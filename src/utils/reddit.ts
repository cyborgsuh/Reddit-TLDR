import { PostRecord } from '../types';

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

export async function fetchTopComments(
  subreddit: string, 
  postId: string, 
  maxComments: number = 5,
  commentLimit: number = 10
): Promise<string[]> {
  // Use Netlify function for production, Vite proxy for development
  const isProduction = import.meta.env.PROD;
  const baseUrl = isProduction ? '/.netlify/functions' : '/api/reddit';
  const url = `${baseUrl}/reddit-comments?subreddit=${subreddit}&postId=${postId}&sort=top&limit=${commentLimit}`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('Failed to fetch comments:', response.status, response.statusText);
      return [];
    }
    
    const data = await response.json();
    
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
    console.error('Error fetching comments:', error);
    return [];
  }
}

export async function searchReddit(query: string, limit: number = 25): Promise<PostRecord[]> {
  // Use Netlify function for production, Vite proxy for development
  const isProduction = import.meta.env.PROD;
  const baseUrl = isProduction ? '/.netlify/functions' : '/api/reddit';
  const url = `${baseUrl}/reddit-search?q=${encodeURIComponent(query)}&limit=${limit}`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
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
        
        // Fetch comments for this post with configurable limit
        const comments = await fetchTopComments(subreddit, postId, 5, Math.min(limit, 20));
        
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
    console.error('Error searching Reddit:', error);
    throw error;
  }
}