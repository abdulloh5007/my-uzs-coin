import type React from 'react';
import { Coins } from 'lucide-react';

interface ScoreDisplayProps {
  score: number;
}

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ score }) => {
  return (
    <div className="flex items-center justify-center text-center my-4 md:my-6">
      <Coins className="w-8 h-8 md:w-10 md:h-10 mr-3 text-accent" />
      <span className="text-4xl md:text-5xl font-bold text-foreground">{score}</span>
    </div>
  );
};

export default ScoreDisplay;
