import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageSquare, TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';
import { AnalysisResult } from '../types';

interface ExpandableCardProps {
  analysisResult: AnalysisResult;
  index: number;
  isExpanded: boolean;
  onToggle: (index: number) => void;
}

const ExpandableCard: React.FC<ExpandableCardProps> = ({ 
  analysisResult, 
  index, 
  isExpanded, 
  onToggle 
}) => {
  const { post, result } = analysisResult;
  const contentRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Debounced click handler for performance
  const debouncedToggle = useCallback(
    debounce(() => onToggle(index), 50),
    [index, onToggle]
  );

  // Calculate content height when expanded state changes
  useEffect(() => {
    if (contentRef.current) {
      const height = contentRef.current.scrollHeight;
      setContentHeight(height);
    }
  }, [isExpanded, analysisResult]);

  // Handle animation state
  useEffect(() => {
    if (isExpanded !== undefined) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isExpanded]);

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return TrendingUp;
      case 'negative': return TrendingDown;
      case 'mixed': return AlertCircle;
      case 'neutral': return Minus;
      default: return Minus;
    }
  };

  const getSentimentClass = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'sentiment-positive';
      case 'negative': return 'sentiment-negative';
      case 'mixed': return 'sentiment-mixed';
      case 'neutral': return 'sentiment-neutral';
      default: return 'sentiment-neutral';
    }
  };

  const handleClick = (event: React.MouseEvent) => {
    // Prevent toggle when clicking on text content for selection
    const target = event.target as HTMLElement;
    if (target.closest('.selectable-content')) {
      return;
    }
    debouncedToggle();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      debouncedToggle();
    }
  };

  const SentimentIcon = result ? getSentimentIcon(result.sentiment) : Minus;

  return (
    <div
      ref={cardRef}
      className={`expandable-card ${isExpanded ? 'expanded' : 'collapsed'} ${isAnimating ? 'animating' : ''}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-expanded={isExpanded}
      aria-label={`${post.title} - Click to ${isExpanded ? 'collapse' : 'expand'} details`}
      style={{
        '--content-height': `${contentHeight}px`,
      } as React.CSSProperties}
    >
      {/* Card Header - Always Visible */}
      <div className="card-header">
        <div className="card-title-section">
          <h3 className="card-title">
            {post.title}
          </h3>
          {post.subreddit && (
            <p className="card-subreddit">
              r/{post.subreddit}
            </p>
          )}
        </div>
        
        <div className="card-sentiment">
          {result ? (
            <div className={`sentiment-badge ${getSentimentClass(result.sentiment)}`}>
              <SentimentIcon className="sentiment-icon" />
              <span>{result.sentiment}</span>
            </div>
          ) : (
            <div className="sentiment-badge sentiment-neutral">
              <AlertCircle className="sentiment-icon" />
              <span>Failed</span>
            </div>
          )}
        </div>
      </div>

      {/* Expandable Content */}
      <div className="card-content-wrapper">
        <div ref={contentRef} className="card-content selectable-content">
          {/* Post Content */}
          {post.selftext && (
            <div className="post-content">
              <p className="post-text">
                {post.selftext}
              </p>
            </div>
          )}

          {/* Comments */}
          {post.comments && post.comments.length > 0 && (
            <div className="comments-section">
              <div className="comments-header">
                <MessageSquare className="comments-icon" />
                <span className="comments-title">Top Comments</span>
              </div>
              <div className="comments-list">
                {post.comments.slice(0, 3).map((comment, commentIndex) => (
                  <p key={commentIndex} className="comment-item">
                    {comment}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Sentiment Analysis Results */}
          {result && (
            <div className="analysis-section">
              {/* Explanation */}
              <div className="explanation-box">
                <p className="explanation-text">{result.explanation}</p>
              </div>

              <div className="aspects-grid">
                {/* Positive Points */}
                {result.positives.length > 0 && (
                  <div className="positive-aspects">
                    <h4 className="aspects-title positive-title">
                      <TrendingUp className="aspects-icon" />
                      Positive Aspects
                    </h4>
                    <ul className="aspects-list">
                      {result.positives.map((positive, positiveIndex) => (
                        <li key={positiveIndex} className="aspect-item positive-item">
                          <span className="aspect-bullet positive-bullet">•</span>
                          <span className="aspect-text">{positive}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Negative Points */}
                {result.negatives.length > 0 && (
                  <div className="negative-aspects">
                    <h4 className="aspects-title negative-title">
                      <TrendingDown className="aspects-icon" />
                      Negative Aspects
                    </h4>
                    <ul className="aspects-list">
                      {result.negatives.map((negative, negativeIndex) => (
                        <li key={negativeIndex} className="aspect-item negative-item">
                          <span className="aspect-bullet negative-bullet">•</span>
                          <span className="aspect-text">{negative}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export default ExpandableCard;