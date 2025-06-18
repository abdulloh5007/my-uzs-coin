"use client";

import React, { useState, useEffect, useCallback } from 'react';
import ClickableCoin from '@/components/ClickableCoin';
import TopBar from '@/components/TopBar';
import BottomNavBar from '@/components/BottomNavBar';
import GameStats from '@/components/GameStats';
import ShopModal from '@/components/ShopModal';
import type { UpgradeId } from '@/components/ShopModal';

// Initial game stats
const INITIAL_MAX_ENERGY = 1000;
const INITIAL_CLICK_POWER = 1;
const INITIAL_ENERGY_REGEN_RATE_PER_SECOND = 3; 
const INITIAL_SCORE = 300; 

// Game mechanics constants
const ENERGY_PER_CLICK = 1; 
const ENERGY_REGEN_INTERVAL = 50; // Milliseconds
const CLICK_ANIMATION_DURATION = 200; // Milliseconds, for visual animation only

export default function HomePage() {
  const [score, setScore] = useState(INITIAL_SCORE);
  const [maxEnergy, setMaxEnergy] = useState(INITIAL_MAX_ENERGY);
  const [energy, setEnergy] = useState(INITIAL_MAX_ENERGY);
  const [clickPower, setClickPower] = useState(INITIAL_CLICK_POWER);
  const [energyRegenRatePerSecond, setEnergyRegenRatePerSecond] = useState(INITIAL_ENERGY_REGEN_RATE_PER_SECOND);
  
  const [isAnimatingClick, setIsAnimatingClick] = useState(false); // For visual animation state
  const [isShopOpen, setIsShopOpen] = useState(false);

  // Derived value for energy regeneration logic
  const energyRegenAmountPerInterval = energyRegenRatePerSecond * (ENERGY_REGEN_INTERVAL / 1000);

  const handleCoinClick = useCallback(() => {
    if (energy >= ENERGY_PER_CLICK) {
      setScore((prevScore) => prevScore + clickPower);
      setEnergy((prevEnergy) => Math.max(0, prevEnergy - ENERGY_PER_CLICK));
      
      // Handle visual animation: start if not already animating
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

    return () => {
      clearInterval(regenTimer);
    };
  }, [maxEnergy, energyRegenAmountPerInterval]);


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
      
      <BottomNavBar activeItem="кликер" />

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
