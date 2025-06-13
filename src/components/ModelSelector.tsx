import React, { useState } from 'react';
import { ChevronDown, Zap, Gauge, Rabbit, Rocket, Star } from 'lucide-react';

export interface GeminiModel {
  id: string;
  name: string;
  displayName: string;
  rpm: number; // Requests per minute
  tpm: number; // Tokens per minute
  rpd: number; // Requests per day
  performance: 'highest' | 'high' | 'medium' | 'fast' | 'fastest';
  description: string;
}

const GEMINI_MODELS: GeminiModel[] = [
  {
    id: 'gemini-2.5-flash-preview-05-20',
    name: 'gemini-2.5-flash-preview-05-20',
    displayName: 'Gemini 2.5 Flash Preview',
    rpm: 10,
    tpm: 250000,
    rpd: 500,
    performance: 'highest',
    description: 'Latest preview model with highest quality'
  },
  {
    id: 'gemini-2.0-flash',
    name: 'gemini-2.0-flash',
    displayName: 'Gemini 2.0 Flash',
    rpm: 15,
    tpm: 1000000,
    rpd: 1500,
    performance: 'high',
    description: 'Stable high-performance model (Recommended)'
  },
  {
    id: 'gemini-2.0-flash-exp',
    name: 'gemini-2.0-flash-exp',
    displayName: 'Gemini 2.0 Flash Experimental',
    rpm: 10,
    tpm: 250000,
    rpd: 1000,
    performance: 'high',
    description: 'Experimental features with high quality'
  },
  {
    id: 'gemini-2.0-flash-lite',
    name: 'gemini-2.0-flash-lite',
    displayName: 'Gemini 2.0 Flash Lite',
    rpm: 30,
    tpm: 1000000,
    rpd: 1500,
    performance: 'fastest',
    description: 'Fastest processing with good quality'
  },
  {
    id: 'gemini-1.5-flash',
    name: 'gemini-1.5-flash',
    displayName: 'Gemini 1.5 Flash',
    rpm: 15,
    tpm: 250000,
    rpd: 500,
    performance: 'medium',
    description: 'Reliable baseline model'
  }
];

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  disabled?: boolean;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ 
  selectedModel, 
  onModelChange, 
  disabled = false 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getPerformanceIcon = (performance: string) => {
    switch (performance) {
      case 'highest': return Star;
      case 'high': return Rocket;
      case 'medium': return Gauge;
      case 'fast': return Zap;
      case 'fastest': return Rabbit;
      default: return Gauge;
    }
  };

  const getPerformanceColor = (performance: string) => {
    switch (performance) {
      case 'highest': return 'text-purple-600 dark:text-purple-400';
      case 'high': return 'text-blue-600 dark:text-blue-400';
      case 'medium': return 'text-green-600 dark:text-green-400';
      case 'fast': return 'text-yellow-600 dark:text-yellow-400';
      case 'fastest': return 'text-orange-600 dark:text-orange-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const selectedModelData = GEMINI_MODELS.find(m => m.id === selectedModel) || GEMINI_MODELS[1]; // Default to 2.0 Flash
  const SelectedIcon = getPerformanceIcon(selectedModelData.performance);

  const handleModelSelect = (modelId: string) => {
    onModelChange(modelId);
    setIsExpanded(false);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(0)}K`;
    }
    return num.toString();
  };

  return (
    <div>
      <label htmlFor="modelSelector" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
        AI Model
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          disabled={disabled}
          className={`w-full flex items-center justify-between px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg transition-all duration-200 ${
            disabled 
              ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed opacity-50' 
              : 'bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer focus:ring-2 focus:ring-orange-500 focus:border-transparent'
          }`}
          aria-label="Select Gemini model"
        >
          <div className="flex items-center space-x-3">
            <SelectedIcon className={`h-5 w-5 ${getPerformanceColor(selectedModelData.performance)}`} />
            <div className="text-left">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {selectedModelData.displayName}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {selectedModelData.rpm} RPM • {formatNumber(selectedModelData.tpm)} TPM • {formatNumber(selectedModelData.rpd)} RPD
              </div>
            </div>
          </div>
          <ChevronDown className={`h-5 w-5 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${
            isExpanded ? 'rotate-180' : ''
          }`} />
        </button>

        {isExpanded && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
            <div className="p-4 border-b border-gray-200 dark:border-gray-600">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Select Gemini Model</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Choose based on your performance needs and rate limits</p>
            </div>
            
            <div className="p-2 space-y-2">
              {GEMINI_MODELS.map((model) => {
                const Icon = getPerformanceIcon(model.performance);
                const isSelected = model.id === selectedModel;
                
                return (
                  <button
                    key={model.id}
                    onClick={() => handleModelSelect(model.id)}
                    className={`w-full text-left p-4 rounded-lg transition-all duration-200 ${
                      isSelected 
                        ? 'bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-200 dark:border-orange-700' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <Icon className={`h-5 w-5 mt-1 flex-shrink-0 ${getPerformanceColor(model.performance)}`} />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className={`text-sm font-semibold ${
                            isSelected ? 'text-orange-900 dark:text-orange-100' : 'text-gray-900 dark:text-white'
                          }`}>
                            {model.displayName}
                          </h4>
                          {isSelected && (
                            <div className="flex-shrink-0 w-2 h-2 bg-orange-500 rounded-full"></div>
                          )}
                        </div>
                        
                        <p className={`text-xs mb-3 leading-relaxed ${
                          isSelected ? 'text-orange-700 dark:text-orange-300' : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          {model.description}
                        </p>
                        
                        <div className="grid grid-cols-3 gap-3">
                          <div className={`text-center p-2 rounded ${
                            isSelected ? 'bg-orange-100 dark:bg-orange-800/30' : 'bg-gray-100 dark:bg-gray-600'
                          }`}>
                            <div className={`text-sm font-bold ${
                              isSelected ? 'text-orange-800 dark:text-orange-200' : 'text-gray-900 dark:text-white'
                            }`}>
                              {model.rpm}
                            </div>
                            <div className={`text-xs ${
                              isSelected ? 'text-orange-600 dark:text-orange-400' : 'text-gray-500 dark:text-gray-400'
                            }`}>
                              RPM
                            </div>
                          </div>
                          <div className={`text-center p-2 rounded ${
                            isSelected ? 'bg-orange-100 dark:bg-orange-800/30' : 'bg-gray-100 dark:bg-gray-600'
                          }`}>
                            <div className={`text-sm font-bold ${
                              isSelected ? 'text-orange-800 dark:text-orange-200' : 'text-gray-900 dark:text-white'
                            }`}>
                              {formatNumber(model.tpm)}
                            </div>
                            <div className={`text-xs ${
                              isSelected ? 'text-orange-600 dark:text-orange-400' : 'text-gray-500 dark:text-gray-400'
                            }`}>
                              TPM
                            </div>
                          </div>
                          <div className={`text-center p-2 rounded ${
                            isSelected ? 'bg-orange-100 dark:bg-orange-800/30' : 'bg-gray-100 dark:bg-gray-600'
                          }`}>
                            <div className={`text-sm font-bold ${
                              isSelected ? 'text-orange-800 dark:text-orange-200' : 'text-gray-900 dark:text-white'
                            }`}>
                              {formatNumber(model.rpd)}
                            </div>
                            <div className={`text-xs ${
                              isSelected ? 'text-orange-600 dark:text-orange-400' : 'text-gray-500 dark:text-gray-400'
                            }`}>
                              RPD
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            
            <div className="p-4 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50">
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                <span className="font-semibold">RPM:</span> Requests per minute • 
                <span className="font-semibold"> TPM:</span> Tokens per minute • 
                <span className="font-semibold"> RPD:</span> Requests per day
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModelSelector;
export { GEMINI_MODELS };