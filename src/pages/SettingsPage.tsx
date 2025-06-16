import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Settings, 
  Key, 
  Eye, 
  EyeOff, 
  Save, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  User,
  LogOut,
  ArrowLeft,
  Loader
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import DarkModeToggle from '../components/DarkModeToggle';
import RedditAuthButton from '../components/RedditAuthButton';
import { RedditAuth } from '../utils/reddit-auth';
import { RedditAuthState } from '../types';
import { supabase } from '../lib/supabase';

interface GeminiKeyStatus {
  hasKey: boolean;
  status: 'not_set' | 'valid' | 'invalid' | 'testing';
  apiKey?: string;
}

const SettingsPage: React.FC = () => {
  const { user, signOut } = useAuth();
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true' || 
             (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  // Gemini API Key state
  const [geminiKey, setGeminiKey] = useState('');
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [geminiKeyStatus, setGeminiKeyStatus] = useState<GeminiKeyStatus>({
    hasKey: false,
    status: 'not_set'
  });
  const [savingGeminiKey, setSavingGeminiKey] = useState(false);
  const [loadingGeminiKey, setLoadingGeminiKey] = useState(true);

  // Reddit OAuth state
  const [redditAuthState, setRedditAuthState] = useState<RedditAuthState>({
    isAuthenticated: false,
    accessToken: null,
    refreshToken: null,
    expiresAt: null,
    username: null
  });

  // Messages
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', isDark.toString());
  }, [isDark]);

  useEffect(() => {
    // Initialize Reddit auth state
    const redditAuth = RedditAuth.getInstance();
    setRedditAuthState(redditAuth.getAuthState());

    // Load Gemini API key status
    loadGeminiKeyStatus();
  }, []);

  const toggleDarkMode = () => {
    setIsDark(!isDark);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleAuthStateChange = (newAuthState: RedditAuthState) => {
    setRedditAuthState(newAuthState);
  };

  const loadGeminiKeyStatus = async () => {
    try {
      setLoadingGeminiKey(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setLoadingGeminiKey(false);
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-gemini-key`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setGeminiKeyStatus(data);
        if (data.hasKey && data.apiKey) {
          setGeminiKey(data.apiKey);
        }
      }
    } catch (error) {
      console.error('Error loading Gemini key status:', error);
    } finally {
      setLoadingGeminiKey(false);
    }
  };

  const validateGeminiKeyFormat = (key: string): boolean => {
    return key.startsWith('AIza') && key.length >= 30;
  };

  const handleSaveGeminiKey = async () => {
    if (!geminiKey.trim()) {
      setErrorMessage('Please enter a Gemini API key');
      return;
    }

    if (!validateGeminiKeyFormat(geminiKey)) {
      setErrorMessage('Invalid API key format. Gemini API keys should start with "AIza" and be at least 30 characters long.');
      return;
    }

    setSavingGeminiKey(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setErrorMessage('Authentication required');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/save-gemini-key`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey: geminiKey }),
      });

      const data = await response.json();

      if (response.ok) {
        setGeminiKeyStatus({
          hasKey: true,
          status: data.status,
          apiKey: geminiKey
        });
        setSuccessMessage('Gemini API key saved successfully!');
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage(data.error || 'Failed to save API key');
      }
    } catch (error) {
      console.error('Error saving Gemini key:', error);
      setErrorMessage('An unexpected error occurred');
    } finally {
      setSavingGeminiKey(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'invalid':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'testing':
        return <Loader className="h-5 w-5 text-orange-500 animate-spin" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'valid':
        return 'Valid API key';
      case 'invalid':
        return 'Invalid API key';
      case 'testing':
        return 'Testing API key...';
      default:
        return 'No API key set';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid':
        return 'text-green-600 dark:text-green-400';
      case 'invalid':
        return 'text-red-600 dark:text-red-400';
      case 'testing':
        return 'text-orange-600 dark:text-orange-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      <DarkModeToggle isDark={isDark} onToggle={toggleDarkMode} />
      
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                to="/app"
                className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to App</span>
              </Link>
              <div className="flex items-center space-x-3">
                <Settings className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                <span className="text-xl font-bold text-gray-900 dark:text-white">Settings</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <User className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{user?.email}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border border-gray-200 dark:border-gray-600 rounded-lg transition-all duration-200"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-6 py-8">
        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center space-x-3">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
            <p className="text-green-700 dark:text-green-300 text-sm">{successMessage}</p>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center space-x-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <p className="text-red-700 dark:text-red-300 text-sm">{errorMessage}</p>
          </div>
        )}

        <div className="space-y-8">
          {/* Gemini API Key Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center space-x-3 mb-6">
              <Key className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Gemini API Key</h2>
            </div>

            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Your Gemini API key is used to power the AI sentiment analysis. It's encrypted and stored securely.
            </p>

            {loadingGeminiKey ? (
              <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <Loader className="h-5 w-5 text-orange-500 animate-spin" />
                <span className="text-gray-600 dark:text-gray-300">Loading API key status...</span>
              </div>
            ) : (
              <>
                {/* API Key Status */}
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(geminiKeyStatus.status)}
                    <span className={`font-medium ${getStatusColor(geminiKeyStatus.status)}`}>
                      {getStatusText(geminiKeyStatus.status)}
                    </span>
                  </div>
                  {geminiKeyStatus.hasKey && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      Last updated: {new Date().toLocaleDateString()}
                    </p>
                  )}
                </div>

                {/* API Key Input */}
                <div className="space-y-4">
                  <div>
                    <label htmlFor="geminiKey" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Gemini API Key
                    </label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5" />
                      <input
                        type={showGeminiKey ? 'text' : 'password'}
                        id="geminiKey"
                        value={geminiKey}
                        onChange={(e) => setGeminiKey(e.target.value)}
                        className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-700"
                        placeholder="Enter your Gemini API key"
                      />
                      <button
                        type="button"
                        onClick={() => setShowGeminiKey(!showGeminiKey)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      >
                        {showGeminiKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Get your API key from{' '}
                      <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300 underline"
                      >
                        Google AI Studio
                      </a>
                    </p>
                  </div>

                  <button
                    onClick={handleSaveGeminiKey}
                    disabled={savingGeminiKey || !geminiKey.trim()}
                    className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                      savingGeminiKey || !geminiKey.trim()
                        ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed text-white'
                        : 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 dark:from-orange-700 dark:to-amber-700 dark:hover:from-orange-800 dark:hover:to-amber-800 text-white transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl'
                    }`}
                  >
                    {savingGeminiKey ? (
                      <>
                        <Loader className="h-5 w-5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5" />
                        <span>Save API Key</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Reddit OAuth Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center space-x-3 mb-6">
              <svg className="h-6 w-6 text-orange-600 dark:text-orange-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
              </svg>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Reddit Authentication</h2>
            </div>

            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Connect your Reddit account to access higher rate limits and avoid API restrictions when fetching posts and comments.
            </p>

            <div className="space-y-4">
              <RedditAuthButton 
                authState={redditAuthState} 
                onAuthStateChange={handleAuthStateChange} 
              />
              
              {redditAuthState.isAuthenticated && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <div>
                      <p className="text-green-700 dark:text-green-300 font-medium">
                        Reddit account connected successfully
                      </p>
                      <p className="text-green-600 dark:text-green-400 text-sm">
                        You now have access to higher rate limits for Reddit API requests
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Account Information */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center space-x-3 mb-6">
              <User className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Account Information</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-gray-900 dark:text-white">{user?.email}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Account Created
                </label>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-gray-900 dark:text-white">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;