
import type React from 'react';
import { Coins } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CoinShapeProps {
  shapeFillClass?: string;
  iconClass?: string;
  className?: string;
}

const EmeraldCoin: React.FC<CoinShapeProps> = ({ shapeFillClass, iconClass, className }) => {
  return (
    <div className={cn("relative w-full h-full flex items-center justify-center", className)}>
      <svg
        viewBox="0 0 100 100"
        className={cn("absolute inset-0 w-full h-full", shapeFillClass)} // Apply fill class to SVG
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Adjusted points for a larger visual shape */}
        <polygon points="20,2 80,2 98,22 98,78 80,98 20,98 2,78 2,22" />
      </svg>
      <Coins className={cn("w-3/4 h-3/4 relative z-10", iconClass)} /> {/* Icon on top, size increased */}
    </div>
  );
};

export default EmeraldCoin;
