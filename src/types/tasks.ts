
import type { LucideIcon } from 'lucide-react';

export interface TaskTier {
  id: string;
  description: string;
  target: number;
  reward: number;
  progressKey?: string; // Key to look up in the userProgress object
  // currentProgress and isCompleted will be determined dynamically in the component
}

export interface Task {
  id: string;
  title: string;
  icon: LucideIcon;
  iconColorClass?: string; // e.g., 'text-blue-400'
  iconBgClass?: string;   // e.g., 'bg-blue-500/20'
  subtitle: string;
  stars: number; // Rating of the task, e.g., 1, 2, or 3
  tiers: TaskTier[];
  type: 'daily' | 'main' | 'league';
}
