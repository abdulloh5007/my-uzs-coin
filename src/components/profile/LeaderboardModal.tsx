
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export interface Player {
  rank: number;
  name: string;
  score: number;
  uid: string;
}

interface LeaderboardModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  leagueName: string;
  topPlayers: Player[];
  currentPlayer: Player | null;
  isLoading: boolean;
}

const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onOpenChange,
  leagueName,
  topPlayers = [],
  currentPlayer,
  isLoading,
}) => {
  const isCurrentPlayerInTop = currentPlayer && topPlayers.some(p => p.uid === currentPlayer.uid);

  const renderSkeletons = () => (
    Array.from({ length: 10 }).map((_, i) => (
      <TableRow key={`skeleton-${i}`}>
        <TableCell><Skeleton className="h-5 w-5 rounded-full" /></TableCell>
        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
        <TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
      </TableRow>
    ))
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-background border-border p-0 shadow-2xl flex flex-col max-h-[85vh] md:max-h-[80vh]">
        <DialogHeader className="p-6 pb-4 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-primary" />
              <DialogTitle className="text-xl font-semibold text-foreground">{leagueName}</DialogTitle>
            </div>
          </div>
           <DialogDescription className="text-sm text-muted-foreground pt-1">
            Рейтинг лучших игроков в мире.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-6 pt-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead>Игрок</TableHead>
                  <TableHead className="text-right">Счет</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? renderSkeletons() : (
                  topPlayers.length > 0 ? (
                    topPlayers.map((player) => (
                      <TableRow key={player.uid} className={currentPlayer?.uid === player.uid ? "bg-primary/10" : ""}>
                        <TableCell className="font-medium">{player.rank}</TableCell>
                        <TableCell>{player.name}</TableCell>
                        <TableCell className="text-right">{player.score.toLocaleString()}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                       <TableCell colSpan={3} className="h-24 text-center">В рейтинге пока нет игроков.</TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </div>
        </ScrollArea>

        {currentPlayer && !isCurrentPlayerInTop && !isLoading && (
            <div className="p-6 pt-4 border-t border-border/50">
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
