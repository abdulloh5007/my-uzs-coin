/**
 * @fileOverview Utility functions for task management.
 *
 * - checkAndNotifyTaskCompletion - Checks for task completion and shows notifications.
 */

import type { Task } from '@/types/tasks';
import type { Toast } from "@/hooks/use-toast";
import { CheckCircle2 } from 'lucide-react';
import React from 'react';

export function checkAndNotifyTaskCompletion(
  currentProgress: Record<string, number>,
  allTasks: Task[],
  toastFn: (props: Toast) => void, // This is the toast function from useToast()
  showNewTaskCompletedToast: boolean = true
): { newCompletedUnclaimedTierIds: string[], newRewardsWereAdded: boolean } {
  let completedUnclaimed = JSON.parse(localStorage.getItem('completedUnclaimedTaskTierIds') || '[]') as string[];
  const claimed = JSON.parse(localStorage.getItem('claimedTaskTierIds') || '[]') as string[];
  let newRewardsWereAddedThisCheck = false;

  allTasks.forEach(task => {
    task.tiers.forEach(tier => {
      const progressVal = currentProgress[tier.progressKey || ''] || 0;
      if (progressVal >= tier.target) {
        if (!completedUnclaimed.includes(tier.id) && !claimed.includes(tier.id)) {
          completedUnclaimed.push(tier.id);
          newRewardsWereAddedThisCheck = true;

          if (showNewTaskCompletedToast) {
            toastFn({
              title: (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                  <span className="font-semibold text-foreground">Задание выполнено!</span>
                </div>
              ),
              description: (
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-primary">{task.title}</span>: {tier.description}
                </p>
              ),
              duration: 5000,
            });
          }
        }
      }
    });
  });

  if (newRewardsWereAddedThisCheck) {
    localStorage.setItem('completedUnclaimedTaskTierIds', JSON.stringify(completedUnclaimed));
    sessionStorage.removeItem('newRewardsToastShownThisSession');
  }
  return { newCompletedUnclaimedTierIds: completedUnclaimed, newRewardsWereAdded: newRewardsWereAddedThisCheck };
}
