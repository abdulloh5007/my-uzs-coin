
import type React from 'react';
import { Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Skin } from '@/types/skins'; // Ensure Skin type is available if needed, or just its relevant parts

interface ClickableCoinProps {
  onClick: () => void;
  isAnimating: boolean;
  disabled: boolean;
  coinColorClass?: string;
  coinIconColorClass?: string;
  coinShapeComponent?: Skin['coinShapeComponent']; // Use the type from Skin
}

const ClickableCoin: React.FC<ClickableCoinProps> = ({
  onClick,
  isAnimating,
  disabled,
  coinColorClass = 'bg-primary hover:bg-primary/90', // Default for non-custom shapes
  coinIconColorClass = 'text-primary-foreground',
  coinShapeComponent: CoinShapeComponent,
}) => {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      aria-label="Click coin"
      className={cn(
        "w-48 h-48 md:w-64 md:h-64 p-0 shadow-xl active:shadow-inner",
        "flex items-center justify-center transition-all duration-150 ease-in-out",
        // If custom shape, button is effectively transparent. Shape handles its own fill.
        // If no custom shape, button uses coinColorClass for its background.
        CoinShapeComponent
          ? 'bg-transparent hover:bg-transparent focus:bg-transparent active:bg-transparent border-none shadow-none hover:shadow-none active:shadow-none'
          : coinColorClass,
        isAnimating ? 'animate-coin-click' : '',
        CoinShapeComponent ? '' : 'rounded-full' // Only round if no custom shape
      )}
    >
      {CoinShapeComponent ? (
        <CoinShapeComponent
          shapeFillClass={coinColorClass} // This will be "fill-emerald-500 hover:fill-emerald-600"
          iconClass={coinIconColorClass}
          className="w-full h-full"
        />
      ) : (
        <Coins // Standard circular coin
          className={cn(
            "w-4/5 h-4/5", // Icon made larger
            coinIconColorClass
          )}
        />
      )}
    </Button>
  );
};

export default ClickableCoin;
