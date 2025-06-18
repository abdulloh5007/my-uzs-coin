"use client";

import React, { useState, useEffect, useCallback } from 'react';
import ScoreDisplay from '@/components/ScoreDisplay';
import ClickableCoin from '@/components/ClickableCoin';
import EnergyBar from '@/components/EnergyBar';
import { Card, CardContent } from '@/components/ui/card';

const MAX_ENERGY = 1000;
const ENERGY_PER_CLICK = 100;
const SCORE_PER_CLICK = 1;
const ENERGY_REGEN_POINTS = 2; // Amount of energy regenerated per interval
const ENERGY_REGEN_INTERVAL = 50; // Milliseconds (2 energy / 50ms = 40 energy per second)
const CLICK_ANIMATION_DURATION = 200; // Milliseconds

export default function HomePage() {
  const [score, setScore] = useState(0);
  const [energy, setEnergy] = useState(MAX_ENERGY);
  const [isAnimatingClick, setIsAnimatingClick] = useState(false);

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
  
  // Preload images if any (not critical for this icon-based app but good practice)
  // useEffect(() => {
  //  const img = new Image();
  //  img.src = '/path/to/coin-image.png'; // Example if using images
  // }, []);


  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 font-body antialiased bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <div className="fixed top-0 left-0 right-0 z-10 pt-4 bg-background/80 backdrop-blur-sm">
        <ScoreDisplay score={score} />
      </div>
      
      <div className="flex flex-col items-center justify-center flex-grow mt-[100px] mb-[120px] md:mt-[120px] md:mb-[150px]"> {/* Added margins to avoid overlap with fixed elements */}
        <ClickableCoin
          onClick={handleCoinClick}
          isAnimating={isAnimatingClick}
          disabled={energy < ENERGY_PER_CLICK}
        />
      </div>
      
      <div className="fixed bottom-0 left-0 right-0 z-10 pb-4 bg-background/80 backdrop-blur-sm">
        <EnergyBar currentEnergy={energy} maxEnergy={MAX_ENERGY} />
      </div>

      <div className="absolute bottom-4 right-4 text-xs text-muted-foreground opacity-70">
        <p>Click the coin!</p>
        <p>Energy regenerates over time.</p>
      </div>
    </main>
  );
}
