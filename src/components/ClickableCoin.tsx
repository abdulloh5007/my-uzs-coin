
import type React from 'react';
import { Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ClickableCoinProps {
  onClick: () => void;
  isAnimating: boolean; 
  disabled: boolean;    
  coinColorClass?: string; // e.g., 'bg-yellow-500' or 'bg-gradient-to-r ...'
  coinIconColorClass?: string; // e.g., 'text-white'
}

const ClickableCoin: React.FC<ClickableCoinProps> = ({ 
  onClick, 
  isAnimating, 
  disabled,
  coinColorClass = 'bg-primary hover:bg-primary/90', // Default to theme primary
  coinIconColorClass = 'text-primary-foreground' // Default to theme primary foreground
}) => {
  return (
    <Button
      onClick={onClick}
      disabled={disabled} 
      aria-label="Click coin"
      className={cn(
        "rounded-full w-48 h-48 md:w-64 md:h-64 p-0 shadow-xl active:shadow-inner",
        "flex items-center justify-center",
        coinColorClass, // Apply dynamic background color
        isAnimating ? 'animate-coin-click' : ''
      )}
    >
      <Coins
        className={cn(
          "w-3/4 h-3/4 transition-transform duration-150 ease-in-out",
          coinIconColorClass // Apply dynamic icon color
        )}
      />
    </Button>
  );
};

export default ClickableCoin;
