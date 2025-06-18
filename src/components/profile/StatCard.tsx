
import type React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, label, value }) => {
  return (
    <Card className="bg-card/70 border-border/40 shadow-md">
      <CardContent className="p-4 flex items-center">
        <div className="p-3 bg-primary/10 rounded-lg mr-4">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <div className="text-left">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-xl font-semibold text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatCard;
