import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Navigation from '../components/Navigation';
import { 
  MessageSquare, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Search,
  Filter,
  ExternalLink,
  Calendar,
  User,
  Hash,
  Heart,
  MessageCircle,
  Share,
  MoreHorizontal,
  ChevronDown,
  Download,
  RefreshCw,
  AlertCircle,
  Loader
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Mention {
  id: string;
  author: string;
  content: string;
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  subreddit: string;
  timestamp: string;
  score: number;
  comments: number;
  shares: number;
  platform: 'reddit' | 'twitter' | 'facebook' | 'instagram' | 'linkedin';
  tags: string[];
  url: string;
  keyword: string;
  mentioned_at: string;
}

interface MentionStats {
  total: number;
  positive: number;
  negative: number;
  neutral: number;
  mixed: number;
}

const MentionsPage: React.FC = () => {
  const { user } = useAuth();
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true' || 
             (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  const [mentions, setMentions] = useState<Mention[]>([]);
  const [filteredMentions, setFilteredMentions] = useState<Mention[]>([]);
  const [mentionStats, setMentionStats] = useState<MentionStats>({
    total: 0,
    positive: 0,
    negative: 0,
    neutral: 0,
    mixed: 0
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSentiment, setSelectedSentiment] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [selectedKeyword, setSelectedKeyword] = useState<string>('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('24h');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const ITEMS_PER_PAGE = 20;

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
    fetchMentions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [mentions, searchQuery, selectedSentiment, selectedSource, selectedKeyword, selectedTimeRange]);

  const fetchMentions = async (pageNum: number = 1, append: boolean = false) => {
    try {
      if (pageNum === 1) {
        setIsLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      // Calculate time range
      const timeRanges = {
        '1h': 1,
        '24h': 24,
        '7d': 24 * 7,
        '30d': 24 * 30,
        'all': null
      };

      const hoursBack = timeRanges[selectedTimeRange as keyof typeof timeRanges];
      let timeFilter = '';
      
      if (hoursBack) {
        const timeAgo = new Date();
        timeAgo.setHours(timeAgo.getHours() - hoursBack);
        timeFilter = timeAgo.toISOString();
      }

      // Build query
      let query = supabase
        .from('user_mentions')
        .select('*', { count: 'exact' })
        .eq('user_id', user?.id)
        .order('mentioned_at', { ascending: false })
        .range((pageNum - 1) * ITEMS_PER_PAGE, pageNum * ITEMS_PER_PAGE - 1);

      if (timeFilter) {
        query = query.gte('mentioned_at', timeFilter);
      }

      const { data, error: fetchError, count } = await query;

      if (fetchError) {
        throw fetchError;
      }

      const formattedMentions: Mention[] = (data || []).map(mention => ({
        id: mention.id,
        author: mention.author,
        content: mention.content,
        sentiment: mention.sentiment,
        subreddit: mention.subreddit || 'unknown',
        timestamp: formatTimeAgo(new Date(mention.mentioned_at)),
        score: mention.score || 0,
        comments: mention.num_comments || 0,
        shares: mention.num_shares || 0,
        platform: mention.platform,
        tags: mention.tags || [],
        url: mention.url || '#',
        keyword: mention.keyword,
        mentioned_at: mention.mentioned_at
      }));

      if (append) {
        setMentions(prev => [...prev, ...formattedMentions]);
      } else {
        setMentions(formattedMentions);
      }

      setHasMore(formattedMentions.length === ITEMS_PER_PAGE);

      // Calculate stats
      if (pageNum === 1) {
        const stats = {
          total: count || 0,
          positive: formattedMentions.filter(m => m.sentiment === 'positive').length,
          negative: formattedMentions.filter(m => m.sentiment === 'negative').length,
          neutral: formattedMentions.filter(m => m.sentiment === 'neutral').length,
          mixed: formattedMentions.filter(m => m.sentiment === 'mixed').length
        };
        setMentionStats(stats);
      }

    } catch (err) {
      console.error('Error fetching mentions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch mentions');
    } finally {
      setIsLoading(false);
      setLoadingMore(false);
    }
  };

  const applyFilters = () => {
    let filtered = mentions;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(mention =>
        mention.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mention.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mention.keyword.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mention.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Sentiment filter
    if (selectedSentiment !== 'all') {
      filtered = filtered.filter(mention => mention.sentiment === selectedSentiment);
    }

    // Source filter
    if (selectedSource !== 'all') {
      filtered = filtered.filter(mention => mention.platform === selectedSource);
    }

    // Keyword filter
    if (selectedKeyword !== 'all') {
      filtered = filtered.filter(mention => mention.keyword === selectedKeyword);
    }

    setFilteredMentions(filtered);
  };

  const handleRefresh = async () => {
    setPage(1);
    await fetchMentions(1, false);
  };

  const handleLoadMore = async () => {
    const nextPage = page + 1;
    setPage(nextPage);
    await fetchMentions(nextPage, true);
  };

  const handleTimeRangeChange = async (newRange: string) => {
    setSelectedTimeRange(newRange);
    setPage(1);
    await fetchMentions(1, false);
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'negative':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'mixed':
        return <MessageSquare className="h-4 w-4 text-orange-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const getSentimentBadgeColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800';
      case 'negative':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800';
      case 'mixed':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-700';
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'reddit':
        return (
          <svg className="h-4 w-4 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
          </svg>
        );
      default:
        return <MessageSquare className="h-4 w-4 text-gray-500" />;
    }
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

  // Get unique keywords for filter
  const uniqueKeywords = [...new Set(mentions.map(m => m.keyword))];

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
                    <span>Mentions Feed</span>
                    <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500 animate-pulse mt-1 sm:mt-0" />
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                    Track and respond to mentions across all platforms
                  </p>
                </div>
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleRefresh}
                    disabled={isLoading}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-all duration-200 transform hover:scale-105"
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                  <button className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl">
                    <Download className="h-4 w-4" />
                    <span>Export Feed</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mb-8">
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {isLoading ? '...' : mentionStats.total}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Mentions</div>
              </div>
            </div>

            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
                  {isLoading ? '...' : mentionStats.positive}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Positive</div>
              </div>
            </div>

            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-red-600 dark:text-red-400 mb-1">
                  {isLoading ? '...' : mentionStats.negative}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Negative</div>
              </div>
            </div>

            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-orange-600 dark:text-orange-400 mb-1">
                  {isLoading ? '...' : mentionStats.mixed}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Mixed</div>
              </div>
            </div>

            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-gray-600 dark:text-gray-400 mb-1">
                  {isLoading ? '...' : mentionStats.neutral}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Neutral</div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search mentions..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-700"
                />
              </div>

              {/* Time Range Filter */}
              <div className="relative">
                <select
                  value={selectedTimeRange}
                  onChange={(e) => handleTimeRangeChange(e.target.value)}
                  className="appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 pr-8 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="1h">Last Hour</option>
                  <option value="24h">Last 24 Hours</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="all">All Time</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>

              {/* Sentiment Filter */}
              <div className="relative">
                <select
                  value={selectedSentiment}
                  onChange={(e) => setSelectedSentiment(e.target.value)}
                  className="appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 pr-8 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="all">All Sentiment</option>
                  <option value="positive">Positive</option>
                  <option value="negative">Negative</option>
                  <option value="mixed">Mixed</option>
                  <option value="neutral">Neutral</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>

              {/* Keyword Filter */}
              {uniqueKeywords.length > 0 && (
                <div className="relative">
                  <select
                    value={selectedKeyword}
                    onChange={(e) => setSelectedKeyword(e.target.value)}
                    className="appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 pr-8 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="all">All Keywords</option>
                    {uniqueKeywords.map(keyword => (
                      <option key={keyword} value={keyword}>{keyword}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              )}

              {/* More Filters Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-all duration-200"
              >
                <Filter className="h-4 w-4" />
                <span>More Filters</span>
              </button>
            </div>

            {/* Extended Filters */}
            {showFilters && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Source Platform
                    </label>
                    <select 
                      value={selectedSource}
                      onChange={(e) => setSelectedSource(e.target.value)}
                      className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white"
                    >
                      <option value="all">All Sources</option>
                      <option value="reddit">Reddit</option>
                      <option value="twitter">Twitter</option>
                      <option value="facebook">Facebook</option>
                      <option value="instagram">Instagram</option>
                      <option value="linkedin">LinkedIn</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Engagement Level
                    </label>
                    <select className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white">
                      <option>All levels</option>
                      <option>High engagement</option>
                      <option>Medium engagement</option>
                      <option>Low engagement</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Sort By
                    </label>
                    <select className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white">
                      <option>Most recent</option>
                      <option>Most engagement</option>
                      <option>Highest score</option>
                      <option>Most relevant</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader className="h-8 w-8 text-orange-500 animate-spin mr-3" />
              <span className="text-gray-600 dark:text-gray-300">Loading mentions...</span>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && filteredMentions.length === 0 && (
            <div className="text-center py-12">
              <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No mentions found</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {mentions.length === 0 
                  ? "Start monitoring keywords in Settings to see mentions here."
                  : "Try adjusting your filters to see more results."
                }
              </p>
              {mentions.length === 0 && (
                <button
                  onClick={() => window.location.href = '/settings'}
                  className="px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105"
                >
                  Set Up Monitoring
                </button>
              )}
            </div>
          )}

          {/* Mentions List */}
          {!isLoading && filteredMentions.length > 0 && (
            <div className="space-y-4">
              {filteredMentions.map((mention) => (
                <div
                  key={mention.id}
                  className="group bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.01]"
                >
                  <div className="flex items-start space-x-4">
                    {/* Avatar */}
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                      {mention.author.charAt(0).toUpperCase()}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {mention.author}
                          </span>
                          <div className="flex items-center space-x-1">
                            {getPlatformIcon(mention.platform)}
                            <span className="text-orange-600 dark:text-orange-400 text-sm font-medium">
                              r/{mention.subreddit}
                            </span>
                          </div>
                          <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getSentimentBadgeColor(mention.sentiment)}`}>
                            {getSentimentIcon(mention.sentiment)}
                            <span className="capitalize">{mention.sentiment}</span>
                          </div>
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-medium">
                            {mention.keyword}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {mention.timestamp}
                          </span>
                          <button className="opacity-0 group-hover:opacity-100 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200">
                            <MoreHorizontal className="h-4 w-4 text-gray-500" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Content */}
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                        {mention.content}
                      </p>
                      
                      {/* Tags */}
                      {mention.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {mention.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center space-x-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs"
                            >
                              <Hash className="h-3 w-3" />
                              <span>{tag}</span>
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {/* Engagement Stats */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center space-x-1">
                            <Heart className="h-4 w-4" />
                            <span>{mention.score}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MessageCircle className="h-4 w-4" />
                            <span>{mention.comments}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Share className="h-4 w-4" />
                            <span>{mention.shares}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors duration-200">
                            <MessageCircle className="h-4 w-4" />
                            <span>Reply</span>
                          </button>
                          <a
                            href={mention.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-orange-100 dark:bg-orange-900/30 hover:bg-orange-200 dark:hover:bg-orange-900/50 text-orange-700 dark:text-orange-400 rounded-lg transition-colors duration-200"
                          >
                            <ExternalLink className="h-4 w-4" />
                            <span>View</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Load More */}
          {!isLoading && filteredMentions.length > 0 && hasMore && (
            <div className="mt-8 text-center">
              <button 
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-8 py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingMore ? (
                  <div className="flex items-center space-x-2">
                    <Loader className="h-5 w-5 animate-spin" />
                    <span>Loading...</span>
                  </div>
                ) : (
                  'Load More Mentions'
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MentionsPage;