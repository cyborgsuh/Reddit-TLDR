import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, TrendingUp, TrendingDown, Minus, ExternalLink } from 'lucide-react';

interface Mention {
  id: string;
  author: string;
  content: string;
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  subreddit: string;
  timestamp: string;
  score: number;
}

interface RecentMentionsProps {
  mentions: Mention[];
}

const RecentMentions: React.FC<RecentMentionsProps> = ({ mentions = [] }) => {
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

  return (
    <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Mentions</h3>
        <Link
          to="/mentions"
          className="flex items-center space-x-1 text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors text-sm font-medium"
        >
          <span>View all</span>
          <ExternalLink className="h-4 w-4" />
        </Link>
      </div>
      
      <div className="space-y-4">
        {mentions.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No recent mentions found.</p>
            <p className="text-sm mt-2">Start monitoring keywords to see mentions here.</p>
          </div>
        ) : (
          mentions.map((mention) => (
          <div
            key={mention.id}
            className="group p-4 rounded-xl bg-gray-50/50 dark:bg-gray-700/50 hover:bg-gray-100/50 dark:hover:bg-gray-600/50 transition-all duration-200 border border-gray-200/30 dark:border-gray-600/30"
          >
            <div className="flex items-start space-x-3">
              {/* Avatar */}
              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {mention.author.charAt(0).toUpperCase()}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="font-medium text-gray-900 dark:text-white text-sm">
                    {mention.author}
                  </span>
                  <span className="text-orange-600 dark:text-orange-400 text-sm font-medium">
                    r/{mention.subreddit}
                  </span>
                  <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getSentimentBadgeColor(mention.sentiment)}`}>
                    {getSentimentIcon(mention.sentiment)}
                    <span className="capitalize">{mention.sentiment}</span>
                  </div>
                </div>
                
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-2 line-clamp-2">
                  {mention.content}
                </p>
                
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>{mention.timestamp}</span>
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="h-3 w-3" />
                    <span>{mention.score}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecentMentions;