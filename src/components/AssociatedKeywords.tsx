import React from 'react';
import { Hash, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KeywordInsight {
  keyword: string;
  sentiment: 'positive' | 'negative' | 'mixed' | 'neutral';
  mentions: number;
  change: number;
}

interface AssociatedKeywordsProps {
  keywords: KeywordInsight[];
}

const AssociatedKeywords: React.FC<AssociatedKeywordsProps> = ({ keywords }) => {
  const getSentimentColor = (sentiment: string) => {
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

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600 dark:text-green-400';
    if (change < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  return (
    <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg h-fit">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 rounded-xl">
          <Hash className="h-5 w-5 text-orange-600 dark:text-orange-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Brand Associated Keywords</h3>
      </div>

      <div className="space-y-4">
        {keywords.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Hash className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No keyword data available yet.</p>
            <p className="text-sm mt-2">Start monitoring keywords to see insights here.</p>
          </div>
        ) : (
          keywords.map((keyword, index) => (
          <div
            key={index}
            className="group p-4 rounded-xl bg-gray-50/50 dark:bg-gray-700/50 hover:bg-gray-100/50 dark:hover:bg-gray-600/50 transition-all duration-200 border border-gray-200/30 dark:border-gray-600/30"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <span className="font-medium text-gray-900 dark:text-white text-sm">
                  {keyword.keyword}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getSentimentColor(keyword.sentiment)}`}>
                  {keyword.sentiment}
                </span>
              </div>
              <div className={`flex items-center space-x-1 text-xs font-medium ${getChangeColor(keyword.change)}`}>
                {getChangeIcon(keyword.change)}
                <span>{keyword.change > 0 ? '+' : ''}{keyword.change}%</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                {keyword.mentions.toLocaleString()} mentions
              </span>
              <div className="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-orange-500 to-amber-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((keyword.mentions / 250) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
          ))
        )}
      </div>

      <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl border border-orange-200/50 dark:border-orange-800/50">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {keywords.length > 0 
            ? `Your "${keywords[0]?.keyword}" keyword has ${keywords[0]?.mentions} mentions with ${keywords[0]?.sentiment} sentiment.`
            : "Set up keyword monitoring to get AI-powered insights about your brand performance."
          }
        </p>
      </div>
    </div>
  );
};

export default AssociatedKeywords;