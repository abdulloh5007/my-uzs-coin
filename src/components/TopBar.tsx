
import React, { useState, useEffect } from 'react';
import { Coins, LogOut, Menu, Gift, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { useRouter, usePathname } from 'next/navigation';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { cn } from '@/lib/utils';

const TopBar: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [hasNewMail, setHasNewMail] = useState(false);
  const [hasNewRewards, setHasNewRewards] = useState(false);


  useEffect(() => {
    if (currentUser) {
      const userDocRef = doc(db, 'users', currentUser.uid);
      
      const unsubscribeUser = onSnapshot(userDocRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setScore(data.score);
          setHasNewRewards((data.completedUnclaimedTaskTierIds || []).length > 0);
        }
      }, (error) => {
        console.error("Error fetching user data:", error);
      });
      
      const transfersRef = collection(db, 'nft_transfers');
      const qMailbox = query(transfersRef, where('recipientId', '==', currentUser.uid), where('status', '==', 'pending'));
      const unsubscribeMail = onSnapshot(qMailbox, (snapshot) => {
          setHasNewMail(!snapshot.empty);
      });

      return () => {
        unsubscribeUser();
        unsubscribeMail();
      };
    }
  }, [currentUser]);

  const handleDrawerNavigate = (path: string) => {
    router.push(path);
    setIsDrawerOpen(false);
  };

  const handleLogout = async () => {
    setIsDrawerOpen(false);
    try {
      await logout();
    } catch (error) {
      console.error("Error logging out: ", error);
    }
  };
  
  const renderNotificationBadge = () => (
    <span className="absolute top-3 right-3 flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
    </span>
  );

  return (
    <div className="fixed top-0 left-0 right-0 z-20 bg-card shadow-md">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <div className="flex items-center gap-2">
          <Coins className="w-8 h-8 text-primary" />
          <h1 className="text-xl md:text-2xl font-bold text-foreground">UZSCOIN</h1>
        </div>

        <div className="flex items-center gap-2">
          {currentUser && (
            <>
              {pathname !== '/' && score !== null && (
                <div className="hidden md:flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-full">
                  <span className="font-bold text-primary text-sm">{score.toLocaleString()}</span>
                  <Coins className="w-5 h-5 text-primary" />
                </div>
              )}
              <div className="hidden md:flex">
                <Button variant="destructive" size="sm" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Выйти
                </Button>
              </div>

              <div className="md:hidden">
                <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Menu className="h-6 w-6" />
                      <span className="sr-only">Открыть меню</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[280px] p-0 flex flex-col bg-background">
                    <SheetHeader className="p-6 pb-4 border-b border-border/50 text-left">
                      <SheetTitle>Меню</SheetTitle>
                    </SheetHeader>
                    
                    {pathname !== '/' && score !== null && (
                      <div className="px-4 py-3 border-b border-border/50">
                        <div className="flex items-center justify-center gap-2 bg-primary/10 px-3 py-1.5 rounded-full">
                          <span className="font-bold text-primary text-sm">Баланс: {score.toLocaleString()}</span>
                           <Coins className="w-5 h-5 text-primary" />
                        </div>
                      </div>
                    )}
                    
                    <nav className="flex-grow p-4 space-y-2">
                      <Button
                        variant="ghost"
                        className={cn(
                          "relative w-full justify-start text-base py-6 gap-3",
                          pathname === '/rewards' && "bg-accent text-accent-foreground"
                        )}
                        onClick={() => handleDrawerNavigate('/rewards')}
                      >
                        <Gift className="w-5 h-5 text-primary" /> Награды
                        {hasNewRewards && renderNotificationBadge()}
                      </Button>
                       <Button
                        variant="ghost"
                        className={cn(
                          "relative w-full justify-start text-base py-6 gap-3",
                          pathname === '/collections' && "bg-accent text-accent-foreground"
                        )}
                        onClick={() => handleDrawerNavigate('/collections')}
                      >
                        <LayoutGrid className="w-5 h-5 text-primary" /> Коллекция
                        {hasNewMail && renderNotificationBadge()}
                      </Button>
                    </nav>
                    <SheetFooter className="p-4 mt-auto border-t border-border/50">
                       <Button variant="destructive" className="w-full" onClick={handleLogout}>
                          <LogOut className="mr-2 h-4 w-4" />
                          Выйти
                       </Button>
                    </SheetFooter>
                  </SheetContent>
                </Sheet>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopBar;
