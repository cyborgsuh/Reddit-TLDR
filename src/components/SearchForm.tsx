import React, { useState, useMemo } from 'react';
import { Search, Key, MessageSquare, Clock } from 'lucide-react';
import ModelSelector from './ModelSelector';
import RedditAuthButton from './RedditAuthButton';

interface SearchFormProps {
  onSearch: (query: string, apiKey: string, postLimit: number, maxRetries: number, selectedModel: string) => void;
  isAnalyzing: boolean;
  useOAuth?: boolean;
  onOAuthToggle?: (useOAuth: boolean) => void;
}

const SearchForm: React.FC<SearchFormProps> = ({ onSearch, isAnalyzing, useOAuth = false, onOAuthToggle }) => {
  const [query, setQuery] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [postLimit, setPostLimit] = useState(10);
  const [selectedModel, setSelectedModel] = useState('gemini-2.0-flash'); // Default to stable model
  const [showApiKey, setShowApiKey] = useState(false);
  const [isRedditConnected, setIsRedditConnected] = useState(false);

  // Calculate estimated time range based on performance data and rate limits
  const estimatedTimeRange = useMemo(() => {
    if (postLimit <= 0) return { min: '--', max: '--', note: '' };

    // Data retrieval scales roughly linearly: ~0.5-0.7s per post
    const dataTimeMin = Math.max(4.9, postLimit * 0.5);
    const dataTimeMax = Math.max(4.9, postLimit * 0.7);
    
    // AI processing varies significantly due to rate limits
    // Best case (no rate limiting): ~3-4s per post
    // Worst case (heavy rate limiting): ~5-6s per post
    const aiTimeMin = Math.max(29.2, postLimit * 3);
    const aiTimeMax = Math.max(29.2, postLimit * 6);
    
    const totalMin = dataTimeMin + aiTimeMin;
    const totalMax = dataTimeMax + aiTimeMax;
    
    // Convert to minutes and seconds
    const formatTime = (seconds: number) => {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.round(seconds % 60);
      
      if (minutes > 0) {
        return `${minutes}m ${remainingSeconds}s`;
      } else {
        return `${remainingSeconds}s`;
      }
    };

    return {
      min: formatTime(totalMin),
      max: formatTime(totalMax),
      note: postLimit > 10 ? 'May take longer due to API rate limits' : 'Estimate may vary with API rate limits'
    };
  }, [postLimit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && (apiKey.trim() || (useOAuth && isRedditConnected))) {
      onSearch(query.trim(), apiKey.trim(), postLimit, 12, selectedModel);
    }
  };

  const handlePostLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Allow empty string for user to delete and type
    if (value === '') {
      setPostLimit(0);
      return;
    }
    
    // Parse and constrain the value
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue)) {
      setPostLimit(Math.max(1, Math.min(100, numValue)));
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mx-6 -mt-4 relative z-10 border border-gray-100 dark:border-gray-700 transition-colors duration-300">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="query" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Search Term
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5" />
            <input
              type="text"
              id="query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter Reddit search term (e.g., 'Tesla', 'React', 'Climate change')"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-700"
              disabled={isAnalyzing}
            />
          </div>
        </div>

        {/* Reddit OAuth Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Reddit API Access</h3>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useOAuth}
                onChange={(e) => onOAuthToggle?.(e.target.checked)}
                disabled={isAnalyzing}
                className="rounded border-gray-300 dark:border-gray-600 text-orange-600 focus:ring-orange-500 focus:ring-offset-0"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">Use OAuth (Recommended)</span>
            </label>
          </div>
          
          {useOAuth && (
            <RedditAuthButton 
              onConnectionChange={(connected, username) => {
                setIsRedditConnected(connected);
              }}
            />
          )}
        </div>

        {!useOAuth && (
          <div>
           <label htmlFor="apiKey" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Gemini API Key
          </label>
          <div className="relative">
            <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5" />
            <input
              type={showApiKey ? 'text' : 'password'}
              id="apiKey"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Gemini API key"
              className="w-full pl-10 pr-16 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-700"
              disabled={isAnalyzing}
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors text-sm"
            >
              {showApiKey ? 'Hide' : 'Show'}
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
        )}

        {/* Model Selector */}
        <ModelSelector
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          disabled={isAnalyzing}
        />

        {/* Advanced Settings */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-4 transition-colors duration-300">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Advanced Settings</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
              <label htmlFor="postLimit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <MessageSquare className="inline h-4 w-4 mr-1" />
                Posts to Analyze
              </label>
              <input
                type="number"
                id="postLimit"
                value={postLimit || ''} // Show empty string when value is 0
                onChange={handlePostLimitChange}
                min="1"
                max="100"
                placeholder="Enter number (1-100)"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white bg-white dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400"
                disabled={isAnalyzing}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Maximum: 100 posts</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Clock className="inline h-4 w-4 mr-1" />
                Estimated Time
              </label>
              <div className="px-3 py-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                <span className="text-sm font-semibold text-orange-700 dark:text-orange-400">
                  {postLimit > 0 ? `${estimatedTimeRange.min} - ${estimatedTimeRange.max}` : '--'}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {postLimit > 0 ? estimatedTimeRange.note : 'Based on API rate limits'}
              </p>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={!query.trim() || (!apiKey.trim() && !(useOAuth && isRedditConnected)) || postLimit < 1 || isAnalyzing}
          className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-all duration-200 ${
            !query.trim() || (!apiKey.trim() && !(useOAuth && isRedditConnected)) || postLimit < 1 || isAnalyzing
              ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
              : 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 dark:from-orange-700 dark:to-amber-700 dark:hover:from-orange-800 dark:hover:to-amber-800 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl'
          }`}
        >
          {isAnalyzing ? (
            <div className="flex items-center justify-center space-x-3">
              <div className="boxes-small">
                <div className="box"></div>
                <div className="box"></div>
                <div className="box"></div>
                <div className="box"></div>
              </div>
              <span>Analyzing...</span>
            </div>
          ) : (
            'Analyze Sentiment'
          )}
        </button>
      </form>
    </div>
  );
};

export default SearchForm;