import React from 'react';
import { Brain, TrendingUp, AlertCircle, CheckCircle, Lightbulb } from 'lucide-react';

interface BrandMetrics {
  brandVelocity: { value: number; change: number; trend: string };
  shareOfVoice: { value: number; change: number; trend: string };
  influenceScore: { value: number; change: number; trend: string };
  brandSentiment: { value: number; change: number; trend: string };
}

interface Recommendation {
  type: 'critical' | 'opportunity' | 'insight';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  impact: string;
}

interface BrandAnalysisCardProps {
  metrics: BrandMetrics;
  recommendations: Recommendation[];
}

const BrandAnalysisCard: React.FC<BrandAnalysisCardProps> = ({ metrics, recommendations }) => {
  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />;
      case 'opportunity':
        return <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
      case 'insight':
        return <Lightbulb className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />;
      default:
        return <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />;
    }
  };

  const getRecommendationColor = (type: string) => {
    switch (type) {
      case 'critical':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'opportunity':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      case 'insight':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      default:
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
      case 'medium':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
      case 'low':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400';
    }
  };

  return (
    <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-3 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-xl">
          <Brain className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">AI-Powered Brand Analysis</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">Real-time insights powered by advanced AI</p>
        </div>
      </div>

      {/* Analysis Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200/50 dark:border-blue-800/50 mb-6">
        <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
          Your brand reputation has shown <strong>steady improvement</strong> over the past week, with a{' '}
          <span className="text-green-600 dark:text-green-400 font-semibold">
            +{metrics.brandVelocity.change}% increase
          </span>{' '}
          in overall brand velocity. The launch of your new AI feature has generated significant positive buzz, 
          particularly among productivity-focused users. However, there are some concerns about recent product 
          updates affecting core functionality that should be addressed promptly.
        </p>
      </div>

      {/* Performance Tags */}
      <div className="flex flex-wrap gap-2 mb-6">
        <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
          Strong Performance
        </span>
        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-medium">
          AI Feature Launch
        </span>
        <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full text-xs font-medium">
          Action Required
        </span>
      </div>

      {/* AI Recommendations */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
          <Lightbulb className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          <span>AI Recommendations</span>
        </h3>
        
        <div className="space-y-4">
          {recommendations.map((rec, index) => (
            <div
              key={index}
              className={`p-4 rounded-xl border ${getRecommendationColor(rec.type)} transition-all duration-200 hover:shadow-md`}
            >
              <div className="flex items-start space-x-3">
                {getRecommendationIcon(rec.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                      {rec.title}
                    </h4>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(rec.priority)}`}>
                        {rec.priority}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    {rec.description}
                  </p>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    <span className="font-medium">Impact:</span> {rec.impact}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BrandAnalysisCard;