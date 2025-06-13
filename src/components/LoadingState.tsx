import React from 'react';
import { TrendingUp, MessageSquare, Brain } from 'lucide-react';

interface LoadingStateProps {
  stage: 'fetching' | 'analyzing' | 'aggregating';
  currentPost?: number;
  totalPosts?: number;
}

const LoadingState: React.FC<LoadingStateProps> = ({ stage, currentPost, totalPosts }) => {
  const getStageInfo = () => {
    switch (stage) {
      case 'fetching':
        return {
          icon: MessageSquare,
          title: 'Fetching Reddit Posts',
          description: 'Searching for relevant discussions and comments...'
        };
      case 'analyzing':
        return {
          icon: Brain,
          title: 'Analyzing Sentiment',
          description: currentPost && totalPosts 
            ? `Processing post ${currentPost} of ${totalPosts}...`
            : 'Using AI to analyze sentiment and extract insights...'
        };
      case 'aggregating':
        return {
          icon: TrendingUp,
          title: 'Aggregating Results',
          description: 'Summarizing and organizing findings...'
        };
    }
  };

  const { icon: Icon, title, description } = getStageInfo();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mx-6 mt-8 border border-gray-100 dark:border-gray-700 transition-colors duration-300">
      <div className="flex flex-col items-center text-center">
        <div className="mb-6 flex flex-col items-center">
          {/* 3D Boxes Animation */}
          <div className="boxes mb-4">
            <div className="box"></div>
            <div className="box"></div>
            <div className="box"></div>
            <div className="box"></div>
          </div>
          <Icon className="h-8 w-8 text-orange-600 dark:text-orange-400" />
        </div>
        
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">{description}</p>
        
        {currentPost && totalPosts && (
          <div className="w-full max-w-md">
            <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
              <div 
                className="bg-gradient-to-r from-orange-600 to-amber-600 dark:from-orange-500 dark:to-amber-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentPost / totalPosts) * 100}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{currentPost} of {totalPosts} posts analyzed</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingState;