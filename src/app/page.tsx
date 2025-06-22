
"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import ClickableCoin from '@/components/ClickableCoin';
import TopBar from '@/components/TopBar';
import BottomNavBar from '@/components/BottomNavBar';
import EnergyBar from '@/components/EnergyBar';
import ShopModal from '@/components/ShopModal';
import type { UpgradeId } from '@/components/ShopModal';
import { useRouter } from 'next/navigation';
import { formatDistanceStrict } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { initialDailyTasks, initialMainTasks, initialLeagueTasks } from '@/data/tasks';
import { checkAndNotifyTaskCompletion } from '@/lib/taskUtils.tsx';
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
  energy: number; // Added energy to save state
  maxEnergyLevel: number;
  clickPowerLevel: number;
  energyRegenLevel: number;
  totalClicks: number;
  gameStartTime?: string; // ISO string

  daily_clicks: number;
  daily_coinsCollected: number;
  daily_timePlayedSeconds: number;
  daily_lastResetDate: string; // YYYY-MM-DD

  isBoostActive: boolean; // Is click boost active
  boostEndTime: number; // Timestamp when the boost ends
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
  energy: INITIAL_MAX_ENERGY_BASE,
  maxEnergyLevel: 0,
  clickPowerLevel: 0,
  energyRegenLevel: 0,
  totalClicks: INITIAL_TOTAL_CLICKS,
  gameStartTime: new Date().toISOString(),

  daily_clicks: 0,
  daily_coinsCollected: 0,
  daily_timePlayedSeconds: 0,
  daily_lastResetDate: getCurrentDateString(),

  isBoostActive: false,
  boostEndTime: 0,
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
  const [ownedSkins, setOwnedSkins] = useState<string[]>(['classic']);

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
  
  const prevIsBoostActiveRef = useRef<boolean>();

  // Tasks
  const [completedUnclaimedTaskTierIds, setCompletedUnclaimedTaskTierIds] = useState<string[]>([]);
  const [claimedTaskTierIds, setClaimedTaskTierIds] = useState<string[]>([]);
  
  // NFTs
  const [ownedNfts, setOwnedNfts] = useState<string[]>([]);


  const allTasksForNotification = useMemo(() => [...initialDailyTasks, ...initialMainTasks, ...initialLeagueTasks], []);

  // --- Firestore Functions ---
  const handleClaimBotCoins = useCallback(async (coinsToClaim: number) => {
    if (!currentUser || coinsToClaim <= 0) return;

    const newScore = score + coinsToClaim;
    const newSeen = new Date().toISOString();

    setScore(newScore);
    setUnclaimedBotCoins(0);
    setLastSeenTimestamp(newSeen);

    const gameStateUpdate = {
      score: newScore,
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
        toast({ variant: "destructive", title: "Ошибка", description: "Не удалось сохранить сбор монет." });
    }
  }, [currentUser, score, toast]);
  
  const saveGameState = useCallback(async (userId: string) => {
    if (!userId) return;
    const gameStateToSave: UserGameState = {
      score,
      energy,
      maxEnergyLevel,
      clickPowerLevel,
      energyRegenLevel,
      totalClicks,
      gameStartTime: gameStartTime ? gameStartTime.toISOString() : new Date().toISOString(),
      daily_clicks: dailyClicks,
      daily_coinsCollected: dailyCoinsCollected,
      daily_timePlayedSeconds: dailyTimePlayedSeconds,
      daily_lastResetDate: lastResetDate,
      isBoostActive,
      boostEndTime,
      daily_clickBoostsAvailable: dailyClickBoostsAvailable,
      daily_lastClickBoostResetDate: lastClickBoostResetDate,
      daily_fullEnergyBoostsAvailable: dailyFullEnergyBoostsAvailable,
      daily_lastFullEnergyBoostResetDate: lastFullEnergyBoostResetDate,
      isBotOwned,
      lastSeenTimestamp,
      unclaimedBotCoins,
      ownedSkins,
      selectedSkinId: currentSkin.id,
      completedUnclaimedTaskTierIds,
      claimedTaskTierIds,
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
    score, energy, maxEnergyLevel, clickPowerLevel, energyRegenLevel, totalClicks, gameStartTime,
    dailyClicks, dailyCoinsCollected, dailyTimePlayedSeconds, lastResetDate,
    isBoostActive, boostEndTime, dailyClickBoostsAvailable, lastClickBoostResetDate,
    dailyFullEnergyBoostsAvailable, lastFullEnergyBoostResetDate,
    isBotOwned, lastSeenTimestamp, unclaimedBotCoins,
    ownedSkins, currentSkin.id,
    completedUnclaimedTaskTierIds, claimedTaskTierIds, ownedNfts, toast
  ]);

  const loadGameState = useCallback(async (userId: string) => {
    setIsGameDataLoading(true);
    gameDataLoadedRef.current = false;
    try {
      const userDocRef = doc(db, 'users', userId);
      const docSnap = await getDoc(userDocRef);
      const currentDateStr = getCurrentDateString();
      let stateToSet: UserGameState;

      if (docSnap.exists()) {
        stateToSet = { ...initialGameState, ...docSnap.data() as Partial<UserGameState> };

        // Handle date string to Date object conversion for gameStartTime
        if (stateToSet.gameStartTime && typeof stateToSet.gameStartTime === 'string') {
          setGameStartTime(new Date(stateToSet.gameStartTime));
        } else if (!stateToSet.gameStartTime) {
          stateToSet.gameStartTime = new Date().toISOString();
          setGameStartTime(new Date());
        } else {
           const startTime = (stateToSet.gameStartTime as any)?.toDate?.() || stateToSet.gameStartTime;
           setGameStartTime(new Date(startTime));
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

        // Handle boost persistence
        if(stateToSet.isBoostActive && stateToSet.boostEndTime > Date.now()) {
            setIsBoostActive(true);
            setBoostEndTime(stateToSet.boostEndTime);
        } else {
            setIsBoostActive(false);
            setBoostEndTime(0);
            if (stateToSet.isBoostActive) {
              stateToSet.isBoostActive = false;
            }
        }

        setIsBotOwned(stateToSet.isBotOwned);
        setLastSeenTimestamp(stateToSet.lastSeenTimestamp || new Date().toISOString());
        setUnclaimedBotCoins(stateToSet.unclaimedBotCoins || 0);

        setOwnedSkins(stateToSet.ownedSkins);
        const skinToApply = initialSkins.find(s => s.id === stateToSet.selectedSkinId) || defaultSkin;
        setCurrentSkin(skinToApply);

        setCompletedUnclaimedTaskTierIds(stateToSet.completedUnclaimedTaskTierIds);
        setClaimedTaskTierIds(stateToSet.claimedTaskTierIds);
        setOwnedNfts(stateToSet.ownedNfts || []);

         // --- OFFLINE & POST-LOAD CALCULATIONS ---
        const updatesToPersist: Partial<UserGameState> = {};
        const timeOfflineInSeconds = stateToSet.lastSeenTimestamp
            ? Math.floor((Date.now() - new Date(stateToSet.lastSeenTimestamp).getTime()) / 1000)
            : 0;

        // 1. Offline Energy Regeneration
        let energyAfterOfflineRegen = stateToSet.energy;
        if (timeOfflineInSeconds > 0) {
            const calculatedMaxEnergy = INITIAL_MAX_ENERGY_BASE + (stateToSet.maxEnergyLevel * MAX_ENERGY_INCREMENT_PER_LEVEL);
            const calculatedEnergyRegenRate = INITIAL_ENERGY_REGEN_RATE_BASE + (stateToSet.energyRegenLevel * ENERGY_REGEN_INCREMENT_PER_LEVEL);
            const energyRegenerated = timeOfflineInSeconds * calculatedEnergyRegenRate;
            energyAfterOfflineRegen = Math.min(calculatedMaxEnergy, stateToSet.energy + energyRegenerated);
            updatesToPersist.energy = energyAfterOfflineRegen;
        }
        setEnergy(energyAfterOfflineRegen);

        // 2. Bot Offline Earnings
        let totalUnclaimedCoins = 0;
        if (stateToSet.isBotOwned) {
            const savedUnclaimedBotCoins = stateToSet.unclaimedBotCoins || 0;
            let newlyEarnedBotCoins = 0;

            if (timeOfflineInSeconds > BOT_CLICK_INTERVAL_SECONDS) {
                const botBaseClickPower = INITIAL_CLICK_POWER_BASE + (stateToSet.clickPowerLevel * CLICK_POWER_INCREMENT_PER_LEVEL);
                const botClicksCount = Math.floor(timeOfflineInSeconds / BOT_CLICK_INTERVAL_SECONDS);
                newlyEarnedBotCoins = botClicksCount * botBaseClickPower;
            }

            const totalPotentialCoins = savedUnclaimedBotCoins + newlyEarnedBotCoins;
            totalUnclaimedCoins = Math.min(totalPotentialCoins, BOT_MAX_OFFLINE_COINS);

            if (totalUnclaimedCoins > 0) {
                setUnclaimedBotCoins(totalUnclaimedCoins);
                if (totalUnclaimedCoins > savedUnclaimedBotCoins) {
                    updatesToPersist.unclaimedBotCoins = totalUnclaimedCoins;
                }
            }
        }
        
        // 3. Update Last Seen Timestamp & Persist all changes
        const newSeen = new Date().toISOString();
        setLastSeenTimestamp(newSeen);
        updatesToPersist.lastSeenTimestamp = newSeen;
        await setDoc(userDocRef, { ...updatesToPersist, lastUpdated: serverTimestamp() }, { merge: true });

        // 4. Show toast for bot coins after saving state
        if (stateToSet.isBotOwned && totalUnclaimedCoins > 0) {
            toast({
                title: <div className="flex items-center gap-2"><Bot className="h-5 w-5 text-primary" /><span className="font-semibold text-foreground">Бот ждет!</span></div>,
                description: `Ваш бот накопил ${totalUnclaimedCoins.toLocaleString()} монет. Заберите их!`,
                duration: 30000,
                action: ( <ToastAction altText="Забрать" onClick={() => handleClaimBotCoins(totalUnclaimedCoins)}>Забрать</ToastAction> ) as ToastActionElement,
            });
        }


      } else {
        // New user: set from initial and save
        stateToSet = initialGameState;
        setGameStartTime(new Date(initialGameState.gameStartTime!));
        setScore(initialGameState.score);
        setEnergy(initialGameState.energy);
        setMaxEnergyLevel(initialGameState.maxEnergyLevel);
        setClickPowerLevel(initialGameState.clickPowerLevel);
        setEnergyRegenLevel(initialGameState.energyRegenLevel);
        setTotalClicks(initialGameState.totalClicks);
        setDailyClicks(initialGameState.daily_clicks);
        setDailyCoinsCollected(initialGameState.daily_coinsCollected);
        setDailyTimePlayedSeconds(initialGameState.daily_timePlayedSeconds);
        setLastResetDate(initialGameState.daily_lastResetDate);
        setIsBoostActive(initialGameState.isBoostActive);
        setBoostEndTime(initialGameState.boostEndTime);
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


      // Unclaimed rewards toast
      if (stateToSet.completedUnclaimedTaskTierIds.length > 0 && !sessionStorage.getItem('newRewardsToastShownThisSession')) {
        toast({ title: "🎉 Новые награды доступны!", description: "Загляните во вкладку 'Награды', чтобы забрать их.", duration: 5000 });
        sessionStorage.setItem('newRewardsToastShownThisSession', 'true');
      }

    } catch (error) {
      console.error("Error loading game state:", error);
      toast({ variant: "destructive", title: "Ошибка загрузки", description: "Не удалось загрузить прогресс игры." });
    } finally {
      setIsGameDataLoading(false);
      gameDataLoadedRef.current = true;
    }
  }, [toast, handleClaimBotCoins]);


  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
      gameDataLoadedRef.current = false;
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
            setCompletedUnclaimedTaskTierIds(newCompletedUnclaimedTierIds);
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
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isBoostActive, boostEndTime, toast, currentUser]);

  useEffect(() => {
      if (prevIsBoostActiveRef.current === true && isBoostActive === false && currentUser) {
          saveGameState(currentUser.uid);
      }
      prevIsBoostActiveRef.current = isBoostActive;
  }, [isBoostActive, currentUser, saveGameState]);


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
      
      const userDocRef = doc(db, 'users', currentUser.uid);
      await setDoc(userDocRef, {
        score: newScore,
        maxEnergyLevel: newMaxEnergyLevel,
        clickPowerLevel: newClickPowerLevel,
        energyRegenLevel: newEnergyRegenLevel,
        isBotOwned: newIsBotOwned,
        lastUpdated: serverTimestamp()
      }, { merge: true });
    }
    return canPurchase;
  };

  const handleActivateClickBoost = useCallback(async () => {
    if (!currentUser || isGameDataLoading || dailyClickBoostsAvailable <= 0 || isBoostActive) return;
    
    setDailyClickBoostsAvailable(prev => prev - 1);
    setIsBoostActive(true);
    const newBoostEndTime = Date.now() + BOOST_DURATION_MS;
    setBoostEndTime(newBoostEndTime);
    const newResetDate = getCurrentDateString();
    setLastClickBoostResetDate(newResetDate);

    toast({ title: "🚀 Буст Активирован!", description: "x2 сила клика на 1 минуту.", duration: 4000 });
    
    const userDocRef = doc(db, 'users', currentUser.uid);
    await setDoc(userDocRef, {
      daily_clickBoostsAvailable: dailyClickBoostsAvailable - 1,
      isBoostActive: true,
      boostEndTime: newBoostEndTime,
      daily_lastClickBoostResetDate: newResetDate,
      lastUpdated: serverTimestamp()
    }, { merge: true });
  }, [currentUser, isGameDataLoading, dailyClickBoostsAvailable, isBoostActive, toast]);

  const handleActivateFullEnergyBoost = useCallback(async () => {
    if (!currentUser || isGameDataLoading || dailyFullEnergyBoostsAvailable <= 0 || energy >= maxEnergy) return;

    setEnergy(maxEnergy);
    setDailyFullEnergyBoostsAvailable(prev => prev - 1);
    const newResetDate = getCurrentDateString();
    setLastFullEnergyBoostResetDate(newResetDate);

    toast({ title: "⚡ Энергия Восстановлена!", description: "Ваша энергия полностью заполнена.", duration: 4000 });
    
    const userDocRef = doc(db, 'users', currentUser.uid);
    await setDoc(userDocRef, {
      energy: maxEnergy, // Save the full energy
      daily_fullEnergyBoostsAvailable: dailyFullEnergyBoostsAvailable - 1,
      daily_lastFullEnergyBoostResetDate: newResetDate,
      lastUpdated: serverTimestamp()
    }, { merge: true });
  }, [currentUser, isGameDataLoading, dailyFullEnergyBoostsAvailable, maxEnergy, toast, energy]);

  const handleNavigation = (path: string) => {
    if (currentUser) {
      saveGameState(currentUser.uid);
    }
    router.push(path);
  };

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (currentUser && gameDataLoadedRef.current) {
        saveGameState(currentUser.uid);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
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
      
      <main className="flex flex-col flex-grow pt-16 pb-20 md:pb-24 px-4">
        <div className="flex-grow flex flex-col items-center justify-center gap-6 pb-10">
          <div className="text-center">
            <h2 className="text-5xl md:text-6xl font-bold text-primary tracking-tighter">{score.toLocaleString()}</h2>
            <p className="text-muted-foreground -mt-1">монет</p>
          </div>
          
          <ClickableCoin
            onClick={handleCoinClick}
            isAnimating={isAnimatingClick}
            disabled={energy < ENERGY_PER_CLICK}
            coinColorClass={currentSkin.coinColorClass}
            coinIconColorClass={currentSkin.coinIconColorClass}
          />
        </div>
        
        <div>
          <EnergyBar currentEnergy={energy} maxEnergy={maxEnergy} className="w-full max-w-md mx-auto" />
        </div>
      </main>

      <BottomNavBar onNavigate={handleNavigation} activeItem="/" />

      <ShopModal
        isOpen={isShopOpen}
        onOpenChange={setIsShopOpen}
        score={score}
        currentEnergy={energy}
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
