import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Navigation from '../components/Navigation';
import BrandAnalysisCard from '../components/BrandAnalysisCard';
import AssociatedKeywords from '../components/AssociatedKeywords';
import CompetitorLandscape from '../components/CompetitorLandscape';
import AIRecommendations from '../components/AIRecommendations';
import AIChatbot from '../components/AIChatbot';
import { 
  Brain, 
  TrendingUp, 
  Target, 
  Users,
  MessageSquare,
  Sparkles,
  BarChart3,
  Zap
} from 'lucide-react';

const InsightsPage: React.FC = () => {
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

  // Mock data for brand metrics
  const brandMetrics = {
    brandVelocity: { value: 23.4, change: 5.2, trend: 'up' },
    shareOfVoice: { value: 34.2, change: 1.8, trend: 'up' },
    influenceScore: { value: 8.7, change: 0.3, trend: 'up' },
    brandSentiment: { value: 78, change: 4.1, trend: 'up' }
  };

  const associatedKeywords = [
    { keyword: 'customer service', sentiment: 'positive', mentions: 234, change: 12.3 },
    { keyword: 'AI integration', sentiment: 'positive', mentions: 189, change: 45.6 },
    { keyword: 'user experience', sentiment: 'mixed', mentions: 156, change: -2.1 },
    { keyword: 'productivity', sentiment: 'positive', mentions: 142, change: 23.1 },
    { keyword: 'innovation', sentiment: 'positive', mentions: 98, change: 34.5 }
  ];

  const competitors = [
    { name: 'Competitor A', score: 72, mentions: 890, change: -2.1, color: '#10b981' },
    { name: 'Competitor B', score: 81, mentions: 1240, change: 1.8, color: '#f59e0b' },
    { name: 'Your Brand', score: 78, mentions: 1247, change: 5.2, color: '#3b82f6' }
  ];

  const aiRecommendations = [
    {
      type: 'critical',
      title: 'Address Product Update Issues',
      description: 'Several users mentioned broken features after recent updates. Consider creating a comprehensive FAQ or status page to address these concerns publicly.',
      priority: 'high',
      impact: 'Brand Trust'
    },
    {
      type: 'opportunity',
      title: 'Amplify AI Feature Success',
      description: 'The AI integration launch is generating positive buzz. Consider creating case studies or tutorials to capitalize on this momentum.',
      priority: 'medium',
      impact: 'Market Share'
    },
    {
      type: 'insight',
      title: 'Engage with Industry Analysts',
      description: 'Neutral mentions from industry analysts present an opportunity. Reach out to provide additional context and build relationships.',
      priority: 'low',
      impact: 'Thought Leadership'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 transition-colors duration-300">
      <Navigation />
      
      {/* Main Content */}
      <div className="pt-20 sm:pt-24 pb-12 sm:pb-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="mb-8">
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-4 sm:p-6 lg:p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2 flex flex-col sm:flex-row sm:items-center sm:space-x-2">
                    <span>AI Brand Insights</span>
                    <Brain className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500 animate-pulse mt-1 sm:mt-0" />
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                    AI-powered analysis of your brand performance and competitive landscape
                  </p>
                </div>
                
                <div className="text-left lg:text-right">
                  <button className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>Export Report</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* AI-Powered Brand Analysis Section */}
          <div className="mb-8">
            <BrandAnalysisCard 
              metrics={brandMetrics}
              recommendations={aiRecommendations}
            />
          </div>

          {/* Brand Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            <div className="group relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-amber-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30">
                    <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-xs sm:text-sm font-medium text-green-600 dark:text-green-400">
                    +{brandMetrics.brandVelocity.change}%
                  </div>
                </div>
                <h3 className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Brand Velocity
                </h3>
                <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  +{brandMetrics.brandVelocity.value}%
                </div>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  vs last month
                </p>
              </div>
            </div>

            <div className="group relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-amber-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-purple-100 to-violet-100 dark:from-purple-900/30 dark:to-violet-900/30">
                    <Target className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="text-xs sm:text-sm font-medium text-green-600 dark:text-green-400">
                    +{brandMetrics.shareOfVoice.change}%
                  </div>
                </div>
                <h3 className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Share of Voice
                </h3>
                <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  {brandMetrics.shareOfVoice.value}%
                </div>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  vs competitors
                </p>
              </div>
            </div>

            <div className="group relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-amber-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30">
                    <Users className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="text-xs sm:text-sm font-medium text-green-600 dark:text-green-400">
                    +{brandMetrics.influenceScore.change}
                  </div>
                </div>
                <h3 className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Influence Score
                </h3>
                <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  {brandMetrics.influenceScore.value}/10
                </div>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  industry leading
                </p>
              </div>
            </div>

            <div className="group relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-amber-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30">
                    <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="text-xs sm:text-sm font-medium text-green-600 dark:text-green-400">
                    +{brandMetrics.brandSentiment.change}%
                  </div>
                </div>
                <h3 className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Brand Sentiment
                </h3>
                <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  {brandMetrics.brandSentiment.value}%
                </div>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  positive mentions
                </p>
              </div>
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 mb-8">
            {/* Associated Keywords */}
            <div className="lg:col-span-1">
              <AssociatedKeywords keywords={associatedKeywords} />
            </div>
            
            {/* Competitor Landscape */}
            <div className="lg:col-span-2">
              <CompetitorLandscape competitors={competitors} />
            </div>
          </div>

          {/* AI Chatbot */}
          <div className="mb-20 sm:mb-0">
            <AIChatbot />
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsightsPage;