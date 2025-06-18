import type React from 'react';
import { Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ClickableCoinProps {
  onClick: () => void;
  isAnimating: boolean; // This prop is ONLY for CSS animation class
  disabled: boolean;    // This prop is for actual button disabling based on game state (e.g. energy)
}

const ClickableCoin: React.FC<ClickableCoinProps> = ({ onClick, isAnimating, disabled }) => {
  return (
    <Button
      onClick={onClick}
      disabled={disabled} // Button is disabled SOLELY based on the 'disabled' prop from parent
      aria-label="Click coin"
      className={cn(
        "rounded-full w-48 h-48 md:w-64 md:h-64 p-0 bg-primary hover:bg-primary/90 focus:ring-4 focus:ring-ring shadow-xl active:shadow-inner",
        "flex items-center justify-center",
        isAnimating ? 'animate-coin-click' : '' // Apply animation class based on 'isAnimating' prop
        // Shadcn's Button component handles 'disabled:opacity-50' and 'disabled:pointer-events-none' (cursor) automatically.
      )}
    >
      <Coins
        className={cn(
          "w-3/4 h-3/4 text-primary-foreground transition-transform duration-150 ease-in-out",
        )}
      />
    </Button>
  );
};

export default ClickableCoin;
