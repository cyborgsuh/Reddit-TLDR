import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface KeywordSearch {
  id: string;
  keyword: string;
  last_searched_at: string | null;
  next_search_at: string;
  search_frequency_hours: number;
  is_active: boolean;
  total_mentions_found: number;
  last_error: string | null;
}

export const useKeywordManagement = () => {
  const [keywords, setKeywords] = useState<KeywordSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchKeywords = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('keyword_searches')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setKeywords(data || []);
    } catch (err) {
      console.error('Error fetching keywords:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch keywords');
    } finally {
      setLoading(false);
    }
  };

  const addKeyword = async (keyword: string, frequencyHours: number = 24) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error: insertError } = await supabase
        .from('keyword_searches')
        .insert({
          user_id: user.id,
          keyword: keyword.trim(),
          search_frequency_hours: frequencyHours,
          next_search_at: new Date().toISOString()
        });

      if (insertError) {
        throw insertError;
      }

      await fetchKeywords();
      return true;
    } catch (err) {
      console.error('Error adding keyword:', err);
      setError(err instanceof Error ? err.message : 'Failed to add keyword');
      return false;
    }
  };

  const removeKeyword = async (keywordId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('keyword_searches')
        .delete()
        .eq('id', keywordId);

      if (deleteError) {
        throw deleteError;
      }

      await fetchKeywords();
      return true;
    } catch (err) {
      console.error('Error removing keyword:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove keyword');
      return false;
    }
  };

  const toggleKeyword = async (keywordId: string, isActive: boolean) => {
    try {
      const { error: updateError } = await supabase
        .from('keyword_searches')
        .update({ is_active: isActive })
        .eq('id', keywordId);

      if (updateError) {
        throw updateError;
      }

      await fetchKeywords();
      return true;
    } catch (err) {
      console.error('Error toggling keyword:', err);
      setError(err instanceof Error ? err.message : 'Failed to toggle keyword');
      return false;
    }
  };

  const updateFrequency = async (keywordId: string, frequencyHours: number) => {
    try {
      const { error: updateError } = await supabase
        .from('keyword_searches')
        .update({ search_frequency_hours: frequencyHours })
        .eq('id', keywordId);

      if (updateError) {
        throw updateError;
      }

      await fetchKeywords();
      return true;
    } catch (err) {
      console.error('Error updating frequency:', err);
      setError(err instanceof Error ? err.message : 'Failed to update frequency');
      return false;
    }
  };

  const triggerManualSearch = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/keyword-monitor`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to trigger search: ${response.statusText}`);
      }

      await fetchKeywords();
      return true;
    } catch (err) {
      console.error('Error triggering manual search:', err);
      setError(err instanceof Error ? err.message : 'Failed to trigger search');
      return false;
    }
  };

  useEffect(() => {
    fetchKeywords();
  }, []);

  return {
    keywords,
    loading,
    error,
    addKeyword,
    removeKeyword,
    toggleKeyword,
    updateFrequency,
    triggerManualSearch,
    refetch: fetchKeywords
  };
};