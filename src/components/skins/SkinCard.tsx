
import type React from 'react';
import type { Skin } from '@/types/skins';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Coins, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SkinCardProps {
  skin: Skin;
  userBalance: number;
  onSelectSkin: (skinId: string) => void;
  onBuySkin: (skinId: string, price: number) => void;
}

const SkinCard: React.FC<SkinCardProps> = ({ skin, userBalance, onSelectSkin, onBuySkin }) => {
  const IconComponent = skin.iconComponent;

  const handleButtonClick = () => {
    if (skin.isSelected) {
      return; // Already selected, do nothing
    }
    if (skin.isOwned) {
      onSelectSkin(skin.id);
    } else {
      if (userBalance >= skin.price) {
        onBuySkin(skin.id, skin.price);
      }
    }
  };

  let buttonContent: React.ReactNode;
  let buttonDisabled = false;
  let buttonVariant: "default" | "secondary" | "outline" | "ghost" | "link" | "destructive" = "secondary";
  let buttonClasses = "w-full mt-auto transition-all duration-150 ease-in-out";


  if (skin.isSelected) {
    buttonContent = (
      <>
        <Check className="w-4 h-4 mr-1.5" />
        Выбрано
      </>
    );
    buttonDisabled = true;
    buttonVariant = "default"; 
    buttonClasses = cn(buttonClasses, "bg-accent hover:bg-accent/90 text-accent-foreground");
  } else if (skin.isOwned) {
    buttonContent = 'Выбрать';
    buttonVariant = "outline";
    buttonClasses = cn(buttonClasses, "border-primary/50 text-primary hover:bg-primary/10 hover:text-primary");
  } else { // Not owned
    buttonContent = (
      <>
        <Coins className="w-4 h-4 mr-1.5" />
        {skin.price.toLocaleString()}
      </>
    );
    if (userBalance < skin.price) {
      buttonDisabled = true;
      buttonClasses = cn(buttonClasses, "bg-muted text-muted-foreground hover:bg-muted");
      // No longer setting buttonContent to "Мало монет"
    } else {
        buttonVariant = "default"; // Use primary (gold) for buyable
        buttonClasses = cn(buttonClasses, "bg-primary hover:bg-primary/90 text-primary-foreground");
    }
  }


  return (
    <Card className={cn("flex flex-col items-center justify-between p-4 aspect-[4/5] shadow-lg transition-all duration-200 ease-in-out transform hover:scale-105", skin.cardBgClass)}>
      <div className={cn("p-3 rounded-full mb-3", skin.iconBgClass)}>
        <IconComponent className={cn("w-8 h-8", skin.iconColorClass)} />
      </div>
      <h3 className="text-sm font-semibold text-foreground mb-2 text-center truncate w-full">{skin.name}</h3>
      <Button
        onClick={handleButtonClick}
        disabled={buttonDisabled}
        variant={buttonVariant}
        size="sm"
        className={buttonClasses}
      >
        {buttonContent}
      </Button>
    </Card>
  );
};

export default SkinCard;
