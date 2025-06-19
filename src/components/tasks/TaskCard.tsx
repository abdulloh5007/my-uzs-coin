
import type React from 'react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { Task, TaskTier } from '@/types/tasks';
import TaskTierItem from './TaskTierItem';
import StarDisplay from './StarDisplay';

interface TaskCardProps {
  task: Task;
  userTierProgressGetter: (progressKey?: string) => number;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, userTierProgressGetter }) => {
  const { icon: Icon, title, subtitle, stars, tiers } = task;
  const [isClient, setIsClient] = useState(false);
  const [locallyTrackedCompletedTierIds, setLocallyTrackedCompletedTierIds] = useState<string[]>([]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      const localCompletedUnclaimed = JSON.parse(localStorage.getItem('completedUnclaimedTaskTierIds') || '[]') as string[];
      const localClaimed = JSON.parse(localStorage.getItem('claimedTaskTierIds') || '[]') as string[];
      setLocallyTrackedCompletedTierIds([...localCompletedUnclaimed, ...localClaimed]);
    }
    // No direct dependency on task.id here, as this effect should primarily react to client-side status.
    // It will run once on mount after isClient is true.
    // If localStorage changes from elsewhere, this component won't know without more complex state management or event listeners.
    // However, TasksPage is the primary writer and this card is usually displayed within it.
  }, [isClient]);


  let completedTiersForStarsDisplay = 0;
  if (isClient) {
    tiers.forEach(tier => {
      if (locallyTrackedCompletedTierIds.includes(tier.id)) {
        completedTiersForStarsDisplay++;
      }
    });
  }

  const overallProgressPercentage = tiers.length > 0 ? (completedTiersForStarsDisplay / tiers.length) * 100 : 0;
  
  const starDisplayCount = stars > 0 ? stars : (tiers.length > 0 ? tiers.length : 1);
  const starDisplayFilledCount = Math.min(completedTiersForStarsDisplay, starDisplayCount);


  return (
    <Card className="bg-card/80 border-border/50 shadow-lg w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-full ${task.iconBgClass || 'bg-primary/20'}`}>
              <Icon className={`w-6 h-6 ${task.iconColorClass || 'text-primary'}`} />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-foreground">{title}</CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                {subtitle}
              </CardDescription>
            </div>
          </div>
          <StarDisplay count={starDisplayCount} filledCount={starDisplayFilledCount} />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="space-y-0 divide-y divide-border/30 mb-3">
          {tiers.map((tier) => (
            <TaskTierItem
              key={tier.id}
              tier={tier}
              currentProgress={userTierProgressGetter(tier.progressKey)}
            />
          ))}
        </ul>
        {tiers.length > 1 && ( // Only show overall progress if more than one tier
          <>
            <Progress value={overallProgressPercentage} className="h-2 bg-primary/30 mb-1" indicatorClassName="bg-primary" />
            <p className="text-xs text-muted-foreground text-right">
              {completedTiersForStarsDisplay}/{tiers.length} завершено
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TaskCard;
