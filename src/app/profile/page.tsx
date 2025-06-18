
"use client";

import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Coins, Star, Clock4 } from 'lucide-react';
import BottomNavBar from '@/components/BottomNavBar';
import LeagueInfoCard from '@/components/profile/LeagueInfoCard';
import StatCard from '@/components/profile/StatCard';
import TasksSection from '@/components/profile/TasksSection';
import LeaderboardModal from '@/components/profile/LeaderboardModal';
import type { League } from '@/lib/leagues';
import { getLeagueInfo } from '@/lib/leagues';
import { useRouter, usePathname } from 'next/navigation';
import { formatDistanceStrict } from 'date-fns';


export default function ProfilePage() {
  const [userScore, setUserScore] = useState(0);
  const [totalClicks, setTotalClicks] = useState(0);
  const [gameTimePlayed, setGameTimePlayed] = useState("0s");
  
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [selectedLeagueForLeaderboard, setSelectedLeagueForLeaderboard] = useState<League | null>(null);

  const [clientUserScoreDisplay, setClientUserScoreDisplay] = useState<string | number>(0);
  const [clientTotalClicksDisplay, setClientTotalClicksDisplay] = useState<string | number>(0);

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const storedScore = localStorage.getItem('userScore');
    const storedClicks = localStorage.getItem('totalClicks');
    const storedStartTime = localStorage.getItem('gameStartTime');

    let currentScoreVal = 0;
    let currentClicksVal = 0;

    if (storedScore) {
      currentScoreVal = parseInt(storedScore, 10);
    }
    if (storedClicks) {
      currentClicksVal = parseInt(storedClicks, 10);
    }

    setUserScore(currentScoreVal);
    setTotalClicks(currentClicksVal);

    setClientUserScoreDisplay(currentScoreVal.toLocaleString());
    setClientTotalClicksDisplay(currentClicksVal.toLocaleString());

    if (storedStartTime) {
      const startTime = new Date(storedStartTime);
      const updateTime = () => {
         setGameTimePlayed(formatDistanceStrict(new Date(), startTime, {roundingMethod: 'floor'}));
      };
      updateTime(); 
      const timerId = setInterval(updateTime, 1000); 
      return () => clearInterval(timerId); 
    } else {
      setGameTimePlayed("N/A");
    }
  }, []);

  const { currentLeague, nextLeague, progressPercentage } = getLeagueInfo(userScore);

  const handleOpenLeaderboard = () => {
    setSelectedLeagueForLeaderboard(currentLeague);
    setIsLeaderboardOpen(true);
  };

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-indigo-900/50 text-foreground font-body antialiased selection:bg-primary selection:text-primary-foreground">
      <div className="flex-grow container mx-auto px-4 py-8 pt-10 md:pt-16 text-center">
        <h1 className="text-4xl font-bold mb-8">Профиль</h1>
        
        <Avatar className="w-24 h-24 mx-auto mb-8 shadow-lg ring-2 ring-primary/50">
          <AvatarImage src="https://placehold.co/100x100.png" alt="User Avatar" data-ai-hint="silhouette person" />
          <AvatarFallback>
            <User className="w-12 h-12 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>

        <div className="max-w-md mx-auto space-y-4">
          <LeagueInfoCard
            currentLeague={currentLeague}
            nextLeague={nextLeague}
            currentScore={userScore} // Pass the raw number for logic
            progressPercentage={progressPercentage}
            onOpenLeaderboard={handleOpenLeaderboard}
          />
          
          <StatCard icon={Coins} label="Всего монет" value={clientUserScoreDisplay} />
          <StatCard icon={Star} label="Всего кликов" value={clientTotalClicksDisplay} />
          <StatCard icon={Clock4} label="Время игры" value={gameTimePlayed} />
        </div>

        <TasksSection currentLeagueName={currentLeague.name} />

      </div>
      
      <BottomNavBar activeItem={pathname} onNavigate={handleNavigation} />

      {selectedLeagueForLeaderboard && (
        <LeaderboardModal
          isOpen={isLeaderboardOpen}
          onOpenChange={setIsLeaderboardOpen}
          leagueName={selectedLeagueForLeaderboard.name}
          currentPlayer={{ name: "Вы (Это вы)", score: userScore, rank: 101 }} 
        />
      )}
    </div>
  );
}
