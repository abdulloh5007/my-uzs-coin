
import type { Task } from '@/types/tasks';
import { Coins, MousePointerClick, Clock, ShieldCheck, Trophy, Star, Gem, Palette, Wand2 } from 'lucide-react';

export const initialDailyTasks: Task[] = [
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
    stars: 3, // Updated from 2 to 3
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
    stars: 3, // Updated from 1 to 3
    type: 'daily',
    tiers: [
      { id: 'd-active-1', description: 'Провести в игре 5 минут', target: 300, reward: 20, progressKey: 'daily_timePlayedSeconds' }, 
      { id: 'd-active-2', description: 'Провести в игре 15 минут', target: 900, reward: 60, progressKey: 'daily_timePlayedSeconds' }, 
      { id: 'd-active-3', description: 'Провести в игре 30 минут', target: 1800, reward: 120, progressKey: 'daily_timePlayedSeconds' }, 
    ],
  },
];

export const initialMainTasks: Task[] = [
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

export const initialLeagueTasks: Task[] = [
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
