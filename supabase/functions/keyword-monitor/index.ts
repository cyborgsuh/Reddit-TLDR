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
      console.error(`🔑 [${userId}] Reddit credentials not configured in environment`)
      return null
    }

    console.log(`🔄 [${userId}] Starting token refresh process...`)
    console.log(`🔄 [${userId}] Using refresh token: ${refreshToken.substring(0, 10)}...`)

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

    console.log(`🔄 [${userId}] Reddit refresh response status: ${tokenResponse.status}`)

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error(`❌ [${userId}] Reddit token refresh failed: ${errorText}`)
      console.error(`❌ [${userId}] This usually means the refresh token is invalid or expired`)
      return null
    }

    const tokenData = await tokenResponse.json()
    const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString()

    console.log(`✅ [${userId}] Token refresh successful!`)
    console.log(`✅ [${userId}] New token expires at: ${expiresAt}`)
    console.log(`✅ [${userId}] Token valid for: ${tokenData.expires_in} seconds (${Math.round(tokenData.expires_in / 3600)} hours)`)

    // Update credentials in database
    const { error: updateError } = await supabaseClient
      .from('reddit_credentials')
      .update({
        access_token: tokenData.access_token,
        expires_at: expiresAt,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    if (updateError) {
      console.error(`❌ [${userId}] Failed to update token in database: ${updateError.message}`)
      return null
    }

    console.log(`💾 [${userId}] Successfully updated token in database`)
    return tokenData.access_token
  } catch (error) {
    console.error(`❌ [${userId}] Error during token refresh:`, error)
    return null
  }
}

async function getValidRedditToken(
  supabaseClient: any,
  userId: string
): Promise<string | null> {
  try {
    console.log(`\n🔍 [${userId}] === TOKEN VALIDATION PROCESS ===`)
    
    // Get user's Reddit credentials
    console.log(`🔍 [${userId}] Fetching Reddit credentials from database...`)
    const { data: credentials, error } = await supabaseClient
      .from('reddit_credentials')
      .select('access_token, refresh_token, expires_at, reddit_username')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.log(`❌ [${userId}] Database error fetching credentials: ${error.message}`)
      return null
    }

    if (!credentials) {
      console.log(`❌ [${userId}] No Reddit credentials found in database`)
      console.log(`❌ [${userId}] User needs to connect their Reddit account first`)
      return null
    }

    console.log(`✅ [${userId}] Found Reddit credentials in database`)
    console.log(`📊 [${userId}] Reddit username: ${credentials.reddit_username}`)
    console.log(`📊 [${userId}] Access token present: ${credentials.access_token ? 'YES' : 'NO'}`)
    console.log(`📊 [${userId}] Refresh token present: ${credentials.refresh_token ? 'YES' : 'NO'}`)
    console.log(`📊 [${userId}] Token expires at: ${credentials.expires_at}`)

    const now = new Date()
    const expiresAt = new Date(credentials.expires_at)
    const timeUntilExpiry = expiresAt.getTime() - now.getTime()
    const minutesUntilExpiry = Math.round(timeUntilExpiry / (1000 * 60))
    const hoursUntilExpiry = Math.round(timeUntilExpiry / (1000 * 60 * 60))

    console.log(`⏰ [${userId}] Current time: ${now.toISOString()}`)
    console.log(`⏰ [${userId}] Token expires: ${expiresAt.toISOString()}`)
    console.log(`⏰ [${userId}] Time until expiry: ${minutesUntilExpiry} minutes (${hoursUntilExpiry} hours)`)

    // Check if token is still valid (with 5 minute buffer)
    const bufferTime = 5 * 60 * 1000 // 5 minutes in milliseconds
    const isTokenValid = expiresAt.getTime() > now.getTime() + bufferTime

    console.log(`🔍 [${userId}] Token validation check:`)
    console.log(`🔍 [${userId}] - Token expiry time: ${expiresAt.getTime()}`)
    console.log(`🔍 [${userId}] - Current time + buffer: ${now.getTime() + bufferTime}`)
    console.log(`🔍 [${userId}] - Is token valid: ${isTokenValid}`)

    if (isTokenValid) {
      console.log(`✅ [${userId}] Using existing valid access token`)
      console.log(`✅ [${userId}] Token is valid for another ${minutesUntilExpiry} minutes`)
      return credentials.access_token
    }

    // Token is expired or about to expire
    console.log(`⚠️ [${userId}] Access token is expired or expiring soon`)
    
    if (!credentials.refresh_token) {
      console.log(`❌ [${userId}] No refresh token available - cannot refresh`)
      console.log(`❌ [${userId}] User will need to re-authenticate with Reddit`)
      return null
    }

    console.log(`🔄 [${userId}] Attempting to refresh expired token...`)
    const newAccessToken = await refreshRedditToken(supabaseClient, userId, credentials.refresh_token)
    
    if (newAccessToken) {
      console.log(`✅ [${userId}] Successfully refreshed token`)
      return newAccessToken
    } else {
      console.log(`❌ [${userId}] Token refresh failed`)
      return null
    }
  } catch (error) {
    console.error(`❌ [${userId}] Unexpected error getting Reddit token:`, error)
    return null
  }
}

