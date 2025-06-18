
import type { LucideIcon } from 'lucide-react';

export interface TaskTier {
  id: string;
  description: string;
  target: number;
  reward: number;
  currentProgress?: number; // Added for convenience, will be populated from mock
  isCompleted?: boolean; // Added for convenience, will be populated from mock
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
