
import type React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarDisplayProps {
  count: number; // Total stars to display (e.g., 3)
  filledCount: number; // How many of them are filled (e.g., task rating)
  className?: string;
  starClassName?: string;
}

const StarDisplay: React.FC<StarDisplayProps> = ({
  count,
  filledCount,
  className,
  starClassName,
}) => {
  return (
    <div className={cn("flex items-center", className)}>
      {Array.from({ length: count }).map((_, index) => (
        <Star
          key={index}
          className={cn(
            "w-5 h-5",
            index < filledCount
              ? "text-yellow-400 fill-yellow-400"
              : "text-gray-500", // Muted color for empty/unfilled rating stars
            starClassName
          )}
        />
      ))}
    </div>
  );
};

export default StarDisplay;
