
import type React from 'react';
import { useState, useEffect } from 'react';
import { User, MousePointerClick, Gift, Sparkles, Users, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  path: string;
  isActive?: boolean;
  onClick?: () => void;
  hasNotification?: boolean;
  className?: string;
}

const NavItem: React.FC<NavItemProps> = ({ icon: Icon, label, isActive, onClick, hasNotification, className }) => {
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center justify-center h-full p-2 flex-1 rounded-none",
        "text-muted-foreground hover:text-foreground",
        isActive ? "text-primary bg-primary/10" : "",
        className
      )}
    >
      <Icon className={cn("w-6 h-6 mb-0.5", isActive ? "text-primary" : "")} />
      <span className={cn("text-xs", isActive ? "font-semibold text-primary" : "")}>{label}</span>
      {hasNotification && (
        <span className="absolute top-1 right-1 md:top-2 md:right-2 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
        </span>
      )}
    </Button>
  );
};

interface BottomNavBarProps {
  onNavigate?: (path: string) => void;
  activeItem?: string; 
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({ onNavigate, activeItem }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser } = useAuth();
  const [hasNewMail, setHasNewMail] = useState(false);

  useEffect(() => {
    if (currentUser) {
      const transfersRef = collection(db, 'nft_transfers');
      const qMailbox = query(transfersRef, where('recipientId', '==', currentUser.uid), where('status', '==', 'pending'));
      const unsubscribeMail = onSnapshot(qMailbox, (snapshot) => {
          setHasNewMail(!snapshot.empty);
      });

      return () => {
        unsubscribeMail();
      };
    }
  }, [currentUser]);


  const navItems: Omit<NavItemProps, 'isActive' | 'onClick' | 'hasNotification' | 'className'>[] = [
    { icon: MousePointerClick, label: 'Кликер', path: '/' }, 
    { icon: Users, label: 'Друзья', path: '/friends' },
    { icon: Sparkles, label: 'Магазин', path: '/mint' },
    { icon: Gift, label: 'Награды', path: '/rewards' },
    { icon: LayoutGrid, label: 'Коллекция', path: '/collections' },
    { icon: User, label: 'Профиль', path: '/profile' },
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
          const currentItemIsActive = (currentPathForActivity === item.path || (currentPathForActivity === '/' && item.path === '/') || (item.path === '/' && currentPathForActivity.startsWith('/?')));
          let itemHasNotification = false;
          // Only show notification for mail on collections tab
          if (item.path === '/collections') {
            itemHasNotification = hasNewMail;
          }

          const isHiddenOnMobile = item.path === '/mint';

          return (
            <NavItem
              key={item.label}
              icon={item.icon}
              label={item.label}
              path={item.path}
              isActive={currentItemIsActive}
              onClick={() => handleItemClick(item.path)}
              hasNotification={itemHasNotification}
              className={isHiddenOnMobile ? 'hidden md:flex' : 'flex'}
            />
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavBar;
