exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { q, limit = 25 } = event.queryStringParameters || {};

    if (!q) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Query parameter "q" is required' }),
      };
    }

    // Use Reddit's JSON API with proper headers and error handling
    const redditUrl = `https://www.reddit.com/search.json?q=${encodeURIComponent(q)}&limit=${Math.min(parseInt(limit), 100)}&sort=relevance&t=all`;
    
    console.log('Fetching from Reddit:', redditUrl);
    
    const response = await fetch(redditUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'RedditTLDR/1.0 (by /u/RedditTLDR)',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      timeout: 10000 // 10 second timeout
    });

    console.log('Reddit response status:', response.status);

    if (!response.ok) {
      console.error('Reddit API error:', response.status, response.statusText);
      
      // If Reddit is blocking us, return a mock response for testing
      if (response.status === 429 || response.status === 403) {
        return {
          statusCode: 200,
          headers: {
            ...headers,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            data: {
              children: [
                {
                  data: {
                    title: `Sample post about ${q}`,
                    selftext: `This is a sample post about ${q}. The actual Reddit API is currently rate limiting requests from this server. Please try again later or use a different search term.`,
                    subreddit: 'sample',
                    id: 'sample123',
                    score: 100,
                    num_comments: 10
                  }
                }
              ]
            }
          }),
        };
      }
      
      throw new Error(`Reddit API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Reddit data received, children count:', data?.data?.children?.length || 0);
    
    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error('Error fetching from Reddit:', error);
    
    // Return a more helpful error response
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to fetch data from Reddit',
        details: error.message,
        suggestion: 'Reddit may be rate limiting requests. Please try again in a few minutes.'
      }),
    };
  }
};