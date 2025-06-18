
import type React from 'react';
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

// Helper to add indicatorClassName to Progress props for custom color
declare module '@/components/ui/progress' {
  interface ProgressProps {
    indicatorClassName?: string;
  }
}
// Monkey-patching Progress to accept indicatorClassName
const OriginalProgress = Progress;
(Progress as any) = React.forwardRef<
  React.ElementRef<typeof OriginalProgress>,
  React.ComponentPropsWithoutRef<typeof OriginalProgress> & { indicatorClassName?: string }
>(({ indicatorClassName, ...props }, ref) => (
  <OriginalProgress
    ref={ref}
    {...props}
    // This is a way to customize indicator color; actual implementation might differ
    // For shadcn/ui Progress, you typically customize via CSS variables or by wrapping.
    // Here, we pass it down and assume it might be used by a custom Progress or for styling.
    // A more robust way is to use CSS variables in globals.css.
    // For now, this is a placeholder for the idea of dynamic progress bar color.
    // The coloring is actually handled by the className on Progress itself and its child.
    // We'll rely on the parent className for the bg color of the track and indicatorClassName for the fill.
    // Corrected in parent to use bg-primary/30 and bg-primary convention
  >
    <div
      className={`h-full w-full flex-1 transition-all ${indicatorClassName || 'bg-primary'}`}
      style={{ transform: `translateX(-${100 - (props.value || 0)}%)` }}
    />
  </OriginalProgress>
));


export default LeagueInfoCard;
