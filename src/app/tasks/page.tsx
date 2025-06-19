
"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TaskCard from '@/components/tasks/TaskCard';
import type { Task } from '@/types/tasks';
import BottomNavBar from '@/components/BottomNavBar';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast'; 
import { initialDailyTasks, initialMainTasks, initialLeagueTasks } from '@/data/tasks';
import { checkAndNotifyTaskCompletion } from '@/lib/taskUtils';

const getCurrentDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const day = today.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function TasksPage() {
  const [activeTab, setActiveTab] = useState<string>("daily");
  const router = useRouter();
  const { toast } = useToast();
  const [userProgress, setUserProgress] = useState<Record<string, number>>({});
  const [isClient, setIsClient] = useState(false);

  const allTasks = useMemo<Task[]>(() => {
    return [...initialDailyTasks, ...initialMainTasks, ...initialLeagueTasks];
  }, []);


  const loadAndCheckTasks = useCallback(() => {
    if (!isClient) return;

    const currentDateStr = getCurrentDateString();
    const storedLastResetDate = localStorage.getItem('daily_lastResetDate');

    let dailyClicks = 0;
    let dailyCoinsCollected = 0;
    let dailyTimePlayedSeconds = 0;

    if (storedLastResetDate === currentDateStr) {
      dailyClicks = parseInt(localStorage.getItem('daily_clicks') || '0', 10);
      dailyCoinsCollected = parseInt(localStorage.getItem('daily_coinsCollected') || '0', 10);
      dailyTimePlayedSeconds = parseInt(localStorage.getItem('daily_timePlayedSeconds') || '0', 10);
    } else {
      localStorage.setItem('daily_lastResetDate', currentDateStr);
      localStorage.setItem('daily_clicks', '0');
      localStorage.setItem('daily_coinsCollected', '0');
      localStorage.setItem('daily_timePlayedSeconds', '0');
      
      const dailyTierIds = new Set<string>();
      initialDailyTasks.forEach(task => task.tiers.forEach(tier => dailyTierIds.add(tier.id)));

      let completedUnclaimed = JSON.parse(localStorage.getItem('completedUnclaimedTaskTierIds') || '[]') as string[];
      completedUnclaimed = completedUnclaimed.filter(id => !dailyTierIds.has(id));
      localStorage.setItem('completedUnclaimedTaskTierIds', JSON.stringify(completedUnclaimed));
      
      let claimed = JSON.parse(localStorage.getItem('claimedTaskTierIds') || '[]') as string[];
      claimed = claimed.filter(id => !dailyTierIds.has(id));
      localStorage.setItem('claimedTaskTierIds', JSON.stringify(claimed));
    }

    const currentScore = parseInt(localStorage.getItem('userScore') || '0', 10);
    const ownedSkinsRaw = localStorage.getItem('ownedSkins');
    const ownedSkinsArray: string[] = ownedSkinsRaw ? JSON.parse(ownedSkinsRaw) : ['classic'];
    
    const newProgress: Record<string, number> = {
      daily_clicks: dailyClicks,
      daily_coinsCollected: dailyCoinsCollected,
      daily_timePlayedSeconds: dailyTimePlayedSeconds,
      ownedSkin_emerald: ownedSkinsArray.includes('emerald') ? 1 : 0,
      ownedSkin_rainbow: ownedSkinsArray.includes('rainbow') ? 1 : 0,
      ownedSkins_length: ownedSkinsArray.length,
      userScore: currentScore,
    };
    setUserProgress(newProgress);

    checkAndNotifyTaskCompletion(newProgress, allTasks, toast);

  }, [isClient, allTasks, toast]);


  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      loadAndCheckTasks();
    }
  }, [isClient, activeTab, loadAndCheckTasks]); 


  const handleNavigation = (path: string) => {
    router.push(path);
  };
  
  if (!isClient) {
    return null; 
  }

  const getTierProgress = (progressKey?: string): number => {
    if (!progressKey) return 0;
    return userProgress[progressKey] || 0;
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-indigo-900/50 text-foreground font-body antialiased selection:bg-primary selection:text-primary-foreground">
      <div className="flex-grow container mx-auto px-4 py-8 pt-10 md:pt-16">
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
                <TaskCard key={task.id} task={task} userTierProgressGetter={getTierProgress} />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="main">
             <div className="space-y-6">
              {initialMainTasks.length > 0 ? initialMainTasks.map(task => (
                <TaskCard key={task.id} task={task} userTierProgressGetter={getTierProgress} />
              )) : (
                <p className="text-center text-muted-foreground py-8">Основные задания скоро появятся!</p>
              )}
            </div>
          </TabsContent>
          <TabsContent value="league">
            <div className="space-y-6">
                {initialLeagueTasks.length > 0 ? initialLeagueTasks.map(task => (
                    <TaskCard key={task.id} task={task} userTierProgressGetter={getTierProgress} />
                )) : (
                    <p className="text-center text-muted-foreground py-8">Задания лиг появятся по мере вашего продвижения!</p>
                )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <BottomNavBar onNavigate={handleNavigation} activeItem="/tasks" />
    </div>
  );
}

