import type React from 'react';
import { Zap } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface EnergyBarProps {
  currentEnergy: number;
  maxEnergy: number;
}

// This component might be largely superseded by GameStats.tsx,
// but keeping it in case it's used elsewhere or for direct use.
// The GameStats component will replicate similar UI for energy.
const EnergyBar: React.FC<EnergyBarProps> = ({ currentEnergy, maxEnergy }) => {
  const energyPercentage = maxEnergy > 0 ? (currentEnergy / maxEnergy) * 100 : 0;

  return (
    <div className="w-full max-w-md mx-auto my-4 md:my-6 px-4">
      <div className="flex justify-between items-center mb-1 text-sm font-medium text-foreground"> {/* text-primary-foreground to text-foreground */}
        <div className="flex items-center">
          <Zap className="w-4 h-4 mr-1.5 text-primary" />
          <span>Energy</span>
        </div>
        <span>{Math.floor(currentEnergy)} / {maxEnergy}</span>
      </div>
      <Progress value={energyPercentage} aria-label={`Energy level: ${Math.floor(energyPercentage)}%`} className="h-4 bg-primary/30" />
    </div>
  );
};

export default EnergyBar;
