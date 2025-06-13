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
    const { subreddit, postId, sort = 'top', limit = 10 } = event.queryStringParameters || {};

    if (!subreddit || !postId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Subreddit and postId are required' }),
      };
    }

    const redditUrl = `https://www.reddit.com/r/${subreddit}/comments/${postId}.json?sort=${sort}&limit=${Math.min(parseInt(limit), 50)}`;
    
    console.log('Fetching comments from Reddit:', redditUrl);
    
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

    console.log('Reddit comments response status:', response.status);

    if (!response.ok) {
      console.error('Reddit comments API error:', response.status, response.statusText);
      
      // If Reddit is blocking us, return empty comments array
      if (response.status === 429 || response.status === 403) {
        return {
          statusCode: 200,
          headers: {
            ...headers,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify([
            { data: { children: [] } }, // Post data
            { data: { children: [] } }  // Comments data (empty)
          ]),
        };
      }
      
      throw new Error(`Reddit API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Reddit comments data received');
    
    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error('Error fetching comments from Reddit:', error);
    
    // Return empty comments array on error
    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        { data: { children: [] } }, // Post data
        { data: { children: [] } }  // Comments data (empty)
      ]),
    };
  }
};