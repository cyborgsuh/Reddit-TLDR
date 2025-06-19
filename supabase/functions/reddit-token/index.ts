import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('=== Reddit Token Function Invoked ===')
  console.log('Method:', req.method)
  console.log('URL:', req.url)
  
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request')
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Parsing request body...')
    const { code, redirect_uri } = await req.json()
    console.log('Received code:', code ? 'present' : 'missing')
    console.log('Received redirect_uri:', redirect_uri)

    if (!code || !redirect_uri) {
      console.error('Missing required parameters:', { code: !!code, redirect_uri: !!redirect_uri })
      return new Response(
        JSON.stringify({ error: 'Missing code or redirect_uri' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const clientId = Deno.env.get('REDDIT_CLIENT_ID')
    const clientSecret = Deno.env.get('REDDIT_CLIENT_SECRET')

    console.log('Reddit Client ID:', clientId ? 'present' : 'missing')
    console.log('Reddit Client Secret:', clientSecret ? 'present' : 'missing')

    if (!clientId || !clientSecret) {
      console.error('Reddit credentials not configured in environment')
      return new Response(
        JSON.stringify({ error: 'Reddit credentials not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Exchange authorization code for access token
    console.log('Attempting token exchange with Reddit...')
    const tokenResponse = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'RedditTLDR/1.0 (by /u/RedditTLDR)',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirect_uri,
      }),
    })

    console.log('Reddit token response status:', tokenResponse.status)
    console.log('Reddit token response status text:', tokenResponse.statusText)

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Reddit token exchange failed with error:', errorText)
      return new Response(
        JSON.stringify({ error: 'Token exchange failed', details: errorText }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const tokenData = await tokenResponse.json()
    console.log('Received token data:', {
      access_token: tokenData.access_token ? 'present' : 'missing',
      refresh_token: tokenData.refresh_token ? 'present' : 'missing',
      expires_in: tokenData.expires_in,
      scope: tokenData.scope
    })

    // Get user info to store username
    console.log('Fetching Reddit user info...')
    const userResponse = await fetch('https://oauth.reddit.com/api/v1/me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'User-Agent': 'RedditTLDR/1.0 (by /u/RedditTLDR)',
      },
    })

    let username = null
    if (userResponse.ok) {
      const userData = await userResponse.json()
      username = userData.name
      console.log('Reddit username retrieved:', username)
    } else {
      console.warn('Failed to fetch Reddit user info:', userResponse.status, userResponse.statusText)
    }

    // Store credentials in Supabase if user is authenticated
    const authHeader = req.headers.get('Authorization')
    console.log('Auth header present:', !!authHeader)
    
    if (authHeader) {
      console.log('Creating Supabase client...')
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } }
      )

      console.log('Getting user from auth...')
      const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
      
      if (userError) {
        console.error('Error getting user from auth:', userError)
      } else if (!user) {
        console.error('No user found in auth')
      } else {
        console.log('User found:', user.id)
        
        const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString()
        console.log('Token expires at:', expiresAt)
        
        console.log('Attempting to upsert Reddit credentials...')
        const { data: upsertData, error: upsertError } = await supabaseClient
          .from('reddit_credentials')
          .upsert({
            user_id: user.id,
            reddit_username: username || 'unknown',
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            expires_at: expiresAt,
            scope: tokenData.scope || 'read'
          })
          .select()

        if (upsertError) {
          console.error('Supabase upsert error:', upsertError)
          console.error('Error details:', JSON.stringify(upsertError, null, 2))
        } else {
          console.log('Successfully upserted Reddit credentials for user:', user.id)
          console.log('Upsert result:', upsertData)
        }
      }
    } else {
      console.warn('No authorization header provided - credentials not stored')
    }

    console.log('=== Reddit Token Function Completed Successfully ===')
    return new Response(
      JSON.stringify({
        ...tokenData,
        username
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('=== Reddit Token Function Error ===')
    console.error('Error in reddit-token function:', error)
    console.error('Error stack:', error.stack)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})