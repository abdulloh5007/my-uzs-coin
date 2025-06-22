
import type React from 'react';
import { Coins, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

interface TopBarProps {
  score: number;
}

const TopBar: React.FC<TopBarProps> = ({ score }) => {
  const { currentUser, logout } = useAuth();

  const handleLogout = async () => {
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
          <h1 className="text-xl md:text-2xl font-bold text-foreground">UZS</h1>
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
            <span className="text-2xl font-bold text-primary tracking-tighter">{score.toLocaleString()}</span>
            <span className="text-xs -mt-1 text-muted-foreground">монет</span>
        </div>

        <div className="flex items-center gap-2">
          {currentUser && (
            <>
              <Button variant="destructive" size="sm" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Выйти
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopBar;
