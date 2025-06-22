
"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
import { Bot, Coins as CoinsIcon, Sparkles } from 'lucide-react';
import type { ToastActionElement } from "@/components/ui/toast";
import { ToastAction } from "@/components/ui/toast";
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';

// --- Game Balance Constants ---
const INITIAL_MAX_ENERGY_BASE = 500;
const INITIAL_CLICK_POWER_BASE = 1;
const INITIAL_ENERGY_REGEN_RATE_BASE = 1;

const MAX_ENERGY_MAX_LEVEL = 9;
const CLICK_POWER_MAX_LEVEL = 9;
const ENERGY_REGEN_MAX_LEVEL = 4;

const MAX_ENERGY_INCREMENT_PER_LEVEL = 500;
const CLICK_POWER_INCREMENT_PER_LEVEL = 1;
const ENERGY_REGEN_INCREMENT_PER_LEVEL = 1;

export const maxEnergyUpgradeCosts = [250, 500, 1000, 2000, 4000, 8000, 16000, 32000, 64000];
export const clickPowerUpgradeCosts = [1600, 2880, 5184, 9331, 16796, 30233, 54419, 97955, 176319];
export const energyRegenUpgradeCosts = [800, 2400, 7200, 21600];

const INITIAL_SCORE = 0;
const INITIAL_TOTAL_CLICKS = 0;
const ENERGY_PER_CLICK = 1;
const ENERGY_REGEN_INTERVAL = 50;
const CLICK_ANIMATION_DURATION = 200;
const DAILY_STATS_UPDATE_INTERVAL = 1000;

const BOT_CLICK_INTERVAL_SECONDS = 2;
const BOT_MAX_OFFLINE_COINS = 299000;
const BOT_PURCHASE_COST = 200000;

const DAILY_CLICK_BOOST_LIMIT = 3;
const DAILY_FULL_ENERGY_BOOST_LIMIT = 3;
const BOOST_DURATION_MS = 60000;

// --- Firestore Game State Interface ---
interface UserGameState {
  score: number;
  maxEnergyLevel: number;
  clickPowerLevel: number;
  energyRegenLevel: number;
  totalClicks: number;
  gameStartTime?: string; // ISO string

  daily_clicks: number;
  daily_coinsCollected: number;
  daily_timePlayedSeconds: number;
  daily_lastResetDate: string; // YYYY-MM-DD

  daily_clickBoostsAvailable: number;
  daily_lastClickBoostResetDate: string; // YYYY-MM-DD
  daily_fullEnergyBoostsAvailable: number;
  daily_lastFullEnergyBoostResetDate: string; // YYYY-MM-DD

  isBotOwned: boolean;
  lastSeenTimestamp?: string; // ISO string or number
  unclaimedBotCoins: number;

  ownedSkins: string[];
  selectedSkinId: string;

  completedUnclaimedTaskTierIds: string[];
  claimedTaskTierIds: string[];
  
  ownedNfts: string[]; // For mint page

  lastUpdated?: any; // Firestore ServerTimestamp
}

const getCurrentDateString = () => {
  const today = new Date();
  return today.toISOString().split('T')[0]; // YYYY-MM-DD
};

const initialGameState: UserGameState = {
  score: INITIAL_SCORE,
  maxEnergyLevel: 0,
  clickPowerLevel: 0,
  energyRegenLevel: 0,
  totalClicks: INITIAL_TOTAL_CLICKS,
  gameStartTime: new Date().toISOString(),

  daily_clicks: 0,
  daily_coinsCollected: 0,
  daily_timePlayedSeconds: 0,
  daily_lastResetDate: getCurrentDateString(),

  daily_clickBoostsAvailable: DAILY_CLICK_BOOST_LIMIT,
  daily_lastClickBoostResetDate: getCurrentDateString(),
  daily_fullEnergyBoostsAvailable: DAILY_FULL_ENERGY_BOOST_LIMIT,
  daily_lastFullEnergyBoostResetDate: getCurrentDateString(),

  isBotOwned: false,
  lastSeenTimestamp: new Date().toISOString(),
  unclaimedBotCoins: 0,

  ownedSkins: ['classic'],
  selectedSkinId: 'classic',

  completedUnclaimedTaskTierIds: [],
  claimedTaskTierIds: [],
  ownedNfts: [],
};


