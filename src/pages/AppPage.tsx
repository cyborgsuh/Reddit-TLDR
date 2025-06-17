import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import SearchForm from '../components/SearchForm';
import LoadingState from '../components/LoadingState';
import StackedResults from '../components/StackedResults';
import Summary from '../components/Summary';
import Footer from '../components/Footer';
import DarkModeToggle from '../components/DarkModeToggle';
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

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      
      {/* App Header with User Info */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <svg className="h-8 w-8 text-orange-600 dark:text-orange-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
              </svg>
              <span className="text-xl font-bold text-gray-900 dark:text-white">Reddit TLDR</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <User className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{user?.email}</span>
              </div>
              <Link
                to="/settings"
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 border border-gray-200 dark:border-gray-600 rounded-lg transition-all duration-200"
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
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

      <Header />
      
      {/* Reddit Auth Section */}
      <div className="container mx-auto max-w-6xl px-6 -mt-2 mb-4">
        <div className="flex justify-center">
          <RedditAuthButton 
            authState={redditAuthState} 
            onAuthStateChange={handleAuthStateChange} 
          />
        </div>
        {redditAuthState.isAuthenticated && (
          <div className="text-center mt-2">
            <p className="text-sm text-green-600 dark:text-green-400">
              ✓ Higher rate limits enabled with Reddit authentication
            </p>
          </div>
        )}
      </div>
      
      <div className="container mx-auto max-w-6xl pb-12">
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

      <Footer />
    </div>
  );
};

export default AppPage;