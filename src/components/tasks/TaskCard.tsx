
import type React from 'react';
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

  let completedTiers = 0;
  tiers.forEach(tier => {
    const currentProgress = userTierProgressGetter(tier.progressKey);
    if (currentProgress >= tier.target) {
      completedTiers++;
    }
  });

  const overallProgressPercentage = tiers.length > 0 ? (completedTiers / tiers.length) * 100 : 0;
  
  const starDisplayCount = stars;
  const starDisplayFilledCount = Math.min(completedTiers, stars);


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
          <StarDisplay count={starDisplayCount > 0 ? starDisplayCount : 1} filledCount={starDisplayFilledCount} />
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
        {tiers.length > 1 && (
          <>
            <Progress value={overallProgressPercentage} className="h-2 bg-primary/30 mb-1" indicatorClassName="bg-primary" />
            <p className="text-xs text-muted-foreground text-right">
              {completedTiers}/{tiers.length} завершено
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TaskCard;
