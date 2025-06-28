
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Coins, Sparkles, Box, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs, Timestamp, runTransaction, arrayUnion, serverTimestamp } from 'firebase/firestore';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '@/components/AppLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


// --- TYPES ---
interface CaseItem {
  docId: string;
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  itemPool: string[]; // Array of NFT IDs
}

interface CaseShopState {
  score: number;
  ownedCases: { caseId: string; instanceId: string }[];
}

const CaseCard: React.FC<{
    caseItem: CaseItem, 
    onBuy: () => void,
    canAfford: boolean,
    isBuying: boolean,
}> = ({ caseItem, onBuy, canAfford, isBuying }) => {
    
    return (
        <Card
            className="card-glow-effect border-border/50 text-left h-full flex flex-col overflow-hidden bg-card/80"
        >
            <CardHeader className="p-4 pb-0 relative aspect-video flex justify-center items-center overflow-hidden">
                <Image src={caseItem.imageUrl} alt={caseItem.name} layout="fill" objectFit="contain" className="p-4" unoptimized/>
            </CardHeader>
            <CardContent className="p-4 space-y-3 flex-grow flex flex-col justify-between z-10">
                <div>
                  <div className="flex items-center justify-between">
                     <CardTitle className="text-lg font-semibold text-foreground">{caseItem.name}</CardTitle>
                     <TooltipProvider delayDuration={0}>
                       <Tooltip>
                         <TooltipTrigger asChild>
                           <Button variant="ghost" size="icon" className="h-5 w-5 p-0">
                             <Info className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                           </Button>
                         </TooltipTrigger>
                         <TooltipContent side="top" align="start" className="max-w-xs text-sm p-3">
                           <p className="font-semibold">Возможное содержимое:</p>
                           <p className="text-xs text-muted-foreground">Содержит один случайный NFT из пула предметов. Открыть можно в коллекции.</p>
                         </TooltipContent>
                       </Tooltip>
                     </TooltipProvider>
                  </div>
                  <CardDescription className="text-xs mt-1">{caseItem.description}</CardDescription>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between items-center text-sm mb-3">
                      <span className="text-muted-foreground">Цена:</span>
                      <span className="font-semibold text-primary flex items-center gap-1"><Coins className="w-4 h-4"/>{caseItem.price.toLocaleString()}</span>
                  </div>
                   <Button onClick={onBuy} className="w-full" disabled={isBuying || !canAfford}>
                    {isBuying ? 'Покупка...' : !canAfford ? 'Недостаточно монет' : 'Купить'}
                  </Button>
                </div>
            </CardContent>
        </Card>
    );
}

export default function CasesShopPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { currentUser, loading: authLoading } = useAuth();
  
  const [shopState, setShopState] = useState<CaseShopState>({ score: 0, ownedCases: [] });
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [buyingCaseId, setBuyingCaseId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadShopData = useCallback(async (userId?: string) => {
    setIsLoading(true);
    try {
      if (userId) {
        const userDocRef = doc(db, 'users', userId);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          setShopState({
            score: data.score || 0,
            ownedCases: data.ownedCases || [],
          });
        }
      }

      const casesCollectionRef = collection(db, 'cases');
      const casesQuerySnapshot = await getDocs(casesCollectionRef);
      const fetchedCases: CaseItem[] = casesQuerySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
              docId: doc.id,
              name: data.name,
              description: data.description,
              price: data.price,
              imageUrl: data.imageUrl,
              itemPool: data.itemPool,
          } as CaseItem;
      });
      setCases(fetchedCases);

    } catch (error) {
      console.error("Error loading case shop data:", error);
      toast({ variant: "destructive", title: "Ошибка", description: "Не удалось загрузить данные магазина кейсов." });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
    } else {
      loadShopData(currentUser?.uid);
    }
  }, [currentUser, authLoading, router, loadShopData]);

  const handleBuyCase = async (caseItem: CaseItem) => {
    if (!currentUser || buyingCaseId) return;

    if (shopState.score < caseItem.price) {
        toast({ variant: "destructive", title: "Недостаточно монет", description: `Вам не хватает ${(caseItem.price - shopState.score).toLocaleString()} монет.` });
        return;
    }
    
    setBuyingCaseId(caseItem.docId);
    const userDocRef = doc(db, 'users', currentUser.uid);

    try {
        await runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(userDocRef);
            if (!userDoc.exists()) throw "Документ пользователя не найден!";

            const userData = userDoc.data();
            if (userData.score < caseItem.price) throw "Недостаточно монет.";
            
            const newInstanceId = doc(collection(db, "dummy")).id;
            const newOwnedCase = { 
                caseId: caseItem.docId, 
                instanceId: newInstanceId,
                purchasedAt: Timestamp.now()
            };

            transaction.update(userDocRef, {
                score: userData.score - caseItem.price,
                ownedCases: arrayUnion(newOwnedCase),
                lastUpdated: serverTimestamp()
            });
        });
        
        toast({
          title: `Кейс "${caseItem.name}" куплен!`,
          description: `Вы можете открыть его в своей коллекции.`,
          duration: 5000,
        });
        loadShopData(currentUser.uid);

    } catch (e: any) {
        console.error("Transaction failed: ", e);
        toast({
            variant: "destructive",
            title: "Ошибка покупки",
            description: typeof e === 'string' ? e : "Не удалось совершить покупку. Попробуйте снова.",
        });
        loadShopData(currentUser.uid);
    } finally {
        setBuyingCaseId(null);
    }
  };
  
  if (authLoading || isLoading) {
    return (
      <AppLayout activeItem="/cases" contentClassName="text-center">
        <Skeleton className="h-20 w-20 rounded-full mx-auto mb-4" />
        <Skeleton className="h-10 w-3/5 mx-auto mb-8" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border-border/50 text-left h-full flex flex-col">
              <CardHeader className="p-4 pb-0 relative aspect-video">
                <Skeleton className="w-full h-full"/>
              </CardHeader>
              <CardContent className="p-4 space-y-3 flex-grow flex flex-col justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-10 w-full mt-4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout activeItem="/cases" contentClassName="text-center">
      <div className="mx-auto flex justify-center items-center mb-4 h-20 w-20 rounded-full bg-primary/20">
          <Box className="w-10 h-10 text-primary" />
      </div>
      <h1 className="text-4xl font-bold mb-8 text-foreground">Магазин Кейсов</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
          <AnimatePresence>
            {cases.length > 0 ? (
              cases.map((caseItem) => (
                <motion.div
                  key={caseItem.docId}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  <CaseCard 
                    caseItem={caseItem}
                    onBuy={() => handleBuyCase(caseItem)}
                    canAfford={shopState.score >= caseItem.price}
                    isBuying={buyingCaseId === caseItem.docId}
                  />
                </motion.div>
              ))
            ) : (
              !isLoading && (
                <motion.div
                  key="not-found"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="md:col-span-3 text-center py-10"
                >
                  <p className="text-muted-foreground">Кейсы пока не добавлены.</p>
                  <p className="text-sm text-muted-foreground">Загляните позже!</p>
                </motion.div>
              )
            )}
          </AnimatePresence>
      </div>

    </AppLayout>
  );
}
