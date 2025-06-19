
import type React from 'react';
import { useState, useEffect } from 'react'; // Added useState and useEffect
import { CheckCircle2, CircleDot } from 'lucide-react'; // Using CircleDot for pending
import type { TaskTier } from '@/types/tasks';
import { cn } from '@/lib/utils';

interface TaskTierItemProps {
  tier: TaskTier;
  currentProgress: number;
}

const TaskTierItem: React.FC<TaskTierItemProps> = ({ tier, currentProgress }) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const isCompleted = currentProgress >= tier.target;

  return (
    <li className="flex items-center justify-between py-2 text-sm">
      <div className="flex items-center">
        {isCompleted ? (
          <CheckCircle2 className="w-5 h-5 mr-2 text-green-500" />
        ) : (
          <CircleDot className="w-5 h-5 mr-2 text-primary/70" />
        )}
        <span className={cn(isCompleted ? "text-muted-foreground line-through" : "text-foreground")}>
          {tier.description}
        </span>
      </div>
      <div className="text-right">
        {isCompleted ? (
          <span className="font-medium text-green-500">✓ Выполнено</span>
        ) : (
          <span className="font-medium text-foreground">
            {isClient ? currentProgress.toLocaleString() : currentProgress}/{isClient ? tier.target.toLocaleString() : tier.target}
          </span>
        )}
        <div className={cn("text-xs font-semibold", isCompleted ? "text-green-500" : "text-primary")}>
          +{isClient ? tier.reward.toLocaleString() : tier.reward} монет
        </div>
      </div>
    </li>
  );
};

export default TaskTierItem;

