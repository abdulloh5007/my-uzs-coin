
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
import { Bot, Coins as CoinsIcon, Sparkles } from 'lucide-react'; // Renamed Coins to CoinsIcon
import type { ToastActionElement } from "@/components/ui/toast";
import { ToastAction } from "@/components/ui/toast";
import { useAuth } from '@/context/AuthContext';


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
const DAILY_CLICK_BOOST_LIMIT = 3;
const DAILY_FULL_ENERGY_BOOST_LIMIT = 3;
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
  const router = useRouter();
  const { currentUser, loading: authLoading } = useAuth();

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

  const [dailyClicks, setDailyClicks] = useState(0);
  const [dailyCoinsCollected, setDailyCoinsCollected] = useState(0);
  const [dailyTimePlayedSeconds, setDailyTimePlayedSeconds] = useState(0);
  const [lastResetDate, setLastResetDate] = useState(getCurrentDateString());

  const [currentSkin, setCurrentSkin] = useState<Skin>(defaultSkin);
  const [isBotOwned, setIsBotOwned] = useState(false);

  // Boost states
  const [dailyClickBoostsAvailable, setDailyClickBoostsAvailable] = useState(DAILY_CLICK_BOOST_LIMIT);
  const [dailyFullEnergyBoostsAvailable, setDailyFullEnergyBoostsAvailable] = useState(DAILY_FULL_ENERGY_BOOST_LIMIT);
  const [isBoostActive, setIsBoostActive] = useState(false);
  const [boostEndTime, setBoostEndTime] = useState(0);
  const [originalClickPower, setOriginalClickPower] = useState(0);


  const allTasksForNotification = useMemo(() => [...initialDailyTasks, ...initialMainTasks, ...initialLeagueTasks], []);

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, authLoading, router]);

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
    if (!currentUser) return; // Don't run if not authenticated

    const storedScore = localStorage.getItem('userScore');
    setScore(storedScore ? parseInt(storedScore, 10) : INITIAL_SCORE);

    const storedTotalClicks = localStorage.getItem('totalClicks');
    setTotalClicks(storedTotalClicks ? parseInt(storedTotalClicks, 10) : INITIAL_TOTAL_CLICKS);

    const storedGameStartTime = localStorage.getItem('gameStartTime');
    setGameStartTime(storedGameStartTime ? new Date(storedGameStartTime) : new Date());

    const currentDateStr = getCurrentDateString();
    const storedLastResetDate = localStorage.getItem('daily_lastResetDate');
    const storedLastClickBoostResetDate = localStorage.getItem('daily_lastClickBoostResetDate');
    const storedDailyClickBoostsAvailable = localStorage.getItem('daily_clickBoostsAvailable');
    const storedLastFullEnergyBoostResetDate = localStorage.getItem('daily_lastFullEnergyBoostResetDate');
    const storedDailyFullEnergyBoostsAvailable = localStorage.getItem('daily_fullEnergyBoostsAvailable');


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

    // Click Boost Reset
    if (storedLastClickBoostResetDate === currentDateStr) {
        setDailyClickBoostsAvailable(storedDailyClickBoostsAvailable ? parseInt(storedDailyClickBoostsAvailable, 10) : DAILY_CLICK_BOOST_LIMIT);
    } else {
        setDailyClickBoostsAvailable(DAILY_CLICK_BOOST_LIMIT);
        localStorage.setItem('daily_lastClickBoostResetDate', currentDateStr);
        if (isBoostActive && originalClickPower > 0) { 
            setClickPower(originalClickPower); 
        }
        setIsBoostActive(false);
        setBoostEndTime(0);
    }

    // Full Energy Boost Reset
    if (storedLastFullEnergyBoostResetDate === currentDateStr) {
        setDailyFullEnergyBoostsAvailable(storedDailyFullEnergyBoostsAvailable ? parseInt(storedDailyFullEnergyBoostsAvailable, 10) : DAILY_FULL_ENERGY_BOOST_LIMIT);
    } else {
        setDailyFullEnergyBoostsAvailable(DAILY_FULL_ENERGY_BOOST_LIMIT);
        localStorage.setItem('daily_lastFullEnergyBoostResetDate', currentDateStr);
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

    const initialClickPowerFromStorage = parseInt(localStorage.getItem('clickPower') || INITIAL_CLICK_POWER.toString(), 10);
    setClickPower(initialClickPowerFromStorage);

    // --- Bot Logic ---
    const storedIsBotOwned = localStorage.getItem('isBotOwned');
    setIsBotOwned(storedIsBotOwned === 'true'); 

    const previouslyUnclaimedBotCoinsRaw = localStorage.getItem('unclaimedBotCoins');
    const previouslyUnclaimedBotCoins = previouslyUnclaimedBotCoinsRaw ? parseInt(previouslyUnclaimedBotCoinsRaw, 10) : 0;

    if (previouslyUnclaimedBotCoins > 0 && storedIsBotOwned === 'true') {
        toast({
            title: (
                <div className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-primary" />
                    <span className="font-semibold text-foreground">Бот Ожидает!</span>
                </div>
            ),
            description: `У вас есть ${previouslyUnclaimedBotCoins.toLocaleString()} монет от бота, ожидающих сбора.`,
            duration: 30000, 
            action: (
                <ToastAction
                    altText="Забрать"
                    onClick={() => {
                        setScore(prevScore => {
                            const newScore = prevScore + previouslyUnclaimedBotCoins;
                            localStorage.setItem('userScore', newScore.toString());
                            return newScore;
                        });
                        localStorage.removeItem('unclaimedBotCoins'); 
                        toast({
                            title: "💰 Монеты зачислены!",
                            description: `${previouslyUnclaimedBotCoins.toLocaleString()} монет добавлено на ваш баланс.`,
                            duration: 3000,
                        });
                    }}
                >
                    Забрать
                </ToastAction>
            ) as ToastActionElement,
        });
        localStorage.setItem('lastSeenTimestamp', Date.now().toString()); 
    } else if (storedIsBotOwned === 'true') {
        const lastSeen = localStorage.getItem('lastSeenTimestamp');
        if (lastSeen) {
            const timeOfflineInSeconds = Math.floor((Date.now() - parseInt(lastSeen, 10)) / 1000);
            
            if (timeOfflineInSeconds > BOT_CLICK_INTERVAL_SECONDS) { 
                const botClicksCount = Math.floor(timeOfflineInSeconds / BOT_CLICK_INTERVAL_SECONDS);
                const clickPowerForBot = parseInt(localStorage.getItem('clickPower') || INITIAL_CLICK_POWER.toString(), 10);
                const coinsEarnedByBot = botClicksCount * clickPowerForBot;
                const actualCoinsEarned = Math.min(coinsEarnedByBot, BOT_MAX_OFFLINE_COINS);

                if (actualCoinsEarned > 0) {
                    localStorage.setItem('unclaimedBotCoins', actualCoinsEarned.toString());
                    toast({
                        title: (
                            <div className="flex items-center gap-2">
                                <Bot className="h-5 w-5 text-primary" />
                                <span className="font-semibold text-foreground">Бот Помог!</span>
                            </div>
                        ),
                        description: `Ваш оффлайн бот готов передать вам ${actualCoinsEarned.toLocaleString()} монет.`,
                        duration: 30000, 
                        action: (
                            <ToastAction
                                altText="Забрать"
                                onClick={() => {
                                    setScore(prevScore => {
                                        const newScore = prevScore + actualCoinsEarned;
                                        localStorage.setItem('userScore', newScore.toString());
                                        return newScore;
                                    });
                                    localStorage.removeItem('unclaimedBotCoins'); 
                                    toast({
                                        title: "💰 Монеты зачислены!",
                                        description: `${actualCoinsEarned.toLocaleString()} монет добавлено на ваш баланс.`,
                                        duration: 3000,
                                    });
                                }}
                            >
                                Забрать
                            </ToastAction>
                        ) as ToastActionElement,
                    });
                }
            }
        }
        localStorage.setItem('lastSeenTimestamp', Date.now().toString());
    } else {
        localStorage.setItem('lastSeenTimestamp', Date.now().toString());
    }
    // --- End of Bot Logic ---

  }, [toast, currentUser, authLoading, isBoostActive, originalClickPower]); // Added dependencies for boost logic

  useEffect(() => {
    if (!currentUser) return;
    localStorage.setItem('userScore', score.toString());
    localStorage.setItem('totalClicks', totalClicks.toString());
    if (gameStartTime) {
      localStorage.setItem('gameStartTime', gameStartTime.toISOString());
    }
    localStorage.setItem('clickPower', clickPower.toString());
    checkAndNotifyTaskCompletion(getFullProgressForCheck(), allTasksForNotification, toast);
  }, [score, totalClicks, gameStartTime, clickPower, getFullProgressForCheck, allTasksForNotification, toast, currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    localStorage.setItem('daily_lastResetDate', lastResetDate);
    localStorage.setItem('daily_clicks', dailyClicks.toString());
    localStorage.setItem('daily_coinsCollected', dailyCoinsCollected.toString());
    localStorage.setItem('daily_timePlayedSeconds', dailyTimePlayedSeconds.toString());
    checkAndNotifyTaskCompletion(getFullProgressForCheck(), allTasksForNotification, toast);
  }, [lastResetDate, dailyClicks, dailyCoinsCollected, dailyTimePlayedSeconds, getFullProgressForCheck, allTasksForNotification, toast, currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    localStorage.setItem('daily_clickBoostsAvailable', dailyClickBoostsAvailable.toString());
    localStorage.setItem('daily_lastClickBoostResetDate', localStorage.getItem('daily_lastClickBoostResetDate') || getCurrentDateString());
  }, [dailyClickBoostsAvailable, currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    localStorage.setItem('daily_fullEnergyBoostsAvailable', dailyFullEnergyBoostsAvailable.toString());
    localStorage.setItem('daily_lastFullEnergyBoostResetDate', localStorage.getItem('daily_lastFullEnergyBoostResetDate') || getCurrentDateString());
  }, [dailyFullEnergyBoostsAvailable, currentUser]);


  // Boost Timer Effect
  useEffect(() => {
    if (!currentUser || !isBoostActive || boostEndTime === 0) {
      return;
    }

    const timer = setInterval(() => {
      if (Date.now() >= boostEndTime) {
        if (originalClickPower > 0) { 
          setClickPower(originalClickPower);
        }
        setIsBoostActive(false);
        setBoostEndTime(0);
        setOriginalClickPower(0); 
        toast({
          title: "⚙️ Буст Завершён",
          description: "Действие буста x2 силы клика закончилось.",
          duration: 4000,
        });
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isBoostActive, boostEndTime, originalClickPower, toast, currentUser]);


  const energyRegenAmountPerInterval = energyRegenRatePerSecond * (ENERGY_REGEN_INTERVAL / 1000);

  const handleCoinClick = useCallback(() => {
    if (!currentUser) return;
    if (energy >= ENERGY_PER_CLICK) {
      const scoreIncrease = clickPower; 

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
  }, [energy, clickPower, isAnimatingClick, currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const regenTimer = setInterval(() => {
      setEnergy((prevEnergy) => Math.min(maxEnergy, prevEnergy + energyRegenAmountPerInterval));
    }, ENERGY_REGEN_INTERVAL);

    return () => clearInterval(regenTimer);
  }, [maxEnergy, energyRegenAmountPerInterval, currentUser]);

  useEffect(() => {
    if (!currentUser || !gameStartTime) return;
    const timePlayedTimer = setInterval(() => {
      setGameTimePlayed(formatDistanceStrict(new Date(), gameStartTime, {roundingMethod: 'floor'}));
    }, 1000);
    return () => clearInterval(timePlayedTimer);
  }, [gameStartTime, currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const dailyTimeUpdateTimer = setInterval(() => {
      setDailyTimePlayedSeconds(prev => prev + (DAILY_STATS_UPDATE_INTERVAL / 1000));
    }, DAILY_STATS_UPDATE_INTERVAL);
    return () => clearInterval(dailyTimeUpdateTimer);
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
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
  }, [toast, currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'selectedSkinId' && event.newValue) {
        const skinToApply = initialSkins.find(s => s.id === event.newValue) || defaultSkin;
        setCurrentSkin(skinToApply);
      }
      if (event.key === 'isBotOwned' && event.newValue) {
        setIsBotOwned(event.newValue === 'true');
      }
      if (event.key === 'daily_clickBoostsAvailable' && event.newValue) {
        setDailyClickBoostsAvailable(parseInt(event.newValue, 10));
      }
      if (event.key === 'daily_fullEnergyBoostsAvailable' && event.newValue) {
        setDailyFullEnergyBoostsAvailable(parseInt(event.newValue, 10));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const handleBeforeUnload = () => {
      localStorage.setItem('lastSeenTimestamp', Date.now().toString());
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentUser]);


  const toggleShop = () => {
    if (!currentUser) return;
    setIsShopOpen(prev => !prev);
  };

  const handlePurchase = (upgradeId: UpgradeId, cost: number) => {
    if (!currentUser) return false;
    if (score >= cost) {
      setScore(prevScore => prevScore - cost);
      switch (upgradeId) {
        case 'maxEnergyUpgrade':
          setMaxEnergy(prev => prev + 50);
          break;
        case 'clickPowerUpgrade':
          if (isBoostActive) {
            setOriginalClickPower(prev => prev +1); 
            setClickPower(prev => (prev / 2) + 1 * 2); 
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
          localStorage.setItem('lastSeenTimestamp', Date.now().toString());
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

  const handleActivateClickBoost = useCallback(() => {
    if (!currentUser) return;
    if (dailyClickBoostsAvailable > 0 && !isBoostActive) {
      setOriginalClickPower(clickPower);
      setClickPower(prev => prev * 2);
      setDailyClickBoostsAvailable(prev => prev - 1);
      setIsBoostActive(true);
      setBoostEndTime(Date.now() + BOOST_DURATION_MS);

      toast({
        title: "🚀 Буст Активирован!",
        description: "x2 сила клика на 1 минуту.",
        duration: 4000,
      });
    }
  }, [dailyClickBoostsAvailable, isBoostActive, clickPower, toast, currentUser]);

  const handleActivateFullEnergyBoost = useCallback(() => {
    if (!currentUser) return;
    if (dailyFullEnergyBoostsAvailable > 0) {
      setEnergy(maxEnergy);
      setDailyFullEnergyBoostsAvailable(prev => prev - 1);
      toast({
        title: "⚡ Энергия Восстановлена!",
        description: "Ваша энергия полностью заполнена.",
        duration: 4000,
      });
    }
  }, [dailyFullEnergyBoostsAvailable, maxEnergy, toast, currentUser]);


  const handleNavigation = (path: string) => {
    router.push(path);
  };

  if (authLoading || (!currentUser && !authLoading)) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-gradient-to-br from-background to-indigo-900/50">
        <Sparkles className="w-16 h-16 animate-spin text-primary" />
        <p className="mt-4 text-lg text-foreground">Загрузка игры...</p>
      </div>
    );
  }

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
        clickPower={clickPower}
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
        currentClickPower={clickPower} 
        baseClickPower={isBoostActive ? originalClickPower : clickPower} 
        currentEnergyRegenRate={energyRegenRatePerSecond}
        onPurchase={handlePurchase}
        isBotOwned={isBotOwned}
        botPurchaseCost={BOT_PURCHASE_COST}
        botClickIntervalSeconds={BOT_CLICK_INTERVAL_SECONDS}
        botMaxOfflineCoins={BOT_MAX_OFFLINE_COINS}
        dailyClickBoostsAvailable={dailyClickBoostsAvailable}
        isBoostActive={isBoostActive}
        onActivateClickBoost={handleActivateClickBoost}
        boostEndTime={boostEndTime}
        dailyFullEnergyBoostsAvailable={dailyFullEnergyBoostsAvailable}
        onActivateFullEnergyBoost={handleActivateFullEnergyBoost}
      />
    </div>
  );
}
