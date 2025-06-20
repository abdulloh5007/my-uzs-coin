
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ClickableCoin from '@/components/ClickableCoin';
import TopBar from '@/components/TopBar';
import BottomNavBar from '@/components/BottomNavBar';
import GameStats from '@/components/GameStats';
import ShopModal from '@/components/ShopModal';
import type { UpgradeId } from '@/components/ShopModal';
import { useRouter } from 'next/navigation';
import { formatDistanceStrict } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { initialDailyTasks, initialMainTasks, initialLeagueTasks } from '@/data/tasks';
import { checkAndNotifyTaskCompletion } from '@/lib/taskUtils';
import type { Skin } from '@/types/skins';
import { initialSkins, defaultSkin } from '@/data/skins';
import { cn } from '@/lib/utils';
import { Bot } from 'lucide-react';

const INITIAL_MAX_ENERGY = 100;
const INITIAL_CLICK_POWER = 1;
const INITIAL_ENERGY_REGEN_RATE_PER_SECOND = 3;
const INITIAL_SCORE = 1000000000;
const INITIAL_TOTAL_CLICKS = 0;

const ENERGY_PER_CLICK = 1;
const ENERGY_REGEN_INTERVAL = 50; // ms
const CLICK_ANIMATION_DURATION = 200; // ms
const DAILY_STATS_UPDATE_INTERVAL = 1000; // ms

// Bot constants
const BOT_CLICK_INTERVAL_SECONDS = 2;
const BOT_MAX_OFFLINE_COINS = 299000;
const BOT_PURCHASE_COST = 200000;

// Boost constants
const DAILY_BOOSTS_LIMIT = 3;
const BOOST_DURATION_MS = 60000; // 1 minute

const getCurrentDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const day = today.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function HomePage() {
  const { toast } = useToast();
  const [score, setScore] = useState(INITIAL_SCORE);
  const [maxEnergy, setMaxEnergy] = useState(INITIAL_MAX_ENERGY);
  const [energy, setEnergy] = useState(INITIAL_MAX_ENERGY);
  const [clickPower, setClickPower] = useState(INITIAL_CLICK_POWER);
  const [energyRegenRatePerSecond, setEnergyRegenRatePerSecond] = useState(INITIAL_ENERGY_REGEN_RATE_PER_SECOND);

  const [totalClicks, setTotalClicks] = useState(INITIAL_TOTAL_CLICKS);
  const [gameStartTime, setGameStartTime] = useState<Date | null>(null);
  const [gameTimePlayed, setGameTimePlayed] = useState("0s");

  const [isAnimatingClick, setIsAnimatingClick] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const router = useRouter();

  const [dailyClicks, setDailyClicks] = useState(0);
  const [dailyCoinsCollected, setDailyCoinsCollected] = useState(0);
  const [dailyTimePlayedSeconds, setDailyTimePlayedSeconds] = useState(0);
  const [lastResetDate, setLastResetDate] = useState(getCurrentDateString());

  const [currentSkin, setCurrentSkin] = useState<Skin>(defaultSkin);
  const [isBotOwned, setIsBotOwned] = useState(false);

  // Boost states
  const [dailyBoostsAvailable, setDailyBoostsAvailable] = useState(DAILY_BOOSTS_LIMIT);
  const [isBoostActive, setIsBoostActive] = useState(false);
  const [boostEndTime, setBoostEndTime] = useState(0);
  const [originalClickPower, setOriginalClickPower] = useState(0);


  const allTasksForNotification = useMemo(() => [...initialDailyTasks, ...initialMainTasks, ...initialLeagueTasks], []);

  const getFullProgressForCheck = useCallback(() => {
    const ownedSkinsRaw = localStorage.getItem('ownedSkins');
    const ownedSkinsArray: string[] = ownedSkinsRaw ? JSON.parse(ownedSkinsRaw) : ['classic'];

    return {
      daily_clicks: dailyClicks,
      daily_coinsCollected: dailyCoinsCollected,
      daily_timePlayedSeconds: dailyTimePlayedSeconds,
      userScore: score,
      ownedSkin_emerald: ownedSkinsArray.includes('emerald') ? 1 : 0,
      ownedSkin_rainbow: ownedSkinsArray.includes('rainbow') ? 1 : 0,
      ownedSkins_length: ownedSkinsArray.length,
    };
  }, [dailyClicks, dailyCoinsCollected, dailyTimePlayedSeconds, score]);

  useEffect(() => {
    const storedScore = localStorage.getItem('userScore');
    setScore(storedScore ? parseInt(storedScore, 10) : INITIAL_SCORE);

    const storedTotalClicks = localStorage.getItem('totalClicks');
    setTotalClicks(storedTotalClicks ? parseInt(storedTotalClicks, 10) : INITIAL_TOTAL_CLICKS);

    const storedGameStartTime = localStorage.getItem('gameStartTime');
    setGameStartTime(storedGameStartTime ? new Date(storedGameStartTime) : new Date());

    const currentDateStr = getCurrentDateString();
    const storedLastResetDate = localStorage.getItem('daily_lastResetDate');
    const storedLastBoostResetDate = localStorage.getItem('daily_lastBoostResetDate');
    const storedDailyBoostsAvailable = localStorage.getItem('daily_boostsAvailable');

    if (storedLastResetDate === currentDateStr) {
      setDailyClicks(parseInt(localStorage.getItem('daily_clicks') || '0', 10));
      setDailyCoinsCollected(parseInt(localStorage.getItem('daily_coinsCollected') || '0', 10));
      setDailyTimePlayedSeconds(parseInt(localStorage.getItem('daily_timePlayedSeconds') || '0', 10));
    } else {
      setDailyClicks(0);
      setDailyCoinsCollected(0);
      setDailyTimePlayedSeconds(0);
      localStorage.setItem('daily_lastResetDate', currentDateStr);
      localStorage.setItem('daily_clicks', '0');
      localStorage.setItem('daily_coinsCollected', '0');
      localStorage.setItem('daily_timePlayedSeconds', '0');

      const dailyTierIds = new Set<string>();
      initialDailyTasks.forEach(task => task.tiers.forEach(tier => dailyTierIds.add(tier.id)));

      const completedUnclaimed = JSON.parse(localStorage.getItem('completedUnclaimedTaskTierIds') || '[]') as string[];
      const newCompletedUnclaimed = completedUnclaimed.filter(id => !dailyTierIds.has(id));
      localStorage.setItem('completedUnclaimedTaskTierIds', JSON.stringify(newCompletedUnclaimed));

      const claimed = JSON.parse(localStorage.getItem('claimedTaskTierIds') || '[]') as string[];
      const newClaimed = claimed.filter(id => !dailyTierIds.has(id));
      localStorage.setItem('claimedTaskTierIds', JSON.stringify(newClaimed));
    }
    setLastResetDate(currentDateStr);


    if (storedLastBoostResetDate === currentDateStr) {
        setDailyBoostsAvailable(storedDailyBoostsAvailable ? parseInt(storedDailyBoostsAvailable, 10) : DAILY_BOOSTS_LIMIT);
    } else {
        setDailyBoostsAvailable(DAILY_BOOSTS_LIMIT);
        localStorage.setItem('daily_lastBoostResetDate', currentDateStr);
        // If a boost was active and the day rolled over, deactivate it silently
        if (isBoostActive && originalClickPower > 0) { // Check originalClickPower to avoid issues if it was never set
            setClickPower(originalClickPower); 
        }
        setIsBoostActive(false);
        setBoostEndTime(0);
    }


    const unclaimedRewards = JSON.parse(localStorage.getItem('completedUnclaimedTaskTierIds') || '[]') as string[];
    if (unclaimedRewards.length > 0 && !sessionStorage.getItem('newRewardsToastShownThisSession')) {
      toast({
        title: "🎉 Новые награды доступны!",
        description: "Загляните во вкладку 'Награды', чтобы забрать их.",
        duration: 5000,
      });
      sessionStorage.setItem('newRewardsToastShownThisSession', 'true');
    }
    
    const selectedSkinIdFromStorage = localStorage.getItem('selectedSkinId');
    const skinToApply = initialSkins.find(s => s.id === selectedSkinIdFromStorage) || defaultSkin;
    setCurrentSkin(skinToApply);

    const storedIsBotOwned = localStorage.getItem('isBotOwned');
    if (storedIsBotOwned === 'true') {
      setIsBotOwned(true);
    }

    const initialClickPowerFromStorage = parseInt(localStorage.getItem('clickPower') || INITIAL_CLICK_POWER.toString(), 10);
    setClickPower(initialClickPowerFromStorage); // Set initial clickPower from storage

    if (storedIsBotOwned === 'true') {
      const lastSeen = localStorage.getItem('lastSeenTimestamp');
      if (lastSeen) {
        const timeOfflineInSeconds = Math.floor((Date.now() - parseInt(lastSeen, 10)) / 1000);
        if (timeOfflineInSeconds > 0) {
          const botClicksCount = Math.floor(timeOfflineInSeconds / BOT_CLICK_INTERVAL_SECONDS);
          // Use the click power that was active when user left, from localStorage
          const clickPowerForBot = parseInt(localStorage.getItem('clickPower') || INITIAL_CLICK_POWER.toString(), 10);
          const coinsEarnedByBot = botClicksCount * clickPowerForBot;
          const actualCoinsEarned = Math.min(coinsEarnedByBot, BOT_MAX_OFFLINE_COINS);

          if (actualCoinsEarned > 0) {
            setScore(prevScore => prevScore + actualCoinsEarned);
            toast({
              title: (
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-foreground">Бот Помог!</span>
                </div>
              ),
              description: `Ваш оффлайн бот собрал ${actualCoinsEarned.toLocaleString()} монет, пока вас не было.`,
              duration: 7000,
            });
          }
        }
      }
    }
    localStorage.setItem('lastSeenTimestamp', Date.now().toString());

  }, [toast]); // isBoostActive, originalClickPower removed from deps to avoid issues on initial load day change

  useEffect(() => {
    localStorage.setItem('userScore', score.toString());
    localStorage.setItem('totalClicks', totalClicks.toString());
    if (gameStartTime) {
      localStorage.setItem('gameStartTime', gameStartTime.toISOString());
    }
    localStorage.setItem('clickPower', clickPower.toString());
    checkAndNotifyTaskCompletion(getFullProgressForCheck(), allTasksForNotification, toast);
  }, [score, totalClicks, gameStartTime, clickPower, getFullProgressForCheck, allTasksForNotification, toast]);

  useEffect(() => {
    localStorage.setItem('daily_lastResetDate', lastResetDate);
    localStorage.setItem('daily_clicks', dailyClicks.toString());
    localStorage.setItem('daily_coinsCollected', dailyCoinsCollected.toString());
    localStorage.setItem('daily_timePlayedSeconds', dailyTimePlayedSeconds.toString());
    checkAndNotifyTaskCompletion(getFullProgressForCheck(), allTasksForNotification, toast);
  }, [lastResetDate, dailyClicks, dailyCoinsCollected, dailyTimePlayedSeconds, getFullProgressForCheck, allTasksForNotification, toast]);

  useEffect(() => {
    localStorage.setItem('daily_boostsAvailable', dailyBoostsAvailable.toString());
  }, [dailyBoostsAvailable]);

  // Boost Timer Effect
  useEffect(() => {
    if (!isBoostActive || boostEndTime === 0) {
      // Ensure originalClickPower is not 0 if we are trying to reset from an active boost that somehow loaded without original
      // This scenario is less likely with current non-persistent boost logic.
      if (isBoostActive && originalClickPower === 0 && clickPower !== INITIAL_CLICK_POWER) {
         //This might indicate an issue, perhaps log or reset to a base value
         //For now, if boost was active but original wasn't set, it might have been a new session issue
         //Let's assume if originalClickPower is 0, we might not need to revert or revert to initial
      }
      return;
    }

    const timer = setInterval(() => {
      if (Date.now() >= boostEndTime) {
        if (originalClickPower > 0) { // Only revert if originalClickPower was properly set
          setClickPower(originalClickPower);
        }
        setIsBoostActive(false);
        setBoostEndTime(0);
        setOriginalClickPower(0); // Reset original click power
        toast({
          title: "⚙️ Буст Завершён",
          description: "Действие буста x2 силы клика закончилось.",
          duration: 4000,
        });
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isBoostActive, boostEndTime, originalClickPower, toast, setClickPower]);


  const energyRegenAmountPerInterval = energyRegenRatePerSecond * (ENERGY_REGEN_INTERVAL / 1000);

  const handleCoinClick = useCallback(() => {
    if (energy >= ENERGY_PER_CLICK) {
      const scoreIncrease = clickPower; // clickPower is already doubled if boost is active

      setScore((prevScore) => prevScore + scoreIncrease);
      setEnergy((prevEnergy) => Math.max(0, prevEnergy - ENERGY_PER_CLICK));
      setTotalClicks((prevClicks) => prevClicks + 1);

      setDailyClicks((prev) => prev + 1);
      setDailyCoinsCollected((prev) => prev + scoreIncrease);

      if (!isAnimatingClick) {
        setIsAnimatingClick(true);
        setTimeout(() => {
          setIsAnimatingClick(false);
        }, CLICK_ANIMATION_DURATION);
      }
    }
  }, [energy, clickPower, isAnimatingClick]);

  useEffect(() => {
    const regenTimer = setInterval(() => {
      setEnergy((prevEnergy) => Math.min(maxEnergy, prevEnergy + energyRegenAmountPerInterval));
    }, ENERGY_REGEN_INTERVAL);

    return () => clearInterval(regenTimer);
  }, [maxEnergy, energyRegenAmountPerInterval]);

  useEffect(() => {
    if (!gameStartTime) return;
    const timePlayedTimer = setInterval(() => {
      setGameTimePlayed(formatDistanceStrict(new Date(), gameStartTime, {roundingMethod: 'floor'}));
    }, 1000);
    return () => clearInterval(timePlayedTimer);
  }, [gameStartTime]);

  useEffect(() => {
    const dailyTimeUpdateTimer = setInterval(() => {
      setDailyTimePlayedSeconds(prev => prev + (DAILY_STATS_UPDATE_INTERVAL / 1000));
    }, DAILY_STATS_UPDATE_INTERVAL);
    return () => clearInterval(dailyTimeUpdateTimer);
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      const unclaimedRewards = JSON.parse(localStorage.getItem('completedUnclaimedTaskTierIds') || '[]') as string[];
      if (unclaimedRewards.length > 0 && !sessionStorage.getItem('newRewardsToastShownThisSession')) {
         toast({
            title: "🎉 Новые награды доступны!",
            description: "Загляните во вкладку 'Награды', чтобы забрать их.",
            duration: 5000,
        });
        sessionStorage.setItem('newRewardsToastShownThisSession', 'true');
      }
      if (unclaimedRewards.length === 0) {
        sessionStorage.removeItem('newRewardsToastShownThisSession');
      }
    }, 10000);

    return () => clearInterval(intervalId);
  }, [toast]);

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'selectedSkinId' && event.newValue) {
        const skinToApply = initialSkins.find(s => s.id === event.newValue) || defaultSkin;
        setCurrentSkin(skinToApply);
      }
      if (event.key === 'isBotOwned' && event.newValue) {
        setIsBotOwned(event.newValue === 'true');
      }
      if (event.key === 'daily_boostsAvailable' && event.newValue) {
        setDailyBoostsAvailable(parseInt(event.newValue, 10));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      localStorage.setItem('lastSeenTimestamp', Date.now().toString());
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);


  const toggleShop = () => {
    setIsShopOpen(prev => !prev);
  };

  const handlePurchase = (upgradeId: UpgradeId, cost: number) => {
    if (score >= cost) {
      setScore(prevScore => prevScore - cost);
      switch (upgradeId) {
        case 'maxEnergyUpgrade':
          setMaxEnergy(prev => prev + 50);
          break;
        case 'clickPowerUpgrade':
          // If boost is active, new base click power should be half of current, then doubled.
          // Or, more simply, increase originalClickPower if boost is active, else clickPower.
          // For simplicity now: this upgrades the base click power. If boost is active, its effect is multiplicative on new base.
          if (isBoostActive) {
            setOriginalClickPower(prev => prev +1); // Upgrade base power
            setClickPower(prev => (prev / 2) + 1 * 2); // Recalculate boosted
          } else {
            setClickPower(prev => prev + 1);
          }
          break;
        case 'energyRegenRateUpgrade':
          setEnergyRegenRatePerSecond(prev => prev + 1);
          break;
        case 'offlineBotPurchase':
          setIsBotOwned(true);
          localStorage.setItem('isBotOwned', 'true');
          toast({
            title: "🤖 Оффлайн Бот Активирован!",
            description: "Теперь ваш бот будет собирать монеты, пока вы отдыхаете.",
            duration: 5000,
          });
          break;
      }
      return true;
    }
    return false;
  };

  const handleActivateBoost = useCallback(() => {
    if (dailyBoostsAvailable > 0 && !isBoostActive) {
      setOriginalClickPower(clickPower);
      setClickPower(prev => prev * 2);
      setDailyBoostsAvailable(prev => prev - 1);
      setIsBoostActive(true);
      setBoostEndTime(Date.now() + BOOST_DURATION_MS);

      toast({
        title: "🚀 Буст Активирован!",
        description: "x2 сила клика на 1 минуту.",
        duration: 4000,
      });
    }
  }, [dailyBoostsAvailable, isBoostActive, clickPower, toast, setClickPower, setOriginalClickPower, setDailyBoostsAvailable, setIsBoostActive, setBoostEndTime]);


  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <div className={cn(
        "flex flex-col min-h-screen bg-gradient-to-br text-foreground font-body antialiased selection:bg-primary selection:text-primary-foreground",
        currentSkin.pageGradientFromClass,
        currentSkin.pageGradientToClass
      )}>
      <TopBar onShopClick={toggleShop} />
      <GameStats
        score={score}
        currentEnergy={energy}
        maxEnergy={maxEnergy}
        clickPower={clickPower} // This will show boosted power if active
        energyRegenRate={energyRegenRatePerSecond}
        isBoostActive={isBoostActive}
        boostEndTime={boostEndTime}
      />

      <main className="flex flex-col items-center justify-center flex-grow pt-32 pb-20 md:pt-36 md:pb-24 px-4">
        <ClickableCoin
          onClick={handleCoinClick}
          isAnimating={isAnimatingClick}
          disabled={energy < ENERGY_PER_CLICK}
          coinColorClass={currentSkin.coinColorClass}
          coinIconColorClass={currentSkin.coinIconColorClass}
        />
      </main>

      <BottomNavBar onNavigate={handleNavigation} />

      <ShopModal
        isOpen={isShopOpen}
        onOpenChange={setIsShopOpen}
        score={score}
        currentMaxEnergy={maxEnergy}
        currentClickPower={clickPower} // Pass current (potentially boosted) click power
        baseClickPower={isBoostActive ? originalClickPower : clickPower} // Pass base for bot description
        currentEnergyRegenRate={energyRegenRatePerSecond}
        onPurchase={handlePurchase}
        isBotOwned={isBotOwned}
        botPurchaseCost={BOT_PURCHASE_COST}
        botClickIntervalSeconds={BOT_CLICK_INTERVAL_SECONDS}
        botMaxOfflineCoins={BOT_MAX_OFFLINE_COINS}
        dailyBoostsAvailable={dailyBoostsAvailable}
        isBoostActive={isBoostActive}
        onActivateBoost={handleActivateBoost}
        boostEndTime={boostEndTime}
      />
    </div>
  );
}

