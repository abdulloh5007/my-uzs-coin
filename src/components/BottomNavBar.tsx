import type React from 'react';
import { User, MousePointerClick, ListChecks, Gift, Sparkles, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon: Icon, label, isActive, onClick }) => {
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center h-full p-2 flex-1 rounded-none",
        "text-muted-foreground hover:text-foreground",
        isActive ? "text-primary bg-primary/10" : ""
      )}
    >
      <Icon className={cn("w-6 h-6 mb-0.5", isActive ? "text-primary" : "")} />
      <span className={cn("text-xs", isActive ? "font-semibold text-primary" : "")}>{label}</span>
    </Button>
  );
};

interface BottomNavBarProps {
  activeItem?: string;
  onNavigate?: (item: string) => void;
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeItem = 'clicker', onNavigate }) => {
  const navItems: Omit<NavItemProps, 'isActive' | 'onClick'>[] = [
    { icon: User, label: 'Профиль' },
    { icon: MousePointerClick, label: 'Кликер' },
    { icon: ListChecks, label: 'Задания' },
    { icon: Gift, label: 'Награды' },
    { icon: Sparkles, label: 'Mint' }, // Using Sparkles for Mint as an example
    { icon: Palette, label: 'Скины' },   // Using Palette for Skins
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 bg-card shadow-up h-16 md:h-20">
      <div className="container mx-auto flex items-stretch justify-around h-full px-0">
        {navItems.map((item) => (
          <NavItem
            key={item.label}
            icon={item.icon}
            label={item.label}
            isActive={activeItem === item.label.toLowerCase()}
            onClick={() => onNavigate?.(item.label.toLowerCase())}
          />
        ))}
      </div>
    </div>
  );
};

export default BottomNavBar;
