
import type React from 'react';
import { Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
// Skin type import is no longer needed here as coinShapeComponent is removed

interface ClickableCoinProps {
  onClick: () => void;
  isAnimating: boolean;
  disabled: boolean;
  coinColorClass?: string;
  coinIconColorClass?: string;
  // coinShapeComponent?: Skin['coinShapeComponent']; // Removed
}

const ClickableCoin: React.FC<ClickableCoinProps> = ({
  onClick,
  isAnimating,
  disabled,
  coinColorClass = 'bg-primary hover:bg-primary/90',
  coinIconColorClass = 'text-primary-foreground',
  // coinShapeComponent: CoinShapeComponent, // Removed
}) => {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      aria-label="Click coin"
      className={cn(
        "w-48 h-48 md:w-64 md:h-64 p-0 shadow-xl active:shadow-inner",
        "flex items-center justify-center transition-all duration-150 ease-in-out",
        coinColorClass, // Apply coinColorClass directly to the button
        isAnimating ? 'animate-coin-click' : '',
        'rounded-full' // Always rounded as we removed custom shapes
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
