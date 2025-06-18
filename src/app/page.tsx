"use client";

import React, { useState, useEffect, useCallback } from 'react';
import ClickableCoin from '@/components/ClickableCoin';
import TopBar from '@/components/TopBar';
import BottomNavBar from '@/components/BottomNavBar';
import GameStats from '@/components/GameStats';

const MAX_ENERGY = 1000;
const ENERGY_PER_CLICK = 100; // Default: 100
const SCORE_PER_CLICK = 1;    // Default: 1. Image suggests +6 "Сила клика"
const ENERGY_REGEN_POINTS = 2; // Default: 2.
const ENERGY_REGEN_INTERVAL = 50; // Milliseconds. (2 / 0.050s = 40 energy/sec). Image suggests +3/sec.

const CLICK_ANIMATION_DURATION = 200; // Milliseconds

export default function HomePage() {
  const [score, setScore] = useState(0);
  const [energy, setEnergy] = useState(MAX_ENERGY);
  const [isAnimatingClick, setIsAnimatingClick] = useState(false);
  // const [activeTab, setActiveTab] = useState('кликер'); // For BottomNavBar, if needed

  const clickPower = SCORE_PER_CLICK;
  const energyRegenRate = (ENERGY_REGEN_POINTS / (ENERGY_REGEN_INTERVAL / 1000));


  const handleCoinClick = useCallback(() => {
    if (energy >= ENERGY_PER_CLICK && !isAnimatingClick) {
      setScore((prevScore) => prevScore + SCORE_PER_CLICK);
      setEnergy((prevEnergy) => Math.max(0, prevEnergy - ENERGY_PER_CLICK));
      setIsAnimatingClick(true);
      setTimeout(() => {
        setIsAnimatingClick(false);
      }, CLICK_ANIMATION_DURATION);
    }
  }, [energy, isAnimatingClick]);

  useEffect(() => {
    const regenTimer = setInterval(() => {
      setEnergy((prevEnergy) => Math.min(MAX_ENERGY, prevEnergy + ENERGY_REGEN_POINTS));
    }, ENERGY_REGEN_INTERVAL);

    return () => {
      clearInterval(regenTimer);
    };
  }, []);

  // const handleNavigation = (item: string) => {
  //   setActiveTab(item);
  //   // Add navigation logic here if different pages/views are implemented
  //   console.log("Navigating to:", item);
  // };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-body antialiased selection:bg-primary selection:text-primary-foreground">
      <TopBar />
      <GameStats
        score={score}
        currentEnergy={energy}
        maxEnergy={MAX_ENERGY}
        clickPower={clickPower}
        energyRegenRate={energyRegenRate}
      />
      
      <main className="flex flex-col items-center justify-center flex-grow pt-32 pb-20 md:pt-36 md:pb-24 px-4"> {/* Adjusted padding for fixed bars */}
        <ClickableCoin
          onClick={handleCoinClick}
          isAnimating={isAnimatingClick}
          disabled={energy < ENERGY_PER_CLICK}
        />
      </main>
      
      <BottomNavBar activeItem="кликер" /* onNavigate={handleNavigation} */ />
    </div>
  );
}
