import React, { useState, useEffect, useRef } from 'react';

interface StreamingTextProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  className?: string;
}

const StreamingText: React.FC<StreamingTextProps> = ({ 
  text, 
  speed = 25, 
  onComplete,
  className = ""
}) => {
  const [revealed, setRevealed] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const animationRef = useRef<number>();
  const lastFrameTimeRef = useRef<number>(0);

  // Animation settings
  const effectWindow = 30;
  const maxBlur = 4;
  const blurStartPoint = 0.4;
  
  // Color palette (RGB values)
  const finalColor = [226, 232, 240]; // slate-200
  const coolColor = [220, 38, 38];    // red-600
  const warmColor = [219, 39, 119];   // pink-600
  const hotColor = [124, 58, 237];    // violet-600

  const letters = text.split('');

  const getStyle = (index: number): React.CSSProperties => {
    if (isFinished) {
      return {
        color: 'inherit',
        filter: 'none',
        opacity: 1,
        transition: 'all 1s ease'
      };
    }

    const distance = revealed - index;

    if (distance > effectWindow) return { opacity: 1 };
    if (index >= revealed) return { opacity: 0 };

    const t = Math.max(0, 1 - (distance / effectWindow));

    // Blur calculation
    let blur = 0;
    if (t > blurStartPoint) {
      const blurT = (t - blurStartPoint) / (1 - blurStartPoint);
      blur = maxBlur * blurT;
    }

    // Color calculation (4-point gradient)
    let r: number, g: number, b: number;
    if (t > 0.66) {
      const p = (t - 0.66) / 0.34;
      r = warmColor[0] * (1 - p) + hotColor[0] * p;
      g = warmColor[1] * (1 - p) + hotColor[1] * p;
      b = warmColor[2] * (1 - p) + hotColor[2] * p;
    } else if (t > 0.33) {
      const p = (t - 0.33) / 0.33;
      r = coolColor[0] * (1 - p) + warmColor[0] * p;
      g = coolColor[1] * (1 - p) + warmColor[1] * p;
      b = coolColor[2] * (1 - p) + warmColor[2] * p;
    } else {
      const p = t / 0.33;
      r = finalColor[0] * (1 - p) + coolColor[0] * p;
      g = finalColor[1] * (1 - p) + coolColor[1] * p;
      b = finalColor[2] * (1 - p) + coolColor[2] * p;
    }

    const color = `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
    const minOpacity = 0.7;
    const opacity = minOpacity + (1 - minOpacity) * t;

    return {
      color,
      filter: `blur(${blur}px)`,
      opacity,
      transition: 'all 0.05s linear'
    };
  };

  const animate = (currentTime: number) => {
    if (currentTime - lastFrameTimeRef.current >= speed) {
      setRevealed(prev => {
        const next = prev + 1;
        if (next > letters.length) {
          setIsFinished(true);
          onComplete?.();
          return prev;
        }
        return next;
      });
      lastFrameTimeRef.current = currentTime;
    }

    if (revealed <= letters.length && !isFinished) {
      animationRef.current = requestAnimationFrame(animate);
    }
  };

  useEffect(() => {
    setRevealed(0);
    setIsFinished(false);
    lastFrameTimeRef.current = performance.now();
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [text]);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <span className={`inline-flex flex-wrap leading-relaxed ${className}`}>
      {letters.map((letter, index) => (
        <span
          key={index}
          style={getStyle(index)}
          className="inline-block"
        >
          {letter === ' ' ? '\u00A0' : letter}
        </span>
      ))}
    </span>
  );
};

export default StreamingText;