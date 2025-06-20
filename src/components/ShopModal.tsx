
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Coins, Zap, Target, History, Lightbulb, Bot } from 'lucide-react'; // Changed from Robot to Bot
import { cn } from '@/lib/utils';

export type UpgradeId = 'maxEnergyUpgrade' | 'clickPowerUpgrade' | 'energyRegenRateUpgrade' | 'offlineBotPurchase';

interface UpgradeItemProps {
  icon: React.ElementType;
  title: string;
  description: string;
  cost: number;
  onPurchase: () => void;
  canAfford: boolean;
  isOwned?: boolean;
  balanceIcon?: React.ElementType;
}

const UpgradeItemCard: React.FC<UpgradeItemProps> = ({
  icon: Icon,
  title,
  description,
  cost,
  onPurchase,
  canAfford,
  isOwned = false,
  balanceIcon: BalanceIcon = Coins,
}) => {
  let buttonText = 'Купить';
  let buttonDisabled = !canAfford;
  let buttonVariant: "default" | "secondary" | "outline" | "ghost" | "link" | "destructive" | null | undefined = "default";

  if (isOwned) {
    buttonText = 'Куплено';
    buttonDisabled = true;
    buttonVariant = 'secondary';
  } else if (!canAfford) {
    buttonVariant = 'default'; 
  }


  return (
    <Card className="bg-card/80 border-border/50">
      <CardContent className="p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="p-2 bg-primary/20 rounded-full">
            <Icon className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-foreground">{title}</h4>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 min-w-[100px] text-right">
          {!isOwned && (
            <div className="flex items-center text-sm font-medium text-primary mb-1">
              <BalanceIcon className="w-4 h-4 mr-1" />
              {cost.toLocaleString()}
            </div>
          )}
          <Button
            size="sm"
            onClick={onPurchase}
            disabled={buttonDisabled}
            variant={buttonVariant}
            className={cn(
              "px-6 w-full",
              isOwned ? "bg-green-600 hover:bg-green-700 text-white" : 
              (canAfford ? "bg-primary hover:bg-primary/90 text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted cursor-not-allowed")
            )}
          >
            {buttonText}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

interface ShopModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  score: number;
  currentMaxEnergy: number;
  currentClickPower: number;
  currentEnergyRegenRate: number; // per second
  onPurchase: (upgradeId: UpgradeId, cost: number) => boolean; // Returns true if purchase was successful
  isBotOwned: boolean;
}

const ShopModal: React.FC<ShopModalProps> = ({
  isOpen,
  onOpenChange,
  score,
  currentMaxEnergy,
  currentClickPower,
  currentEnergyRegenRate,
  onPurchase,
  isBotOwned,
}) => {
  const upgrades: Array<Omit<UpgradeItemProps, 'onPurchase' | 'canAfford' | 'isOwned'> & { id: UpgradeId, effectAmount?: number }> = [
    {
      id: 'maxEnergyUpgrade',
      icon: Zap,
      title: 'Увеличить энергию',
      description: `+50 к максимальной энергии (${currentMaxEnergy} \u2192 ${currentMaxEnergy + 50})`,
      cost: 100,
      effectAmount: 50,
    },
    {
      id: 'clickPowerUpgrade',
      icon: Target,
      title: 'Усилить клик',
      description: `+1 к силе клика (${currentClickPower} \u2192 ${currentClickPower + 1})`,
      cost: 1600,
      effectAmount: 1,
    },
    {
      id: 'energyRegenRateUpgrade',
      icon: History,
      title: 'Ускорить восстановление',
      description: `+1 энергии в секунду (${currentEnergyRegenRate.toFixed(0)} \u2192 ${(currentEnergyRegenRate + 1).toFixed(0)})`,
      cost: 800,
      effectAmount: 1,
    },
    {
      id: 'offlineBotPurchase',
      icon: Bot, // Changed from Robot to Bot
      title: 'Оффлайн Бот',
      description: `Собирает монеты, пока вы оффлайн. 1 клик (сила: ${currentClickPower}) каждые 2 сек. Макс: 299,000.`,
      cost: 200000,
    },
  ];

  const handleItemPurchase = (upgradeId: UpgradeId, cost: number) => {
    onPurchase(upgradeId, cost);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background border-border p-0 shadow-2xl">
        <DialogHeader className="p-6 pb-4 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="w-6 h-6 text-primary" />
              <DialogTitle className="text-xl font-semibold text-foreground">Магазин бустов</DialogTitle>
            </div>
          </div>
        </DialogHeader>
        
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <Card className="bg-primary/10 border-primary/30">
            <CardContent className="p-3 flex items-center justify-center">
              <Coins className="w-5 h-5 mr-2 text-primary" />
              <span className="text-sm font-medium text-foreground">Ваш баланс: </span>
              <span className="text-sm font-semibold text-primary ml-1">{score.toLocaleString()}</span>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {upgrades.map((upgrade) => (
              <UpgradeItemCard
                key={upgrade.id}
                icon={upgrade.icon}
                title={upgrade.title}
                description={upgrade.id === 'offlineBotPurchase' ? `Собирает монеты, пока вы оффлайн. 1 клик (сила: ${currentClickPower}) каждые 2 сек. Макс: 299,000.` : upgrade.description}
                cost={upgrade.cost}
                onPurchase={() => handleItemPurchase(upgrade.id, upgrade.cost)}
                canAfford={score >= upgrade.cost}
                isOwned={upgrade.id === 'offlineBotPurchase' ? isBotOwned : undefined}
              />
            ))}
          </div>
          
          <div className="mt-4 p-3 bg-card/50 rounded-md flex items-center text-xs text-muted-foreground">
            <Lightbulb className="w-4 h-4 mr-2 text-primary" />
            <span>Энергия восстанавливается по {currentEnergyRegenRate.toFixed(0)} единиц в секунду</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShopModal;
