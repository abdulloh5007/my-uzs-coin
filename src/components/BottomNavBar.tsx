
import type React from 'react';
import { useState, useEffect } from 'react'; 
import { User, MousePointerClick, ListChecks, Gift, Sparkles, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePathname, useRouter } from 'next/navigation';

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  path: string;
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
  onNavigate?: (path: string) => void;
  activeItem?: string; // Optional activeItem prop for external control
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({ onNavigate, activeItem }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const navItems: Omit<NavItemProps, 'isActive' | 'onClick'>[] = [
    { icon: User, label: 'Профиль', path: '/profile' },
    { icon: MousePointerClick, label: 'Кликер', path: '/' }, 
    { icon: ListChecks, label: 'Задания', path: '/tasks' }, 
    { icon: Gift, label: 'Награды', path: '/rewards' },
    { icon: Sparkles, label: 'Mint', path: '/mint' }, // Assuming Mint is a future feature
    { icon: Palette, label: 'Скины', path: '/skins' },
  ];

  const handleItemClick = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      if (path.startsWith('/')) { 
        router.push(path);
      }
    }
  };
  
  const currentPathForActivity = activeItem !== undefined ? activeItem : pathname;


  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 bg-card shadow-up h-16 md:h-20">
      <div className="container mx-auto flex items-stretch justify-around h-full px-0">
        {navItems.map((item) => {
          const currentItemIsActive = isClient ? (currentPathForActivity === item.path || (item.path === '/' && currentPathForActivity.startsWith('/?'))) : false;
          return (
            <NavItem
              key={item.label}
              icon={item.icon}
              label={item.label}
              path={item.path}
              isActive={currentItemIsActive}
              onClick={() => handleItemClick(item.path)}
            />
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavBar;
