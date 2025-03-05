import { motion } from 'framer-motion';
import React from 'react';

interface CandlestickRainProps {
  count?: number;
}

const CandlestickRain: React.FC<CandlestickRainProps> = ({ count = 10 }) => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(count)].map((_, i) => (
        <div
          key={`candlestick-column-${i}`}
          className={`absolute candlestick-column ${i > count * 0.7 ? 'hidden md:block' : i > count * 0.8 ? 'hidden sm:block' : 'block'}`}
          style={{
            left: `${(i * 100) / count}%`,
            top: '-100px',
            height: '2000px',
            opacity: 0.25,
            animation: `candlestick-fall ${25 + i % 4 * 2.5}s linear infinite`,
            animationDelay: `-${i % 5 * 1.2}s`,
          }}
        >
          {[...Array(10)].map((_, j) => (
            <div
              key={`candlestick-${i}-${j}`}
              className={`candlestick-${1 + ((i+j) % 4)}`}
              style={{
                top: `${j * 200}px`,
                opacity: 0.5 - (j * 0.01),
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default CandlestickRain;
