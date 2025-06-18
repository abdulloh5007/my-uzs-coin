
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  // DialogClose, // Removed
} from '@/components/ui/dialog';
// import { Button } from '@/components/ui/button'; // Button for explicit close removed
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy } from 'lucide-react'; // User, XIcon removed

interface Player {
  rank: number;
  name: string;
  score: number;
}

interface LeaderboardModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  leagueName: string;
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
  const isCurrentPlayerInTop = currentPlayer && topPlayers.some(p => p.name === currentPlayer.name && p.score === currentPlayer.score);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-background border-border p-0 shadow-2xl flex flex-col max-h-[85vh] md:max-h-[80vh]">
        <DialogHeader className="p-6 pb-4 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-primary" />
              <DialogTitle className="text-xl font-semibold text-foreground">Топ Игроков: {leagueName}</DialogTitle>
            </div>
            {/* Removed explicit DialogClose button */}
          </div>
           <DialogDescription className="text-sm text-muted-foreground pt-1">
            Рейтинг лучших игроков в лиге {leagueName}.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 min-h-0"> {/* Occupies available space and scrolls */}
          <div className="p-6 pt-2"> {/* Padding for scrollable content */}
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
          </div>
        </ScrollArea>

        {currentPlayer && !isCurrentPlayerInTop && (
            <div className="p-6 pt-4 border-t border-border/50"> {/* Player section, outside ScrollArea */}
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
      </DialogContent>
    </Dialog>
  );
};

export default LeaderboardModal;
