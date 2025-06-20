
import type { Skin } from '@/types/skins';
import { Palette as PaletteIcon } from 'lucide-react';
import RainbowPaletteIcon from '@/components/skins/RainbowPaletteIcon';
// Removed EmeraldCoin and DiamondCoin imports

export const initialSkins: Skin[] = [
  {
    id: 'classic',
    name: 'Классическая',
    iconComponent: PaletteIcon,
    iconColorClass: 'text-yellow-400',
    iconBgClass: 'bg-purple-500/40',
    cardBgClass: 'bg-purple-600/30 hover:bg-purple-600/40',
    price: 0,
    coinColorClass: 'bg-primary hover:bg-primary/90',
    coinIconColorClass: 'text-primary-foreground',
    pageGradientFromClass: 'from-background',
    pageGradientToClass: 'to-indigo-900/50',
  },
  {
    id: 'silver',
    name: 'Серебряная',
    iconComponent: PaletteIcon,
    iconColorClass: 'text-slate-300',
    iconBgClass: 'bg-slate-600/40',
    cardBgClass: 'bg-slate-700/30 hover:bg-slate-700/40',
    price: 1000,
    coinColorClass: 'bg-slate-500 hover:bg-slate-600',
    coinIconColorClass: 'text-slate-100',
    pageGradientFromClass: 'from-slate-800',
    pageGradientToClass: 'to-slate-900',
  },
  {
    id: 'ruby',
    name: 'Рубиновая',
    iconComponent: PaletteIcon,
    iconColorClass: 'text-red-300',
    iconBgClass: 'bg-red-600/40',
    cardBgClass: 'bg-red-700/30 hover:bg-red-700/40',
    price: 5000,
    coinColorClass: 'bg-red-600 hover:bg-red-700',
    coinIconColorClass: 'text-red-100',
    pageGradientFromClass: 'from-red-800',
    pageGradientToClass: 'to-red-900',
  },
  {
    id: 'emerald',
    name: 'Изумрудная',
    iconComponent: PaletteIcon,
    iconColorClass: 'text-green-300',
    iconBgClass: 'bg-green-600/40',
    cardBgClass: 'bg-green-700/30 hover:bg-green-700/40',
    price: 10000,
    coinColorClass: 'bg-emerald-500 hover:bg-emerald-600 transition-colors duration-150', // Changed back to bg- class
    coinIconColorClass: 'text-emerald-100',
    pageGradientFromClass: 'from-emerald-800',
    pageGradientToClass: 'to-emerald-900',
    // coinShapeComponent: EmeraldCoin, // Removed
  },
  {
    id: 'diamond',
    name: 'Алмазная',
    iconComponent: PaletteIcon,
    iconColorClass: 'text-blue-300',
    iconBgClass: 'bg-blue-600/40',
    cardBgClass: 'bg-blue-700/30 hover:bg-blue-700/40',
    price: 25000,
    coinColorClass: 'bg-sky-400 hover:bg-sky-500 transition-colors duration-150', // Changed back to bg- class
    coinIconColorClass: 'text-sky-100',
    pageGradientFromClass: 'from-sky-800',
    pageGradientToClass: 'to-sky-900',
    // coinShapeComponent: DiamondCoin, // Removed
  },
  {
    id: 'rainbow',
    name: 'Радужная',
    iconComponent: RainbowPaletteIcon,
    iconColorClass: '', // RainbowPaletteIcon is self-colored
    iconBgClass: 'bg-indigo-600/40',
    cardBgClass: 'bg-indigo-700/30 hover:bg-indigo-700/40',
    price: 50000,
    coinColorClass: 'bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600',
    coinIconColorClass: 'text-white',
    pageGradientFromClass: 'from-purple-700',
    pageGradientToClass: 'to-pink-700',
  },
];

export const defaultSkin: Skin = initialSkins.find(skin => skin.id === 'classic') || initialSkins[0];
