
import type React from 'react';
import { User, MousePointerClick, ListChecks, Gift, Sparkles, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePathname, useRouter } from 'next/navigation'; // Import useRouter and usePathname

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  path: string; // Added path for navigation
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
  // activeItem prop is removed, will be derived from pathname
  onNavigate?: (path: string) => void; // Changed to path
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({ onNavigate }) => {
  const router = useRouter();
  const pathname = usePathname();

  const navItems: Omit<NavItemProps, 'isActive' | 'onClick'>[] = [
    { icon: User, label: 'Профиль', path: '/profile' },
    { icon: MousePointerClick, label: 'Кликер', path: '/' }, 
    { icon: ListChecks, label: 'Задания', path: '/tasks' }, 
    { icon: Gift, label: 'Награды', path: '/rewards' }, // Placeholder path
    { icon: Sparkles, label: 'Mint', path: '/mint' }, // Placeholder path
    { icon: Palette, label: 'Скины', path: '/skins' },
  ];

  const handleItemClick = (path: string) => {
    if (onNavigate) {
      // If onNavigate is provided (e.g. from HomePage for smoother transitions or specific logic)
      onNavigate(path);
    } else {
      // Default navigation behavior if onNavigate is not provided (e.g. from ProfilePage, TasksPage)
      if (path.startsWith('/')) { 
        router.push(path);
      }
    }
  };


  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 bg-card shadow-up h-16 md:h-20">
      <div className="container mx-auto flex items-stretch justify-around h-full px-0">
        {navItems.map((item) => (
          <NavItem
            key={item.label}
            icon={item.icon}
            label={item.label}
            path={item.path}
            isActive={pathname === item.path || (item.path === '/' && pathname.startsWith('/?'))}
            onClick={() => handleItemClick(item.path)}
          />
        ))}
      </div>
    </div>
  );
};

export default BottomNavBar;
