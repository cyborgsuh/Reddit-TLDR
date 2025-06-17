import React from 'react';

interface SentimentData {
  day: string;
  positive: number;
  negative: number;
  neutral: number;
  mixed: number;
}

interface SentimentChartProps {
  data: SentimentData[];
  title: string;
}

const SentimentChart: React.FC<SentimentChartProps> = ({ data, title }) => {
  const maxValue = Math.max(...data.map(d => d.positive + d.negative + d.neutral + d.mixed));
  
  return (
    <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">{title}</h3>
      
      <div className="space-y-4">
        {/* Legend */}
        <div className="flex items-center justify-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-600 dark:text-gray-400">Positive</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
            <span className="text-gray-600 dark:text-gray-400">Neutral</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span className="text-gray-600 dark:text-gray-400">Mixed</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-gray-600 dark:text-gray-400">Negative</span>
          </div>
        </div>
        
        {/* Chart */}
        <div className="flex items-end justify-between h-48 space-x-2">
          {data.map((item, index) => {
            const total = item.positive + item.negative + item.neutral + item.mixed;
            const height = (total / maxValue) * 100;
            
            const positiveHeight = (item.positive / total) * height;
            const neutralHeight = (item.neutral / total) * height;
            const mixedHeight = (item.mixed / total) * height;
            const negativeHeight = (item.negative / total) * height;
            
            return (
              <div key={index} className="flex flex-col items-center space-y-2 flex-1">
                <div 
                  className="w-full max-w-12 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden relative group cursor-pointer transition-transform duration-200 hover:scale-105"
                  style={{ height: `${Math.max(height, 8)}%` }}
                >
                  {/* Stacked bars */}
                  <div 
                    className="absolute bottom-0 w-full bg-green-500 transition-all duration-300"
                    style={{ height: `${positiveHeight}%` }}
                  />
                  <div 
                    className="absolute bottom-0 w-full bg-gray-400 transition-all duration-300"
                    style={{ 
                      height: `${neutralHeight}%`,
                      bottom: `${positiveHeight}%`
                    }}
                  />
                  <div 
                    className="absolute bottom-0 w-full bg-orange-500 transition-all duration-300"
                    style={{ 
                      height: `${mixedHeight}%`,
                      bottom: `${positiveHeight + neutralHeight}%`
                    }}
                  />
                  <div 
                    className="absolute bottom-0 w-full bg-red-500 transition-all duration-300"
                    style={{ 
                      height: `${negativeHeight}%`,
                      bottom: `${positiveHeight + neutralHeight + mixedHeight}%`
                    }}
                  />
                  
                  {/* Tooltip on hover */}
                  <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                    Total: {total}
                  </div>
                </div>
                
                <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                  {item.day}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SentimentChart;