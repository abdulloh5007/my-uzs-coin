
import type { LucideIcon } from 'lucide-react';
import type React from 'react';

export interface Skin {
  id: string;
  name: string;
  // For SkinCard display
  iconComponent: LucideIcon | React.FC<React.SVGProps<SVGSVGElement>>;
  iconColorClass: string; 
  iconBgClass: string;    
  cardBgClass: string;    
  price: number;
  isOwned?: boolean;
  isSelected?: boolean;

  // New properties for HomePage styling
  coinColorClass: string;         // e.g., 'bg-yellow-500' or 'bg-gradient-to-r from-red-500 to-blue-500'
  coinIconColorClass: string;     // e.g., 'text-white' for the Coins icon on the clickable coin
  pageGradientFromClass: string;  // e.g., 'from-purple-800'
  pageGradientToClass: string;    // e.g., 'to-indigo-900'
}
