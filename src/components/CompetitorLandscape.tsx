import React, { useState } from 'react';
import { Users, Plus, X, TrendingUp, TrendingDown } from 'lucide-react';

interface Competitor {
  name: string;
  score: number;
  mentions: number;
  change: number;
  color: string;
}

interface CompetitorLandscapeProps {
  competitors: Competitor[];
}

const CompetitorLandscape: React.FC<CompetitorLandscapeProps> = ({ competitors: initialCompetitors = [] }) => {
  const [competitors, setCompetitors] = useState(initialCompetitors);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCompetitor, setNewCompetitor] = useState({ name: '', score: 0, mentions: 0 });
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; data: any } | null>(null);

  // Chart data for the last 5 time periods
  const chartData = [
    { period: '1', yourBrand: 76, competitorA: 74, competitorB: 79 },
    { period: '2', yourBrand: 77, competitorA: 73, competitorB: 80 },
    { period: '3', yourBrand: 75, competitorA: 75, competitorB: 78 },
    { period: '4', yourBrand: 79, competitorA: 72, competitorB: 81 },
    { period: '5', yourBrand: 78, competitorA: 72, competitorB: 81 },
  ];

  const handleAddCompetitor = () => {
    if (newCompetitor.name.trim()) {
      const colors = ['#ef4444', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'];
      const newColor = colors[competitors.length % colors.length];
      
      setCompetitors([...competitors, {
        ...newCompetitor,
        color: newColor,
        change: Math.random() * 10 - 5 // Random change between -5 and +5
      }]);
      setNewCompetitor({ name: '', score: 0, mentions: 0 });
      setShowAddModal(false);
    }
  };

  const handleChartHover = (event: React.MouseEvent, competitor: string, period: string, value: number) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setHoveredPoint({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      data: { competitor, period, value }
    });
  };

  return (
    <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-purple-100 to-violet-100 dark:from-purple-900/30 dark:to-violet-900/30 rounded-xl">
            <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Competitive Landscape</h3>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-105 text-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Add Competitor</span>
        </button>
      </div>

      {/* Competitor Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {competitors.map((competitor, index) => (
          <div
            key={index}
            className="p-4 rounded-xl bg-gray-50/50 dark:bg-gray-700/50 border border-gray-200/30 dark:border-gray-600/30"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: competitor.color }}
                />
                <span className="font-medium text-gray-900 dark:text-white text-sm">
                  {competitor.name}
                </span>
              </div>
              {competitor.name !== 'Your Brand' && (
                <span className={`text-xs font-medium ${competitor.change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {competitor.change >= 0 ? '+' : ''}{competitor.change.toFixed(1)}%
                </span>
              )}
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Score:</span>
                <span className="font-medium text-gray-900 dark:text-white">{competitor.score}/100</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Mentions:</span>
                <span className="font-medium text-gray-900 dark:text-white">{competitor.mentions.toLocaleString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Performance Chart */}
      <div className="relative">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Brand Score Trend</h4>
        <div className="relative h-64 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
          <svg width="100%" height="100%" viewBox="0 0 400 200" className="overflow-visible">
            {/* Grid lines */}
            {[0, 1, 2, 3, 4].map(i => (
              <line
                key={i}
                x1={i * 100}
                y1={0}
                x2={i * 100}
                y2={200}
                stroke="currentColor"
                strokeWidth="1"
                className="text-gray-200 dark:text-gray-600"
                opacity="0.3"
              />
            ))}
            {[0, 1, 2, 3, 4].map(i => (
              <line
                key={i}
                x1={0}
                y1={i * 50}
                x2={400}
                y2={i * 50}
                stroke="currentColor"
                strokeWidth="1"
                className="text-gray-200 dark:text-gray-600"
                opacity="0.3"
              />
            ))}

            {/* Chart lines */}
            {competitors.slice(0, 3).map((competitor, compIndex) => {
              const dataKey = competitor.name === 'Your Brand' ? 'yourBrand' : 
                            competitor.name === 'Competitor A' ? 'competitorA' : 'competitorB';
              
              const points = chartData.map((data, index) => ({
                x: index * 100,
                y: 200 - ((data[dataKey as keyof typeof data] as number - 60) / 40) * 200
              }));

              const pathData = points.map((point, index) => 
                `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
              ).join(' ');

              return (
                <g key={compIndex}>
                  <path
                    d={pathData}
                    fill="none"
                    stroke={competitor.color}
                    strokeWidth="3"
                    className="transition-all duration-300"
                  />
                  {points.map((point, pointIndex) => (
                    <circle
                      key={pointIndex}
                      cx={point.x}
                      cy={point.y}
                      r="4"
                      fill={competitor.color}
                      className="cursor-pointer hover:r-6 transition-all duration-200"
                      onMouseEnter={(e) => handleChartHover(e, competitor.name, chartData[pointIndex].period, chartData[pointIndex][dataKey as keyof typeof chartData[pointIndex]] as number)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                  ))}
                </g>
              );
            })}
          </svg>

          {/* Tooltip */}
          {hoveredPoint && (
            <div
              className="absolute z-10 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs px-2 py-1 rounded shadow-lg pointer-events-none"
              style={{
                left: hoveredPoint.x + 10,
                top: hoveredPoint.y - 30,
              }}
            >
              <div className="font-medium">{hoveredPoint.data.competitor}</div>
              <div>Score: {hoveredPoint.data.value}</div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex justify-center space-x-6 mt-4">
          {competitors.slice(0, 3).map((competitor, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: competitor.color }}
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">{competitor.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Add Competitor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add Competitor</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Competitor Name
                </label>
                <input
                  type="text"
                  value={newCompetitor.name}
                  onChange={(e) => setNewCompetitor({ ...newCompetitor, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter competitor name"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Initial Score
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newCompetitor.score}
                    onChange={(e) => setNewCompetitor({ ...newCompetitor, score: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Mentions
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newCompetitor.mentions}
                    onChange={(e) => setNewCompetitor({ ...newCompetitor, mentions: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCompetitor}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-lg transition-all duration-200"
              >
                Add Competitor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompetitorLandscape;