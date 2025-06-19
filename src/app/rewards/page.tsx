
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import BottomNavBar from '@/components/BottomNavBar';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gift, CheckCircle2, Coins, History } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Task, TaskTier } from '@/types/tasks';
import { initialDailyTasks, initialMainTasks, initialLeagueTasks } from '@/data/tasks';
import RewardCard from '@/components/rewards/RewardCard';

const getCurrentDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const day = today.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export interface DisplayableReward {
  id: string; // tier.id
  parentTask: Task;
  tier: TaskTier;
  isClaimed: boolean;
}

export default function RewardsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  const [availableRewards, setAvailableRewards] = useState<DisplayableReward[]>([]);
  const [claimedRewardsList, setClaimedRewardsList] = useState<DisplayableReward[]>([]);
  const [userScore, setUserScore] = useState(0);

  const allPossibleTasks = useMemo<Task[]>(() => {
    return [...initialDailyTasks, ...initialMainTasks, ...initialLeagueTasks];
  }, []);

  const loadAndProcessRewards = useCallback(() => {
    if (!isClient) return;

    const currentScore = parseInt(localStorage.getItem('userScore') || '0', 10);
    setUserScore(currentScore);

    const currentDateStr = getCurrentDateString();
    const storedLastResetDate = localStorage.getItem('daily_lastResetDate');

    let completedUnclaimedTierIds = JSON.parse(localStorage.getItem('completedUnclaimedTaskTierIds') || '[]') as string[];
    let claimedTierIds = JSON.parse(localStorage.getItem('claimedTaskTierIds') || '[]') as string[];

    if (storedLastResetDate !== currentDateStr) {
      localStorage.setItem('daily_lastResetDate', currentDateStr);
      localStorage.setItem('daily_clicks', '0');
      localStorage.setItem('daily_coinsCollected', '0');
      localStorage.setItem('daily_timePlayedSeconds', '0');

      const dailyTierIdsSet = new Set<string>();
      initialDailyTasks.forEach(task => task.tiers.forEach(tier => dailyTierIdsSet.add(tier.id)));

      completedUnclaimedTierIds = completedUnclaimedTierIds.filter(id => !dailyTierIdsSet.has(id));
      localStorage.setItem('completedUnclaimedTaskTierIds', JSON.stringify(completedUnclaimedTierIds));
      
      claimedTierIds = claimedTierIds.filter(id => !dailyTierIdsSet.has(id));
      localStorage.setItem('claimedTaskTierIds', JSON.stringify(claimedTierIds));
    }
    
    const newAvailableRewards: DisplayableReward[] = [];
    const newClaimedRewards: DisplayableReward[] = [];

    allPossibleTasks.forEach(task => {
      task.tiers.forEach(tier => {
        if (claimedTierIds.includes(tier.id)) {
          newClaimedRewards.push({ id: tier.id, parentTask: task, tier, isClaimed: true });
        } else if (completedUnclaimedTierIds.includes(tier.id)) {
          newAvailableRewards.push({ id: tier.id, parentTask: task, tier, isClaimed: false });
        }
      });
    });

    setAvailableRewards(newAvailableRewards);
    setClaimedRewardsList(newClaimedRewards);

  }, [isClient, allPossibleTasks]);


  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) { // Ensure loadAndProcessRewards is called only when client is ready
      loadAndProcessRewards();
    }
  }, [isClient, loadAndProcessRewards]);


  const handleClaimReward = (tierId: string, rewardAmount: number) => {
    const newScore = userScore + rewardAmount;
    setUserScore(newScore);
    localStorage.setItem('userScore', newScore.toString());

    let completedUnclaimed = JSON.parse(localStorage.getItem('completedUnclaimedTaskTierIds') || '[]') as string[];
    completedUnclaimed = completedUnclaimed.filter(id => id !== tierId);
    localStorage.setItem('completedUnclaimedTaskTierIds', JSON.stringify(completedUnclaimed));

    let claimed = JSON.parse(localStorage.getItem('claimedTaskTierIds') || '[]') as string[];
    claimed.push(tierId);
    localStorage.setItem('claimedTaskTierIds', JSON.stringify(claimed));
    
    sessionStorage.removeItem('newRewardsToastShownThisSession'); 

    toast({
      title: "Награда получена!",
      description: `+${rewardAmount} монет добавлено к вашему балансу.`,
    });
    loadAndProcessRewards(); 
  };

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  if (!isClient) {
    return null; 
  }

  const totalAvailable = availableRewards.length;
  const totalClaimed = claimedRewardsList.length;

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-indigo-900/50 text-foreground font-body antialiased selection:bg-primary selection:text-primary-foreground">
      <div className="flex-grow container mx-auto px-4 py-8 pt-10 md:pt-16 text-center">
        <h1 className="text-4xl font-bold mb-6">Награды</h1>

        <div className="flex justify-center items-center gap-6 mb-8 text-sm">
          <div className="flex items-center p-2 bg-card/80 rounded-lg shadow">
            <Gift className="w-5 h-5 mr-2 text-primary" />
            <span className="text-muted-foreground">Доступно: </span>
            <span className="font-semibold text-primary ml-1">{totalAvailable}</span>
          </div>
          <div className="flex items-center p-2 bg-card/80 rounded-lg shadow">
            <History className="w-5 h-5 mr-2 text-green-500" />
            <span className="text-muted-foreground">Получено: </span>
            <span className="font-semibold text-green-500 ml-1">{totalClaimed}</span>
          </div>
        </div>
        
        {totalAvailable === 0 && totalClaimed === 0 && (
            <p className="text-muted-foreground text-center py-10">Пока нет доступных или полученных наград. Выполняйте задания!</p>
        )}

        {totalAvailable > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-left text-primary">Забрать награды</h2>
            <div className="space-y-4 max-w-2xl mx-auto">
              {availableRewards.map(reward => (
                <RewardCard key={reward.id} reward={reward} onClaim={handleClaimReward} />
              ))}
            </div>
          </div>
        )}

        {totalClaimed > 0 && (
          <div>
            <h2 className="text-2xl font-semibold mb-4 text-left text-green-500">Полученные награды</h2>
            <div className="space-y-4 max-w-2xl mx-auto">
              {claimedRewardsList.map(reward => (
                <RewardCard key={reward.id} reward={reward} onClaim={() => {}} />
              ))}
            </div>
          </div>
        )}
      </div>
      <BottomNavBar onNavigate={handleNavigation} activeItem="/rewards" />
    </div>
  );
}
