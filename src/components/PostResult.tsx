import React from 'react';
import { MessageSquare, TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';
import { AnalysisResult } from '../types';

interface PostResultProps {
  analysisResult: AnalysisResult;
}

const PostResult: React.FC<PostResultProps> = ({ analysisResult }) => {
  const { post, result } = analysisResult;

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'negative': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'mixed': return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
      case 'neutral': return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return TrendingUp;
      case 'negative': return TrendingDown;
      case 'mixed': return AlertCircle;
      case 'neutral': return Minus;
      default: return Minus;
    }
  };

  const SentimentIcon = result ? getSentimentIcon(result.sentiment) : Minus;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
      {/* Post Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
          {post.title}
        </h3>
        {post.subreddit && (
          <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">r/{post.subreddit}</p>
        )}
      </div>

      {/* Post Content */}
      {post.selftext && (
        <div className="mb-4">
          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed line-clamp-3">
            {post.selftext}
          </p>
        </div>
      )}

      {/* Comments */}
      {post.comments && post.comments.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <MessageSquare className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Top Comments</span>
          </div>
          <div className="space-y-2">
            {post.comments.slice(0, 3).map((comment, index) => (
              <p key={index} className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-2 rounded-lg line-clamp-2">
                {comment}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Sentiment Analysis Results */}
      {result ? (
        <div className="space-y-4">
          {/* Sentiment Badge */}
          <div className={`inline-flex items-center space-x-2 px-3 py-2 rounded-full border ${getSentimentColor(result.sentiment)}`}>
            <SentimentIcon className="h-4 w-4" />
            <span className="text-sm font-semibold capitalize">{result.sentiment}</span>
          </div>

          {/* Explanation */}
          <p className="text-sm text-gray-700 dark:text-gray-300 italic">{result.explanation}</p>

          {/* Positive Points */}
          {result.positives.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-green-700 dark:text-green-400 mb-2">Positive Aspects</h4>
              <ul className="space-y-1">
                {result.positives.map((positive, index) => (
                  <li key={index} className="text-xs text-green-600 dark:text-green-400 flex items-start space-x-2">
                    <span className="text-green-400 dark:text-green-500 mt-1">•</span>
                    <span>{positive}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Negative Points */}
          {result.negatives.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-2">Negative Aspects</h4>
              <ul className="space-y-1">
                {result.negatives.map((negative, index) => (
                  <li key={index} className="text-xs text-red-600 dark:text-red-400 flex items-start space-x-2">
                    <span className="text-red-400 dark:text-red-500 mt-1">•</span>
                    <span>{negative}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">Analysis failed</span>
        </div>
      )}
    </div>
  );
};

export default PostResult;