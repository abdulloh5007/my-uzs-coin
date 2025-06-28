
"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TaskCard from '@/components/tasks/TaskCard';
import type { Task } from '@/types/tasks';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast'; 
import { initialDailyTasks, initialMainTasks, initialLeagueTasks } from '@/data/tasks';
import { checkAndNotifyTaskCompletion } from '@/lib/taskUtils';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import AppLayout from '@/components/AppLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent } from '@/components/ui/card';


export default function TasksPage() {
  const [activeTab, setActiveTab] = useState<string>("daily");
  const router = useRouter();
  const { toast } = useToast();
  const { currentUser, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  const [userProgress, setUserProgress] = useState<Record<string, number>>({});
  const [completedUnclaimedTaskTierIds, setCompletedUnclaimedTaskTierIds] = useState<string[]>([]);
  const [claimedTaskTierIds, setClaimedTaskTierIds] = useState<string[]>([]);

  const allTasks = useMemo<Task[]>(() => {
    return [...initialDailyTasks, ...initialMainTasks, ...initialLeagueTasks];
  }, []);

  const loadProgress = useCallback(async (userId: string) => {
    setIsLoading(true);
    try {
        const userDocRef = doc(db, 'users', userId);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            const newProgress: Record<string, number> = {
                daily_clicks: data.daily_clicks || 0,
                daily_coinsCollected: data.daily_coinsCollected || 0,
                daily_timePlayedSeconds: data.daily_timePlayedSeconds || 0,
                ownedSkin_emerald: (data.ownedSkins || []).includes('emerald') ? 1 : 0,
                ownedSkin_rainbow: (data.ownedSkins || []).includes('rainbow') ? 1 : 0,
                ownedSkins_length: (data.ownedSkins || []).length,
                userScore: data.score || 0,
                totalScoreCollected: data.totalScoreCollected || data.score || 0,
            };
            setUserProgress(newProgress);
            const unclaimed = data.completedUnclaimedTaskTierIds || [];
            const claimed = data.claimedTaskTierIds || [];
            setCompletedUnclaimedTaskTierIds(unclaimed);
            setClaimedTaskTierIds(claimed);

            // This function checks for new completions based on the loaded progress
            // and updates Firestore if any new tasks are completed.
            const { newRewardsWereAdded } = checkAndNotifyTaskCompletion(
                newProgress,
                allTasks,
                claimed,
                unclaimed,
                toast,
                false // Don't show toasts on this page, only on HomePage
            );

            // If task completion check added new rewards, we might need to re-fetch or update state
            if (newRewardsWereAdded) {
               // The function already saves to Firestore, but local state might need an update
               // For now, a page refresh or re-navigation would show it.
               // A more advanced solution would involve a shared state manager (like Zustand/Redux).
               // For now, the user will see the updates when they visit the Rewards page.
            }

        }
    } catch (error) {
        console.error("Error loading task progress:", error);
        toast({ variant: "destructive", title: "Ошибка", description: "Не удалось загрузить прогресс заданий." });
    } finally {
        setIsLoading(false);
    }
  }, [allTasks, toast]);


  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
    } else if (currentUser) {
      loadProgress(currentUser.uid);
    }
  }, [currentUser, authLoading, router, loadProgress]);
  
  if (authLoading || isLoading) {
    return (
      <AppLayout activeItem="/tasks">
        <Skeleton className="h-10 w-48 mx-auto mb-8" />
        <div className="w-full max-w-2xl mx-auto">
          <Skeleton className="h-10 w-full mb-6" />
          <div className="space-y-6">
              {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="bg-card/80 border-border/50 shadow-lg w-full">
                      <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                  <Skeleton className="w-12 h-12 rounded-full" />
                                  <div className="space-y-2">
                                      <Skeleton className="h-6 w-40" />
                                      <Skeleton className="h-4 w-48" />
                                  </div>
                              </div>
                              <Skeleton className="h-5 w-24" />
                          </div>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-2">
                          <Skeleton className="h-12 w-full" />
                          <Skeleton className="h-12 w-full" />
                      </CardContent>
                  </Card>
              ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  const getTierProgress = (progressKey?: string): number => {
    if (!progressKey) return 0;
    return userProgress[progressKey] || 0;
  };

  return (
    <AppLayout activeItem="/tasks">
      <h1 className="text-4xl font-bold mb-8 text-center">Задания</h1>

      <Tabs defaultValue="daily" className="w-full max-w-2xl mx-auto" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 mb-6 bg-card/80">
          <TabsTrigger value="daily" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Ежедневные</TabsTrigger>
          <TabsTrigger value="main" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Основные</TabsTrigger>
          <TabsTrigger value="league" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Лиги</TabsTrigger>
        </TabsList>

        <TabsContent value="daily">
          <div className="space-y-6">
            {initialDailyTasks.map(task => (
              <TaskCard key={task.id} task={task} userTierProgressGetter={getTierProgress} completedTierIds={[...completedUnclaimedTaskTierIds, ...claimedTaskTierIds]} />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="main">
           <div className="space-y-6">
            {initialMainTasks.length > 0 ? initialMainTasks.map(task => (
              <TaskCard key={task.id} task={task} userTierProgressGetter={getTierProgress} completedTierIds={[...completedUnclaimedTaskTierIds, ...claimedTaskTierIds]} />
            )) : (
              <p className="text-center text-muted-foreground py-8">Основные задания скоро появятся!</p>
            )}
          </div>
        </TabsContent>
        <TabsContent value="league">
          <div className="space-y-6">
              {initialLeagueTasks.length > 0 ? initialLeagueTasks.map(task => (
                  <TaskCard key={task.id} task={task} userTierProgressGetter={getTierProgress} completedTierIds={[...completedUnclaimedTaskTierIds, ...claimedTaskTierIds]}/>
              )) : (
                  <p className="text-center text-muted-foreground py-8">Задания лиг появятся по мере вашего продвижения!</p>
              )}
          </div>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
