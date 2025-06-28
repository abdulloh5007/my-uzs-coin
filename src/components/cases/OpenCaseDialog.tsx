
'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { Loader2, Coins, Sparkles } from 'lucide-react';

interface CaseItem {
  docId: string;
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  itemPool: string[]; // For future use
}

interface OpenCaseDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  caseItem: CaseItem | null;
  userScore: number;
  userId: string;
  onSuccessfulOpen: () => void; // Callback to refresh user data on parent page
}

const OpenCaseDialog: React.FC<OpenCaseDialogProps> = ({
  isOpen,
  onOpenChange,
  caseItem,
  userScore,
  userId,
  onSuccessfulOpen,
}) => {
  const [isOpening, setIsOpening] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const { toast } = useToast();

  if (!caseItem) return null;

  const canAfford = userScore >= caseItem.price;

  const handleOpen = async () => {
    if (!canAfford || isOpening) return;
    
    setIsOpening(true);
    setResultMessage(null);

    // Simulate opening animation
    setTimeout(async () => {
        try {
            const userDocRef = doc(db, 'users', userId);
            await runTransaction(db, async (transaction) => {
                const userDoc = await transaction.get(userDocRef);
                if (!userDoc.exists()) throw "Документ пользователя не найден!";

                const userData = userDoc.data();
                if (userData.score < caseItem.price) throw "Недостаточно монет.";
                
                transaction.update(userDocRef, {
                    score: userData.score - caseItem.price,
                    lastUpdated: serverTimestamp()
                });
            });

            // TODO: Prize logic will be implemented here later.
            // For now, just a placeholder success message.
            const prize = "Ценный приз"; // Placeholder
            setResultMessage(`Поздравляем! Вы выиграли: ${prize}!`);
            
            toast({
              title: `Кейс "${caseItem.name}" открыт!`,
              description: `Вы получили: ${prize}`,
              duration: 5000,
            });
            
            onSuccessfulOpen(); // This will trigger data refetch on the cases page.

        } catch (e: any) {
            console.error("Transaction failed: ", e);
            toast({
                variant: "destructive",
                title: "Ошибка открытия",
                description: typeof e === 'string' ? e : "Не удалось открыть кейс. Попробуйте снова.",
            });
            setResultMessage('Ошибка. Пожалуйста, попробуйте еще раз.');
        } finally {
            setIsOpening(false);
        }
    }, 2000); // 2 second delay for "animation"
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state on close
    setTimeout(() => {
        setIsOpening(false);
        setResultMessage(null);
    }, 300);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-background border-border p-0 shadow-2xl flex flex-col">
        <DialogHeader className="p-6 text-center">
          <DialogTitle className="text-2xl">{caseItem.name}</DialogTitle>
           <DialogDescription>{caseItem.description}</DialogDescription>
        </DialogHeader>
        
        <div className="px-6 pb-6 min-h-[250px] flex flex-col items-center justify-center">
            {isOpening ? (
                <motion.div
                    key="opening"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center text-center text-muted-foreground"
                >
                    <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                    <p>Открываем...</p>
                </motion.div>
            ) : resultMessage ? (
                 <motion.div
                    key="result"
                    initial={{ opacity: 0, y: 50, scale: 0.7 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="flex flex-col items-center justify-center text-center"
                 >
                    <Sparkles className="w-16 h-16 text-primary mb-4" />
                    <p className="text-lg font-semibold text-foreground">{resultMessage}</p>
                 </motion.div>
            ) : (
                <motion.div
                    key="initial"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center text-center"
                >
                    <div className="relative w-32 h-32 mb-4">
                        <Image src={caseItem.imageUrl} alt={caseItem.name} layout="fill" objectFit="contain" unoptimized/>
                    </div>
                    <h3 className="font-semibold text-foreground">Возможное содержимое</h3>
                    <p className="text-sm text-muted-foreground mt-1">Содержит один из нескольких ценных призов.</p>
                </motion.div>
            )}
        </div>
        
        <DialogFooter className="p-6 border-t border-border/50 bg-background mt-auto">
            {resultMessage ? (
                <Button className="w-full" onClick={handleClose}>Закрыть</Button>
            ) : (
                <Button className="w-full" onClick={handleOpen} disabled={!canAfford || isOpening}>
                    {isOpening ? 'Открытие...' : (
                        <span className="flex items-center gap-2">
                            Открыть за <Coins className="w-4 h-4"/> {caseItem.price.toLocaleString()}
                        </span>
                    )}
                </Button>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
export default OpenCaseDialog;
