
"use client";

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TaskCard from '@/components/tasks/TaskCard';
import type { Task } from '@/types/tasks';
import BottomNavBar from '@/components/BottomNavBar';
import { Coins, MousePointerClick, Clock, ShieldCheck, Trophy, Star, Gem, Palette, Wand2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Helper to get current date string in YYYY-MM-DD format
const getCurrentDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const day = today.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const initialDailyTasks: Task[] = [
  {
    id: 'daily-click-master',
    title: 'Кликер мастер',
    icon: MousePointerClick,
    iconColorClass: 'text-blue-400',
    iconBgClass: 'bg-blue-500/20',
    subtitle: 'Ежедневное задание • Сбрасывается каждый день',
    stars: 3,
    type: 'daily',
    tiers: [
      { id: 'd-click-1', description: 'Сделать 50 кликов', target: 50, reward: 30, progressKey: 'daily_clicks' },
      { id: 'd-click-2', description: 'Сделать 150 кликов', target: 150, reward: 80, progressKey: 'daily_clicks' },
      { id: 'd-click-3', description: 'Сделать 300 кликов', target: 300, reward: 150, progressKey: 'daily_clicks' },
    ],
  },
  {
    id: 'daily-coin-collector',
    title: 'Коллекционер монет',
    icon: Coins,
    iconColorClass: 'text-yellow-400',
    iconBgClass: 'bg-yellow-500/20',
    subtitle: 'Ежедневное задание • Сбрасывается каждый день',
    stars: 3,
    type: 'daily',
    tiers: [
      { id: 'd-coin-1', description: 'Собрать 100 монет', target: 100, reward: 50, progressKey: 'daily_coinsCollected' },
      { id: 'd-coin-2', description: 'Собрать 500 монет', target: 500, reward: 200, progressKey: 'daily_coinsCollected' },
      { id: 'd-coin-3', description: 'Собрать 1000 монет', target: 1000, reward: 400, progressKey: 'daily_coinsCollected' },
    ],
  },
  {
    id: 'daily-active-player',
    title: 'Активный игрок',
    icon: Clock,
    iconColorClass: 'text-purple-400',
    iconBgClass: 'bg-purple-500/20',
    subtitle: 'Ежедневное задание • Сбрасывается каждый день',
    stars: 3,
    type: 'daily',
    tiers: [
      { id: 'd-active-1', description: 'Провести в игре 5 минут', target: 300, reward: 20, progressKey: 'daily_timePlayedSeconds' }, // 5 min = 300s
      { id: 'd-active-2', description: 'Провести в игре 15 минут', target: 900, reward: 60, progressKey: 'daily_timePlayedSeconds' }, // 15 min = 900s
      { id: 'd-active-3', description: 'Провести в игре 30 минут', target: 1800, reward: 120, progressKey: 'daily_timePlayedSeconds' }, // 30 min = 1800s
    ],
  },
];

const initialMainTasks: Task[] = [
  {
    id: 'main-emerald-collector',
    title: 'Изумрудный коллекционер',
    icon: Palette,
    iconColorClass: 'text-green-400',
    iconBgClass: 'bg-green-500/20',
    subtitle: 'Основное задание • Коллекционируйте скины',
    stars: 1,
    type: 'main',
    tiers: [
      { id: 'm-emerald-1', description: 'Купить изумрудный скин', target: 1, reward: 1000, progressKey: 'ownedSkin_emerald' },
    ],
  },
  {
    id: 'main-skin-collector',
    title: 'Коллекционер скинов',
    icon: Trophy,
    iconColorClass: 'text-yellow-400',
    iconBgClass: 'bg-yellow-500/20',
    subtitle: 'Основное задание • Соберите их все',
    stars: 3,
    type: 'main',
    tiers: [
      { id: 'm-skins-1', description: 'Иметь 3 скина', target: 3, reward: 10000, progressKey: 'ownedSkins_length' },
      { id: 'm-skins-2', description: 'Иметь 5 скинов', target: 5, reward: 20000, progressKey: 'ownedSkins_length' },
      { id: 'm-skins-3', description: 'Иметь 6 скинов', target: 6, reward: 50000, progressKey: 'ownedSkins_length' },
    ],
  },
  {
    id: 'main-rainbow-skin-purchase',
    title: 'Покупка радужного скина',
    icon: Wand2, 
    iconColorClass: 'text-indigo-400',
    iconBgClass: 'bg-indigo-500/20',
    subtitle: 'Основное задание • Самый яркий скин',
    stars: 1,
    type: 'main',
    tiers: [
      { id: 'm-rainbow-1', description: 'Купить радужный скин', target: 1, reward: 30000, progressKey: 'ownedSkin_rainbow' },
    ],
  },
];

const initialLeagueTasks: Task[] = [
  {
    id: 'league-silver-milestone',
    title: 'Серебряная лига',
    icon: Star,
    iconColorClass: 'text-slate-400',
    iconBgClass: 'bg-slate-500/20',
    subtitle: 'Цель: Собрать 100,000 монет',
    stars: 1,
    type: 'league',
    tiers: [
      { id: 'l-silver-m1', description: 'Собрать 100,000 монет', target: 100000, reward: 10000, progressKey: 'userScore' },
    ],
  },
  {
    id: 'league-gold-milestone',
    title: 'Золотая лига',
    icon: Trophy, 
    iconColorClass: 'text-yellow-400',
    iconBgClass: 'bg-yellow-500/20',
    subtitle: 'Цель: Собрать 500,000 монет',
    stars: 1,
    type: 'league',
    tiers: [
      { id: 'l-gold-m1', description: 'Собрать 500,000 монет', target: 500000, reward: 50000, progressKey: 'userScore' },
    ],
  },
  {
    id: 'league-platinum-milestone',
    title: 'Платиновая лига',
    icon: Gem, 
    iconColorClass: 'text-cyan-400',
    iconBgClass: 'bg-cyan-500/20',
    subtitle: 'Цель: Собрать 2,000,000 монет',
    stars: 1,
    type: 'league',
    tiers: [
      { id: 'l-platinum-m1', description: 'Собрать 2,000,000 монет', target: 2000000, reward: 200000, progressKey: 'userScore' },
    ],
  },
  {
    id: 'league-diamond-milestone',
    title: 'Алмазная лига',
    icon: Gem, 
    iconColorClass: 'text-blue-400', 
    iconBgClass: 'bg-blue-500/20',
    subtitle: 'Цель: Собрать 10,000,000 монет',
    stars: 1,
    type: 'league',
    tiers: [
      { id: 'l-diamond-m1', description: 'Собрать 10,000,000 монет', target: 10000000, reward: 1000000, progressKey: 'userScore' },
    ],
  },
];


export default function TasksPage() {
  const [activeTab, setActiveTab] = useState<string>("daily");
  const router = useRouter();
  const [userProgress, setUserProgress] = useState<Record<string, number>>({});
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
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
      // If dates mismatch, ensure daily stats are reset in localStorage
      // This primarily acts as a safeguard if HomePage hasn't run yet on a new day
      localStorage.setItem('daily_lastResetDate', currentDateStr);
      localStorage.setItem('daily_clicks', '0');
      localStorage.setItem('daily_coinsCollected', '0');
      localStorage.setItem('daily_timePlayedSeconds', '0');
    }

    const currentScore = parseInt(localStorage.getItem('userScore') || '0', 10);
    const ownedSkinsRaw = localStorage.getItem('ownedSkins');
    const ownedSkinsArray: string[] = ownedSkinsRaw ? JSON.parse(ownedSkinsRaw) : ['classic'];
    
    const newProgress: Record<string, number> = {};

    // Populate progress for daily tasks
    newProgress['daily_clicks'] = dailyClicks;
    newProgress['daily_coinsCollected'] = dailyCoinsCollected;
    newProgress['daily_timePlayedSeconds'] = dailyTimePlayedSeconds;
    
    // Populate progress for main tasks
    newProgress['ownedSkin_emerald'] = ownedSkinsArray.includes('emerald') ? 1 : 0;
    newProgress['ownedSkin_rainbow'] = ownedSkinsArray.includes('rainbow') ? 1 : 0;
    newProgress['ownedSkins_length'] = ownedSkinsArray.length;

    // Populate progress for league tasks
    newProgress['userScore'] = currentScore;

    setUserProgress(newProgress);

  }, [activeTab]); // Re-calculate progress if tab changes, or on initial load. Could be refined.

  const handleNavigation = (path: string) => {
    router.push(path);
  };
  
  if (!isClient) {
    return null; // Or a loading spinner
  }

  // Function to get current progress for a specific tier
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
      <BottomNavBar onNavigate={handleNavigation} />
    </div>
  );
}
