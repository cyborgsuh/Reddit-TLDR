import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ExternalLink, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface RedditCredentials {
  reddit_username: string;
  expires_at: string;
  created_at: string;
}

interface RedditAuthButtonProps {
  onConnectionChange?: (isConnected: boolean, username?: string) => void;
}

const RedditAuthButton: React.FC<RedditAuthButtonProps> = ({ onConnectionChange }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [redditUsername, setRedditUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAuthStatus();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        checkRedditConnection(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsConnected(false);
        setRedditUsername(null);
        onConnectionChange?.(false);
      }
    });

    // Check for OAuth callback success
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('reddit_connected') === 'true') {
      const username = urlParams.get('username');
      if (username) {
        setIsConnected(true);
        setRedditUsername(decodeURIComponent(username));
        onConnectionChange?.(true, decodeURIComponent(username));
        
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }

    return () => subscription.unsubscribe();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        await checkRedditConnection(session.user.id);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkRedditConnection = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('reddit_credentials')
        .select('reddit_username, expires_at, created_at')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code !== 'PGRST116') { // Not found error
          console.error('Error checking Reddit connection:', error);
        }
        setIsConnected(false);
        setRedditUsername(null);
        onConnectionChange?.(false);
        return;
      }

      const credentials = data as RedditCredentials;
      const now = new Date();
      const expiresAt = new Date(credentials.expires_at);

      if (now >= expiresAt) {
        // Token expired
        setIsConnected(false);
        setRedditUsername(null);
        onConnectionChange?.(false);
      } else {
        setIsConnected(true);
        setRedditUsername(credentials.reddit_username);
        onConnectionChange?.(true, credentials.reddit_username);
      }
    } catch (error) {
      console.error('Error checking Reddit connection:', error);
      setIsConnected(false);
      setRedditUsername(null);
      onConnectionChange?.(false);
    }
  };

  const handleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      
      if (error) {
        console.error('Error signing in:', error);
        alert('Failed to sign in. Please try again.');
      }
    } catch (error) {
      console.error('Error during sign in:', error);
      alert('Failed to sign in. Please try again.');
    }
  };

  const handleConnectReddit = async () => {
    if (!user) {
      await handleSignIn();
      return;
    }

    setIsConnecting(true);
    
    try {
      // Reddit OAuth parameters
      const clientId = import.meta.env.VITE_REDDIT_CLIENT_ID;
      const redirectUri = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reddit-oauth-callback`;
      const scope = 'read';
      const state = user.id; // Use user ID as state parameter
      
      // Construct Reddit OAuth URL
      const authUrl = new URL('https://www.reddit.com/api/v1/authorize');
      authUrl.searchParams.set('client_id', clientId);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('state', state);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('duration', 'permanent');
      authUrl.searchParams.set('scope', scope);
      
      // Redirect to Reddit OAuth
      window.location.href = authUrl.toString();
    } catch (error) {
      console.error('Error connecting to Reddit:', error);
      alert('Failed to connect to Reddit. Please try again.');
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('reddit_credentials')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error('Error disconnecting Reddit:', error);
        alert('Failed to disconnect Reddit account. Please try again.');
        return;
      }

      setIsConnected(false);
      setRedditUsername(null);
      onConnectionChange?.(false);
    } catch (error) {
      console.error('Error disconnecting Reddit:', error);
      alert('Failed to disconnect Reddit account. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-5 w-5 animate-spin text-orange-600" />
        <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Checking connection...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-1">
              Sign In Required
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
              Sign in to connect your Reddit account and access higher API rate limits.
            </p>
            <button
              onClick={handleSignIn}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 rounded-lg transition-colors"
            >
              Sign In with Google
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isConnected && redditUsername) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-green-800 dark:text-green-200 mb-1">
              Reddit Connected
            </h3>
            <p className="text-sm text-green-700 dark:text-green-300 mb-3">
              Connected as <span className="font-medium">u/{redditUsername}</span>. 
              You now have access to higher API rate limits.
            </p>
            <button
              onClick={handleDisconnect}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-green-800 dark:text-green-200 bg-green-100 dark:bg-green-800/30 hover:bg-green-200 dark:hover:bg-green-800/50 rounded-lg transition-colors"
            >
              Disconnect Reddit
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
      <div className="flex items-start space-x-3">
        <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-orange-800 dark:text-orange-200 mb-1">
            Connect Reddit Account
          </h3>
          <p className="text-sm text-orange-700 dark:text-orange-300 mb-3">
            Connect your Reddit account to access higher API rate limits and avoid rate limiting issues.
          </p>
          <button
            onClick={handleConnectReddit}
            disabled={isConnecting}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConnecting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Connecting...
              </>
            ) : (
              <>
                <ExternalLink className="h-4 w-4 mr-2" />
                Connect Reddit
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RedditAuthButton;