import { RedditAuthState, RedditTokenResponse } from '../types';

const getRedditClientId = () => {
  return import.meta.env.VITE_REDDIT_CLIENT_ID || import.meta.env.VITE_PUBLIC_REDDIT_CLIENT_ID;
};

const getRedirectUri = () => {
  return `${window.location.origin}/auth/callback`;
};

// Reddit OAuth2 endpoints
const REDDIT_AUTH_URL = 'https://www.reddit.com/api/v1/authorize';
const REDDIT_TOKEN_URL = 'https://www.reddit.com/api/v1/access_token';

export class RedditAuth {
  private static instance: RedditAuth;
  private authState: RedditAuthState = {
    isAuthenticated: false,
    accessToken: null,
    refreshToken: null,
    expiresAt: null,
    username: null
  };

  private constructor() {
    this.loadAuthState();
  }

  static getInstance(): RedditAuth {
    if (!RedditAuth.instance) {
      RedditAuth.instance = new RedditAuth();
    }
    return RedditAuth.instance;
  }

  private loadAuthState(): void {
    try {
      const stored = localStorage.getItem('reddit_auth_state');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.authState = { ...this.authState, ...parsed };
        
        // Check if token is expired
        if (this.authState.expiresAt && Date.now() >= this.authState.expiresAt) {
          console.log('RedditAuth: Stored token is expired, clearing state');
          this.clearAuthState();
        } else {
          console.log('RedditAuth: Loaded valid auth state from localStorage');
        }
      }
    } catch (error) {
      console.error('RedditAuth: Error loading auth state:', error);
      this.clearAuthState();
    }
  }

  private saveAuthState(): void {
    try {
      localStorage.setItem('reddit_auth_state', JSON.stringify(this.authState));
      console.log('RedditAuth: Saved auth state to localStorage');
    } catch (error) {
      console.error('RedditAuth: Error saving auth state:', error);
    }
  }

  private clearAuthState(): void {
    console.log('RedditAuth: Clearing auth state');
    this.authState = {
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      username: null
    };
    localStorage.removeItem('reddit_auth_state');
  }

  generateAuthUrl(): string {
    const REDDIT_CLIENT_ID = getRedditClientId();
    const REDDIT_REDIRECT_URI = getRedirectUri();

    console.log('RedditAuth: Generating auth URL');
    console.log('RedditAuth: Client ID present:', !!REDDIT_CLIENT_ID);
    console.log('RedditAuth: Redirect URI:', REDDIT_REDIRECT_URI);

    if (!REDDIT_CLIENT_ID) {
      throw new Error('Reddit Client ID is not configured. Please set VITE_REDDIT_CLIENT_ID in your environment variables.');
    }

    const state = Math.random().toString(36).substring(2, 15);
    localStorage.setItem('reddit_auth_state_param', state);
    console.log('RedditAuth: Generated state parameter:', state);

    const params = new URLSearchParams({
      client_id: REDDIT_CLIENT_ID,
      response_type: 'code',
      state: state,
      redirect_uri: REDDIT_REDIRECT_URI,
      duration: 'permanent',
      scope: 'read'
    });

    const authUrl = `${REDDIT_AUTH_URL}?${params.toString()}`;
    console.log('RedditAuth: Generated auth URL:', authUrl);
    return authUrl;
  }

  async handleCallback(code: string, state: string): Promise<boolean> {
    try {
      console.log('RedditAuth: Starting handleCallback');
      console.log('RedditAuth: Code present:', !!code);
      console.log('RedditAuth: State present:', !!state);
      
      // Verify state parameter
      const storedState = localStorage.getItem('reddit_auth_state_param');
      console.log('RedditAuth: Stored state present:', !!storedState);
      console.log('RedditAuth: State matches:', storedState === state);
      
      if (!storedState || storedState !== state) {
        console.error('RedditAuth: State parameter mismatch');
        throw new Error('Invalid state parameter');
      }
      localStorage.removeItem('reddit_auth_state_param');

      // Exchange code for tokens
      console.log('RedditAuth: Exchanging code for tokens...');
      const tokenResponse = await this.exchangeCodeForTokens(code);
      console.log('RedditAuth: Token exchange successful');
      
      // Update auth state
      this.authState = {
        isAuthenticated: true,
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token || null,
        expiresAt: Date.now() + (tokenResponse.expires_in * 1000),
        username: null // Will be fetched separately if needed
      };

      this.saveAuthState();
      console.log('RedditAuth: Auth state updated and saved');
      return true;
    } catch (error) {
      console.error('RedditAuth: Error handling OAuth callback:', error);
      this.clearAuthState();
      return false;
    }
  }

  private async exchangeCodeForTokens(code: string): Promise<RedditTokenResponse> {
    const REDDIT_REDIRECT_URI = getRedirectUri();
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    
    // Use anon key for token exchange
    const authToken = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    console.log('RedditAuth: Making token exchange request to Supabase function');
    console.log('RedditAuth: Supabase URL present:', !!supabaseUrl);
    console.log('RedditAuth: Auth token present:', !!authToken);
    
    const response = await fetch(`${supabaseUrl}/functions/v1/reddit-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        code,
        redirect_uri: REDDIT_REDIRECT_URI
      })
    });

    console.log('RedditAuth: Token exchange response status:', response.status);
    console.log('RedditAuth: Token exchange response ok:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('RedditAuth: Token exchange failed:', errorText);
      throw new Error(`Token exchange failed: ${errorText}`);
    }

    const tokenData = await response.json();
    console.log('RedditAuth: Token exchange response received');
    return tokenData;
  }

  async refreshAccessToken(): Promise<boolean> {
    if (!this.authState.refreshToken) {
      console.log('RedditAuth: No refresh token available');
      this.clearAuthState();
      return false;
    }

    try {
      console.log('RedditAuth: Refreshing access token...');
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/reddit-refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          refresh_token: this.authState.refreshToken
        })
      });

      if (!response.ok) {
        console.error('RedditAuth: Token refresh failed');
        throw new Error('Token refresh failed');
      }

      const tokenResponse: RedditTokenResponse = await response.json();
      
      this.authState.accessToken = tokenResponse.access_token;
      this.authState.expiresAt = Date.now() + (tokenResponse.expires_in * 1000);
      
      this.saveAuthState();
      console.log('RedditAuth: Token refreshed successfully');
      return true;
    } catch (error) {
      console.error('RedditAuth: Error refreshing token:', error);
      this.clearAuthState();
      return false;
    }
  }

  async getValidAccessToken(): Promise<string | null> {
    // Check if we have a valid token
    if (this.authState.accessToken && this.authState.expiresAt && Date.now() < this.authState.expiresAt - 60000) {
      console.log('RedditAuth: Using existing valid token');
      return this.authState.accessToken;
    }

    // Try to refresh the token
    if (this.authState.refreshToken) {
      console.log('RedditAuth: Token expired, attempting refresh...');
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        return this.authState.accessToken;
      }
    }

    console.log('RedditAuth: No valid token available');
    return null;
  }

  getAuthState(): RedditAuthState {
    return { ...this.authState };
  }

  logout(): void {
    console.log('RedditAuth: Logging out');
    this.clearAuthState();
  }

  isAuthenticated(): boolean {
    const isAuth = this.authState.isAuthenticated && 
           this.authState.accessToken !== null && 
           this.authState.expiresAt !== null && 
           Date.now() < this.authState.expiresAt;
    
    console.log('RedditAuth: isAuthenticated check:', isAuth);
    return isAuth;
  }
}