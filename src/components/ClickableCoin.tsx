
import type React from 'react';
import { Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ClickableCoinProps {
  onClick: () => void;
  isAnimating: boolean;
  disabled: boolean;
  coinColorClass?: string;
  coinIconColorClass?: string;
  isBoostActive?: boolean;
}

const ClickableCoin: React.FC<ClickableCoinProps> = ({
  onClick,
  isAnimating,
  disabled,
  coinColorClass = 'bg-primary hover:bg-primary/90',
  coinIconColorClass = 'text-primary-foreground',
  isBoostActive = false,
}) => {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      aria-label="Click coin"
      className={cn(
        "w-48 h-48 md:w-64 md:h-64 p-0 shadow-xl active:shadow-inner",
        "flex items-center justify-center transition-all duration-150 ease-in-out",
        coinColorClass,
        isAnimating ? 'animate-coin-click' : '',
        'rounded-full',
        isBoostActive && 'shadow-lg shadow-amber-400/80 animate-pulse'
      )}
    >
      <Coins
        className={cn(
          "w-4/5 h-4/5", // Icon size
          coinIconColorClass
        )}
      />
    </Button>
  );
};

export default ClickableCoin;
