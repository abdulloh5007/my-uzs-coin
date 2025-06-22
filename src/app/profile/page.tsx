
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Coins, Star, Clock4, Mail, Sparkles } from 'lucide-react';
import BottomNavBar from '@/components/BottomNavBar';
import LeagueInfoCard from '@/components/profile/LeagueInfoCard';
import StatCard from '@/components/profile/StatCard';
import LeaderboardModal from '@/components/profile/LeaderboardModal';
import type { League } from '@/lib/leagues';
import { getLeagueInfo } from '@/lib/leagues';
import { useRouter } from 'next/navigation';
import { formatDistanceStrict } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface ProfileStats {
  score: number;
  totalClicks: number;
  gameStartTime: string | null;
}

export default function ProfilePage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isDataLoading, setIsDataLoading] = useState(true);

  const [stats, setStats] = useState<ProfileStats>({
    score: 0,
    totalClicks: 0,
    gameStartTime: null,
  });
  const [gameTimePlayed, setGameTimePlayed] = useState("0s");

  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [selectedLeagueForLeaderboard, setSelectedLeagueForLeaderboard] = useState<League | null>(null);

  const loadProfileData = useCallback(async (userId: string) => {
    setIsDataLoading(true);
    try {
      const userDocRef = doc(db, 'users', userId);
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setStats({
          score: data.score || 0,
          totalClicks: data.totalClicks || 0,
          gameStartTime: data.gameStartTime || null,
        });
      }
    } catch (error) {
      console.error("Error loading profile data:", error);
    } finally {
      setIsDataLoading(false);
    }
  }, []);

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


  const { currentLeague, nextLeague, progressPercentage } = getLeagueInfo(stats.score);

  const handleOpenLeaderboard = () => {
    setSelectedLeagueForLeaderboard(currentLeague);
    setIsLeaderboardOpen(true);
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

  const mockTopPlayers: Array<{ name: string; score: number; rank: number }> = [];
  const currentPlayerLeaderboardEntry = { name: currentUser.displayName || 'Вы', score: stats.score, rank: 1 };
  
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
            currentScore={stats.score} 
            progressPercentage={progressPercentage}
            onOpenLeaderboard={handleOpenLeaderboard}
          />
          
          <StatCard icon={Coins} label="Всего монет" value={stats.score.toLocaleString()} />
          <StatCard icon={Star} label="Всего кликов" value={stats.totalClicks.toLocaleString()} />
          <StatCard icon={Clock4} label="Время игры" value={gameTimePlayed} />
        </div>

      </div>
      
      <BottomNavBar activeItem="/profile" onNavigate={handleNavigation} />

      {selectedLeagueForLeaderboard && (
        <LeaderboardModal
          isOpen={isLeaderboardOpen}
          onOpenChange={setIsLeaderboardOpen}
          leagueName={selectedLeagueForLeaderboard.name}
          topPlayers={mockTopPlayers}
          currentPlayer={currentPlayerLeaderboardEntry}
        />
      )}
    </div>
  );
}
