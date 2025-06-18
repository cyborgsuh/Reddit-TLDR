import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface DashboardData {
  reputationScore: number;
  reputationChange: number;
  totalMentions: number;
  positiveRatio: number;
  sentimentCounts: {
    positive: number;
    negative: number;
    neutral: number;
    mixed: number;
  };
  recentMentions: Array<{
    id: string;
    author: string;
    content: string;
    sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
    subreddit: string;
    timestamp: string;
    score: number;
    comments: number;
    shares: number;
    platform: string;
    tags: string[];
    url: string;
  }>;
  sentimentTrend: Array<{
    day: string;
    positive: number;
    negative: number;
    neutral: number;
    mixed: number;
  }>;
  lastUpdated: string;
}

export const useDashboardData = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Return mock data for demo purposes when no session
        const mockData: DashboardData = {
          reputationScore: 78,
          reputationChange: 5.2,
          totalMentions: 1247,
          positiveRatio: 68,
          sentimentCounts: {
            positive: 847,
            negative: 156,
            neutral: 189,
            mixed: 55
          },
          recentMentions: [
            {
              id: '1',
              author: 'sarah_marketing',
              content: 'Just discovered this brand and I am absolutely loving their customer service! The response time is incredible.',
              sentiment: 'positive',
              subreddit: 'CustomerService',
              timestamp: '2 hours ago',
              score: 24,
              comments: 8,
              shares: 3,
              platform: 'reddit',
              tags: ['customer service', 'response time'],
              url: '#'
            },
            {
              id: '2',
              author: 'mike_dev',
              content: 'Having some issues with the latest update. Some features seem to be broken.',
              sentiment: 'negative',
              subreddit: 'TechSupport',
              timestamp: '4 hours ago',
              score: 8,
              comments: 12,
              shares: 1,
              platform: 'reddit',
              tags: ['issues', 'broken features'],
              url: '#'
            },
            {
              id: '3',
              author: 'alex_user',
              content: 'Mixed feelings about the new features. Some are great, others feel rushed.',
              sentiment: 'mixed',
              subreddit: 'ProductReviews',
              timestamp: '6 hours ago',
              score: 15,
              comments: 6,
              shares: 2,
              platform: 'reddit',
              tags: ['mixed feelings', 'features'],
              url: '#'
            }
          ],
          sentimentTrend: [
            { day: 'Mon', positive: 45, negative: 15, neutral: 25, mixed: 15 },
            { day: 'Tue', positive: 52, negative: 12, neutral: 28, mixed: 8 },
            { day: 'Wed', positive: 38, negative: 22, neutral: 30, mixed: 10 },
            { day: 'Thu', positive: 48, negative: 18, neutral: 24, mixed: 10 },
            { day: 'Fri', positive: 55, negative: 10, neutral: 25, mixed: 10 },
            { day: 'Sat', positive: 42, negative: 20, neutral: 28, mixed: 10 },
            { day: 'Sun', positive: 50, negative: 15, neutral: 25, mixed: 10 }
          ],
          lastUpdated: new Date().toISOString()
        };
        
        setData(mockData);
        setLoading(false);
        return;
      }

      // Try to fetch from Supabase function
      try {
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dashboard-data`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch dashboard data: ${response.statusText}`);
        }

        const dashboardData = await response.json();
        setData(dashboardData);
      } catch (fetchError) {
        console.warn('Failed to fetch from Supabase function, using direct database queries:', fetchError);
        
        // Fallback to direct database queries
        const dashboardData = await fetchDashboardDataDirect();
        setData(dashboardData);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardDataDirect = async (): Promise<DashboardData> => {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get total mentions count (last 24 hours)
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const { data: recentMentions, count: totalMentions } = await supabase
      .from('user_mentions')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .gte('mentioned_at', twentyFourHoursAgo.toISOString());

    // Get sentiment breakdown
    const sentimentCounts = {
      positive: recentMentions?.filter(m => m.sentiment === 'positive').length || 0,
      negative: recentMentions?.filter(m => m.sentiment === 'negative').length || 0,
      neutral: recentMentions?.filter(m => m.sentiment === 'neutral').length || 0,
      mixed: recentMentions?.filter(m => m.sentiment === 'mixed').length || 0,
    };

    // Calculate positive ratio
    const totalSentimentMentions = Object.values(sentimentCounts).reduce((a, b) => a + b, 0);
    const positiveRatio = totalSentimentMentions > 0 
      ? Math.round((sentimentCounts.positive / totalSentimentMentions) * 100)
      : 0;

    // Get current reputation score
    const { data: currentScore } = await supabase
      .from('reputation_scores')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', new Date().toISOString().split('T')[0])
      .single();

    // Get recent mentions for the feed
    const { data: recentMentionsFeed } = await supabase
      .from('user_mentions')
      .select('*')
      .eq('user_id', user.id)
      .order('mentioned_at', { ascending: false })
      .limit(10);

    // Format recent mentions
    const formattedMentions = recentMentionsFeed?.map(mention => ({
      id: mention.id,
      author: mention.author,
      content: mention.content,
      sentiment: mention.sentiment as 'positive' | 'negative' | 'neutral' | 'mixed',
      subreddit: mention.subreddit || 'unknown',
      timestamp: formatTimeAgo(new Date(mention.mentioned_at)),
      score: mention.score || 0,
      comments: mention.num_comments || 0,
      shares: 0,
      platform: mention.platform,
      tags: mention.tags || [],
      url: mention.url || '#'
    })) || [];

    // Get reputation trend (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { data: reputationTrend } = await supabase
      .from('reputation_scores')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', sevenDaysAgo.toISOString().split('T')[0])
      .order('date', { ascending: true });

    // Format sentiment trend data
    const sentimentTrendData = reputationTrend?.map((score, index) => ({
      day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index % 7],
      positive: score.positive_mentions || 0,
      negative: score.negative_mentions || 0,
      neutral: score.neutral_mentions || 0,
      mixed: score.mixed_mentions || 0,
    })) || [];

    // Calculate reputation change
    const previousScore = reputationTrend && reputationTrend.length > 1 
      ? reputationTrend[reputationTrend.length - 2]?.overall_score || 50
      : 50;
    const currentScoreValue = currentScore?.overall_score || 50;
    const reputationChange = currentScoreValue - previousScore;

    return {
      reputationScore: currentScoreValue,
      reputationChange: reputationChange,
      totalMentions: totalMentions || 0,
      positiveRatio: positiveRatio,
      sentimentCounts: sentimentCounts,
      recentMentions: formattedMentions,
      sentimentTrend: sentimentTrendData,
      lastUpdated: new Date().toISOString()
    };
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    
    return date.toLocaleDateString();
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchDashboardData
  };
};