async function searchRedditForKeyword(
  keyword: string,
  accessToken: string | null,
  userId: string,
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
      console.log(`🔐 [${userId}] Making AUTHENTICATED Reddit search for keyword: "${keyword}"`)
      console.log(`🔐 [${userId}] Using access token: ${accessToken.substring(0, 10)}...`)
      console.log(`🔐 [${userId}] Search URL: ${url}`)
    } else {
      // Fallback to unauthenticated endpoint
      url = `https://www.reddit.com/search.json?q=${encodeURIComponent(keyword)}&limit=${limit}&sort=new&t=week`
      headers = {
        'User-Agent': 'RedditTLDR-Monitor/1.0 (by /u/RedditTLDR)',
        'Accept': 'application/json',
      }
      console.log(`🌐 [${userId}] Making UNAUTHENTICATED Reddit search for keyword: "${keyword}"`)
      console.log(`⚠️ [${userId}] WARNING: Using unauthenticated API - subject to rate limiting`)
      console.log(`🌐 [${userId}] Search URL: ${url}`)
    }

    const response = await fetch(url, { headers })

    console.log(`📡 [${userId}] Reddit API response status: ${response.status}`)
    console.log(`📡 [${userId}] Reddit API response status text: ${response.statusText}`)

    if (!response.ok) {
      console.error(`❌ [${userId}] Reddit search failed: ${response.status} ${response.statusText}`)
      
      // If authenticated request fails with 401, token might be invalid
      if (accessToken && response.status === 401) {
        console.error(`🔑 [${userId}] CRITICAL: Reddit access token appears to be INVALID`)
        console.error(`🔑 [${userId}] This suggests the token was revoked or corrupted`)
      } else if (response.status === 429) {
        console.error(`⏰ [${userId}] Rate limited by Reddit API`)
        console.error(`⏰ [${userId}] ${accessToken ? 'Even authenticated requests' : 'Unauthenticated requests'} are being rate limited`)
      } else if (response.status === 403) {
        console.error(`🚫 [${userId}] Forbidden by Reddit API`)
        console.error(`🚫 [${userId}] This might indicate IP blocking or policy violation`)
      }
      
      return []
    }

    const data = await response.json()
    const posts = data?.data?.children?.map((child: any) => child.data) || []
    
    console.log(`✅ [${userId}] Successfully retrieved ${posts.length} posts for keyword: "${keyword}"`)
    
    if (posts.length === 0) {
      console.log(`📭 [${userId}] No posts found - this could mean:`)
      console.log(`📭 [${userId}] - No recent posts contain the keyword`)
      console.log(`📭 [${userId}] - The keyword is too specific`)
      console.log(`📭 [${userId}] - Reddit's search algorithm filtered results`)
    }
    
    return posts
  } catch (error) {
    console.error(`❌ [${userId}] Error searching Reddit:`, error)
    return []
  }
}

