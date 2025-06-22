
import type React from 'react';
import { Coins, ShoppingCart, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext'; // Импортируем useAuth

interface TopBarProps {
  onShopClick?: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ onShopClick }) => {
  const { currentUser, logout } = useAuth(); // Получаем currentUser и logout

  const handleLogout = async () => {
    try {
      await logout();
      // Редирект на /login будет обработан в AuthContext или на странице HomePage
    } catch (error) {
      console.error("Error logging out: ", error);
      // Можно добавить toast с ошибкой выхода, если необходимо
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-20 bg-card shadow-md">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <div className="flex items-center gap-2">
          <Coins className="w-8 h-8 text-primary" />
          <h1 className="text-xl md:text-2xl font-bold text-foreground">CoinBlitz</h1>
        </div>

        <div className="flex items-center gap-2">
          {currentUser && (
            <>
              <Button 
                variant="default" 
                size="sm" 
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
                onClick={onShopClick}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Магазин
              </Button>
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
