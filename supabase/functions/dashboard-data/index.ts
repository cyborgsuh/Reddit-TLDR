import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  try {
    // Get user from auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid user' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get current reputation score
    const { data: currentScore } = await supabaseClient
      .from('reputation_scores')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', new Date().toISOString().split('T')[0])
      .single()

    // Get reputation trend (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const { data: reputationTrend } = await supabaseClient
      .from('reputation_scores')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', sevenDaysAgo.toISOString().split('T')[0])
      .order('date', { ascending: true })

    // Get total mentions count (last 24 hours)
    const twentyFourHoursAgo = new Date()
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

    const { data: recentMentions, count: totalMentions } = await supabaseClient
      .from('user_mentions')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .gte('mentioned_at', twentyFourHoursAgo.toISOString())

    // Get sentiment breakdown (last 24 hours)
    const { data: sentimentBreakdown } = await supabaseClient
      .from('user_mentions')
      .select('sentiment')
      .eq('user_id', user.id)
      .gte('mentioned_at', twentyFourHoursAgo.toISOString())

    const sentimentCounts = {
      positive: sentimentBreakdown?.filter(m => m.sentiment === 'positive').length || 0,
      negative: sentimentBreakdown?.filter(m => m.sentiment === 'negative').length || 0,
      neutral: sentimentBreakdown?.filter(m => m.sentiment === 'neutral').length || 0,
      mixed: sentimentBreakdown?.filter(m => m.sentiment === 'mixed').length || 0,
    }

    // Calculate positive ratio
    const totalSentimentMentions = Object.values(sentimentCounts).reduce((a, b) => a + b, 0)
    const positiveRatio = totalSentimentMentions > 0 
      ? Math.round((sentimentCounts.positive / totalSentimentMentions) * 100)
      : 0

    // Get recent mentions for the feed (last 10)
    const { data: recentMentionsFeed } = await supabaseClient
      .from('user_mentions')
      .select('*')
      .eq('user_id', user.id)
      .order('mentioned_at', { ascending: false })
      .limit(10)

    // Format recent mentions for frontend
    const formattedMentions = recentMentionsFeed?.map(mention => ({
      id: mention.id,
      author: mention.author,
      content: mention.content,
      sentiment: mention.sentiment,
      subreddit: mention.subreddit || 'unknown',
      timestamp: formatTimeAgo(new Date(mention.mentioned_at)),
      score: mention.score || 0,
      comments: mention.num_comments || 0,
      shares: 0, // Reddit doesn't provide share count
      platform: mention.platform,
      tags: mention.tags || [],
      url: mention.url || '#'
    })) || []

    // Calculate reputation change
    const previousScore = reputationTrend && reputationTrend.length > 1 
      ? reputationTrend[reputationTrend.length - 2]?.overall_score || 50
      : 50
    const currentScoreValue = currentScore?.overall_score || 50
    const reputationChange = currentScoreValue - previousScore

    // Format sentiment trend data for chart
    const sentimentTrendData = reputationTrend?.map((score, index) => ({
      day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index % 7],
      positive: score.positive_mentions || 0,
      negative: score.negative_mentions || 0,
      neutral: score.neutral_mentions || 0,
      mixed: score.mixed_mentions || 0,
    })) || []

    return new Response(
      JSON.stringify({
        reputationScore: currentScoreValue,
        reputationChange: reputationChange,
        totalMentions: totalMentions || 0,
        positiveRatio: positiveRatio,
        sentimentCounts: sentimentCounts,
        recentMentions: formattedMentions,
        sentimentTrend: sentimentTrendData,
        lastUpdated: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Error in dashboard-data function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
  
  return date.toLocaleDateString()
}