
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy, User, XIcon } from 'lucide-react';

interface Player {
  rank: number;
  name: string;
  score: number;
}

interface LeaderboardModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  leagueName: string;
  // Placeholder data - in a real app, this would come from a backend
  topPlayers?: Player[];
  currentPlayer?: Player | null; 
}

const generateMockPlayers = (leagueName: string, count: number = 100): Player[] => {
  return Array.from({ length: count }, (_, i) => ({
    rank: i + 1,
    name: `Игрок ${leagueName} #${i + 1}`,
    score: Math.floor(Math.random() * (50000000 - 1000 + 1)) + 1000,
  })).sort((a,b) => b.score - a.score).map((p, idx) => ({...p, rank: idx + 1}));
};


const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onOpenChange,
  leagueName,
  topPlayers: initialTopPlayers,
  currentPlayer,
}) => {

  const topPlayers = initialTopPlayers || generateMockPlayers(leagueName, 100);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-background border-border p-0 shadow-2xl">
        <DialogHeader className="p-6 pb-4 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-primary" />
              <DialogTitle className="text-xl font-semibold text-foreground">Топ Игроков: {leagueName}</DialogTitle>
            </div>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <XIcon className="w-5 h-5" />
              </Button>
            </DialogClose>
          </div>
           <DialogDescription className="text-sm text-muted-foreground pt-1">
            Рейтинг лучших игроков в лиге {leagueName}.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] p-1">
          <div className="p-5 pt-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead>Игрок</TableHead>
                  <TableHead className="text-right">Счет</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topPlayers.map((player) => (
                  <TableRow key={player.rank} className={currentPlayer?.name === player.name ? "bg-primary/10" : ""}>
                    <TableCell className="font-medium">{player.rank}</TableCell>
                    <TableCell>{player.name}</TableCell>
                    <TableCell className="text-right">{player.score.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {currentPlayer && !topPlayers.find(p => p.name === currentPlayer.name) && (
                 <div className="mt-6 pt-4 border-t border-border/50">
                    <h4 className="text-md font-semibold mb-2 text-foreground">Ваша позиция</h4>
                    <Table>
                        <TableBody>
                            <TableRow className="bg-primary/20">
                                <TableCell className="font-medium">{currentPlayer.rank}</TableCell>
                                <TableCell>{currentPlayer.name}</TableCell>
                                <TableCell className="text-right">{currentPlayer.score.toLocaleString()}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                 </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default LeaderboardModal;
