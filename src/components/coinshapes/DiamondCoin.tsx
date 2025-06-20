
import type React from 'react';
import { Coins } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CoinShapeProps {
  shapeFillClass?: string;
  iconClass?: string;
  className?: string;
}

const DiamondCoin: React.FC<CoinShapeProps> = ({ shapeFillClass, iconClass, className }) => {
  return (
    <div className={cn("relative w-full h-full flex items-center justify-center", className)}>
      <svg
        viewBox="0 0 100 100"
        className={cn("absolute inset-0 w-full h-full", shapeFillClass)} // Apply fill class to SVG
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Simplified diamond shape */}
        <polygon points="50,2 98,35 90,95 10,95 2,35" />
      </svg>
      <Coins className={cn("w-3/5 h-3/5 relative z-10", iconClass)} /> {/* Icon on top */}
    </div>
  );
};

export default DiamondCoin;
