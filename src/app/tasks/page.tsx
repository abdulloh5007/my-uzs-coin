
"use client";

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TaskCard from '@/components/tasks/TaskCard';
import type { Task } from '@/types/tasks';
import BottomNavBar from '@/components/BottomNavBar';
import { Coins, MousePointerClick, Clock, ShieldCheck, Trophy } from 'lucide-react'; // Added more icons

// Mock Data - In a real app, this would come from a backend or state management
const mockDailyTasks: Task[] = [
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
    stars: 2, // Task rating
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
    stars: 1, // Task rating
    type: 'daily',
    tiers: [
      { id: 'd-active-1', description: 'Провести в игре 5 минут', target: 300, reward: 20 }, // 300 seconds
      { id: 'd-active-2', description: 'Провести в игре 15 минут', target: 900, reward: 60 }, // 900 seconds
      { id: 'd-active-3', description: 'Провести в игре 30 минут', target: 1800, reward: 120 }, // 1800 seconds
    ],
  },
];

const mockMainTasks: Task[] = [
    {
    id: 'main-reach-silver',
    title: 'Достичь Серебряной лиги',
    icon: ShieldCheck, // Example icon
    iconColorClass: 'text-slate-400',
    iconBgClass: 'bg-slate-500/20',
    subtitle: 'Основное задание • Повышайте свой ранг',
    stars: 2,
    type: 'main',
    tiers: [
      { id: 'm-silver-1', description: 'Накопить 100,000 монет', target: 100000, reward: 1000 },
    ],
  },
];

const mockLeagueTasks: Task[] = [
  {
    id: 'league-gold-spender',
    title: 'Трата в Золотой лиге',
    icon: Trophy, // Example icon
    iconColorClass: 'text-yellow-500',
    iconBgClass: 'bg-yellow-600/20',
    subtitle: 'Задание лиги • Только для Золотой лиги',
    stars: 3,
    type: 'league',
    tiers: [
      { id: 'l-gold-1', description: 'Потратить 50,000 монет на улучшения', target: 50000, reward: 2500 },
    ],
  },
];


// Mock user progress - this would typically come from game state / localStorage / backend
const mockUserProgress: Record<string, number> = {
  'd-click-1': 300, // Completed
  'd-click-2': 300, // Completed
  'd-click-3': 300, // Completed
  'd-coin-1': 279, // Completed (target 100)
  'd-coin-2': 279, // In progress for target 500
  'd-coin-3': 279, // Not started effectively for target 1000
  'd-active-1': 600, // 10 minutes played (target 5 min) - Completed
  'd-active-2': 600, // In progress for target 15 min
  'm-silver-1': 75000, // Example progress for a main task
  'l-gold-1': 10000,   // Example progress for a league task
};


export default function TasksPage() {
  const [activeTab, setActiveTab] = useState<string>("daily");

  const tasksToDisplay = () => {
    switch (activeTab) {
      case "daily":
        return mockDailyTasks;
      case "main":
        return mockMainTasks; // Placeholder
      case "league":
        return mockLeagueTasks; // Placeholder
      default:
        return [];
    }
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
      <BottomNavBar />
    </div>
  );
}
