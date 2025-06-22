
/**
 * @fileOverview Utility functions for task management.
 *
 * - checkAndNotifyTaskCompletion - Checks for task completion and shows notifications.
 */

import type { Task } from '@/types/tasks';
import type { Toast } from "@/hooks/use-toast";
import { CheckCircle2 } from 'lucide-react';
import React from 'react';
import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';


export function checkAndNotifyTaskCompletion(
  currentProgress: Record<string, number>,
  allTasks: Task[],
  claimedTierIds: string[],
  completedUnclaimedTaskTierIds: string[],
  toastFn: (props: Toast) => void,
  showNewTaskCompletedToast: boolean = true
): { newCompletedUnclaimedTierIds: string[], newRewardsWereAdded: boolean } {
  let newUnclaimedIds = [...completedUnclaimedTaskTierIds];
  let newRewardsWereAddedThisCheck = false;

  allTasks.forEach(task => {
    task.tiers.forEach(tier => {
      const progressVal = currentProgress[tier.progressKey || ''] || 0;
      if (progressVal >= tier.target) {
        if (!newUnclaimedIds.includes(tier.id) && !claimedTierIds.includes(tier.id)) {
          newUnclaimedIds.push(tier.id);
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
    // We don't save to Firestore here anymore, the calling function is responsible for saving its state.
    // This function now just returns the new state.
    sessionStorage.removeItem('newRewardsToastShownThisSession');
  }

  return { newCompletedUnclaimedTierIds: newUnclaimedIds, newRewardsWereAdded: newRewardsWereAddedThisCheck };
}

    