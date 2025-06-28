
import React from 'react';
import TopBar from '@/components/TopBar';
import BottomNavBar from '@/components/BottomNavBar';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Skeleton } from './ui/skeleton';

interface AppLayoutProps {
  children: React.ReactNode;
  activeItem?: string;
  className?: string;
  contentClassName?: string;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children, activeItem, className, contentClassName }) => {
  const router = useRouter();
  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <div className={cn("flex flex-col min-h-screen bg-gradient-to-br from-background to-indigo-900/50 text-foreground font-body antialiased", className)}>
      <TopBar />
      <main className={cn("flex-grow container mx-auto px-4 pt-24 md:pt-28 pb-20 md:pb-24", contentClassName)}>
        {children}
      </main>
      <BottomNavBar onNavigate={handleNavigation} activeItem={activeItem} />
    </div>
  );
};

export default AppLayout;
