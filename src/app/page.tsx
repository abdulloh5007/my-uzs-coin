
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import ClickableCoin from '@/components/ClickableCoin';
import TopBar from '@/components/TopBar';
import BottomNavBar from '@/components/BottomNavBar';
import GameStats from '@/components/GameStats';
import ShopModal from '@/components/ShopModal';
import type { UpgradeId } from '@/components/ShopModal';
import { useRouter } from 'next/navigation';
import { formatDistanceStrict } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import type { Task, TaskTier } from '@/types/tasks'; // For daily reset
import { initialDailyTasks } from '@/app/tasks/page'; // For daily reset

const INITIAL_MAX_ENERGY = 100;
const INITIAL_CLICK_POWER = 1;
const INITIAL_ENERGY_REGEN_RATE_PER_SECOND = 3;
const INITIAL_SCORE = 300; 
const INITIAL_TOTAL_CLICKS = 0; 

const ENERGY_PER_CLICK = 1;
const ENERGY_REGEN_INTERVAL = 50; 
const CLICK_ANIMATION_DURATION = 200;
const DAILY_STATS_UPDATE_INTERVAL = 1000; 

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

  // Daily Stats
  const [dailyClicks, setDailyClicks] = useState(0);
  const [dailyCoinsCollected, setDailyCoinsCollected] = useState(0);
  const [dailyTimePlayedSeconds, setDailyTimePlayedSeconds] = useState(0);
  const [lastResetDate, setLastResetDate] = useState(getCurrentDateString());

  // Notification for new rewards
  const [hasShownNewRewardsToast, setHasShownNewRewardsToast] = useState(false);


  useEffect(() => {
    const storedScore = localStorage.getItem('userScore');
    setScore(storedScore ? parseInt(storedScore, 10) : INITIAL_SCORE);

    const storedTotalClicks = localStorage.getItem('totalClicks');
    setTotalClicks(storedTotalClicks ? parseInt(storedTotalClicks, 10) : INITIAL_TOTAL_CLICKS);
    
    const storedGameStartTime = localStorage.getItem('gameStartTime');
    setGameStartTime(storedGameStartTime ? new Date(storedGameStartTime) : new Date());

    const currentDateStr = getCurrentDateString();
    const storedLastResetDate = localStorage.getItem('daily_lastResetDate');

    if (storedLastResetDate === currentDateStr) {
      setDailyClicks(parseInt(localStorage.getItem('daily_clicks') || '0', 10));
      setDailyCoinsCollected(parseInt(localStorage.getItem('daily_coinsCollected') || '0', 10));
      setDailyTimePlayedSeconds(parseInt(localStorage.getItem('daily_timePlayedSeconds') || '0', 10));
      setLastResetDate(currentDateStr);
    } else {
      // Reset daily stats
      setDailyClicks(0);
      setDailyCoinsCollected(0);
      setDailyTimePlayedSeconds(0);
      setLastResetDate(currentDateStr);
      localStorage.setItem('daily_lastResetDate', currentDateStr);
      localStorage.setItem('daily_clicks', '0');
      localStorage.setItem('daily_coinsCollected', '0');
      localStorage.setItem('daily_timePlayedSeconds', '0');

      // Reset daily claimed/unclaimed rewards
      const dailyTierIds = new Set<string>();
      initialDailyTasks.forEach(task => task.tiers.forEach(tier => dailyTierIds.add(tier.id)));

      const completedUnclaimed = JSON.parse(localStorage.getItem('completedUnclaimedTaskTierIds') || '[]') as string[];
      const newCompletedUnclaimed = completedUnclaimed.filter(id => !dailyTierIds.has(id));
      localStorage.setItem('completedUnclaimedTaskTierIds', JSON.stringify(newCompletedUnclaimed));
      
      const claimed = JSON.parse(localStorage.getItem('claimedTaskTierIds') || '[]') as string[];
      const newClaimed = claimed.filter(id => !dailyTierIds.has(id));
      localStorage.setItem('claimedTaskTierIds', JSON.stringify(newClaimed));
      setHasShownNewRewardsToast(false); // Reset toast flag for new day
    }

    // Check for unclaimed rewards on load
    const unclaimedRewards = JSON.parse(localStorage.getItem('completedUnclaimedTaskTierIds') || '[]') as string[];
    if (unclaimedRewards.length > 0 && !sessionStorage.getItem('newRewardsToastShownThisSession')) {
      toast({
        title: "🎉 Новые награды доступны!",
        description: "Загляните во вкладку 'Награды', чтобы забрать их.",
        duration: 5000, 
      });
      sessionStorage.setItem('newRewardsToastShownThisSession', 'true');
    }

  }, []); // Removed hasShownNewRewardsToast from dependencies to avoid loop with toast

  useEffect(() => {
    localStorage.setItem('userScore', score.toString());
    localStorage.setItem('totalClicks', totalClicks.toString());
    if (gameStartTime) {
      localStorage.setItem('gameStartTime', gameStartTime.toISOString());
    }
  }, [score, totalClicks, gameStartTime]);

  useEffect(() => {
    localStorage.setItem('daily_lastResetDate', lastResetDate);
    localStorage.setItem('daily_clicks', dailyClicks.toString());
    localStorage.setItem('daily_coinsCollected', dailyCoinsCollected.toString());
    localStorage.setItem('daily_timePlayedSeconds', dailyTimePlayedSeconds.toString());
  }, [lastResetDate, dailyClicks, dailyCoinsCollected, dailyTimePlayedSeconds]);


  const energyRegenAmountPerInterval = energyRegenRatePerSecond * (ENERGY_REGEN_INTERVAL / 1000);

  const handleCoinClick = useCallback(() => {
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

  // Periodically check for new rewards (less aggressive than on every render)
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
      // If unclaimedRewards becomes 0, allow showing toast again next time
      if (unclaimedRewards.length === 0) {
        sessionStorage.removeItem('newRewardsToastShownThisSession');
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(intervalId);
  }, [toast]);


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
          setClickPower(prev => prev + 1);
          break;
        case 'energyRegenRateUpgrade':
          setEnergyRegenRatePerSecond(prev => prev + 1);
          break;
      }
      return true; 
    }
    return false; 
  };

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-body antialiased selection:bg-primary selection:text-primary-foreground">
      <TopBar onShopClick={toggleShop} />
      <GameStats
        score={score}
        currentEnergy={energy}
        maxEnergy={maxEnergy}
        clickPower={clickPower}
        energyRegenRate={energyRegenRatePerSecond} 
      />
      
      <main className="flex flex-col items-center justify-center flex-grow pt-32 pb-20 md:pt-36 md:pb-24 px-4">
        <ClickableCoin
          onClick={handleCoinClick}
          isAnimating={isAnimatingClick}
          disabled={energy < ENERGY_PER_CLICK}
        />
      </main>
      
      <BottomNavBar onNavigate={handleNavigation} />

      <ShopModal
        isOpen={isShopOpen}
        onOpenChange={setIsShopOpen}
        score={score}
        currentMaxEnergy={maxEnergy}
        currentClickPower={clickPower}
        currentEnergyRegenRate={energyRegenRatePerSecond}
        onPurchase={handlePurchase}
      />
    </div>
  );
}
