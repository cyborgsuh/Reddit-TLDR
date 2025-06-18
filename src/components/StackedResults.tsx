import React, { useState } from 'react';
import ExpandableCard from './ExpandableCard';
import { AnalysisResult } from '../types';

interface StackedResultsProps {
  analysisResults: AnalysisResult[];
}

const StackedResults: React.FC<StackedResultsProps> = ({ analysisResults }) => {
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  const handleCardToggle = (index: number) => {
    setExpandedCard(expandedCard === index ? null : index);
  };

  return (
    <div className="stacked-results px-4 sm:px-0">
      <h2 className="results-title">Analysis Results</h2>
      
      <div className="cards-container">
        {analysisResults.map((analysisResult, index) => (
          <ExpandableCard
            key={index}
            analysisResult={analysisResult}
            index={index}
            isExpanded={expandedCard === index}
            onToggle={handleCardToggle}
          />
        ))}
      </div>
    </div>
  );
};

export default StackedResults;