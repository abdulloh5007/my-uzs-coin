
import React, { useState, useEffect } from 'react';
import { Coins, Zap, Target, History } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';

interface GameStatsProps {
  score: number;
  currentEnergy: number;
  maxEnergy: number;
  clickPower: number;
  energyRegenRate: number; // per second
}

const StatItem: React.FC<{ icon: React.ElementType; label: string; value: string | React.ReactNode; className?: string, children?: React.ReactNode }> = ({ icon: Icon, label, value, className, children }) => (
  <div className={`flex flex-col items-center justify-center text-center p-2 rounded-lg bg-background/30 ${className}`}>
    <div className="flex items-center text-sm text-muted-foreground mb-1">
      <Icon className="w-4 h-4 mr-1.5 text-primary" />
      <span>{label}</span>
    </div>
    <div className="text-lg font-semibold text-foreground">{value}</div>
    {children}
  </div>
);

const GameStats: React.FC<GameStatsProps> = ({ score, currentEnergy, maxEnergy, clickPower, energyRegenRate }) => {
  const energyPercentage = maxEnergy > 0 ? (currentEnergy / maxEnergy) * 100 : 0;
  const [formattedScore, setFormattedScore] = useState<string>(score.toString());

  useEffect(() => {
    setFormattedScore(score.toLocaleString());
  }, [score]);

  return (
    <div className="fixed top-16 left-0 right-0 z-10 bg-card shadow-sm py-3">
      <div className="container mx-auto px-2 sm:px-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3">
          <StatItem icon={Coins} label="Монеты" value={formattedScore} />
          <StatItem icon={Zap} label="Энергия" value={`${Math.floor(currentEnergy)}/${maxEnergy}`}>
            <Progress value={energyPercentage} aria-label={`Energy level: ${Math.floor(energyPercentage)}%`} className="h-2 w-full mt-1 bg-primary/30" />
          </StatItem>
          <StatItem icon={Target} label="Сила клика" value={`+${clickPower}`} />
          <StatItem icon={History} label="Восстановление" value={`+${energyRegenRate.toFixed(0)}/сек`} />
        </div>
      </div>
    </div>
  );
};

export default GameStats;

