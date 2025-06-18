
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { League } from '@/lib/leagues';
import { Button } from '@/components/ui/button';

interface LeagueInfoCardProps {
  currentLeague: League;
  nextLeague: League | null;
  currentScore: number;
  progressPercentage: number;
  onOpenLeaderboard: () => void;
}

const LeagueInfoCard: React.FC<LeagueInfoCardProps> = ({
  currentLeague,
  nextLeague,
  currentScore,
  progressPercentage,
  onOpenLeaderboard
}) => {
  const IconComponent = currentLeague.icon;

  return (
    <Card className="bg-card/80 border-border/50 shadow-lg cursor-pointer hover:bg-card/90 transition-colors" onClick={onOpenLeaderboard}>
      <CardContent className="p-4 text-left">
        <div className="flex items-center mb-3">
          <IconComponent className={`w-10 h-10 mr-3 ${currentLeague.color}`} />
          <div>
            <p className="text-xs text-muted-foreground">Текущая лига</p>
            <h3 className={`text-2xl font-bold ${currentLeague.color}`}>{currentLeague.name}</h3>
          </div>
        </div>
        
        {nextLeague ? (
          <>
            <div className="flex justify-between items-center text-xs text-muted-foreground mb-1">
              <span>Прогресс до {nextLeague.name}</span>
              <span>{progressPercentage.toFixed(1)}%</span>
            </div>
            <Progress value={progressPercentage} className={`h-2 ${currentLeague.color.replace('text-','bg-').replace('-400','/30')}`} indicatorClassName={`${currentLeague.color.replace('text-','bg-')}`} />
            <div className="flex justify-between items-center text-xs text-muted-foreground mt-1">
              <span>{currentScore.toLocaleString()} монет</span>
              <span>{nextLeague.threshold.toLocaleString()} монет</span>
            </div>
          </>
        ) : (
          <p className="text-sm text-center text-muted-foreground mt-2">Вы достигли высшей лиги!</p>
        )}
      </CardContent>
    </Card>
  );
};

export default LeagueInfoCard;
