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

async function searchRedditForKeyword(keyword: string, limit: number = 25): Promise<RedditPost[]> {
  try {
    const response = await fetch(
      `https://www.reddit.com/search.json?q=${encodeURIComponent(keyword)}&limit=${limit}&sort=new&t=week`,
      {
        headers: {
          'User-Agent': 'RedditTLDR-Monitor/1.0 (by /u/RedditTLDR)',
          'Accept': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Reddit API error: ${response.status}`)
    }

    const data = await response.json()
    return data?.data?.children?.map((child: any) => child.data) || []
  } catch (error) {
    console.error('Error searching Reddit:', error)
    return []
  }
}

async function getPostComments(subreddit: string, postId: string, limit: number = 10): Promise<RedditComment[]> {
  try {
    const response = await fetch(
      `https://www.reddit.com/r/${subreddit}/comments/${postId}.json?limit=${limit}&sort=top`,
      {
        headers: {
          'User-Agent': 'RedditTLDR-Monitor/1.0 (by /u/RedditTLDR)',
          'Accept': 'application/json',
        },
      }
    )

    if (!response.ok) {
      return []
    }

    const data = await response.json()
    if (!Array.isArray(data) || data.length < 2) {
      return []
    }

    return data[1]?.data?.children?.map((child: any) => child.data).filter((comment: any) => 
      comment && comment.body && comment.body !== '[deleted]' && comment.body !== '[removed]'
    ) || []
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

  const positiveWords = ['good', 'great', 'excellent', 'amazing', 'awesome', 'love', 'best', 'perfect', 'fantastic', 'wonderful']
  const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'worst', 'horrible', 'sucks', 'disappointing', 'useless', 'broken']
  
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
    'features', 'performance', 'reliability', 'innovation', 'design'
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
      throw new Error(`Error fetching searches: ${searchError.message}`)
    }

    console.log(`Processing ${searches?.length || 0} keyword searches`)

    for (const search of searches || []) {
      try {
        console.log(`Processing keyword: ${search.keyword} for user: ${search.user_id}`)
        
        // Search Reddit for the keyword
        const posts = await searchRedditForKeyword(search.keyword, 10)
        let mentionsFound = 0

        for (const post of posts) {
          // Check if we already have this post
          const { data: existingMention } = await supabaseClient
            .from('user_mentions')
            .select('id')
            .eq('user_id', search.user_id)
            .eq('post_id', post.id)
            .single()

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
              author: post.author,
              content: postText,
              sentiment: sentiment,
              subreddit: post.subreddit,
              post_id: post.id,
              url: `https://reddit.com${post.permalink}`,
              score: post.score,
              num_comments: post.num_comments,
              tags: tags,
              mentioned_at: new Date(post.created_utc * 1000).toISOString()
            })

          if (!insertError) {
            mentionsFound++
          }

          // Also check comments for mentions
          const comments = await getPostComments(post.subreddit, post.id, 5)
          
          for (const comment of comments) {
            if (comment.body.toLowerCase().includes(search.keyword.toLowerCase())) {
              const { data: existingComment } = await supabaseClient
                .from('user_mentions')
                .select('id')
                .eq('user_id', search.user_id)
                .eq('comment_id', comment.id)
                .single()

              if (!existingComment) {
                const commentSentiment = await analyzeSentimentSimple(comment.body, search.keyword)
                const commentTags = extractTags(comment.body, search.keyword)

                await supabaseClient
                  .from('user_mentions')
                  .insert({
                    user_id: search.user_id,
                    keyword: search.keyword,
                    platform: 'reddit',
                    author: comment.author,
                    content: comment.body,
                    sentiment: commentSentiment,
                    subreddit: post.subreddit,
                    post_id: post.id,
                    comment_id: comment.id,
                    url: `https://reddit.com${post.permalink}`,
                    score: comment.score,
                    tags: commentTags,
                    mentioned_at: new Date(comment.created_utc * 1000).toISOString()
                  })

                mentionsFound++
              }
            }
          }
        }

        // Update the search record
        const nextSearchTime = new Date()
        nextSearchTime.setHours(nextSearchTime.getHours() + search.search_frequency_hours)

        await supabaseClient
          .from('keyword_searches')
          .update({
            last_searched_at: new Date().toISOString(),
            next_search_at: nextSearchTime.toISOString(),
            total_mentions_found: search.total_mentions_found + mentionsFound,
            last_error: null
          })
          .eq('id', search.id)

        console.log(`Found ${mentionsFound} new mentions for keyword: ${search.keyword}`)

      } catch (error) {
        console.error(`Error processing keyword ${search.keyword}:`, error)
        
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

    // Update daily reputation scores
    await supabaseClient.rpc('update_daily_reputation_scores')

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: searches?.length || 0,
        message: 'Keyword monitoring completed successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Error in keyword-monitor function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})