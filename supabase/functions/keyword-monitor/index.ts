import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RedditPost {
  title: string
  selftext: string
  author: string
  subreddit: string
  id: string
  score: number
  num_comments: number
  created_utc: number
  permalink: string
}

interface RedditComment {
  body: string
  author: string
  id: string
  score: number
  created_utc: number
  parent_id: string
}

interface RedditCredentials {
  access_token: string
  refresh_token: string | null
  expires_at: string
  reddit_username: string
}

async function refreshRedditToken(
  supabaseClient: any,
  userId: string,
  refreshToken: string
): Promise<string | null> {
  try {
    const clientId = Deno.env.get('REDDIT_CLIENT_ID')
    const clientSecret = Deno.env.get('REDDIT_CLIENT_SECRET')

    if (!clientId || !clientSecret) {
      console.error('Reddit credentials not configured')
      return null
    }

    console.log(`Refreshing Reddit token for user: ${userId}`)

    const tokenResponse = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'RedditTLDR-Monitor/1.0 (by /u/RedditTLDR)',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Reddit token refresh failed:', errorText)
      return null
    }

    const tokenData = await tokenResponse.json()
    const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString()

    // Update credentials in database
    await supabaseClient
      .from('reddit_credentials')
      .update({
        access_token: tokenData.access_token,
        expires_at: expiresAt,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    console.log(`Successfully refreshed Reddit token for user: ${userId}`)
    return tokenData.access_token
  } catch (error) {
    console.error('Error refreshing Reddit token:', error)
    return null
  }
}

async function getValidRedditToken(
  supabaseClient: any,
  userId: string
): Promise<string | null> {
  try {
    // Get user's Reddit credentials
    const { data: credentials, error } = await supabaseClient
      .from('reddit_credentials')
      .select('access_token, refresh_token, expires_at, reddit_username')
      .eq('user_id', userId)
      .single()

    if (error || !credentials) {
      console.log(`No Reddit credentials found for user: ${userId}`)
      return null
    }

    const now = new Date()
    const expiresAt = new Date(credentials.expires_at)

    // Check if token is still valid (with 5 minute buffer)
    if (expiresAt.getTime() > now.getTime() + (5 * 60 * 1000)) {
      console.log(`Using existing valid token for user: ${userId}`)
      return credentials.access_token
    }

    // Token is expired or about to expire, refresh it
    if (credentials.refresh_token) {
      console.log(`Token expired for user: ${userId}, attempting refresh`)
      return await refreshRedditToken(supabaseClient, userId, credentials.refresh_token)
    }

    console.log(`No refresh token available for user: ${userId}`)
    return null
  } catch (error) {
    console.error('Error getting Reddit token:', error)
    return null
  }
}

async function searchRedditForKeyword(
  keyword: string,
  accessToken: string | null,
  limit: number = 25
): Promise<RedditPost[]> {
  try {
    let url: string
    let headers: Record<string, string>

    if (accessToken) {
      // Use authenticated OAuth endpoint
      url = `https://oauth.reddit.com/search?q=${encodeURIComponent(keyword)}&limit=${limit}&sort=new&t=week`
      headers = {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'RedditTLDR-Monitor/1.0 (by /u/RedditTLDR)',
        'Accept': 'application/json',
      }
      console.log(`Making authenticated Reddit search for keyword: ${keyword}`)
    } else {
      // Fallback to unauthenticated endpoint
      url = `https://www.reddit.com/search.json?q=${encodeURIComponent(keyword)}&limit=${limit}&sort=new&t=week`
      headers = {
        'User-Agent': 'RedditTLDR-Monitor/1.0 (by /u/RedditTLDR)',
        'Accept': 'application/json',
      }
      console.log(`Making unauthenticated Reddit search for keyword: ${keyword}`)
    }

    const response = await fetch(url, { headers })

    if (!response.ok) {
      console.error(`Reddit search failed: ${response.status} ${response.statusText}`)
      
      // If authenticated request fails with 401, token might be invalid
      if (accessToken && response.status === 401) {
        console.error('Reddit access token appears to be invalid')
      }
      
      return []
    }

    const data = await response.json()
    const posts = data?.data?.children?.map((child: any) => child.data) || []
    
    console.log(`Found ${posts.length} posts for keyword: ${keyword}`)
    return posts
  } catch (error) {
    console.error('Error searching Reddit:', error)
    return []
  }
}

async function getPostComments(
  subreddit: string,
  postId: string,
  accessToken: string | null,
  limit: number = 10
): Promise<RedditComment[]> {
  try {
    let url: string
    let headers: Record<string, string>

    if (accessToken) {
      // Use authenticated OAuth endpoint
      url = `https://oauth.reddit.com/r/${subreddit}/comments/${postId}?limit=${limit}&sort=top`
      headers = {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'RedditTLDR-Monitor/1.0 (by /u/RedditTLDR)',
        'Accept': 'application/json',
      }
    } else {
      // Fallback to unauthenticated endpoint
      url = `https://www.reddit.com/r/${subreddit}/comments/${postId}.json?limit=${limit}&sort=top`
      headers = {
        'User-Agent': 'RedditTLDR-Monitor/1.0 (by /u/RedditTLDR)',
        'Accept': 'application/json',
      }
    }

    const response = await fetch(url, { headers })

    if (!response.ok) {
      console.error(`Failed to fetch comments: ${response.status} ${response.statusText}`)
      return []
    }

    const data = await response.json()
    if (!Array.isArray(data) || data.length < 2) {
      return []
    }

    const comments = data[1]?.data?.children?.map((child: any) => child.data).filter((comment: any) => 
      comment && comment.body && comment.body !== '[deleted]' && comment.body !== '[removed]'
    ) || []

    console.log(`Found ${comments.length} comments for post: ${postId}`)
    return comments
  } catch (error) {
    console.error('Error fetching comments:', error)
    return []
  }
}

async function analyzeSentimentSimple(text: string, keyword: string): Promise<string> {
  // Simple keyword-based sentiment analysis
  const lowerText = text.toLowerCase()
  const lowerKeyword = keyword.toLowerCase()
  
  if (!lowerText.includes(lowerKeyword)) {
    return 'neutral'
  }

  const positiveWords = [
    'good', 'great', 'excellent', 'amazing', 'awesome', 'love', 'best', 'perfect', 
    'fantastic', 'wonderful', 'outstanding', 'brilliant', 'superb', 'impressive',
    'helpful', 'useful', 'recommend', 'satisfied', 'pleased', 'happy'
  ]
  
  const negativeWords = [
    'bad', 'terrible', 'awful', 'hate', 'worst', 'horrible', 'sucks', 'disappointing', 
    'useless', 'broken', 'failed', 'poor', 'annoying', 'frustrating', 'waste',
    'regret', 'avoid', 'problem', 'issue', 'bug'
  ]
  
  const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length
  const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length
  
  if (positiveCount > negativeCount) return 'positive'
  if (negativeCount > positiveCount) return 'negative'
  if (positiveCount > 0 && negativeCount > 0) return 'mixed'
  
  return 'neutral'
}

function extractTags(text: string, keyword: string): string[] {
  const tags: string[] = []
  const lowerText = text.toLowerCase()
  
  // Add keyword as primary tag
  tags.push(keyword.toLowerCase())
  
  // Extract common themes
  const themes = [
    'customer service', 'product quality', 'pricing', 'user experience', 'support',
    'features', 'performance', 'reliability', 'innovation', 'design', 'security',
    'speed', 'interface', 'mobile', 'desktop', 'update', 'bug', 'feature request'
  ]
  
  themes.forEach(theme => {
    if (lowerText.includes(theme)) {
      tags.push(theme)
    }
  })
  
  return [...new Set(tags)] // Remove duplicates
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Starting keyword monitoring process...')
    
    // This function can be called manually or via cron
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get all active keyword searches that need to be processed
    const { data: searches, error: searchError } = await supabaseClient
      .from('keyword_searches')
      .select('*')
      .eq('is_active', true)
      .lte('next_search_at', new Date().toISOString())

    if (searchError) {
      console.error('Error fetching searches:', searchError)
      throw new Error(`Error fetching searches: ${searchError.message}`)
    }

    console.log(`Processing ${searches?.length || 0} keyword searches`)

    let totalProcessed = 0
    let totalMentionsFound = 0

    for (const search of searches || []) {
      try {
        console.log(`\n--- Processing keyword: "${search.keyword}" for user: ${search.user_id} ---`)
        
        // Get valid Reddit token for this user
        const accessToken = await getValidRedditToken(supabaseClient, search.user_id)
        
        if (accessToken) {
          console.log(`✓ Using authenticated Reddit API for user: ${search.user_id}`)
        } else {
          console.log(`⚠ Using unauthenticated Reddit API for user: ${search.user_id} (rate limited)`)
        }
        
        // Search Reddit for the keyword
        const posts = await searchRedditForKeyword(search.keyword, accessToken, 15)
        let mentionsFound = 0

        console.log(`Processing ${posts.length} posts...`)

        for (const post of posts) {
          try {
            // Check if we already have this post
            const { data: existingMention } = await supabaseClient
              .from('user_mentions')
              .select('id')
              .eq('user_id', search.user_id)
              .eq('post_id', post.id)
              .eq('platform', 'reddit')
              .maybeSingle()

            if (existingMention) {
              continue // Skip if we already have this mention
            }

            // Analyze sentiment of the post
            const postText = `${post.title} ${post.selftext}`.trim()
            const sentiment = await analyzeSentimentSimple(postText, search.keyword)
            const tags = extractTags(postText, search.keyword)

            // Insert the mention
            const { error: insertError } = await supabaseClient
              .from('user_mentions')
              .insert({
                user_id: search.user_id,
                keyword: search.keyword,
                platform: 'reddit',
                author: post.author || 'unknown',
                content: postText.substring(0, 2000), // Limit content length
                sentiment: sentiment,
                subreddit: post.subreddit,
                post_id: post.id,
                url: `https://reddit.com${post.permalink}`,
                score: post.score || 0,
                num_comments: post.num_comments || 0,
                tags: tags,
                mentioned_at: new Date(post.created_utc * 1000).toISOString()
              })

            if (insertError) {
              console.error(`Error inserting post mention: ${insertError.message}`)
            } else {
              mentionsFound++
              console.log(`✓ Added post mention: ${post.title.substring(0, 50)}...`)
            }

            // Also check comments for mentions (limit to top 3 to avoid rate limits)
            const comments = await getPostComments(post.subreddit, post.id, accessToken, 3)
            
            for (const comment of comments) {
              if (comment.body.toLowerCase().includes(search.keyword.toLowerCase())) {
                const { data: existingComment } = await supabaseClient
                  .from('user_mentions')
                  .select('id')
                  .eq('user_id', search.user_id)
                  .eq('comment_id', comment.id)
                  .eq('platform', 'reddit')
                  .maybeSingle()

                if (!existingComment) {
                  const commentSentiment = await analyzeSentimentSimple(comment.body, search.keyword)
                  const commentTags = extractTags(comment.body, search.keyword)

                  const { error: commentInsertError } = await supabaseClient
                    .from('user_mentions')
                    .insert({
                      user_id: search.user_id,
                      keyword: search.keyword,
                      platform: 'reddit',
                      author: comment.author || 'unknown',
                      content: comment.body.substring(0, 2000), // Limit content length
                      sentiment: commentSentiment,
                      subreddit: post.subreddit,
                      post_id: post.id,
                      comment_id: comment.id,
                      url: `https://reddit.com${post.permalink}`,
                      score: comment.score || 0,
                      tags: commentTags,
                      mentioned_at: new Date(comment.created_utc * 1000).toISOString()
                    })

                  if (!commentInsertError) {
                    mentionsFound++
                    console.log(`✓ Added comment mention from: ${comment.author}`)
                  } else {
                    console.error(`Error inserting comment mention: ${commentInsertError.message}`)
                  }
                }
              }
            }

            // Add small delay between posts to be respectful to Reddit's API
            await new Promise(resolve => setTimeout(resolve, 500))
          } catch (postError) {
            console.error(`Error processing post ${post.id}:`, postError)
          }
        }

        // Update the search record
        const nextSearchTime = new Date()
        nextSearchTime.setHours(nextSearchTime.getHours() + search.search_frequency_hours)

        const { error: updateError } = await supabaseClient
          .from('keyword_searches')
          .update({
            last_searched_at: new Date().toISOString(),
            next_search_at: nextSearchTime.toISOString(),
            total_mentions_found: search.total_mentions_found + mentionsFound,
            last_error: null
          })
          .eq('id', search.id)

        if (updateError) {
          console.error(`Error updating search record: ${updateError.message}`)
        }

        console.log(`✓ Found ${mentionsFound} new mentions for keyword: "${search.keyword}"`)
        totalMentionsFound += mentionsFound
        totalProcessed++

      } catch (error) {
        console.error(`Error processing keyword "${search.keyword}":`, error)
        
        // Update search record with error
        await supabaseClient
          .from('keyword_searches')
          .update({
            last_error: error.message,
            last_searched_at: new Date().toISOString()
          })
          .eq('id', search.id)
      }
    }

    console.log(`\n--- Keyword monitoring completed ---`)
    console.log(`Processed: ${totalProcessed} keywords`)
    console.log(`Total new mentions found: ${totalMentionsFound}`)

    // Update daily reputation scores
    console.log('Updating daily reputation scores...')
    try {
      await supabaseClient.rpc('update_daily_reputation_scores')
      console.log('✓ Daily reputation scores updated')
    } catch (reputationError) {
      console.error('Error updating reputation scores:', reputationError)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: totalProcessed,
        totalMentionsFound: totalMentionsFound,
        message: 'Keyword monitoring completed successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Error in keyword-monitor function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})