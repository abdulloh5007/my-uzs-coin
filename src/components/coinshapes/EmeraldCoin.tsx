
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
        {/* Emerald-like octagon shape */}
        <polygon points="25,5 75,5 95,25 95,75 75,95 25,95 5,75 5,25" />
      </svg>
      <Coins className={cn("w-3/5 h-3/5 relative z-10", iconClass)} /> {/* Icon on top */}
    </div>
  );
};

export default EmeraldCoin;
