
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Coins, Star, Clock4, Mail, Sparkles, Target, History, TrendingUp, Globe, Trophy } from 'lucide-react';
import BottomNavBar from '@/components/BottomNavBar';
import LeagueInfoCard from '@/components/profile/LeagueInfoCard';
import StatCard from '@/components/profile/StatCard';
import LeaderboardModal from '@/components/profile/LeaderboardModal';
import type { Player } from '@/components/profile/LeaderboardModal';
import { getLeagueInfo } from '@/lib/leagues';
import { useRouter } from 'next/navigation';
import { formatDistanceStrict } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { Button } from '@/components/ui/button';

const INITIAL_CLICK_POWER_BASE = 1;
const CLICK_POWER_INCREMENT_PER_LEVEL = 1;
const INITIAL_ENERGY_REGEN_RATE_BASE = 1;
const ENERGY_REGEN_INCREMENT_PER_LEVEL = 1;

interface ProfileStats {
  score: number;
  totalScoreCollected: number;
  totalClicks: number;
  gameStartTime: string | null;
  clickPowerLevel: number;
  energyRegenLevel: number;
}

export default function ProfilePage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isDataLoading, setIsDataLoading] = useState(true);

  const [stats, setStats] = useState<ProfileStats>({
    score: 0,
    totalScoreCollected: 0,
    totalClicks: 0,
    gameStartTime: null,
    clickPowerLevel: 0,
    energyRegenLevel: 0,
  });
  
  const [clickPower, setClickPower] = useState(INITIAL_CLICK_POWER_BASE);
  const [energyRegenRate, setEnergyRegenRate] = useState(INITIAL_ENERGY_REGEN_RATE_BASE);
  const [gameTimePlayed, setGameTimePlayed] = useState("0s");

  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [topPlayers, setTopPlayers] = useState<Player[]>([]);
  const [currentPlayerForLeaderboard, setCurrentPlayerForLeaderboard] = useState<Player | null>(null);
  const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(false);

  const loadProfileData = useCallback(async (userId: string) => {
    setIsDataLoading(true);
    try {
      const userDocRef = doc(db, 'users', userId);
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setStats({
          score: data.score || 0,
          totalScoreCollected: data.totalScoreCollected || data.score || 0,
          totalClicks: data.totalClicks || 0,
          gameStartTime: data.gameStartTime || null,
          clickPowerLevel: data.clickPowerLevel || 0,
          energyRegenLevel: data.energyRegenLevel || 0,
        });
      }
    } catch (error) {
      console.error("Error loading profile data:", error);
    } finally {
      setIsDataLoading(false);
    }
  }, []);
  
  useEffect(() => {
    setClickPower(INITIAL_CLICK_POWER_BASE + (stats.clickPowerLevel * CLICK_POWER_INCREMENT_PER_LEVEL));
    setEnergyRegenRate(INITIAL_ENERGY_REGEN_RATE_BASE + (stats.energyRegenLevel * ENERGY_REGEN_INCREMENT_PER_LEVEL));
  }, [stats.clickPowerLevel, stats.energyRegenLevel]);


  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
    } else if (currentUser) {
      loadProfileData(currentUser.uid);
    }
  }, [currentUser, authLoading, router, loadProfileData]);
  
  useEffect(() => {
    if (stats.gameStartTime) {
      const startTime = new Date(stats.gameStartTime);
      const updateTime = () => {
         setGameTimePlayed(formatDistanceStrict(new Date(), startTime, {roundingMethod: 'floor'}));
      };
      updateTime(); 
      const timerId = setInterval(updateTime, 1000); 
      return () => clearInterval(timerId); 
    } else {
      setGameTimePlayed("N/A");
    }
  }, [stats.gameStartTime]);


  const { currentLeague, nextLeague, progressPercentage } = getLeagueInfo(stats.totalScoreCollected);

  const handleOpenLeaderboard = async () => {
    if (!currentUser) return;
    setIsLeaderboardOpen(true);
    setIsLeaderboardLoading(true);
    try {
      // Fetch top 100 players
      const usersRef = collection(db, 'users');
      const qTop = query(usersRef, orderBy('totalScoreCollected', 'desc'), limit(100));
      const topSnapshot = await getDocs(qTop);
      const topPlayersData: Player[] = topSnapshot.docs.map((doc, index) => ({
        rank: index + 1,
        name: doc.data().nickname || `Player ${doc.id.substring(0, 5)}`,
        score: doc.data().totalScoreCollected,
        uid: doc.id,
      }));
      setTopPlayers(topPlayersData);

      // Fetch current player's rank
      const qRank = query(usersRef, where('totalScoreCollected', '>', stats.totalScoreCollected));
      const rankSnapshot = await getDocs(qRank);
      const rank = rankSnapshot.size + 1;
      
      setCurrentPlayerForLeaderboard({
        rank: rank,
        name: currentUser.displayName || 'Вы',
        score: stats.totalScoreCollected,
        uid: currentUser.uid
      });

    } catch (error) {
      console.error("Error fetching leaderboard data:", error);
    } finally {
      setIsLeaderboardLoading(false);
    }
  };

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  if (authLoading || isDataLoading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-gradient-to-br from-background to-indigo-900/50">
        <Sparkles className="w-16 h-16 animate-spin text-primary" />
        <p className="mt-4 text-lg text-foreground">Загрузка профиля...</p>
      </div>
    );
  }
  
  if (!currentUser) return null; // Should be redirected, but as a fallback
  
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-indigo-900/50 text-foreground font-body antialiased selection:bg-primary selection:text-primary-foreground">
      <div className="flex-grow container mx-auto px-4 pt-10 md:pt-16 pb-20 md:pb-24 text-center">
        
        <Avatar className="w-24 h-24 mx-auto mb-4 shadow-lg ring-2 ring-primary/50">
          <AvatarImage src={`https://api.dicebear.com/8.x/bottts/svg?seed=${currentUser.uid}`} alt="User Avatar" />
          <AvatarFallback>
            <User className="w-12 h-12 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
        
        <h1 className="text-3xl font-bold">{currentUser.displayName || 'Игрок'}</h1>
        <p className="text-muted-foreground mb-8 flex items-center justify-center gap-1.5">
          <Mail className="w-4 h-4"/>
          {currentUser.email}
        </p>

        <div className="max-w-md mx-auto space-y-4">
          <LeagueInfoCard
            currentLeague={currentLeague}
            nextLeague={nextLeague}
            leagueScore={stats.totalScoreCollected} 
            progressPercentage={progressPercentage}
          />
          
          <StatCard icon={Coins} label="Текущий баланс" value={stats.score.toLocaleString()} />
          <StatCard icon={TrendingUp} label="Всего заработано" value={stats.totalScoreCollected.toLocaleString()} />
          <StatCard icon={Target} label="Сила клика" value={`+${clickPower}`} />
          <StatCard icon={History} label="Восстановление" value={`+${energyRegenRate}/сек`} />
          <StatCard icon={Star} label="Всего кликов" value={stats.totalClicks.toLocaleString()} />
          <StatCard icon={Clock4} label="Время игры" value={gameTimePlayed} />

          <div className="flex gap-4 pt-4">
            <Button className="w-full" onClick={handleOpenLeaderboard}>
              <Globe className="mr-2 h-4 w-4" /> Глобальный рейтинг
            </Button>
            <Button className="w-full" variant="secondary" disabled>
              <Trophy className="mr-2 h-4 w-4" /> Рейтинг лиги
            </Button>
          </div>
        </div>

      </div>
      
      <BottomNavBar activeItem="/profile" onNavigate={handleNavigation} />

      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onOpenChange={setIsLeaderboardOpen}
        leagueName="Глобальный Рейтинг"
        topPlayers={topPlayers}
        currentPlayer={currentPlayerForLeaderboard}
        isLoading={isLeaderboardLoading}
      />
    </div>
  );
}
