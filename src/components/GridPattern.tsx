import React from 'react';

interface GridPatternProps {
  size?: number;
  opacity?: number;
}

const GridPattern: React.FC<GridPatternProps> = ({ size = 24, opacity = 0.2 }) => {
  return (
    <div 
      className="absolute inset-0" 
      style={{ 
        opacity: opacity,
        backgroundImage: `radial-gradient(#3a1463 1px, transparent 1px)`,
        backgroundSize: `${size}px ${size}px`
      }}
    />
  );
};

export default GridPattern;
