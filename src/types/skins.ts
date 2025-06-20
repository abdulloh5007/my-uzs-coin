
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
  coinColorClass: string;         // e.g., 'bg-yellow-500' or 'fill-emerald-500' for SVGs
  coinIconColorClass: string;     // e.g., 'text-white' for the Coins icon
  pageGradientFromClass: string;  // e.g., 'from-purple-800'
  pageGradientToClass: string;    // e.g., 'to-indigo-900'
  coinShapeComponent?: React.FC<{ shapeFillClass?: string; iconClass?: string; className?: string; }>; // For custom SVG coin shapes
}
