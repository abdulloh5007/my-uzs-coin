
'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { getRarityById } from '@/data/rarities';
import { Loader2 } from 'lucide-react';

// Simplified local types to avoid circular dependencies
interface OwnedCase {
  caseId: string;
  instanceId: string;
}
interface CaseDefinition {
  docId: string;
  name: string;
  imageUrl: string;
  itemPool: string[];
}
interface NftItem {
  id: string;
  name: string;
  imageUrl?: string;
  rarityId: string;
  rarityName: string;
}

interface CaseOpeningDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  ownedCase: OwnedCase | null;
  allCases: CaseDefinition[];
  allNfts: NftItem[];
  onClaim: (caseInstanceId: string, wonNft: NftItem) => Promise<void>;
}

const CaseOpeningDialog: React.FC<CaseOpeningDialogProps> = ({
  isOpen,
  onOpenChange,
  ownedCase,
  allCases,
  allNfts,
  onClaim,
}) => {
  const [isOpening, setIsOpening] = useState(false);
  const [wonItem, setWonItem] = useState<NftItem | null>(null);

  const caseDef = ownedCase ? allCases.find(c => c.docId === ownedCase.caseId) : null;
  const possibleItems = caseDef ? allNfts.filter(nft => caseDef.itemPool.includes(nft.id)) : [];

  useEffect(() => {
    // Reset state when dialog opens
    if (isOpen) {
      setIsOpening(true);
      setWonItem(null);
      
      const timer = setTimeout(() => {
        handleOpenCase();
      }, 2500); // Start the "spin" for 2.5 seconds

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleOpenCase = () => {
    if (!caseDef || possibleItems.length === 0) {
      console.error("Case definition or item pool is missing.");
      setIsOpening(false);
      return;
    }

    const wonNftId = caseDef.itemPool[Math.floor(Math.random() * caseDef.itemPool.length)];
    const finalWonItem = allNfts.find(nft => nft.id === wonNftId);

    if (finalWonItem) {
      setWonItem(finalWonItem);
      onClaim(ownedCase!.instanceId, finalWonItem);
    } else {
        console.error("Could not find the won NFT in definitions.");
    }
    setIsOpening(false);
  };
  
  const handleClose = () => {
    onOpenChange(false);
  };
  
  const rarityInfo = wonItem ? getRarityById(wonItem.rarityId) : null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background border-border p-0 shadow-2xl flex flex-col">
        <DialogHeader className="p-6 text-center">
          <DialogTitle className="text-2xl">{caseDef?.name || 'Открытие кейса'}</DialogTitle>
           <DialogDescription>
             {wonItem ? 'Поздравляем! Ваш приз:' : 'Определяем ваш приз...'}
           </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 min-h-[300px] flex items-center justify-center">
            <AnimatePresence mode="wait">
            {isOpening || !wonItem ? (
                <motion.div
                    key="opening"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex flex-col items-center justify-center text-center text-muted-foreground"
                >
                    <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                    <p>Открываем кейс...</p>
                </motion.div>
            ) : (
                <motion.div
                    key="result"
                    initial={{ opacity: 0, y: 50, scale: 0.7 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.5, type: 'spring' }}
                    className="w-full flex flex-col items-center"
                >
                    <Card className={cn(
                        "w-full max-w-xs p-4 flex flex-col items-center justify-center text-center",
                         rarityInfo?.color ? 'border-2' : 'border',
                         rarityInfo?.color?.replace('text-', 'border-')
                    )}>
                        <div className="relative w-32 h-32 mb-4">
                           <Image src={wonItem.imageUrl!} alt={wonItem.name} layout="fill" objectFit="contain" unoptimized/>
                        </div>
                        <h3 className="font-semibold text-xl text-foreground">{wonItem.name}</h3>
                        <p className={cn("text-sm font-medium", rarityInfo?.color || 'text-muted-foreground')}>
                            {wonItem.rarityName}
                        </p>
                    </Card>
                </motion.div>
            )}
            </AnimatePresence>
        </div>

        <DialogFooter className="p-6 border-t border-border/50 bg-background mt-auto">
            <Button className="w-full" onClick={handleClose} disabled={isOpening}>
              {isOpening ? '...' : 'Закрыть'}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CaseOpeningDialog;
