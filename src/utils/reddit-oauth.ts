import { createClient } from '@supabase/supabase-js';
import { PostRecord } from '../types';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export function markdownToText(md: string): string {
  let text = md;
  
  // Collapse multiple newlines
  text = text.replace(/\n+/g, '\n');
  
  // [text](url) -> text
  text = text.replace(/\[(.*?)\]\((.*?)\)/g, '$1');
  
  // ![alt](url) -> remove images
  text = text.replace(/!\[(.*?)\]\((.*?)\)/g, '');
  
  // Inline code
  text = text.replace(/`{1,3}.*?`{1,3}/g, '');
  
  // Remove headers
  text = text.replace(/^\s*#.*$/gm, '');
  
  // Remove list markers
  text = text.replace(/^\s*\*\s+/gm, '');
  text = text.replace(/^\s*-\s+/gm, '');
  
  // Bold
  text = text.replace(/\*\*(.*?)\*\*/g, '$1');
  
  // Italic
  text = text.replace(/\*(.*?)\*/g, '$1');
  text = text.replace(/_{1,2}(.*?)_{1,2}/g, '$1');
  
  // Blockquotes
  text = text.replace(/>\s?/g, '');
  
  // Collapse whitespace
  text = text.replace(/\s+/g, ' ');
  
  return text.trim();
}

async function makeAuthenticatedRedditRequest(path: string, params?: string): Promise<any> {
  try {
    // Get current session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('User not authenticated');
    }

    // Make request through our Supabase edge function
    const url = new URL(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reddit-api-proxy`);
    url.searchParams.set('path', path);
    if (params) {
      url.searchParams.set('params', params);
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Authenticated Reddit request failed:', error);
    throw error;
  }
}

export async function fetchTopCommentsOAuth(
  subreddit: string, 
  postId: string, 
  maxComments: number = 5,
  commentLimit: number = 10
): Promise<string[]> {
  try {
    const path = `/r/${subreddit}/comments/${postId}`;
    const params = `sort=top&limit=${commentLimit}`;
    
    const data = await makeAuthenticatedRedditRequest(path, params);
    
    if (!Array.isArray(data) || data.length < 2) {
      return [];
    }
    
    const comments: string[] = [];
    const commentsData = data[1]?.data?.children || [];
    
    for (const child of commentsData) {
      if (child?.kind === 't1') {
        const commentData = child.data;
        
        // Check if it's a top-level comment
        if (commentData?.parent_id?.endsWith(postId)) {
          const body = commentData.body;
          if (body && body !== '[deleted]' && body !== '[removed]') {
            const plainText = markdownToText(body);
            if (plainText) {
              comments.push(plainText);
              if (comments.length >= maxComments) {
                break;
              }
            }
          }
        }
      }
    }
    
    return comments;
  } catch (error) {
    console.error('Error fetching comments with OAuth:', error);
    return [];
  }
}

export async function searchRedditOAuth(query: string, limit: number = 25): Promise<PostRecord[]> {
  try {
    const path = '/search';
    const params = `q=${encodeURIComponent(query)}&limit=${limit}&sort=relevance&t=all`;
    
    const data = await makeAuthenticatedRedditRequest(path, params);
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    const children = data?.data?.children || [];
    const records: PostRecord[] = [];
    
    for (const child of children) {
      const post = child.data;
      const title = post.title || '';
      const selftext = post.selftext || '';
      const subreddit = post.subreddit || '';
      const postId = post.id || '';
      
      if (title || selftext) {
        const plainSelftext = selftext ? markdownToText(selftext) : '';
        const combined = plainSelftext ? `${title}\n${plainSelftext}` : title;
        
        // Fetch comments for this post
        const comments = await fetchTopCommentsOAuth(subreddit, postId, 3, Math.min(limit, 20));
        
        records.push({
          title,
          selftext: plainSelftext,
          combined,
          comments,
          subreddit,
          post_id: postId
        });
      }
    }
    
    return records;
  } catch (error) {
    console.error('Error searching Reddit with OAuth:', error);
    throw error;
  }
}

export async function checkRedditConnection(): Promise<{ isConnected: boolean; username?: string }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return { isConnected: false };
    }

    const { data, error } = await supabase
      .from('reddit_credentials')
      .select('reddit_username, expires_at')
      .eq('user_id', session.user.id)
      .single();

    if (error || !data) {
      return { isConnected: false };
    }

    const now = new Date();
    const expiresAt = new Date(data.expires_at);

    if (now >= expiresAt) {
      return { isConnected: false };
    }

    return { 
      isConnected: true, 
      username: data.reddit_username 
    };
  } catch (error) {
    console.error('Error checking Reddit connection:', error);
    return { isConnected: false };
  }
}