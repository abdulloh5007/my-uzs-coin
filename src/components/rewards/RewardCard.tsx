
import type React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Coins } from 'lucide-react';
import type { DisplayableReward } from '@/app/rewards/page'; // Using the new interface
import { cn } from '@/lib/utils';

interface RewardCardProps {
  reward: DisplayableReward;
  onClaim: (tierId: string, rewardAmount: number) => void;
}

const TaskTypeBadge: React.FC<{ type: 'daily' | 'main' | 'league' }> = ({ type }) => {
  let bgColor = 'bg-gray-500/20';
  let textColor = 'text-gray-300';
  let text = 'Задание';

  switch (type) {
    case 'daily':
      bgColor = 'bg-purple-500/30';
      textColor = 'text-purple-300';
      text = 'Ежедневная';
      break;
    case 'main':
      bgColor = 'bg-blue-500/30';
      textColor = 'text-blue-300';
      text = 'Основная';
      break;
    case 'league':
      bgColor = 'bg-yellow-500/30';
      textColor = 'text-yellow-300';
      text = 'Лига';
      break;
  }
  return (
    <span className={cn("px-2 py-0.5 text-xs font-medium rounded-full", bgColor, textColor)}>
      {text}
    </span>
  );
};


const RewardCard: React.FC<RewardCardProps> = ({ reward, onClaim }) => {
  const { parentTask, tier, isClaimed } = reward;
  const IconComponent = parentTask.icon;

  return (
    <Card className="bg-card/90 border-border/60 shadow-md w-full text-left hover:bg-card transition-colors">
      <CardContent className="p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className={`p-2.5 rounded-full ${isClaimed ? 'bg-green-500/20' : parentTask.iconBgClass || 'bg-primary/20'}`}>
            {isClaimed ? (
              <CheckCircle2 className="w-6 h-6 text-green-500" />
            ) : (
              <IconComponent className={`w-6 h-6 ${parentTask.iconColorClass || 'text-primary'}`} />
            )}
          </div>
          <div className="flex-1">
            <div className="flex flex-col items-left gap-1 mb-0.5">
                <h4 className="text-md font-semibold text-foreground">{parentTask.title}</h4>
                <TaskTypeBadge type={parentTask.type} />
            </div>
            <p className="text-xs text-muted-foreground mb-1">{tier.description}</p>
            <div className="flex items-center text-sm text-yellow-400">
              <Coins className="w-4 h-4 mr-1" />
              <span>+{tier.reward.toLocaleString()}</span>
            </div>
          </div>
        </div>
        
        {isClaimed ? (
          <Button
            size="sm"
            disabled
            className="bg-green-600/80 hover:bg-green-600/80 text-white px-4 whitespace-nowrap"
          >
            Получено
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={() => onClaim(tier.id, tier.reward)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 whitespace-nowrap"
          >
            Забрать награду
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default RewardCard;
