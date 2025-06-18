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
        throw new Error('No active session');
      }

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
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
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