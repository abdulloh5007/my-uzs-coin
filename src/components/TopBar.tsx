
import React, { useState } from 'react';
import { Coins, LogOut, Menu, Gift, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { useRouter } from 'next/navigation';

interface TopBarProps {
  // score prop removed
}

const TopBar: React.FC<TopBarProps> = ({}) => {
  const { currentUser, logout } = useAuth();
  const router = useRouter();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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
              {/* Desktop Logout Button */}
              <div className="hidden md:flex">
                <Button variant="destructive" size="sm" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Выйти
                </Button>
              </div>

              {/* Mobile Hamburger Menu */}
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
                    <nav className="flex-grow p-4 space-y-2">
                      <Button variant="ghost" className="w-full justify-start text-base py-6 gap-3" onClick={() => handleDrawerNavigate('/rewards')}>
                        <Gift className="w-5 h-5 text-primary" /> Награды
                      </Button>
                      <Button variant="ghost" className="w-full justify-start text-base py-6 gap-3" onClick={() => handleDrawerNavigate('/collections')}>
                        <LayoutGrid className="w-5 h-5 text-primary" /> Коллекция
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
