
import type { LucideIcon } from 'lucide-react';
import type React from 'react';

export interface Skin {
  id: string;
  name: string;
  // Use a more flexible type for iconComponent to allow both LucideIcon and custom React components
  iconComponent: LucideIcon | React.FC<React.SVGProps<SVGSVGElement>>;
  iconColorClass: string; // For LucideIcon, ignored by custom SVG if it has its own colors
  iconBgClass: string; // Background for the icon container
  cardBgClass: string; // Background for the skin card
  price: number;
  isOwned?: boolean;
  isSelected?: boolean;
}
