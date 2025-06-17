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
  RefreshCw
} from 'lucide-react';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSentiment, setSelectedSentiment] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

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

  // Mock data - replace with real API calls
  useEffect(() => {
    const mockMentions: Mention[] = [
      {
        id: '1',
        author: 'sarah_marketing',
        content: 'Just discovered @YourBrand and I am absolutely loving their customer service! The response time is incredible and the team really cares about solving problems. Highly recommended! 👍',
        sentiment: 'positive',
        subreddit: 'CustomerService',
        timestamp: '2 hours ago',
        score: 24,
        comments: 8,
        shares: 3,
        platform: 'reddit',
        tags: ['customer service', 'response time', 'recommended'],
        url: 'https://reddit.com/r/CustomerService/comments/abc123'
      },
      {
        id: '2',
        author: 'mike_dev',
        content: 'Having some issues with @YourBrand product lately. The latest update seems to have broken some features I rely on daily. Hope they fix this soon.',
        sentiment: 'negative',
        subreddit: 'TechSupport',
        timestamp: '4 hours ago',
        score: 8,
        comments: 12,
        shares: 1,
        platform: 'reddit',
        tags: ['issues', 'broken features', 'update'],
        url: 'https://reddit.com/r/TechSupport/comments/def456'
      },
      {
        id: '3',
        author: 'alex_user',
        content: 'Mixed feelings about the new @YourBrand features. Some are great, others feel rushed. The UI is beautiful but functionality could be better.',
        sentiment: 'mixed',
        subreddit: 'ProductReviews',
        timestamp: '6 hours ago',
        score: 15,
        comments: 6,
        shares: 2,
        platform: 'reddit',
        tags: ['mixed feelings', 'UI', 'functionality'],
        url: 'https://reddit.com/r/ProductReviews/comments/ghi789'
      },
      {
        id: '4',
        author: 'emma_productivity',
        content: '🔥 @YourBrand just released an amazing new feature! The AI integration is seamless and saves me hours of work every week. This is innovation at its finest! #productivity #AI',
        sentiment: 'positive',
        subreddit: 'productivity',
        timestamp: '8 hours ago',
        score: 45,
        comments: 18,
        shares: 12,
        platform: 'reddit',
        tags: ['new feature', 'AI integration', 'innovation', 'productivity'],
        url: 'https://reddit.com/r/productivity/comments/jkl012'
      },
      {
        id: '5',
        author: 'tech_analyst_pro',
        content: 'Neutral mention about @YourBrand in the context of industry comparison. They are one of several companies offering similar solutions in this space.',
        sentiment: 'neutral',
        subreddit: 'technology',
        timestamp: '12 hours ago',
        score: 12,
        comments: 3,
        shares: 8,
        platform: 'reddit',
        tags: ['industry', 'comparison', 'solutions'],
        url: 'https://reddit.com/r/technology/comments/mno345'
      },
      {
        id: '6',
        author: 'startup_founder',
        content: 'Been using @YourBrand for our startup and the results have been incredible. The team is responsive and the product keeps getting better. Definitely worth the investment!',
        sentiment: 'positive',
        subreddit: 'startups',
        timestamp: '1 day ago',
        score: 32,
        comments: 14,
        shares: 7,
        platform: 'reddit',
        tags: ['startup', 'responsive team', 'investment'],
        url: 'https://reddit.com/r/startups/comments/pqr678'
      }
    ];

    setMentions(mockMentions);
    setFilteredMentions(mockMentions);
  }, []);

  // Filter mentions based on search and filters
  useEffect(() => {
    let filtered = mentions;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(mention =>
        mention.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mention.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
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

    setFilteredMentions(filtered);
  }, [mentions, searchQuery, selectedSentiment, selectedSource]);

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

  const sentimentCounts = {
    total: mentions.length,
    positive: mentions.filter(m => m.sentiment === 'positive').length,
    negative: mentions.filter(m => m.sentiment === 'negative').length,
    neutral: mentions.filter(m => m.sentiment === 'neutral').length,
    mixed: mentions.filter(m => m.sentiment === 'mixed').length
  };

  const handleRefresh = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
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

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mb-8">
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {sentimentCounts.total}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Mentions</div>
              </div>
            </div>

            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
                  {sentimentCounts.positive}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Positive</div>
              </div>
            </div>

            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-red-600 dark:text-red-400 mb-1">
                  {sentimentCounts.negative}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Negative</div>
              </div>
            </div>

            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-orange-600 dark:text-orange-400 mb-1">
                  {sentimentCounts.mixed}
                </div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Mixed</div>
              </div>
            </div>

            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-gray-600 dark:text-gray-400 mb-1">
                  {sentimentCounts.neutral}
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

              {/* Source Filter */}
              <div className="relative">
                <select
                  value={selectedSource}
                  onChange={(e) => setSelectedSource(e.target.value)}
                  className="appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 pr-8 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="all">All Sources</option>
                  <option value="reddit">Reddit</option>
                  <option value="twitter">Twitter</option>
                  <option value="facebook">Facebook</option>
                  <option value="instagram">Instagram</option>
                  <option value="linkedin">LinkedIn</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>

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
                      Date Range
                    </label>
                    <select className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white">
                      <option>Last 24 hours</option>
                      <option>Last 7 days</option>
                      <option>Last 30 days</option>
                      <option>Custom range</option>
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

          {/* Mentions List */}
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

          {/* Load More */}
          <div className="mt-8 text-center">
            <button className="px-8 py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl">
              Load More Mentions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MentionsPage;