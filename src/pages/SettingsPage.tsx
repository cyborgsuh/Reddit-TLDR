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
  Loader,
  Sun,
  Moon,
  Hash,
  Plus,
  X,
  MessageSquare,
  Brain
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import RedditAuthButton from '../components/RedditAuthButton';
import ModelSelector from '../components/ModelSelector';
import { RedditAuth } from '../utils/reddit-auth';
import { RedditAuthState } from '../types';
import { supabase } from '../lib/supabase';

interface GeminiKeyStatus {
  hasKey: boolean;
  status: 'not_set' | 'valid' | 'invalid' | 'testing';
  apiKey?: string;
}

interface UserSettings {
  defaultPostsCount: number;
  defaultModel: string;
  savedKeywords: string[];
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

  // User settings state
  const [userSettings, setUserSettings] = useState<UserSettings>({
    defaultPostsCount: 10,
    defaultModel: 'gemini-2.0-flash',
    savedKeywords: []
  });
  const [newKeyword, setNewKeyword] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  // Messages
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
    
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

    // Load user settings from localStorage
    loadUserSettings();
  }, []);

  const loadUserSettings = () => {
    try {
      const savedSettings = localStorage.getItem('userSettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setUserSettings(prev => ({ ...prev, ...parsed }));
      }
    } catch (error) {
      console.error('Error loading user settings:', error);
    }
  };

  const saveUserSettings = (newSettings: Partial<UserSettings>) => {
    try {
      const updatedSettings = { ...userSettings, ...newSettings };
      setUserSettings(updatedSettings);
      localStorage.setItem('userSettings', JSON.stringify(updatedSettings));
      
      setSuccessMessage('Settings saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error saving user settings:', error);
      setErrorMessage('Failed to save settings');
    }
  };

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

  const handleAddKeyword = () => {
    if (newKeyword.trim() && !userSettings.savedKeywords.includes(newKeyword.trim())) {
      const updatedKeywords = [...userSettings.savedKeywords, newKeyword.trim()];
      saveUserSettings({ savedKeywords: updatedKeywords });
      setNewKeyword('');
    }
  };

  const handleRemoveKeyword = (keywordToRemove: string) => {
    const updatedKeywords = userSettings.savedKeywords.filter(keyword => keyword !== keywordToRemove);
    saveUserSettings({ savedKeywords: updatedKeywords });
  };

  const handleDefaultSettingsChange = (field: keyof UserSettings, value: any) => {
    saveUserSettings({ [field]: value });
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 transition-colors duration-300">
      
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                to="/dashboard"
                className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back</span>
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
          {/* General Preferences Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center space-x-3 mb-6">
              <Settings className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">General Preferences</h2>
            </div>

            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Customize your general application preferences and interface settings.
            </p>

            <div className="space-y-6">
              {/* Dark Mode Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Dark Mode</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Toggle between light and dark theme
                  </p>
                </div>
                <div className="relative">
                  <button
                    onClick={toggleDarkMode}
                    className={`relative inline-flex h-8 w-16 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 shadow-inner ${
                      isDark ? 'bg-orange-600' : 'bg-gray-300'
                    }`}
                  >
                    {/* Background Icons */}
                    <div className="absolute inset-0 flex items-center justify-between px-2">
                      <Sun className={`h-4 w-4 text-yellow-400 transition-opacity duration-300 ${isDark ? 'opacity-40' : 'opacity-100'}`} />
                      <Moon className={`h-4 w-4 text-blue-200 transition-opacity duration-300 ${isDark ? 'opacity-100' : 'opacity-40'}`} />
                    </div>
                    
                    {/* White Circle Toggle */}
                    <span
                      className={`relative inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-300 z-10 ${
                        isDark ? 'translate-x-9' : 'translate-x-1'
                      }`}
                    >
                      {/* Icon on top of white circle */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Sun className={`h-3 w-3 text-yellow-500 transition-all duration-300 ${isDark ? 'opacity-0 rotate-180 scale-0' : 'opacity-100 rotate-0 scale-100'}`} />
                        <Moon className={`absolute h-3 w-3 text-gray-600 transition-all duration-300 ${isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-180 scale-0'}`} />
                      </div>
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Saved Keywords Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center space-x-3 mb-6">
              <Hash className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Saved Keywords</h2>
            </div>

            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Save frequently used search terms for quick access during analysis.
            </p>

            {/* Add Keyword Input */}
            <div className="space-y-4 mb-6">
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddKeyword()}
                  placeholder="Enter a keyword to save..."
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-700"
                />
                <button
                  onClick={handleAddKeyword}
                  disabled={!newKeyword.trim() || userSettings.savedKeywords.includes(newKeyword.trim())}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                    !newKeyword.trim() || userSettings.savedKeywords.includes(newKeyword.trim())
                      ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed text-white'
                      : 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl'
                  }`}
                >
                  <Plus className="h-5 w-5" />
                  <span>Add</span>
                </button>
              </div>
            </div>

            {/* Keywords List */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Your Saved Keywords ({userSettings.savedKeywords.length})
              </h3>
              
              {userSettings.savedKeywords.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Hash className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No saved keywords yet. Add some to get started!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {userSettings.savedKeywords.map((keyword, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 group hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      <span className="text-gray-900 dark:text-white font-medium truncate">
                        {keyword}
                      </span>
                      <button
                        onClick={() => handleRemoveKeyword(keyword)}
                        className="ml-2 p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Default Analysis Settings Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center space-x-3 mb-6">
              <Brain className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Default Analysis Settings</h2>
            </div>

            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Set your preferred default values for new analyses to speed up your workflow.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Default Posts Count */}
              <div>
                <label htmlFor="defaultPosts" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  <MessageSquare className="inline h-4 w-4 mr-1" />
                  Default Posts Count
                </label>
                <input
                  type="number"
                  id="defaultPosts"
                  min="1"
                  max="100"
                  value={userSettings.defaultPostsCount}
                  onChange={(e) => handleDefaultSettingsChange('defaultPostsCount', parseInt(e.target.value) || 10)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Number of posts to analyze by default (1-100)
                </p>
              </div>

              {/* Default AI Model */}
              <div>
                <ModelSelector
                  selectedModel={userSettings.defaultModel}
                  onModelChange={(model) => handleDefaultSettingsChange('defaultModel', model)}
                  disabled={false}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Your preferred AI model for new analyses
                </p>
              </div>
            </div>

            {/* Settings Summary */}
            <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl border border-orange-200/50 dark:border-orange-800/50">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Current Defaults</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Posts per analysis:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">{userSettings.defaultPostsCount}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">AI Model:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">
                    {userSettings.defaultModel.replace('gemini-', 'Gemini ')}
                  </span>
                </div>
              </div>
            </div>
          </div>

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
              <svg className="h-6 w-6 text-orange-600 dark:text-orange-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0