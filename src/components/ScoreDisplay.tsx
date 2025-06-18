import type React from 'react';
import { Coins } from 'lucide-react';

interface ScoreDisplayProps {
  score: number;
}

// This component might be largely superseded by GameStats.tsx,
// but keeping it in case it's used elsewhere or for direct use.
// The GameStats component will replicate similar UI for score/coins.
const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ score }) => {
  return (
    <div className="flex items-center justify-center text-center my-4 md:my-6">
      <Coins className="w-8 h-8 md:w-10 md:h-10 mr-3 text-primary" /> {/* text-accent to text-primary */}
      <span className="text-4xl md:text-5xl font-bold text-foreground">{score}</span>
    </div>
  );
};

export default ScoreDisplay;
