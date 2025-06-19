
"use client";

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TaskCard from '@/components/tasks/TaskCard';
import type { Task } from '@/types/tasks';
import BottomNavBar from '@/components/BottomNavBar';
import { Coins, MousePointerClick, Clock, ShieldCheck, Trophy, Star, Gem, Palette, Wand2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

const mockDailyTasks: Task[] = [
  {
    id: 'daily-click-master',
    title: 'Кликер мастер',
    icon: MousePointerClick,
    iconColorClass: 'text-blue-400',
    iconBgClass: 'bg-blue-500/20',
    subtitle: 'Ежедневное задание • Сбрасывается каждый день',
    stars: 3, // Already 3
    type: 'daily',
    tiers: [
      { id: 'd-click-1', description: 'Сделать 50 кликов', target: 50, reward: 30 },
      { id: 'd-click-2', description: 'Сделать 150 кликов', target: 150, reward: 80 },
      { id: 'd-click-3', description: 'Сделать 300 кликов', target: 300, reward: 150 },
    ],
  },
  {
    id: 'daily-coin-collector',
    title: 'Коллекционер монет',
    icon: Coins,
    iconColorClass: 'text-yellow-400',
    iconBgClass: 'bg-yellow-500/20',
    subtitle: 'Ежедневное задание • Сбрасывается каждый день',
    stars: 3, // Changed from 2 to 3
    type: 'daily',
    tiers: [
      { id: 'd-coin-1', description: 'Собрать 100 монет', target: 100, reward: 50 },
      { id: 'd-coin-2', description: 'Собрать 500 монет', target: 500, reward: 200 },
      { id: 'd-coin-3', description: 'Собрать 1000 монет', target: 1000, reward: 400 },
    ],
  },
  {
    id: 'daily-active-player',
    title: 'Активный игрок',
    icon: Clock,
    iconColorClass: 'text-purple-400',
    iconBgClass: 'bg-purple-500/20',
    subtitle: 'Ежедневное задание • Сбрасывается каждый день',
    stars: 3, // Changed from 1 to 3
    type: 'daily',
    tiers: [
      { id: 'd-active-1', description: 'Провести в игре 5 минут', target: 300, reward: 20 },
      { id: 'd-active-2', description: 'Провести в игре 15 минут', target: 900, reward: 60 },
      { id: 'd-active-3', description: 'Провести в игре 30 минут', target: 1800, reward: 120 },
    ],
  },
];

const mockMainTasks: Task[] = [
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
      { id: 'm-emerald-1', description: 'Купить изумрудный скин', target: 1, reward: 1000 },
    ],
  },
  {
    id: 'main-skin-collector',
    title: 'Коллекционер скинов',
    icon: Trophy,
    iconColorClass: 'text-yellow-400',
    iconBgClass: 'bg-yellow-500/20',
    subtitle: 'Основное задание • Соберите их все',
    stars: 3, // Already 3
    type: 'main',
    tiers: [
      { id: 'm-skins-1', description: 'Иметь 3 скина', target: 3, reward: 10000 },
      { id: 'm-skins-2', description: 'Иметь 5 скинов', target: 5, reward: 20000 },
      { id: 'm-skins-3', description: 'Иметь 6 скинов', target: 6, reward: 50000 },
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
      { id: 'm-rainbow-1', description: 'Купить радужный скин', target: 1, reward: 30000 },
    ],
  },
];

const mockLeagueTasks: Task[] = [
  {
    id: 'league-silver-milestone',
    title: 'Серебряная лига',
    icon: Star,
    iconColorClass: 'text-slate-400',
    iconBgClass: 'bg-slate-500/20',
    subtitle: 'Цель: Собрать 100,000 монет',
    stars: 1, // League tasks typically show 1 outline star by design
    type: 'league',
    tiers: [
      { id: 'l-silver-m1', description: 'Собрать 100,000 монет', target: 100000, reward: 10000 },
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
      { id: 'l-gold-m1', description: 'Собрать 500,000 монет', target: 500000, reward: 50000 },
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
      { id: 'l-platinum-m1', description: 'Собрать 2,000,000 монет', target: 2000000, reward: 200000 },
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
      { id: 'l-diamond-m1', description: 'Собрать 10,000,000 монет', target: 10000000, reward: 1000000 },
    ],
  },
];


const mockUserProgress: Record<string, number> = {
  'd-click-1': 300, // Completed tier 1, 2, 3
  'd-click-2': 300,
  'd-click-3': 300,
  'd-coin-1': 279,  // Tier 1 completed (100), Tier 2 (500) & 3 (1000) not
  'd-coin-2': 279,
  'd-coin-3': 279,
  'd-active-1': 600, // Tier 1 completed (300), Tier 2 (900) & 3 (1800) not
  'd-active-2': 600, 
  'd-active-3': 600,
  'l-silver-m1': 279, 
  'l-gold-m1': 279,
  'l-platinum-m1': 279,
  'l-diamond-m1': 279,
  'm-emerald-1': 0, 
  'm-skins-1': 2,   
  'm-skins-2': 2,   
  'm-skins-3': 2,   
  'm-rainbow-1': 0, 
};


export default function TasksPage() {
  const [activeTab, setActiveTab] = useState<string>("daily");
  const router = useRouter();

  const handleNavigation = (path: string) => {
    router.push(path);
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
              {mockDailyTasks.map(task => (
                <TaskCard key={task.id} task={task} userProgress={mockUserProgress} />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="main">
             <div className="space-y-6">
              {mockMainTasks.length > 0 ? mockMainTasks.map(task => (
                <TaskCard key={task.id} task={task} userProgress={mockUserProgress} />
              )) : (
                <p className="text-center text-muted-foreground py-8">Основные задания скоро появятся!</p>
              )}
            </div>
          </TabsContent>
          <TabsContent value="league">
            <div className="space-y-6">
                {mockLeagueTasks.length > 0 ? mockLeagueTasks.map(task => (
                    <TaskCard key={task.id} task={task} userProgress={mockUserProgress} />
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

