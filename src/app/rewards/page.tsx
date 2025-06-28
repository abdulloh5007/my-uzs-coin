
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Gift, CheckCircle2, Coins, History, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Task, TaskTier } from '@/types/tasks';
import { initialDailyTasks, initialMainTasks, initialLeagueTasks } from '@/data/tasks';
import RewardCard from '@/components/rewards/RewardCard';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import AppLayout from '@/components/AppLayout';
import { Skeleton } from '@/components/ui/skeleton';


export interface DisplayableReward {
  id: string; // tier.id
  parentTask: Task;
  tier: TaskTier;
  isClaimed: boolean;
}

interface RewardsState {
    score: number;
    totalScoreCollected: number;
    completedUnclaimedTaskTierIds: string[];
    claimedTaskTierIds: string[];
}

export default function RewardsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { currentUser, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  const [availableRewards, setAvailableRewards] = useState<DisplayableReward[]>([]);
  const [claimedRewardsList, setClaimedRewardsList] = useState<DisplayableReward[]>([]);
  const [rewardsState, setRewardsState] = useState<RewardsState>({
      score: 0,
      totalScoreCollected: 0,
      completedUnclaimedTaskTierIds: [],
      claimedTaskTierIds: [],
  });

  const allPossibleTasks = useMemo<Task[]>(() => {
    return [...initialDailyTasks, ...initialMainTasks, ...initialLeagueTasks];
  }, []);

  const processRewards = useCallback((state: RewardsState) => {
    const newAvailableRewards: DisplayableReward[] = [];
    const newClaimedRewards: DisplayableReward[] = [];

    allPossibleTasks.forEach(task => {
      task.tiers.forEach(tier => {
        if (state.claimedTaskTierIds.includes(tier.id)) {
          newClaimedRewards.push({ id: tier.id, parentTask: task, tier, isClaimed: true });
        } else if (state.completedUnclaimedTaskTierIds.includes(tier.id)) {
          newAvailableRewards.push({ id: tier.id, parentTask: task, tier, isClaimed: false });
        }
      });
    });

    setAvailableRewards(newAvailableRewards);
    setClaimedRewardsList(newClaimedRewards);
  }, [allPossibleTasks]);

  const loadRewardsData = useCallback(async (userId: string) => {
    setIsLoading(true);
    try {
      const userDocRef = doc(db, 'users', userId);
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const currentState = {
            score: data.score || 0,
            totalScoreCollected: data.totalScoreCollected || data.score || 0,
            completedUnclaimedTaskTierIds: data.completedUnclaimedTaskTierIds || [],
            claimedTaskTierIds: data.claimedTaskTierIds || [],
        };
        setRewardsState(currentState);
        processRewards(currentState);
      }
    } catch (error) {
      console.error("Error loading rewards data:", error);
      toast({ variant: "destructive", title: "Ошибка", description: "Не удалось загрузить данные о наградах." });
    } finally {
        setIsLoading(false);
    }
  }, [processRewards, toast]);
  
  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
    } else if (currentUser) {
      loadRewardsData(currentUser.uid);
    }
  }, [currentUser, authLoading, router, loadRewardsData]);


  const handleClaimReward = async (tierId: string, rewardAmount: number) => {
    if (!currentUser) return;
    
    const newScore = rewardsState.score + rewardAmount;
    const newTotalScore = rewardsState.totalScoreCollected + rewardAmount;
    const updatedCompletedUnclaimed = rewardsState.completedUnclaimedTaskTierIds.filter(id => id !== tierId);
    const updatedClaimed = [...rewardsState.claimedTaskTierIds, tierId];

    // Optimistic UI update
    const newState: RewardsState = {
        score: newScore,
        totalScoreCollected: newTotalScore,
        completedUnclaimedTaskTierIds: updatedCompletedUnclaimed,
        claimedTaskTierIds: updatedClaimed
    };
    setRewardsState(newState);
    processRewards(newState);

    sessionStorage.removeItem('newRewardsToastShownThisSession'); 

    try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        await setDoc(userDocRef, {
            score: newScore,
            totalScoreCollected: newTotalScore,
            completedUnclaimedTaskTierIds: updatedCompletedUnclaimed,
            claimedTaskTierIds: updatedClaimed,
            lastUpdated: serverTimestamp()
        }, { merge: true });

        toast({
            title: "Награда получена!",
            description: `+${rewardAmount.toLocaleString()} монет добавлено к вашему балансу.`,
        });
    } catch (error) {
        console.error("Error claiming reward:", error);
        toast({ variant: "destructive", title: "Ошибка", description: "Не удалось сохранить получение награды." });
        // Revert UI on error
        loadRewardsData(currentUser.uid);
    }
  };

  if (authLoading || isLoading) {
    return (
      <AppLayout activeItem="/rewards" contentClassName="text-center">
        <Skeleton className="h-10 w-48 mx-auto mb-6" />

        <div className="flex justify-center items-center gap-6 mb-8">
          <Skeleton className="h-10 w-36 rounded-lg" />
          <Skeleton className="h-10 w-36 rounded-lg" />
        </div>
        
        <div className="max-w-2xl mx-auto text-left">
          <Skeleton className="h-8 w-56 mb-4" />
          <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="bg-card/90 border-border/60">
                      <CardContent className="p-4 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 flex-1">
                              <Skeleton className="w-12 h-12 rounded-full" />
                              <div className="flex-1 space-y-2">
                                  <Skeleton className="h-5 w-48" />
                                  <Skeleton className="h-4 w-32" />
                              </div>
                          </div>
                          <Skeleton className="h-9 w-28 rounded-md" />
                      </CardContent>
                  </Card>
              ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  const totalAvailable = availableRewards.length;
  const totalClaimed = claimedRewardsList.length;

  return (
    <AppLayout activeItem="/rewards" contentClassName="text-center">
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
    </AppLayout>
  );
}