async function getPostComments(
  subreddit: string,
  postId: string,
  accessToken: string | null,
  userId: string,
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
      console.log(`🔐 [${userId}] Fetching comments with AUTHENTICATED request`)
    } else {
      // Fallback to unauthenticated endpoint
      url = `https://www.reddit.com/r/${subreddit}/comments/${postId}.json?limit=${limit}&sort=top`
      headers = {
        'User-Agent': 'RedditTLDR-Monitor/1.0 (by /u/RedditTLDR)',
        'Accept': 'application/json',
      }
      console.log(`🌐 [${userId}] Fetching comments with UNAUTHENTICATED request`)
    }

    const response = await fetch(url, { headers })

    if (!response.ok) {
      console.error(`❌ [${userId}] Failed to fetch comments: ${response.status} ${response.statusText}`)
      return []
    }

    const data = await response.json()
    if (!Array.isArray(data) || data.length < 2) {
      return []
    }

    const comments = data[1]?.data?.children?.map((child: any) => child.data).filter((comment: any) => 
      comment && comment.body && comment.body !== '[deleted]' && comment.body !== '[removed]'
    ) || []

    console.log(`💬 [${userId}] Found ${comments.length} valid comments for post: ${postId}`)
    return comments
  } catch (error) {
    console.error(`❌ [${userId}] Error fetching comments:`, error)
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
  console.log('=== KEYWORD MONITOR FUNCTION STARTED ===')
  console.log('Request method:', req.method)
  console.log('Request URL:', req.url)
  console.log('Timestamp:', new Date().toISOString())
  
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request')
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Starting keyword monitoring process...')
    
    // Parse request body to check for specific user ID
    let requestBody: any = {}
    let specificUserId: string | null = null
    
    if (req.method === 'POST') {
      try {
        const bodyText = await req.text()
        if (bodyText) {
          requestBody = JSON.parse(bodyText)
          specificUserId = requestBody.user_id || null
        }
      } catch (parseError) {
        console.log('No valid JSON body found, proceeding with scheduled search for all users')
      }
    }

    if (specificUserId) {
      console.log(`🎯 MANUAL SEARCH TRIGGERED for specific user: ${specificUserId}`)
    } else {
      console.log(`⏰ SCHEDULED SEARCH for all users with due keywords`)
    }
    
    // Check environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const redditClientId = Deno.env.get('REDDIT_CLIENT_ID')
    const redditClientSecret = Deno.env.get('REDDIT_CLIENT_SECRET')
    
    console.log('Environment check:')
    console.log('- SUPABASE_URL:', supabaseUrl ? 'present' : 'MISSING')
    console.log('- SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? 'present' : 'MISSING')
    console.log('- REDDIT_CLIENT_ID:', redditClientId ? 'present' : 'MISSING')
    console.log('- REDDIT_CLIENT_SECRET:', redditClientSecret ? 'present' : 'MISSING')
    
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing required Supabase environment variables')
    }
    
    if (!redditClientId || !redditClientSecret) {
      console.warn('⚠️ Reddit OAuth credentials missing - all requests will be unauthenticated')
    }
    
    // Create Supabase client
    console.log('Creating Supabase client with service role key...')
    const supabaseClient = createClient(supabaseUrl, serviceRoleKey)
    console.log('✅ Supabase client created successfully')

    // Get current timestamp for comparison
    const currentTime = new Date()
    const currentTimeISO = currentTime.toISOString()
    const currentTimeMs = currentTime.getTime()
    
    console.log('=== SEARCH CRITERIA ===')
    console.log('Current time (ISO):', currentTimeISO)
    console.log('Specific user ID:', specificUserId || 'ALL USERS')

    // Build query based on whether this is a user-specific search or scheduled search
    let query = supabaseClient
      .from('keyword_searches')
      .select('*')
      .eq('is_active', true)

    if (specificUserId) {
      // User-specific search: get all active keywords for this user
      console.log(`🎯 Fetching ALL active keywords for user: ${specificUserId}`)
      query = query.eq('user_id', specificUserId)
    } else {
      // Scheduled search: only get keywords that are due for searching
      console.log(`⏰ Fetching keywords due for scheduled search`)
      query = query.lte('next_search_at', currentTimeISO)
    }

    const { data: searchesToProcess, error: searchError } = await query.order('next_search_at', { ascending: true })

    console.log('Database query completed')
    console.log('Search error:', searchError ? JSON.stringify(searchError, null, 2) : 'none')
    console.log('Number of searches found:', searchesToProcess?.length || 0)

    if (searchError) {
      console.error('❌ Error fetching searches from database:', searchError)
      throw new Error(`Error fetching searches: ${searchError.message}`)
    }

    if (!searchesToProcess || searchesToProcess.length === 0) {
      const message = specificUserId 
        ? `No active keywords found for user ${specificUserId}`
        : 'No keywords need processing at this time'
      
      console.log(`⚠️ ${message}`)
      return new Response(
        JSON.stringify({ 
          success: true, 
          processed: 0,
          totalMentionsFound: 0,
          message: message,
          debug: {
            currentTime: currentTimeISO,
            searchType: specificUserId ? 'user-specific' : 'scheduled',
            userId: specificUserId,
            keywordsFound: 0
          }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`\n=== PROCESSING SUMMARY ===`)
    console.log(`Search type: ${specificUserId ? 'USER-SPECIFIC MANUAL' : 'SCHEDULED AUTOMATIC'}`)
    console.log(`Keywords to process: ${searchesToProcess.length}`)
    
    if (specificUserId) {
      console.log(`Target user: ${specificUserId}`)
      console.log(`Keywords: ${searchesToProcess.map(s => s.keyword).join(', ')}`)
    }

    let totalProcessed = 0
    let totalMentionsFound = 0

    for (const search of searchesToProcess) {
      try {
        console.log(`\n🔍 === PROCESSING KEYWORD: "${search.keyword}" ===`)
        console.log(`👤 User ID: ${search.user_id}`)
        console.log(`⏰ Last searched: ${search.last_searched_at || 'never'}`)
        console.log(`🔄 Search frequency: every ${search.search_frequency_hours} hours`)
        console.log(`🎯 Search type: ${specificUserId ? 'MANUAL USER REQUEST' : 'SCHEDULED AUTOMATIC'}`)
        
        // Get valid Reddit token for this user
        const accessToken = await getValidRedditToken(supabaseClient, search.user_id)
        
        if (accessToken) {
          console.log(`✅ [${search.user_id}] AUTHENTICATED Reddit API access available`)
          console.log(`✅ [${search.user_id}] Higher rate limits and better access`)
        } else {
          console.log(`⚠️ [${search.user_id}] NO VALID TOKEN - using unauthenticated access`)
          console.log(`⚠️ [${search.user_id}] Subject to strict rate limiting`)
        }
        
        // Search Reddit for the keyword
        const posts = await searchRedditForKeyword(search.keyword, accessToken, search.user_id, 15)
        let mentionsFound = 0

        console.log(`📝 Processing ${posts.length} posts for analysis...`)

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
              console.log(`⏭️ [${search.user_id}] Skipping existing post: ${post.id}`)
              continue // Skip if we already have this mention
            }

            // Analyze sentiment of the post
            const postText = `${post.title} ${post.selftext}`.trim()
            const sentiment = await analyzeSentimentSimple(postText, search.keyword)
            const tags = extractTags(postText, search.keyword)

            console.log(`💾 [${search.user_id}] Inserting new post mention: ${post.title.substring(0, 50)}...`)
            console.log(`📊 [${search.user_id}] Sentiment: ${sentiment}`)

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
              console.error(`❌ [${search.user_id}] Error inserting post mention: ${insertError.message}`)
            } else {
              mentionsFound++
              console.log(`✅ [${search.user_id}] Added post mention: ${post.title.substring(0, 50)}...`)
            }

            // Also check comments for mentions (limit to top 3 to avoid rate limits)
            const comments = await getPostComments(post.subreddit, post.id, accessToken, search.user_id, 3)
            
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

                  console.log(`💾 [${search.user_id}] Inserting new comment mention from: ${comment.author}`)

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
                    console.log(`✅ [${search.user_id}] Added comment mention from: ${comment.author}`)
                  } else {
                    console.error(`❌ [${search.user_id}] Error inserting comment mention: ${commentInsertError.message}`)
                  }
                } else {
                  console.log(`⏭️ [${search.user_id}] Skipping existing comment: ${comment.id}`)
                }
              }
            }

            // Add small delay between posts to be respectful to Reddit's API
            await new Promise(resolve => setTimeout(resolve, 500))
          } catch (postError) {
            console.error(`❌ [${search.user_id}] Error processing post ${post.id}:`, postError)
          }
        }

        // Update the search record
        // For manual searches, don't update the next_search_at time
        // For scheduled searches, update the next_search_at time
        const updateData: any = {
          last_searched_at: new Date().toISOString(),
          total_mentions_found: search.total_mentions_found + mentionsFound,
          last_error: null
        }

        if (!specificUserId) {
          // Only update next_search_at for scheduled searches
          const nextSearchTime = new Date()
          nextSearchTime.setHours(nextSearchTime.getHours() + search.search_frequency_hours)
          updateData.next_search_at = nextSearchTime.toISOString()
          console.log(`⏰ [${search.user_id}] Next scheduled search: ${nextSearchTime.toISOString()}`)
        } else {
          console.log(`🎯 [${search.user_id}] Manual search - not updating next_search_at`)
        }

        console.log(`📝 [${search.user_id}] Updating search record for keyword: ${search.keyword}`)

        const { error: updateError } = await supabaseClient
          .from('keyword_searches')
          .update(updateData)
          .eq('id', search.id)

        if (updateError) {
          console.error(`❌ [${search.user_id}] Error updating search record: ${updateError.message}`)
        } else {
          console.log(`✅ [${search.user_id}] Updated search record successfully`)
        }

        console.log(`🎉 [${search.user_id}] Found ${mentionsFound} new mentions for keyword: "${search.keyword}"`)
        totalMentionsFound += mentionsFound
        totalProcessed++

      } catch (error) {
        console.error(`❌ Error processing keyword "${search.keyword}":`, error)
        console.error('Error stack:', error.stack)
        
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

    console.log(`\n🏁 === KEYWORD MONITORING COMPLETED ===`)
    console.log(`📊 Search type: ${specificUserId ? 'USER-SPECIFIC MANUAL' : 'SCHEDULED AUTOMATIC'}`)
    console.log(`📊 Processed: ${totalProcessed} keywords`)
    console.log(`📊 Total new mentions found: ${totalMentionsFound}`)

    // Update daily reputation scores
    console.log('📈 Updating daily reputation scores...')
    try {
      await supabaseClient.rpc('update_daily_reputation_scores')
      console.log('✅ Daily reputation scores updated')
    } catch (reputationError) {
      console.error('❌ Error updating reputation scores:', reputationError)
    }

    console.log('=== KEYWORD MONITOR FUNCTION COMPLETED SUCCESSFULLY ===')

    const responseMessage = specificUserId 
      ? `Manual search completed for user ${specificUserId}`
      : 'Scheduled keyword monitoring completed successfully'

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: totalProcessed,
        totalMentionsFound: totalMentionsFound,
        message: responseMessage,
        timestamp: new Date().toISOString(),
        debug: {
          searchType: specificUserId ? 'user-specific' : 'scheduled',
          userId: specificUserId,
          keywordsProcessed: totalProcessed,
          currentTime: currentTimeISO
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('=== KEYWORD MONITOR FUNCTION ERROR ===')
    console.error('Error in keyword-monitor function:', error)
    console.error('Error stack:', error.stack)
    console.error('Error details:', JSON.stringify(error, null, 2))
    
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