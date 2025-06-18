import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Navigation from '../components/Navigation';
import DashboardCard from '../components/DashboardCard';
import SentimentChart from '../components/SentimentChart';
import RecentMentions from '../components/RecentMentions';
import { useDashboardData } from '../hooks/useDashboardData';
import { 
  Shield, 
  Search, 
  TrendingUp, 
  Brain,
  Sparkles,
  Calendar,
  RefreshCw
} from 'lucide-react';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { data: dashboardData, loading: dashboardLoading, error: dashboardError, refetch } = useDashboardData();
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true' || 
             (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', isDark.toString());
  }, [isDark]);


  const userName = user?.email?.split('@')[0] || 'John';
  const currentTime = new Date().toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const handleRefresh = async () => {
    await refetch();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 transition-colors duration-500">
      <Navigation />
      
      {/* Main Content */}
      <div className="pt-20 sm:pt-24 pb-12 sm:pb-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-8">
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-4 sm:p-6 lg:p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2 flex flex-col sm:flex-row sm:items-center sm:space-x-2">
                    <span>Welcome back, {userName}!</span>
                    <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500 animate-pulse mt-1 sm:mt-0" />
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                    Here's how your brand reputation is performing today.
                  </p>
                </div>
                <div className="text-left lg:text-right">
                  <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    <Calendar className="h-4 w-4" />
                    <span className="hidden sm:inline">
                      Last updated: {dashboardData?.lastUpdated ? new Date(dashboardData.lastUpdated).toLocaleString() : currentTime}
                    </span>
                    <span className="sm:hidden">
                      Updated: {dashboardData?.lastUpdated ? new Date(dashboardData.lastUpdated).toLocaleDateString() : new Date().toLocaleDateString()}
                    </span>
                  </div>
                  <button
                    onClick={handleRefresh}
                    disabled={dashboardLoading}
                    className="mt-2 lg:mt-0 lg:ml-4 flex items-center space-x-2 px-3 py-1.5 bg-orange-100 dark:bg-orange-900/30 hover:bg-orange-200 dark:hover:bg-orange-900/50 text-orange-700 dark:text-orange-400 rounded-lg transition-all duration-200 text-sm"
                  >
                    <RefreshCw className={`h-4 w-4 ${dashboardLoading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {dashboardError && (
            <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-700 dark:text-red-300 text-sm">
                Error loading dashboard data: {dashboardError}
              </p>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <DashboardCard
              title="Reputation Score"
              value={dashboardLoading ? "..." : (dashboardData?.reputationScore?.toString() || "50")}
              change={dashboardLoading ? "..." : (dashboardData?.reputationChange ? `${dashboardData.reputationChange > 0 ? '+' : ''}${dashboardData.reputationChange} points` : "No change")}
              changeType={dashboardData?.reputationChange && dashboardData.reputationChange > 0 ? "positive" : dashboardData?.reputationChange && dashboardData.reputationChange < 0 ? "negative" : "neutral"}
              icon={Shield}
              description="Overall brand sentiment score"
            />
            
            <DashboardCard
              title="Total Searches"
              value={dashboardLoading ? "..." : (dashboardData?.totalMentions?.toLocaleString() || "0")}
              change="Last 24 hours"
              changeType="neutral"
              icon={Search}
              description="New mentions found"
            />
            
            <DashboardCard
              title="Positive Ratio"
              value={dashboardLoading ? "..." : `${dashboardData?.positiveRatio || 0}%`}
              change="Of all mentions"
              changeType={dashboardData?.positiveRatio && dashboardData.positiveRatio > 60 ? "positive" : dashboardData?.positiveRatio && dashboardData.positiveRatio < 40 ? "negative" : "neutral"}
              icon={TrendingUp}
              description="Positive vs negative sentiment"
            />
          </div>

          {/* AI Summary */}
          <div className="mb-8">
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-xl">
                  <Brain className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">AI Summary Insights</h3>
              </div>
              
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-blue-200/50 dark:border-blue-800/50">
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                  {dashboardLoading ? (
                    "Loading AI insights..."
                  ) : dashboardData ? (
                    `Your brand reputation score is currently ${dashboardData.reputationScore}/100. ` +
                    `You have ${dashboardData.totalMentions} new mentions in the last 24 hours, with ${dashboardData.positiveRatio}% being positive. ` +
                    (dashboardData.reputationChange > 0 
                      ? `Your reputation has improved by ${dashboardData.reputationChange} points recently.`
                      : dashboardData.reputationChange < 0 
                        ? `Your reputation has decreased by ${Math.abs(dashboardData.reputationChange)} points recently.`
                        : "Your reputation score has remained stable.")
                  ) : (
                    "Unable to load AI insights at this time. Please try refreshing the page."
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Charts and Recent Mentions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-20 sm:mb-0">
            {/* Sentiment Chart */}
            <SentimentChart 
              data={dashboardData?.sentimentTrend || []}
              title="Sentiment Trend (7 days)"
            />
            
            {/* Recent Mentions */}
            <RecentMentions 
              mentions={dashboardData?.recentMentions || []}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;