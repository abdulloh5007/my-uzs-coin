
import type { ElementType } from 'react';
import { Award, Shield, Trophy, Gem, Star as LucideStar, Crown } from 'lucide-react'; // Using specific names to avoid conflict

export interface League {
  name: string;
  threshold: number;
  icon: ElementType;
  color: string; 
  nextLeagueName?: string;
  nextLeagueThreshold?: number;
}

export const leagues: League[] = [
  { name: 'Bronze', threshold: 0, icon: Award, color: 'text-orange-400', nextLeagueName: 'Silver', nextLeagueThreshold: 100000 },
  { name: 'Silver', threshold: 100000, icon: Shield, color: 'text-slate-400', nextLeagueName: 'Gold', nextLeagueThreshold: 500000 },
  { name: 'Gold', threshold: 500000, icon: Trophy, color: 'text-yellow-400', nextLeagueName: 'Platinum', nextLeagueThreshold: 2000000 },
  { name: 'Platinum', threshold: 2000000, icon: Gem, color: 'text-cyan-400', nextLeagueName: 'Diamond', nextLeagueThreshold: 10000000 },
  { name: 'Diamond', threshold: 10000000, icon: LucideStar, color: 'text-blue-400', nextLeagueName: 'Legendary', nextLeagueThreshold: 50000000 },
  { name: 'Legendary', threshold: 50000000, icon: Crown, color: 'text-purple-500' },
];

export const getLeagueInfo = (score: number): { currentLeague: League, nextLeague: League | null, progressPercentage: number } => {
  let currentLeague: League = leagues[0];
  let nextLeague: League | null = null;

  for (let i = 0; i < leagues.length; i++) {
    if (score >= leagues[i].threshold) {
      currentLeague = leagues[i];
    } else {
      nextLeague = leagues[i];
      break; 
    }
  }
  
  // If current league is the last one, there's no next league
  if (currentLeague.name === leagues[leagues.length - 1].name) {
    nextLeague = null;
  } else if (!nextLeague) { 
    // This case handles if score is higher than all but last league threshold, ensures nextLeague is set
     const currentLeagueIndex = leagues.findIndex(l => l.name === currentLeague.name);
     if (currentLeagueIndex < leagues.length - 1) {
        nextLeague = leagues[currentLeagueIndex + 1];
     }
  }


  let progressPercentage = 0;
  if (nextLeague) {
    const leagueStartScore = currentLeague.threshold;
    const scoreInCurrentLeague = Math.max(0, score - leagueStartScore);
    const pointsToNextLeague = nextLeague.threshold - leagueStartScore;
    progressPercentage = pointsToNextLeague > 0 ? Math.min(100, (scoreInCurrentLeague / pointsToNextLeague) * 100) : 100;
  } else {
    // If legendary or highest league
    progressPercentage = 100;
  }
  
  return { currentLeague, nextLeague, progressPercentage };
};