export default function HomePage() {
  const { toast } = useToast();
  const router = useRouter();
  const { currentUser, loading: authLoading } = useAuth();
  const [isGameDataLoading, setIsGameDataLoading] = useState(true);
  const gameDataLoadedRef = useRef(false);

  // --- React State Variables ---
  const [score, setScore] = useState(INITIAL_SCORE);
  const [maxEnergyLevel, setMaxEnergyLevel] = useState(0);
  const [clickPowerLevel, setClickPowerLevel] = useState(0);
  const [energyRegenLevel, setEnergyRegenLevel] = useState(0);

  const [maxEnergy, setMaxEnergy] = useState(INITIAL_MAX_ENERGY_BASE);
  const [clickPower, setClickPower] = useState(INITIAL_CLICK_POWER_BASE);
  const [energyRegenRatePerSecond, setEnergyRegenRatePerSecond] = useState(INITIAL_ENERGY_REGEN_RATE_BASE);
  const [energy, setEnergy] = useState(INITIAL_MAX_ENERGY_BASE);

  const [totalClicks, setTotalClicks] = useState(INITIAL_TOTAL_CLICKS);
  const [gameStartTime, setGameStartTime] = useState<Date | null>(null);
  const [gameTimePlayed, setGameTimePlayed] = useState("0s");

  const [isAnimatingClick, setIsAnimatingClick] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);

  // Daily Stats
  const [dailyClicks, setDailyClicks] = useState(0);
  const [dailyCoinsCollected, setDailyCoinsCollected] = useState(0);
  const [dailyTimePlayedSeconds, setDailyTimePlayedSeconds] = useState(0);
  const [lastResetDate, setLastResetDate] = useState(getCurrentDateString());

  // Skins
  const [currentSkin, setCurrentSkin] = useState<Skin>(defaultSkin);
  const [ownedSkins, setOwnedSkins] = useState<string[]>(['classic']); // Firestore will be source of truth

  // Bot
  const [isBotOwned, setIsBotOwned] = useState(false);
  const [lastSeenTimestamp, setLastSeenTimestamp] = useState<string>(new Date().toISOString());
  const [unclaimedBotCoins, setUnclaimedBotCoins] = useState(0);

  // Boosts
  const [dailyClickBoostsAvailable, setDailyClickBoostsAvailable] = useState(DAILY_CLICK_BOOST_LIMIT);
  const [dailyFullEnergyBoostsAvailable, setDailyFullEnergyBoostsAvailable] = useState(DAILY_FULL_ENERGY_BOOST_LIMIT);
  const [lastClickBoostResetDate, setLastClickBoostResetDate] = useState(getCurrentDateString());
  const [lastFullEnergyBoostResetDate, setLastFullEnergyBoostResetDate] = useState(getCurrentDateString());

  const [isBoostActive, setIsBoostActive] = useState(false);
  const [boostEndTime, setBoostEndTime] = useState(0);
  const [originalClickPowerBeforeBoost, setOriginalClickPowerBeforeBoost] = useState(INITIAL_CLICK_POWER_BASE);

  // Tasks (read from localStorage for now, will be part of UserGameState)
  const [completedUnclaimedTaskTierIds, setCompletedUnclaimedTaskTierIds] = useState<string[]>([]);
  const [claimedTaskTierIds, setClaimedTaskTierIds] = useState<string[]>([]);
  
  // NFTs (read from localStorage for now)
  const [ownedNfts, setOwnedNfts] = useState<string[]>([]);


  const allTasksForNotification = useMemo(() => [...initialDailyTasks, ...initialMainTasks, ...initialLeagueTasks], []);

  // --- Firestore Functions ---
  const saveGameState = useCallback(async (userId: string) => {
    if (!userId) return;
    const gameStateToSave: UserGameState = {
      score, maxEnergyLevel, clickPowerLevel, energyRegenLevel, totalClicks,
      gameStartTime: gameStartTime ? gameStartTime.toISOString() : new Date().toISOString(),
      daily_clicks: dailyClicks, daily_coinsCollected, daily_timePlayedSeconds, daily_lastResetDate: lastResetDate,
      daily_clickBoostsAvailable, daily_lastClickBoostResetDate: lastClickBoostResetDate,
      daily_fullEnergyBoostsAvailable, daily_lastFullEnergyBoostResetDate: lastFullEnergyBoostResetDate,
      isBotOwned, lastSeenTimestamp, unclaimedBotCoins,
      ownedSkins, selectedSkinId: currentSkin.id, // Save currentSkin.id as selectedSkinId
      completedUnclaimedTaskTierIds, claimedTaskTierIds,
      ownedNfts,
      lastUpdated: serverTimestamp(),
    };
    try {
      const userDocRef = doc(db, 'users', userId);
      await setDoc(userDocRef, gameStateToSave, { merge: true });
    } catch (error) {
      console.error("Error saving game state:", error);
      toast({ variant: "destructive", title: "Ошибка сохранения", description: "Не удалось сохранить прогресс игры." });
    }
  }, [
    score, maxEnergyLevel, clickPowerLevel, energyRegenLevel, totalClicks, gameStartTime,
    dailyClicks, dailyCoinsCollected, dailyTimePlayedSeconds, lastResetDate,
    dailyClickBoostsAvailable, lastClickBoostResetDate,
    dailyFullEnergyBoostsAvailable, lastFullEnergyBoostResetDate,
    isBotOwned, lastSeenTimestamp, unclaimedBotCoins,
    ownedSkins, currentSkin.id, // Ensure currentSkin.id is used for selectedSkinId
    completedUnclaimedTaskTierIds, claimedTaskTierIds, ownedNfts, toast
  ]);

  const loadGameState = useCallback(async (userId: string) => {
    setIsGameDataLoading(true);
    gameDataLoadedRef.current = false;
    try {
      const userDocRef = doc(db, 'users', userId);
      const docSnap = await getDoc(userDocRef);
      const currentDateStr = getCurrentDateString();
      let stateToSet = { ...initialGameState }; // Start with defaults

      if (docSnap.exists()) {
        stateToSet = { ...initialGameState, ...docSnap.data() as UserGameState };

        // Handle date string to Date object conversion for gameStartTime
        if (stateToSet.gameStartTime && typeof stateToSet.gameStartTime === 'string') {
          setGameStartTime(new Date(stateToSet.gameStartTime));
        } else if (!stateToSet.gameStartTime) {
          stateToSet.gameStartTime = new Date().toISOString(); // Ensure new users get a gameStartTime
          setGameStartTime(new Date());
        } else {
           // If it's already a Timestamp or some other object, handle appropriately or log
           // For now, if it's not a string, we'll default. This might happen if Firestore auto-converts.
           console.warn("gameStartTime from Firestore was not a string:", stateToSet.gameStartTime);
           setGameStartTime(new Date( (stateToSet.gameStartTime as any)?.toDate?.() || Date.now()));
        }
        
        setScore(stateToSet.score);
        setMaxEnergyLevel(stateToSet.maxEnergyLevel);
        setClickPowerLevel(stateToSet.clickPowerLevel);
        setEnergyRegenLevel(stateToSet.energyRegenLevel);
        setTotalClicks(stateToSet.totalClicks);

        // Daily Stats Reset Logic
        if (stateToSet.daily_lastResetDate !== currentDateStr) {
          stateToSet.daily_clicks = 0;
          stateToSet.daily_coinsCollected = 0;
          stateToSet.daily_timePlayedSeconds = 0;
          stateToSet.daily_lastResetDate = currentDateStr;
          // Reset daily task progress in Firestore if necessary by updating task-related arrays
          const dailyTierIds = new Set<string>();
          initialDailyTasks.forEach(task => task.tiers.forEach(tier => dailyTierIds.add(tier.id)));
          stateToSet.completedUnclaimedTaskTierIds = stateToSet.completedUnclaimedTaskTierIds.filter(id => !dailyTierIds.has(id));
          stateToSet.claimedTaskTierIds = stateToSet.claimedTaskTierIds.filter(id => !dailyTierIds.has(id));
        }
        setDailyClicks(stateToSet.daily_clicks);
        setDailyCoinsCollected(stateToSet.daily_coinsCollected);
        setDailyTimePlayedSeconds(stateToSet.daily_timePlayedSeconds);
        setLastResetDate(stateToSet.daily_lastResetDate);
        
        // Boost Reset Logic
        if (stateToSet.daily_lastClickBoostResetDate !== currentDateStr) {
          stateToSet.daily_clickBoostsAvailable = DAILY_CLICK_BOOST_LIMIT;
          stateToSet.daily_lastClickBoostResetDate = currentDateStr;
        }
        setDailyClickBoostsAvailable(stateToSet.daily_clickBoostsAvailable);
        setLastClickBoostResetDate(stateToSet.daily_lastClickBoostResetDate);

        if (stateToSet.daily_lastFullEnergyBoostResetDate !== currentDateStr) {
          stateToSet.daily_fullEnergyBoostsAvailable = DAILY_FULL_ENERGY_BOOST_LIMIT;
          stateToSet.daily_lastFullEnergyBoostResetDate = currentDateStr;
        }
        setDailyFullEnergyBoostsAvailable(stateToSet.daily_fullEnergyBoostsAvailable);
        setLastFullEnergyBoostResetDate(stateToSet.daily_lastFullEnergyBoostResetDate);

        setIsBotOwned(stateToSet.isBotOwned);
        setLastSeenTimestamp(stateToSet.lastSeenTimestamp || new Date().toISOString());
        setUnclaimedBotCoins(stateToSet.unclaimedBotCoins || 0);

        setOwnedSkins(stateToSet.ownedSkins);
        const skinToApply = initialSkins.find(s => s.id === stateToSet.selectedSkinId) || defaultSkin;
        setCurrentSkin(skinToApply);

        setCompletedUnclaimedTaskTierIds(stateToSet.completedUnclaimedTaskTierIds);
        setClaimedTaskTierIds(stateToSet.claimedTaskTierIds);
        setOwnedNfts(stateToSet.ownedNfts || []);


        // If any reset happened, save the updated state back
        if (stateToSet.daily_lastResetDate === currentDateStr &&
            stateToSet.daily_lastClickBoostResetDate === currentDateStr &&
            stateToSet.daily_lastFullEnergyBoostResetDate === currentDateStr &&
            docSnap.data().daily_lastResetDate !== currentDateStr // Check if original was different
           ) {
             // This save is if date fields were updated due to reset
             await setDoc(userDocRef, stateToSet, { merge: true });
        }

      } else {
        // New user: save initial state
        setGameStartTime(new Date(initialGameState.gameStartTime!)); // Set from initial explicitly
        setScore(initialGameState.score);
        setMaxEnergyLevel(initialGameState.maxEnergyLevel);
        // ... set all other states from initialGameState
        setClickPowerLevel(initialGameState.clickPowerLevel);
        setEnergyRegenLevel(initialGameState.energyRegenLevel);
        setTotalClicks(initialGameState.totalClicks);
        setDailyClicks(initialGameState.daily_clicks);
        setDailyCoinsCollected(initialGameState.daily_coinsCollected);
        setDailyTimePlayedSeconds(initialGameState.daily_timePlayedSeconds);
        setLastResetDate(initialGameState.daily_lastResetDate);
        setDailyClickBoostsAvailable(initialGameState.daily_clickBoostsAvailable);
        setLastClickBoostResetDate(initialGameState.daily_lastClickBoostResetDate);
        setDailyFullEnergyBoostsAvailable(initialGameState.daily_fullEnergyBoostsAvailable);
        setLastFullEnergyBoostResetDate(initialGameState.daily_lastFullEnergyBoostResetDate);
        setIsBotOwned(initialGameState.isBotOwned);
        setLastSeenTimestamp(initialGameState.lastSeenTimestamp!);
        setUnclaimedBotCoins(initialGameState.unclaimedBotCoins);
        setOwnedSkins(initialGameState.ownedSkins);
        setCurrentSkin(initialSkins.find(s => s.id === initialGameState.selectedSkinId) || defaultSkin);
        setCompletedUnclaimedTaskTierIds(initialGameState.completedUnclaimedTaskTierIds);
        setClaimedTaskTierIds(initialGameState.claimedTaskTierIds);
        setOwnedNfts(initialGameState.ownedNfts);
        
        await setDoc(userDocRef, { ...initialGameState, gameStartTime: initialGameState.gameStartTime, lastUpdated: serverTimestamp() });
      }

      // Bot offline earning calculation after loading state
      if (stateToSet.isBotOwned) {
        let currentUnclaimed = stateToSet.unclaimedBotCoins || 0;
        let newLastSeen = stateToSet.lastSeenTimestamp || new Date().toISOString();

        if (currentUnclaimed > 0) {
            // Already has unclaimed coins from previous session
            toast({
                title: <div className="flex items-center gap-2"><Bot className="h-5 w-5 text-primary" /><span className="font-semibold text-foreground">Бот Ожидает!</span></div>,
                description: `У вас есть ${currentUnclaimed.toLocaleString()} монет от бота, ожидающих сбора.`,
                duration: 30000,
                action: ( <ToastAction altText="Забрать" onClick={() => handleClaimBotCoins(currentUnclaimed)}>Забрать</ToastAction> ) as ToastActionElement,
            });
            // Do not update lastSeenTimestamp here, it was from the previous session.
            // It will be updated when coins are claimed or next time game is saved.
        } else {
            // Calculate earnings for the current offline period
            const timeOfflineInSeconds = Math.floor((Date.now() - new Date(newLastSeen).getTime()) / 1000);
            if (timeOfflineInSeconds > BOT_CLICK_INTERVAL_SECONDS) {
                const botBaseClickPower = INITIAL_CLICK_POWER_BASE + (stateToSet.clickPowerLevel * CLICK_POWER_INCREMENT_PER_LEVEL);
                const botClicksCount = Math.floor(timeOfflineInSeconds / BOT_CLICK_INTERVAL_SECONDS);
                const coinsEarnedByBot = botClicksCount * botBaseClickPower;
                const actualCoinsEarned = Math.min(coinsEarnedByBot, BOT_MAX_OFFLINE_COINS);

                if (actualCoinsEarned > 0) {
                    setUnclaimedBotCoins(actualCoinsEarned); // Update local state first
                    newLastSeen = new Date().toISOString(); // Bot has "worked" up to now
                    setLastSeenTimestamp(newLastSeen);
                    
                    await setDoc(userDocRef, { unclaimedBotCoins: actualCoinsEarned, lastSeenTimestamp: newLastSeen, lastUpdated: serverTimestamp() }, { merge: true });
                    
                    toast({
                        title: <div className="flex items-center gap-2"><Bot className="h-5 w-5 text-primary" /><span className="font-semibold text-foreground">Бот Помог!</span></div>,
                        description: `Ваш оффлайн бот готов передать вам ${actualCoinsEarned.toLocaleString()} монет.`,
                        duration: 30000,
                        action: ( <ToastAction altText="Забрать" onClick={() => handleClaimBotCoins(actualCoinsEarned)}>Забрать</ToastAction> ) as ToastActionElement,
                    });
                } else {
                    // No new coins earned, just update last seen
                    newLastSeen = new Date().toISOString();
                    setLastSeenTimestamp(newLastSeen);
                    await setDoc(userDocRef, { lastSeenTimestamp: newLastSeen, lastUpdated: serverTimestamp() }, { merge: true });
                }
            } else {
                 // Not offline long enough, just update last seen
                newLastSeen = new Date().toISOString();
                setLastSeenTimestamp(newLastSeen);
                await setDoc(userDocRef, { lastSeenTimestamp: newLastSeen, lastUpdated: serverTimestamp() }, { merge: true });
            }
        }
      } else {
          // Bot not owned, just update last seen if user exists
          const newSeen = new Date().toISOString();
          setLastSeenTimestamp(newSeen);
          if (docSnap.exists()) { // Only save if doc existed, otherwise initial save handles it
            await setDoc(userDocRef, { lastSeenTimestamp: newSeen, lastUpdated: serverTimestamp() }, { merge: true });
          }
      }


      // Unclaimed rewards toast
      if (stateToSet.completedUnclaimedTaskTierIds.length > 0 && !sessionStorage.getItem('newRewardsToastShownThisSession')) {
        toast({ title: "🎉 Новые награды доступны!", description: "Загляните во вкладку 'Награды', чтобы забрать их.", duration: 5000 });
        sessionStorage.setItem('newRewardsToastShownThisSession', 'true');
      }

    } catch (error) {
      console.error("Error loading game state:", error);
      toast({ variant: "destructive", title: "Ошибка загрузки", description: "Не удалось загрузить прогресс игры." });
      // Fallback to local initial state if Firestore fails critically
        setGameStartTime(new Date(initialGameState.gameStartTime!));
        setScore(initialGameState.score);
        setMaxEnergyLevel(initialGameState.maxEnergyLevel);
        // ... set all other states from initialGameState
    } finally {
      setIsGameDataLoading(false);
      gameDataLoadedRef.current = true;
    }
  }, [toast]); // Removed saveGameState from dependencies to avoid loops


  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
      gameDataLoadedRef.current = false; // Reset loading flag on logout
    } else if (currentUser && !gameDataLoadedRef.current && !authLoading) {
      loadGameState(currentUser.uid);
    }
  }, [currentUser, authLoading, router, loadGameState]);

  // Calculate derived game values based on levels
  useEffect(() => {
    setMaxEnergy(INITIAL_MAX_ENERGY_BASE + (maxEnergyLevel * MAX_ENERGY_INCREMENT_PER_LEVEL));
    const basePower = INITIAL_CLICK_POWER_BASE + (clickPowerLevel * CLICK_POWER_INCREMENT_PER_LEVEL);
    setOriginalClickPowerBeforeBoost(basePower);
    setClickPower(isBoostActive ? basePower * 2 : basePower);
    setEnergyRegenRatePerSecond(INITIAL_ENERGY_REGEN_RATE_BASE + (energyRegenLevel * ENERGY_REGEN_INCREMENT_PER_LEVEL));
  }, [maxEnergyLevel, clickPowerLevel, energyRegenLevel, isBoostActive]);

  useEffect(() => {
    setEnergy(prevEnergy => Math.min(prevEnergy, maxEnergy));
  }, [maxEnergy]);


  const getFullProgressForCheck = useCallback(() => {
    return {
      daily_clicks: dailyClicks,
      daily_coinsCollected: dailyCoinsCollected,
      daily_timePlayedSeconds: dailyTimePlayedSeconds,
      userScore: score,
      ownedSkin_emerald: ownedSkins.includes('emerald') ? 1 : 0,
      ownedSkin_rainbow: ownedSkins.includes('rainbow') ? 1 : 0,
      ownedSkins_length: ownedSkins.length,
    };
  }, [dailyClicks, dailyCoinsCollected, dailyTimePlayedSeconds, score, ownedSkins]);

  // Check for task completion when relevant states change
   useEffect(() => {
    if (currentUser && !isGameDataLoading) {
        const { newCompletedUnclaimedTierIds, newRewardsWereAdded } = checkAndNotifyTaskCompletion(
            getFullProgressForCheck(),
            allTasksForNotification,
            claimedTaskTierIds,
            completedUnclaimedTaskTierIds,
            toast
        );
        if (newRewardsWereAdded) {
            setCompletedUnclaimedTaskTierIds(newCompletedUnclaimedTierIds); // Update local state for UI
            // The saveGameState will be triggered by other actions or a dedicated save mechanism
            // For now, let's ensure this critical task state is saved.
            saveGameState(currentUser.uid); 
        }
    }
  }, [score, dailyClicks, dailyCoinsCollected, dailyTimePlayedSeconds, ownedSkins, currentUser, isGameDataLoading, getFullProgressForCheck, allTasksForNotification, toast, saveGameState, claimedTaskTierIds, completedUnclaimedTaskTierIds]);


  // Boost Timer Effect
  useEffect(() => {
    if (!currentUser || !isBoostActive || boostEndTime === 0) return;
    const timer = setInterval(() => {
      if (Date.now() >= boostEndTime) {
        setIsBoostActive(false);
        setBoostEndTime(0);
        toast({ title: "⚙️ Буст Завершён", description: "Действие буста x2 силы клика закончилось.", duration: 4000 });
        // Save state after boost ends
        if (currentUser) saveGameState(currentUser.uid);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isBoostActive, boostEndTime, toast, currentUser, saveGameState]);

  const energyRegenAmountPerInterval = energyRegenRatePerSecond * (ENERGY_REGEN_INTERVAL / 1000);

  const handleCoinClick = useCallback(() => {
    if (!currentUser || isGameDataLoading) return;
    if (energy >= ENERGY_PER_CLICK) {
      const scoreIncrease = clickPower;
      setScore(prevScore => prevScore + scoreIncrease);
      setEnergy(prevEnergy => Math.max(0, prevEnergy - ENERGY_PER_CLICK));
      setTotalClicks(prevClicks => prevClicks + 1);
      setDailyClicks(prev => prev + 1);
      setDailyCoinsCollected(prev => prev + scoreIncrease);

      if (!isAnimatingClick) {
        setIsAnimatingClick(true);
        setTimeout(() => setIsAnimatingClick(false), CLICK_ANIMATION_DURATION);
      }
    }
  }, [currentUser, isGameDataLoading, energy, clickPower, isAnimatingClick]);

  useEffect(() => {
    if (!currentUser || isGameDataLoading) return;
    const regenTimer = setInterval(() => {
      setEnergy(prevEnergy => Math.min(maxEnergy, prevEnergy + energyRegenAmountPerInterval));
    }, ENERGY_REGEN_INTERVAL);
    return () => clearInterval(regenTimer);
  }, [currentUser, isGameDataLoading, maxEnergy, energyRegenAmountPerInterval]);

  useEffect(() => {
    if (!currentUser || !gameStartTime || isGameDataLoading) return;
    const timePlayedTimer = setInterval(() => {
      setGameTimePlayed(formatDistanceStrict(new Date(), gameStartTime, { roundingMethod: 'floor' }));
    }, 1000);
    return () => clearInterval(timePlayedTimer);
  }, [gameStartTime, currentUser, isGameDataLoading]);

  useEffect(() => {
    if (!currentUser || isGameDataLoading) return;
    const dailyTimeUpdateTimer = setInterval(() => {
      setDailyTimePlayedSeconds(prev => prev + (DAILY_STATS_UPDATE_INTERVAL / 1000));
    }, DAILY_STATS_UPDATE_INTERVAL);
    return () => clearInterval(dailyTimeUpdateTimer);
  }, [currentUser, isGameDataLoading]);
  
  // Listener for skin changes from SkinsPage (which will eventually write to Firestore)
  // For now, this keeps HomePage skin consistent if localStorage is changed by SkinsPage.
  // This will be removed/refactored when SkinsPage uses Firestore.
  useEffect(() => {
    if (!currentUser || isGameDataLoading) return;
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'selectedSkinId' && event.newValue) {
        const skinToApply = initialSkins.find(s => s.id === event.newValue) || defaultSkin;
        setCurrentSkin(skinToApply);
        // If HomePage is authoritative for currentSkin, it should save this change.
        // saveGameState(currentUser.uid); // This might be too aggressive for just skin change via localStorage.
      }
      // Similar listeners for other localStorage items if needed during transition.
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [currentUser, isGameDataLoading, saveGameState]); // saveGameState if it needs to react to this.

  const handleClaimBotCoins = useCallback(async (coinsToClaim: number) => {
    if (!currentUser || coinsToClaim <= 0) return;

    setScore(prevScore => prevScore + coinsToClaim);
    setUnclaimedBotCoins(0);
    const newSeen = new Date().toISOString();
    setLastSeenTimestamp(newSeen); // Update last seen now that coins are claimed

    // Directly save after claiming
    // Construct the partial state to save specifically for bot claim
    const gameStateUpdate = {
      score: score + coinsToClaim, // Use the updated score
      unclaimedBotCoins: 0,
      lastSeenTimestamp: newSeen,
      lastUpdated: serverTimestamp(),
    };
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await setDoc(userDocRef, gameStateUpdate, { merge: true });
      toast({
          title: "💰 Монеты зачислены!",
          description: `${coinsToClaim.toLocaleString()} монет добавлено на ваш баланс.`,
          duration: 3000,
      });
    } catch (error) {
        console.error("Error saving after claiming bot coins:", error);
        // Revert optimistic updates if save fails? Or retry? For now, log and toast.
        toast({ variant: "destructive", title: "Ошибка", description: "Не удалось сохранить сбор монет." });
    }
  }, [currentUser, score, toast]);


  const toggleShop = () => setIsShopOpen(prev => !prev);

  const handlePurchase = async (upgradeId: UpgradeId) => {
    if (!currentUser || isGameDataLoading) return false;
    let cost = 0;
    let canPurchase = false;
    let newMaxEnergyLevel = maxEnergyLevel;
    let newClickPowerLevel = clickPowerLevel;
    let newEnergyRegenLevel = energyRegenLevel;
    let newScore = score;
    let newIsBotOwned = isBotOwned;

    switch (upgradeId) {
      case 'maxEnergyUpgrade':
        if (maxEnergyLevel < MAX_ENERGY_MAX_LEVEL) {
          cost = maxEnergyUpgradeCosts[maxEnergyLevel];
          if (score >= cost) {
            newScore -= cost;
            newMaxEnergyLevel++;
            setEnergy(prevEnergy => prevEnergy + MAX_ENERGY_INCREMENT_PER_LEVEL);
            canPurchase = true;
          }
        }
        break;
      case 'clickPowerUpgrade':
        if (clickPowerLevel < CLICK_POWER_MAX_LEVEL) {
          cost = clickPowerUpgradeCosts[clickPowerLevel];
          if (score >= cost) {
            newScore -= cost;
            newClickPowerLevel++;
            canPurchase = true;
          }
        }
        break;
      case 'energyRegenRateUpgrade':
        if (energyRegenLevel < ENERGY_REGEN_MAX_LEVEL) {
          cost = energyRegenUpgradeCosts[energyRegenLevel];
          if (score >= cost) {
            newScore -= cost;
            newEnergyRegenLevel++;
            canPurchase = true;
          }
        }
        break;
      case 'offlineBotPurchase':
        if (!isBotOwned && score >= BOT_PURCHASE_COST) {
          cost = BOT_PURCHASE_COST;
          newScore -= cost;
          newIsBotOwned = true;
          toast({ title: "🤖 Оффлайн Бот Активирован!", description: "Теперь ваш бот будет собирать монеты, пока вы отдыхаете.", duration: 5000 });
          canPurchase = true;
        }
        break;
    }

    if (canPurchase) {
      setScore(newScore);
      setMaxEnergyLevel(newMaxEnergyLevel);
      setClickPowerLevel(newClickPowerLevel);
      setEnergyRegenLevel(newEnergyRegenLevel);
      setIsBotOwned(newIsBotOwned);
      await saveGameState(currentUser.uid); // Save after purchase
    }
    return canPurchase;
  };

  const handleActivateClickBoost = useCallback(async () => {
    if (!currentUser || isGameDataLoading || dailyClickBoostsAvailable <= 0 || isBoostActive) return;
    
    setDailyClickBoostsAvailable(prev => prev - 1);
    setIsBoostActive(true);
    setBoostEndTime(Date.now() + BOOST_DURATION_MS);
    setLastClickBoostResetDate(getCurrentDateString()); // Ensure reset date is current

    toast({ title: "🚀 Буст Активирован!", description: "x2 сила клика на 1 минуту.", duration: 4000 });
    await saveGameState(currentUser.uid);
  }, [currentUser, isGameDataLoading, dailyClickBoostsAvailable, isBoostActive, toast, saveGameState]);

  const handleActivateFullEnergyBoost = useCallback(async () => {
    if (!currentUser || isGameDataLoading || dailyFullEnergyBoostsAvailable <= 0) return;

    setEnergy(maxEnergy);
    setDailyFullEnergyBoostsAvailable(prev => prev - 1);
    setLastFullEnergyBoostResetDate(getCurrentDateString()); // Ensure reset date is current

    toast({ title: "⚡ Энергия Восстановлена!", description: "Ваша энергия полностью заполнена.", duration: 4000 });
    await saveGameState(currentUser.uid);
  }, [currentUser, isGameDataLoading, dailyFullEnergyBoostsAvailable, maxEnergy, toast, saveGameState]);

  const handleNavigation = (path: string) => router.push(path);

  // Effect to save game state on unmount or page visibility change (Best effort)
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (currentUser && gameDataLoadedRef.current) {
        // Update lastSeenTimestamp before saving on unload
        const updatedGameState = { lastSeenTimestamp: new Date().toISOString() };
         try {
            const userDocRef = doc(db, 'users', currentUser.uid);
            // Use a non-merged setDoc or updateDoc if you only want to update specific fields and not the whole state
            // For simplicity here, we're assuming saveGameState handles the full state or is smart enough.
            // A more targeted update for `lastSeenTimestamp` might be better for `beforeunload`.
            await setDoc(userDocRef, { ...updatedGameState, lastUpdated: serverTimestamp() }, { merge: true });
        } catch (error) {
            console.error("Error saving lastSeenTimestamp on unload:", error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    // Could also use document.addEventListener('visibilitychange', ...) for tab switching

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Save one last time if user is navigating away within the app
      // This depends on how navigation is handled. For Next.js router, this cleanup might be too late.
      // if (currentUser && gameDataLoadedRef.current) {
      //   saveGameState(currentUser.uid);
      // }
    };
  }, [currentUser, saveGameState]);


  if (authLoading || (!currentUser && !authLoading) || (currentUser && isGameDataLoading && !gameDataLoadedRef.current)) {
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

      <BottomNavBar onNavigate={handleNavigation} activeItem="/" />

      <ShopModal
        isOpen={isShopOpen}
        onOpenChange={setIsShopOpen}
        score={score}
        maxEnergyLevel={maxEnergyLevel}
        clickPowerLevel={clickPowerLevel}
        energyRegenLevel={energyRegenLevel}
        currentMaxEnergy={maxEnergy}
        currentClickPower={clickPower}
        baseClickPower={originalClickPowerBeforeBoost}
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
        initialMaxEnergyBase={INITIAL_MAX_ENERGY_BASE}
        maxEnergyIncrementPerLevel={MAX_ENERGY_INCREMENT_PER_LEVEL}
        maxEnergyMaxLevel={MAX_ENERGY_MAX_LEVEL}
        maxEnergyUpgradeCosts={maxEnergyUpgradeCosts}
        initialClickPowerBase={INITIAL_CLICK_POWER_BASE}
        clickPowerIncrementPerLevel={CLICK_POWER_INCREMENT_PER_LEVEL}
        clickPowerMaxLevel={CLICK_POWER_MAX_LEVEL}
        clickPowerUpgradeCosts={clickPowerUpgradeCosts}
        initialEnergyRegenRateBase={INITIAL_ENERGY_REGEN_RATE_BASE}
        energyRegenIncrementPerLevel={ENERGY_REGEN_INCREMENT_PER_LEVEL}
        energyRegenMaxLevel={ENERGY_REGEN_MAX_LEVEL}
        energyRegenUpgradeCosts={energyRegenUpgradeCosts}
      />
    </div>
  );
}

    