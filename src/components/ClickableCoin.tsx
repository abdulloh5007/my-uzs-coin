import type React from 'react';
import { Coins } from 'lucide-react'; // Using Lucide's Coins icon
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ClickableCoinProps {
  onClick: () => void;
  isAnimating: boolean;
  disabled: boolean;
}

const ClickableCoin: React.FC<ClickableCoinProps> = ({ onClick, isAnimating, disabled }) => {
  return (
    <Button
      onClick={onClick}
      disabled={disabled || isAnimating}
      aria-label="Click coin"
      className={cn(
        "rounded-full w-48 h-48 md:w-64 md:h-64 p-0 bg-accent hover:bg-accent/90 focus:ring-4 focus:ring-accent/50 shadow-xl active:shadow-inner",
        "flex items-center justify-center",
        isAnimating ? 'animate-coin-click' : '',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      )}
    >
      <Coins
        className={cn(
          "w-3/4 h-3/4 text-accent-foreground transition-transform duration-150 ease-in-out",
        )}
      />
    </Button>
  );
};

export default ClickableCoin;
