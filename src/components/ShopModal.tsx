
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Coins, Zap, Target, History, Lightbulb, Bot, Info, BatteryFull } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export type UpgradeId = 'maxEnergyUpgrade' | 'clickPowerUpgrade' | 'energyRegenRateUpgrade' | 'offlineBotPurchase';

interface UpgradeItemCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  cost?: number; // Optional, as it might be "Max Level"
  onPurchase: () => void;
  canAfford: boolean;
  isMaxLevel: boolean;
  currentLevelInfo?: string; // e.g., "Уровень: 3/10"
}

const UpgradeItemCard: React.FC<UpgradeItemProps> = ({
  icon: Icon,
  title,
  description,
  cost,
  onPurchase,
  canAfford,
  isMaxLevel,
  currentLevelInfo,
}) => {
  let buttonText = 'Купить';
  let buttonDisabled = !canAfford || isMaxLevel;
  let buttonClasses = "bg-primary hover:bg-primary/90 text-primary-foreground";

  if (isMaxLevel) {
    buttonText = 'Макс. уровень';
    buttonDisabled = true;
    buttonClasses = "bg-green-600 hover:bg-green-700 text-white cursor-default";
  } else if (!canAfford) {
    buttonClasses = "bg-muted text-muted-foreground hover:bg-muted cursor-not-allowed";
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
            {currentLevelInfo && <p className="text-xs text-muted-foreground mt-0.5">{currentLevelInfo}</p>}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 min-w-[100px] text-right">
          {!isMaxLevel && cost !== undefined && (
            <div className="flex items-center text-sm font-medium text-primary mb-1">
              <Coins className="w-4 h-4 mr-1" />
              {cost.toLocaleString()}
            </div>
          )}
          <Button
            size="sm"
            onClick={onPurchase}
            disabled={buttonDisabled}
            className={cn("px-6 w-full", buttonClasses)}
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

  maxEnergyLevel: number;
  clickPowerLevel: number;
  energyRegenLevel: number;

  currentMaxEnergy: number;
  currentClickPower: number; // Effective click power (can be boosted)
  baseClickPower: number;    // Non-boosted click power
  currentEnergyRegenRate: number;

  onPurchase: (upgradeId: UpgradeId) => boolean; // Returns true if purchase was successful for UI feedback

  isBotOwned: boolean;
  botPurchaseCost: number;
  botClickIntervalSeconds: number;
  botMaxOfflineCoins: number;

  dailyClickBoostsAvailable: number;
  isBoostActive: boolean;
  onActivateClickBoost: () => void;
  boostEndTime: number;
  dailyFullEnergyBoostsAvailable: number;
  onActivateFullEnergyBoost: () => void;

  // Game balance constants for display and cost calculation
  initialMaxEnergyBase: number;
  maxEnergyIncrementPerLevel: number;
  maxEnergyMaxLevel: number;
  maxEnergyUpgradeCosts: number[];

  initialClickPowerBase: number;
  clickPowerIncrementPerLevel: number;
  clickPowerMaxLevel: number;
  clickPowerUpgradeCosts: number[];

  initialEnergyRegenRateBase: number;
  energyRegenIncrementPerLevel: number;
  energyRegenMaxLevel: number;
  energyRegenUpgradeCosts: number[];
}

const ShopModal: React.FC<ShopModalProps> = ({
  isOpen,
  onOpenChange,
  score,
  maxEnergyLevel,
  clickPowerLevel,
  energyRegenLevel,
  currentMaxEnergy, // Derived value, passed for display
  currentClickPower, // Derived and potentially boosted, for display in stats
  baseClickPower,    // Derived non-boosted, for bot and some display
  currentEnergyRegenRate, // Derived value, passed for display
  onPurchase,
  isBotOwned,
  botPurchaseCost,
  botClickIntervalSeconds,
  botMaxOfflineCoins,
  dailyClickBoostsAvailable,
  isBoostActive,
  onActivateClickBoost,
  boostEndTime,
  dailyFullEnergyBoostsAvailable,
  onActivateFullEnergyBoost,
  initialMaxEnergyBase,
  maxEnergyIncrementPerLevel,
  maxEnergyMaxLevel,
  maxEnergyUpgradeCosts,
  initialClickPowerBase,
  clickPowerIncrementPerLevel,
  clickPowerMaxLevel,
  clickPowerUpgradeCosts,
  initialEnergyRegenRateBase,
  energyRegenIncrementPerLevel,
  energyRegenMaxLevel,
  energyRegenUpgradeCosts,
}) => {
  const [timeLeftInBoost, setTimeLeftInBoost] = useState(0);

  useEffect(() => {
    if (isBoostActive && boostEndTime > 0) {
      const updateTimer = () => {
        const remaining = Math.max(0, Math.ceil((boostEndTime - Date.now()) / 1000));
        setTimeLeftInBoost(remaining);
      };
      updateTimer(); 
      const intervalId = setInterval(updateTimer, 1000);
      return () => clearInterval(intervalId);
    } else {
      setTimeLeftInBoost(0);
    }
  }, [isBoostActive, boostEndTime]);

  const upgradesConfig = [
    {
      id: 'maxEnergyUpgrade' as UpgradeId,
      icon: Zap,
      title: 'Увеличить энергию',
      level: maxEnergyLevel,
      maxLevel: maxEnergyMaxLevel,
      costs: maxEnergyUpgradeCosts,
      currentValueDisplay: currentMaxEnergy,
      increment: maxEnergyIncrementPerLevel,
      baseValue: initialMaxEnergyBase,
      unit: '',
    },
    {
      id: 'clickPowerUpgrade' as UpgradeId,
      icon: Target,
      title: 'Усилить клик',
      level: clickPowerLevel,
      maxLevel: clickPowerMaxLevel,
      costs: clickPowerUpgradeCosts,
      currentValueDisplay: baseClickPower, // Show base power for upgrade reference
      increment: clickPowerIncrementPerLevel,
      baseValue: initialClickPowerBase,
      unit: '',
    },
    {
      id: 'energyRegenRateUpgrade' as UpgradeId,
      icon: History,
      title: 'Ускорить восстановление',
      level: energyRegenLevel,
      maxLevel: energyRegenMaxLevel,
      costs: energyRegenUpgradeCosts,
      currentValueDisplay: currentEnergyRegenRate,
      increment: energyRegenIncrementPerLevel,
      baseValue: initialEnergyRegenRateBase,
      unit: '/сек',
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background border-border p-0 shadow-2xl">
        <DialogHeader className="p-6 pb-4 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="w-6 h-6 text-primary" />
              <DialogTitle className="text-xl font-semibold text-foreground">Магазин</DialogTitle>
            </div>
          </div>
        </DialogHeader>
        
        <div className="p-6 space-y-1 max-h-[75vh] overflow-y-auto">
          <Card className="bg-primary/10 border-primary/30 mb-4">
            <CardContent className="p-3 flex items-center justify-center">
              <Coins className="w-5 h-5 mr-2 text-primary" />
              <span className="text-sm font-medium text-foreground">Ваш баланс: </span>
              <span className="text-sm font-semibold text-primary ml-1">{score.toLocaleString()}</span>
            </CardContent>
          </Card>

          <Tabs defaultValue="upgrades" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="upgrades">Улучшения</TabsTrigger>
              <TabsTrigger value="boosts">Бусты</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upgrades" className="space-y-3">
              {upgradesConfig.map((upgrade) => {
                const isMaxLvl = upgrade.level >= upgrade.maxLevel;
                const costForNextLevel = isMaxLvl ? undefined : upgrade.costs[upgrade.level];
                const canAffordNext = costForNextLevel !== undefined && score >= costForNextLevel;
                
                let description = '';
                if (isMaxLvl) {
                  description = `Макс. уровень (${upgrade.currentValueDisplay}${upgrade.unit})`;
                } else {
                  const nextValue = upgrade.currentValueDisplay + upgrade.increment;
                  description = `+${upgrade.increment}${upgrade.unit} (${upgrade.currentValueDisplay}${upgrade.unit} \u2192 ${nextValue}${upgrade.unit})`;
                }
                const currentLevelInfo = `Уровень: ${upgrade.level + 1}/${upgrade.maxLevel + 1}`;


                return (
                  <UpgradeItemCard
                    key={upgrade.id}
                    icon={upgrade.icon}
                    title={upgrade.title}
                    description={description}
                    cost={costForNextLevel}
                    onPurchase={() => onPurchase(upgrade.id)}
                    canAfford={canAffordNext}
                    isMaxLevel={isMaxLvl}
                    currentLevelInfo={currentLevelInfo}
                  />
                );
              })}
              
              <Card className="bg-card/80 border-border/50 mt-3">
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="p-2 bg-green-500/20 rounded-full">
                      <Bot className="w-6 h-6 text-green-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h4 className="font-semibold text-foreground">Оффлайн Бот</h4>
                        <TooltipProvider delayDuration={0}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-5 w-5 ml-1.5 p-0">
                                <Info className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top" align="start">
                              <p className="max-w-xs text-xs">Собирает монеты, пока вы оффлайн. 1 клик (сила: {baseClickPower}) каждые {botClickIntervalSeconds} сек. Макс: {botMaxOfflineCoins.toLocaleString()} монет.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <p className="text-xs text-muted-foreground">Автоматический сбор монет.</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 min-w-[100px] text-right">
                    {!isBotOwned && (
                      <div className="flex items-center text-sm font-medium text-primary mb-1">
                        <Coins className="w-4 h-4 mr-1" />
                        {botPurchaseCost.toLocaleString()}
                      </div>
                    )}
                    <Button
                      size="sm"
                      onClick={() => onPurchase('offlineBotPurchase')}
                      disabled={isBotOwned || score < botPurchaseCost}
                      className={cn(
                        "px-6 w-full",
                        isBotOwned ? "bg-green-600 hover:bg-green-700 text-white cursor-default" : 
                        (score >= botPurchaseCost ? "bg-primary hover:bg-primary/90 text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted cursor-not-allowed")
                      )}
                    >
                      {isBotOwned ? 'Куплено' : 'Купить'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="boosts" className="space-y-3">
              <Card className="bg-card/80 border-border/50">
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="p-2 bg-purple-500/20 rounded-full">
                      <Zap className="w-6 h-6 text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h4 className="font-semibold text-foreground">x2 Сила клика (1 мин)</h4>
                        <TooltipProvider delayDuration={0}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-5 w-5 ml-1.5 p-0">
                                <Info className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top" align="start">
                              <p className="max-w-xs text-xs">Удваивает силу вашего клика на 60 секунд.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <p className="text-xs text-muted-foreground">Усиливает ваши клики.</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 min-w-[130px] text-right">
                    <div className="text-xs text-muted-foreground mb-1">
                      Доступно: <span className="font-semibold text-primary">{dailyClickBoostsAvailable} / 3</span>
                    </div>
                    <Button
                      size="sm"
                      onClick={onActivateClickBoost}
                      disabled={isBoostActive || dailyClickBoostsAvailable === 0}
                      className={cn(
                        "px-4 w-full", 
                        isBoostActive ? "bg-blue-600 hover:bg-blue-700 text-white cursor-default" : 
                        (dailyClickBoostsAvailable > 0 ? "bg-accent hover:bg-accent/90 text-accent-foreground" : "bg-muted text-muted-foreground hover:bg-muted cursor-not-allowed")
                      )}
                    >
                      {isBoostActive ? `Активен (${timeLeftInBoost}с)` : (dailyClickBoostsAvailable > 0 ? "Активировать" : "Нет доступных")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
              {isBoostActive && timeLeftInBoost > 0 && (
                <p className="text-xs text-center text-primary/80 pt-1">
                  Действие буста x2 закончится через {timeLeftInBoost} сек.
                </p>
              )}

              <Card className="bg-card/80 border-border/50">
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="p-2 bg-green-500/20 rounded-full">
                      <BatteryFull className="w-6 h-6 text-green-400" />
                    </div>
                    <div className="flex-1">
                       <div className="flex items-center">
                        <h4 className="font-semibold text-foreground">Полная Энергия</h4>
                        <TooltipProvider delayDuration={0}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-5 w-5 ml-1.5 p-0">
                                <Info className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top" align="start">
                              <p className="max-w-xs text-xs">Мгновенно восстанавливает вашу энергию до максимума.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <p className="text-xs text-muted-foreground">Мгновенное пополнение энергии.</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 min-w-[130px] text-right">
                    <div className="text-xs text-muted-foreground mb-1">
                      Доступно: <span className="font-semibold text-primary">{dailyFullEnergyBoostsAvailable} / 3</span>
                    </div>
                    <Button
                      size="sm"
                      onClick={onActivateFullEnergyBoost}
                      disabled={dailyFullEnergyBoostsAvailable === 0}
                      className={cn(
                        "px-4 w-full", 
                        dailyFullEnergyBoostsAvailable > 0 ? "bg-accent hover:bg-accent/90 text-accent-foreground" : "bg-muted text-muted-foreground hover:bg-muted cursor-not-allowed"
                      )}
                    >
                      {dailyFullEnergyBoostsAvailable > 0 ? "Активировать" : "Нет доступных"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

            </TabsContent>
          </Tabs>
          
          <div className="mt-4 p-3 bg-card/50 rounded-md flex items-center text-xs text-muted-foreground">
            <Lightbulb className="w-4 h-4 mr-2 text-primary" />
            <span>Энергия восстанавливается по {currentEnergyRegenRate.toFixed(0)}{energyRegenIncrementPerLevel > 0 && currentEnergyRegenRate > initialEnergyRegenRateBase ? `/сек` : `/сек`}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShopModal;

    