import type React from 'react';
import { Zap } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface EnergyBarProps {
  currentEnergy: number;
  maxEnergy: number;
  className?: string;
}

const EnergyBar: React.FC<EnergyBarProps> = ({ currentEnergy, maxEnergy, className }) => {
  const energyPercentage = maxEnergy > 0 ? (currentEnergy / maxEnergy) * 100 : 0;

  return (
    <div className={cn(className)}>
      <div className="flex justify-between items-center mb-1 text-sm font-medium text-foreground">
        <div className="flex items-center">
          <Zap className="w-4 h-4 mr-1.5 text-primary" />
          <span>Энергия</span>
        </div>
        <span>{Math.floor(currentEnergy)} / {maxEnergy}</span>
      </div>
      <Progress value={energyPercentage} aria-label={`Energy level: ${Math.floor(energyPercentage)}%`} className="h-4 bg-primary/30" />
    </div>
  );
};

export default EnergyBar;
