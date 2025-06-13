import React from 'react';
import { TrendingUp, TrendingDown, BarChart3, Clock } from 'lucide-react';
import { AggregatedResult, SentimentCounts } from '../types';

interface SummaryProps {
  aggregatedResult: AggregatedResult | null;
  sentimentCounts: SentimentCounts;
  dataRetrievalTime: number;
  llmProcessingTime: number;
  keyword: string;
}

// Helper function to format time in minutes and seconds
const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  
  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    return `${remainingSeconds}s`;
  }
};

const Summary: React.FC<SummaryProps> = ({
  aggregatedResult,
  sentimentCounts,
  dataRetrievalTime,
  llmProcessingTime,
  keyword
}) => {
  const totalPosts = Object.values(sentimentCounts).reduce((sum, count) => sum + count, 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mx-6 mt-8 border border-gray-100 dark:border-gray-700 transition-colors duration-300">
      <div className="flex items-center space-x-3 mb-6">
        <BarChart3 className="h-6 w-6 text-orange-600 dark:text-orange-400" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Analysis Summary</h2>
      </div>

      {/* Sentiment Distribution */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Sentiment Distribution</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(sentimentCounts).map(([sentiment, count]) => {
            const percentage = totalPosts > 0 ? (count / totalPosts) * 100 : 0;
            const colors = {
              positive: 'bg-green-500 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
              negative: 'bg-red-500 text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
              mixed: 'bg-orange-500 text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
              neutral: 'bg-gray-500 text-gray-700 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
            };
            const [barColor, ...restColors] = colors[sentiment as keyof typeof colors].split(' ');
            const colorClasses = restColors.join(' ');

            return (
              <div key={sentiment} className={`p-4 rounded-lg border ${colorClasses}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold capitalize">{sentiment}</span>
                  <span className="text-lg font-bold">{count}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`${barColor} h-2 rounded-full transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <p className="text-xs mt-1">{percentage.toFixed(1)}%</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Aggregated Insights */}
      {aggregatedResult && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-6">Key Insights about "{keyword}"</h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Positive Summary */}
            {aggregatedResult.positives.length > 0 && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <h4 className="text-lg font-semibold text-green-800 dark:text-green-400">Positive Aspects</h4>
                </div>
                <ul className="space-y-3">
                  {aggregatedResult.positives.map((positive, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <span className="flex-shrink-0 w-2 h-2 bg-green-400 dark:bg-green-500 rounded-full mt-2"></span>
                      <span className="text-green-700 dark:text-green-300 text-sm leading-relaxed">{positive}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Negative Summary */}
            {aggregatedResult.negatives.length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                  <h4 className="text-lg font-semibold text-red-800 dark:text-red-400">Negative Aspects</h4>
                </div>
                <ul className="space-y-3">
                  {aggregatedResult.negatives.map((negative, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <span className="flex-shrink-0 w-2 h-2 bg-red-400 dark:bg-red-500 rounded-full mt-2"></span>
                      <span className="text-red-700 dark:text-red-300 text-sm leading-relaxed">{negative}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Performance Metrics */}
      <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-6 transition-colors duration-300">
        <div className="flex items-center space-x-2 mb-4">
          <Clock className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Performance Metrics</h4>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{totalPosts}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Posts Analyzed</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatTime(dataRetrievalTime)}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Data Retrieval</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{formatTime(llmProcessingTime)}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">AI Processing</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{formatTime(dataRetrievalTime + llmProcessingTime)}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Time</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Summary;