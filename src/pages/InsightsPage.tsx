import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Navigation from '../components/Navigation';
import BrandAnalysisCard from '../components/BrandAnalysisCard';
import AssociatedKeywords from '../components/AssociatedKeywords';
import CompetitorLandscape from '../components/CompetitorLandscape';
import AIChatbot from '../components/AIChatbot';
import { useDashboardData } from '../hooks/useDashboardData';
import { supabase } from '../lib/supabase';
import { 
  Brain, 
  TrendingUp, 
  Target, 
  Users,
  MessageSquare,
  Sparkles,
  BarChart3,
  Zap,
  AlertCircle,
  Loader
} from 'lucide-react';

interface KeywordInsight {
  keyword: string;
  sentiment: 'positive' | 'negative' | 'mixed' | 'neutral';
  mentions: number;
  change: number;
}

interface CompetitorData {
  name: string;
  score: number;
  mentions: number;
  change: number;
  color: string;
}

interface AIRecommendation {
  type: 'critical' | 'opportunity' | 'insight';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  impact: string;
}

const InsightsPage: React.FC = () => {
  const { user } = useAuth();
  const { data: dashboardData, loading: dashboardLoading, error: dashboardError } = useDashboardData();
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true' || 
             (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  const [keywordInsights, setKeywordInsights] = useState<KeywordInsight[]>([]);
  const [competitors, setCompetitors] = useState<CompetitorData[]>([]);
  const [aiRecommendations, setAIRecommendations] = useState<AIRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    fetchInsightsData();
  }, []);

  const fetchInsightsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch keyword insights from user mentions
      const { data: mentionsData, error: mentionsError } = await supabase
        .from('user_mentions')
        .select('keyword, sentiment')
        .eq('user_id', user?.id)
        .gte('mentioned_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days

      if (mentionsError) {
        throw mentionsError;
      }

      // Process keyword insights
      const keywordMap = new Map<string, { positive: number; negative: number; neutral: number; mixed: number; total: number }>();
      
      mentionsData?.forEach(mention => {
        const current = keywordMap.get(mention.keyword) || { positive: 0, negative: 0, neutral: 0, mixed: 0, total: 0 };
        current[mention.sentiment as keyof typeof current]++;
        current.total++;
        keywordMap.set(mention.keyword, current);
      });

      const insights: KeywordInsight[] = Array.from(keywordMap.entries()).map(([keyword, stats]) => {
        const dominantSentiment = Object.entries(stats)
          .filter(([key]) => key !== 'total')
          .reduce((a, b) => stats[a[0] as keyof typeof stats] > stats[b[0] as keyof typeof stats] ? a : b)[0] as 'positive' | 'negative' | 'neutral' | 'mixed';

        return {
          keyword,
          sentiment: dominantSentiment,
          mentions: stats.total,
          change: Math.random() * 40 - 20 // Mock change data
        };
      }).sort((a, b) => b.mentions - a.mentions).slice(0, 5);

      setKeywordInsights(insights);

      // Mock competitor data (in real implementation, this would come from competitive analysis)
      const mockCompetitors: CompetitorData[] = [
        { name: 'Competitor A', score: 72, mentions: 890, change: -2.1, color: '#10b981' },
        { name: 'Competitor B', score: 81, mentions: 1240, change: 1.8, color: '#f59e0b' },
        { name: 'Your Brand', score: dashboardData?.reputationScore || 78, mentions: dashboardData?.totalMentions || 1247, change: dashboardData?.reputationChange || 5.2, color: '#3b82f6' }
      ];

      setCompetitors(mockCompetitors);

      // Generate AI recommendations based on data
      const recommendations: AIRecommendation[] = [];

      // Check for negative sentiment issues
      const negativeKeywords = insights.filter(k => k.sentiment === 'negative');
      if (negativeKeywords.length > 0) {
        recommendations.push({
          type: 'critical',
          title: 'Address Negative Sentiment',
          description: `${negativeKeywords[0].keyword} is showing negative sentiment trends. Consider addressing user concerns and improving communication around this topic.`,
          priority: 'high',
          impact: 'Brand Trust'
        });
      }

      // Check for positive opportunities
      const positiveKeywords = insights.filter(k => k.sentiment === 'positive' && k.change > 10);
      if (positiveKeywords.length > 0) {
        recommendations.push({
          type: 'opportunity',
          title: 'Amplify Positive Momentum',
          description: `${positiveKeywords[0].keyword} is generating positive buzz with ${positiveKeywords[0].mentions} mentions. Consider creating more content around this topic.`,
          priority: 'medium',
          impact: 'Market Share'
        });
      }

      // General insights
      if (insights.length > 0) {
        recommendations.push({
          type: 'insight',
          title: 'Monitor Keyword Performance',
          description: `You have ${insights.length} active keywords being monitored. Consider expanding your keyword list to capture more brand mentions.`,
          priority: 'low',
          impact: 'Brand Awareness'
        });
      }

      setAIRecommendations(recommendations);

    } catch (err) {
      console.error('Error fetching insights data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch insights data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate brand metrics from dashboard data
  const brandMetrics = {
    brandVelocity: { 
      value: dashboardData?.reputationChange || 0, 
      change: dashboardData?.reputationChange || 0, 
      trend: dashboardData?.reputationChange && dashboardData.reputationChange > 0 ? 'up' : 'down' 
    },
    shareOfVoice: { 
      value: Math.min(100, Math.max(0, (dashboardData?.totalMentions || 0) / 50)), 
      change: 1.8, 
      trend: 'up' 
    },
    influenceScore: { 
      value: Math.min(10, Math.max(0, (dashboardData?.reputationScore || 50) / 10)), 
      change: 0.3, 
      trend: 'up' 
    },
    brandSentiment: { 
      value: dashboardData?.positiveRatio || 50, 
      change: dashboardData?.reputationChange || 0, 
      trend: dashboardData?.reputationChange && dashboardData.reputationChange > 0 ? 'up' : 'down' 
    }
  };

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

          {/* Error Message */}
          {(error || dashboardError) && (
            <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-red-700 dark:text-red-300 text-sm">{error || dashboardError}</p>
            </div>
          )}

          {/* Loading State */}
          {(loading || dashboardLoading) && (
            <div className="flex items-center justify-center py-12">
              <Loader className="h-8 w-8 text-orange-500 animate-spin mr-3" />
              <span className="text-gray-600 dark:text-gray-300">Loading insights...</span>
            </div>
          )}

          {!loading && !dashboardLoading && (
            <>
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
                      {brandMetrics.shareOfVoice.value.toFixed(1)}%
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
                      {brandMetrics.influenceScore.value.toFixed(1)}/10
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
                  <AssociatedKeywords keywords={keywordInsights} />
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default InsightsPage;