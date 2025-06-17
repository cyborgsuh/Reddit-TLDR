import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Navigation from '../components/Navigation';
import DashboardCard from '../components/DashboardCard';
import SentimentChart from '../components/SentimentChart';
import RecentMentions from '../components/RecentMentions';
import DarkModeToggle from '../components/DarkModeToggle';
import { 
  Shield, 
  Search, 
  TrendingUp, 
  Brain,
  Sparkles,
  Calendar
} from 'lucide-react';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true' || 
             (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', isDark.toString());
  }, [isDark]);

  const toggleDarkMode = () => {
    setIsDark(!isDark);
  };

  // Mock data - replace with real data later
  const userName = user?.email?.split('@')[0] || 'John';
  const currentTime = new Date().toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const sentimentData = [
    { day: 'Mon', positive: 45, negative: 15, neutral: 25, mixed: 15 },
    { day: 'Tue', positive: 52, negative: 12, neutral: 28, mixed: 8 },
    { day: 'Wed', positive: 38, negative: 22, neutral: 30, mixed: 10 },
    { day: 'Thu', positive: 48, negative: 18, neutral: 24, mixed: 10 },
    { day: 'Fri', positive: 55, negative: 10, neutral: 25, mixed: 10 },
    { day: 'Sat', positive: 42, negative: 20, neutral: 28, mixed: 10 },
    { day: 'Sun', positive: 50, negative: 15, neutral: 25, mixed: 10 },
  ];

  const recentMentions = [
    {
      id: '1',
      author: 'sarah_marketing',
      content: 'Just discovered @YourBrand and I am absolutely loving their customer service! The response time is incredible and the team really cares about solving problems. Highly recommended! 👍',
      sentiment: 'positive' as const,
      subreddit: 'CustomerService',
      timestamp: '2 hours ago',
      score: 24
    },
    {
      id: '2',
      author: 'mike_dev',
      content: 'Having some issues with @YourBrand product lately. The latest update seems to have broken some features I rely on daily. Hope they fix this soon.',
      sentiment: 'negative' as const,
      subreddit: 'TechSupport',
      timestamp: '4 hours ago',
      score: 8
    },
    {
      id: '3',
      author: 'alex_user',
      content: 'Mixed feelings about the new @YourBrand features. Some are great, others feel rushed. The UI is beautiful but functionality could be better.',
      sentiment: 'mixed' as const,
      subreddit: 'ProductReviews',
      timestamp: '6 hours ago',
      score: 15
    }
  ];

  const handleViewAllMentions = () => {
    // Navigate to mentions feed page
    console.log('Navigate to mentions feed');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-amber-50/30 to-yellow-50/50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 transition-colors duration-300">
      <DarkModeToggle isDark={isDark} onToggle={toggleDarkMode} />
      <Navigation />
      
      {/* Main Content */}
      <div className="pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-8">
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center space-x-2">
                    <span>Welcome back, {userName}!</span>
                    <Sparkles className="h-8 w-8 text-orange-500 animate-pulse" />
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300">
                    Here's how your brand reputation is performing today.
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                    <Calendar className="h-4 w-4" />
                    <span>Last updated: {currentTime}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <DashboardCard
              title="Reputation Score"
              value="78"
              change="+5.2% this week"
              changeType="positive"
              icon={Shield}
              description="Overall brand sentiment score"
            />
            
            <DashboardCard
              title="Total Searches"
              value="1,247"
              change="+12% vs last week"
              changeType="positive"
              icon={Search}
              description="Keyword mentions in 24h"
            />
            
            <DashboardCard
              title="Positive Ratio"
              value="68%"
              change="+8% vs last week"
              changeType="positive"
              icon={TrendingUp}
              description="Positive vs negative sentiment"
            />
          </div>

          {/* AI Summary */}
          <div className="mb-8">
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-xl">
                  <Brain className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI Summary Insights</h3>
              </div>
              
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-blue-200/50 dark:border-blue-800/50">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  Your brand reputation has shown steady improvement over the past week, with a 5.2% increase in overall sentiment score. 
                  The launch of your new AI feature has generated significant positive buzz, particularly among productivity-focused users. 
                  However, there are some concerns about recent product updates affecting core functionality that should be addressed promptly.
                </p>
              </div>
            </div>
          </div>

          {/* Charts and Recent Mentions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Sentiment Chart */}
            <SentimentChart 
              data={sentimentData}
              title="Sentiment Trend (7 days)"
            />
            
            {/* Recent Mentions */}
            <RecentMentions 
              mentions={recentMentions}
              onViewAll={handleViewAllMentions}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;