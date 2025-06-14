import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

interface RedditCredentials {
  access_token: string
  refresh_token: string | null
  expires_at: string
  reddit_username: string
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseToken = authHeader.replace('Bearer ', '')

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Get user from Supabase token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(supabaseToken)
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid user token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get Reddit credentials for this user
    const { data: credentials, error: credentialsError } = await supabaseClient
      .from('reddit_credentials')
      .select('access_token, refresh_token, expires_at, reddit_username')
      .eq('user_id', user.id)
      .single()

    if (credentialsError || !credentials) {
      return new Response(
        JSON.stringify({ error: 'Reddit account not connected. Please connect your Reddit account first.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const redditCreds = credentials as RedditCredentials

    // Check if token is expired
    const now = new Date()
    const expiresAt = new Date(redditCreds.expires_at)
    
    if (now >= expiresAt) {
      // TODO: Implement token refresh logic here
      return new Response(
        JSON.stringify({ error: 'Reddit token expired. Please reconnect your Reddit account.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse the request URL to get Reddit API path and parameters
    const url = new URL(req.url)
    const redditPath = url.searchParams.get('path')
    const queryParams = url.searchParams.get('params')

    if (!redditPath) {
      return new Response(
        JSON.stringify({ error: 'Missing Reddit API path parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Construct Reddit API URL
    let redditUrl = `https://oauth.reddit.com${redditPath}`
    if (queryParams) {
      redditUrl += `?${queryParams}`
    }

    // Make authenticated request to Reddit API
    const redditResponse = await fetch(redditUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${redditCreds.access_token}`,
        'User-Agent': 'RedditTLDR/1.0 by /u/RedditTLDR'
      }
    })

    if (!redditResponse.ok) {
      const errorText = await redditResponse.text()
      console.error('Reddit API error:', redditResponse.status, errorText)
      
      return new Response(
        JSON.stringify({ 
          error: 'Reddit API request failed',
          status: redditResponse.status,
          details: errorText
        }),
        { status: redditResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const redditData = await redditResponse.json()

    return new Response(
      JSON.stringify(redditData),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-Reddit-User': redditCreds.reddit_username
        } 
      }
    )

  } catch (error) {
    console.error('Reddit API proxy error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})