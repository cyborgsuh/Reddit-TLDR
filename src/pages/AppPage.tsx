import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User } from 'lucide-react';
import Navigation from '../components/Navigation';
import SearchForm from '../components/SearchForm';
import LoadingState from '../components/LoadingState';
import StackedResults from '../components/StackedResults';
import Summary from '../components/Summary';
import RedditAuthButton from '../components/RedditAuthButton';
import AuthCallback from '../components/AuthCallback';
import { searchReddit } from '../utils/reddit';
import { analyzeSentiment, aggregateResults } from '../utils/gemini';
import { AnalysisResult, AggregatedResult, SentimentCounts, RedditAuthState } from '../types';
import { RedditAuth } from '../utils/reddit-auth';

const AppPage: React.FC = () => {
  const { user, signOut } = useAuth();
  
  // Check if this is the auth callback route
  const isAuthCallback = window.location.pathname === '/auth/callback';
  
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true' || 
             (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [aggregatedResult, setAggregatedResult] = useState<AggregatedResult | null>(null);
  const [currentStage, setCurrentStage] = useState<'fetching' | 'analyzing' | 'aggregating'>('fetching');
  const [currentPost, setCurrentPost] = useState(0);
  const [totalPosts, setTotalPosts] = useState(0);
  const [sentimentCounts, setSentimentCounts] = useState<SentimentCounts>({
    positive: 0,
    negative: 0,
    mixed: 0,
    neutral: 0
  });
  const [dataRetrievalTime, setDataRetrievalTime] = useState(0);
  const [llmProcessingTime, setLlmProcessingTime] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [redditAuthState, setRedditAuthState] = useState<RedditAuthState>({
    isAuthenticated: false,
    accessToken: null,
    refreshToken: null,
    expiresAt: null,
    username: null
  });

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
  }, []);

  const handleAuthStateChange = (newAuthState: RedditAuthState) => {
    setRedditAuthState(newAuthState);
  };

  const handleAuthComplete = (success: boolean) => {
    if (success) {
      const redditAuth = RedditAuth.getInstance();
      setRedditAuthState(redditAuth.getAuthState());
    }
    // Redirect back to main app
    window.location.href = '/app';
  };

  // Show auth callback component if on callback route
  if (isAuthCallback) {
    return <AuthCallback onAuthComplete={handleAuthComplete} />;
  }

  const handleSearch = async (query: string, apiKey: string, postLimit: number, maxRetries: number, selectedModel: string) => {
    setIsAnalyzing(true);
    setAnalysisResults([]);
    setAggregatedResult(null);
    setCurrentPost(0);
    setTotalPosts(0);
    setKeyword(query);
    setSentimentCounts({ positive: 0, negative: 0, mixed: 0, neutral: 0 });

    try {
      // Stage 1: Fetch Reddit data
      setCurrentStage('fetching');
      const dataStartTime = Date.now();
      
      const posts = await searchReddit(query, postLimit);
      setTotalPosts(posts.length);
      
      const dataEndTime = Date.now();
      setDataRetrievalTime((dataEndTime - dataStartTime) / 1000);

      if (posts.length === 0) {
        alert('No posts found for this search term. Try a different keyword.');
        setIsAnalyzing(false);
        return;
      }

      // Stage 2: Analyze sentiment for each post
      setCurrentStage('analyzing');
      const llmStartTime = Date.now();
      
      const results: AnalysisResult[] = [];
      const allPositives: string[] = [];
      const allNegatives: string[] = [];
      const counts: SentimentCounts = { positive: 0, negative: 0, mixed: 0, neutral: 0 };

      for (let i = 0; i < posts.length; i++) {
        const post = posts[i];
        setCurrentPost(i + 1);

        try {
          const result = await analyzeSentiment(post, query, apiKey, maxRetries, selectedModel);
          const analysisResult: AnalysisResult = { post, result };
          
          results.push(analysisResult);
          setAnalysisResults([...results]);

          if (result) {
            // Count sentiments
            const sentiment = result.sentiment.toLowerCase() as keyof SentimentCounts;
            if (sentiment in counts) {
              counts[sentiment]++;
              setSentimentCounts({ ...counts });
            }

            // Collect positive and negative points
            allPositives.push(...result.positives);
            allNegatives.push(...result.negatives);
          }

          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Error analyzing post ${i + 1}:`, error);
          const analysisResult: AnalysisResult = { post, result: null };
          results.push(analysisResult);
          setAnalysisResults([...results]);
        }
      }

      // Stage 3: Aggregate results
      setCurrentStage('aggregating');
      
      if (allPositives.length > 0 || allNegatives.length > 0) {
        try {
          const aggregated = await aggregateResults(allPositives, allNegatives, query, apiKey, maxRetries, selectedModel);
          setAggregatedResult(aggregated);
        } catch (error) {
          console.error('Error aggregating results:', error);
        }
      }

      const llmEndTime = Date.now();
      setLlmProcessingTime((llmEndTime - llmStartTime) / 1000);

    } catch (error) {
      console.error('Error during analysis:', error);
      if (error instanceof Error) {
        alert(`Error: ${error.message}`);
      } else {
        alert('An unexpected error occurred during analysis.');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 transition-colors duration-300">
      
      {/* Use Navigation Component */}
      <Navigation />

      {/* Main Content */}
      <div className="pt-20 sm:pt-24 pb-12 sm:pb-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-4 sm:p-6 lg:p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2 flex flex-col sm:flex-row sm:items-center sm:space-x-2">
                  <span>Reddit TLDR Analysis</span>
                  <div className="flex items-center space-x-2 mt-1 sm:mt-0">
                    <svg className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500 animate-pulse" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
                    </svg>
                  </div>
                </h1>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                  AI-powered sentiment analysis for Reddit discussions
                </p>
              </div>
              
              <div className="text-left lg:text-right">
                <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Signed in as: {user?.email}</span>
                  <span className="sm:hidden">User: {user?.email?.split('@')[0]}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Reddit Auth Section */}
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">Reddit Authentication</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Connect your Reddit account for higher rate limits and better performance
                </p>
              </div>
              <div className="flex flex-col items-start sm:items-end space-y-2">
                <RedditAuthButton 
                  authState={redditAuthState} 
                  onAuthStateChange={handleAuthStateChange} 
                />
                {redditAuthState.isAuthenticated && (
                  <p className="text-sm text-green-600 dark:text-green-400">
                    ✓ Higher rate limits enabled
                  </p>
                )}
              </div>
            </div>
          </div>
          
          {/* Search Form */}
          <SearchForm onSearch={handleSearch} isAnalyzing={isAnalyzing} />

          {isAnalyzing && (
            <LoadingState 
              stage={currentStage} 
              currentPost={currentPost} 
              totalPosts={totalPosts} 
            />
          )}

          {analysisResults.length > 0 && (
            <StackedResults analysisResults={analysisResults} />
          )}

          {!isAnalyzing && analysisResults.length > 0 && (
            <Summary
              aggregatedResult={aggregatedResult}
              sentimentCounts={sentimentCounts}
              dataRetrievalTime={dataRetrievalTime}
              llmProcessingTime={llmProcessingTime}
              keyword={keyword}
            />
          )}
        </div>
      </div>

    </div>
  );
};

export default AppPage;