
import type React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { Task } from '@/types/tasks';
import TaskTierItem from './TaskTierItem';
import StarDisplay from './StarDisplay';

interface TaskCardProps {
  task: Task;
  userProgress: Record<string, number>;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, userProgress }) => {
  const { icon: Icon, title, subtitle, stars, tiers } = task;

  let completedTiers = 0;
  tiers.forEach(tier => {
    if ((userProgress[tier.id] || 0) >= tier.target) {
      completedTiers++;
    }
  });

  const overallProgressPercentage = tiers.length > 0 ? (completedTiers / tiers.length) * 100 : 0;

  // Total stars to display is always task.stars
  const starDisplayCount = stars;
  // Filled stars are the number of completed tiers, capped by task.stars
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
          {/* Ensure starDisplayCount is at least 1 if stars can be 0 for some tasks, or ensure stars is always >= 1 */}
          <StarDisplay count={starDisplayCount > 0 ? starDisplayCount : 1} filledCount={starDisplayFilledCount} />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="space-y-0 divide-y divide-border/30 mb-3">
          {tiers.map((tier) => (
            <TaskTierItem
              key={tier.id}
              tier={tier}
              currentProgress={userProgress[tier.id] || 0}
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
