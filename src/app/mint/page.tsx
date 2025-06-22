
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import BottomNavBar from '@/components/BottomNavBar';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Coins, Trophy, Crown, Sparkles, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

interface NftItem {
  id: 'standard' | 'premium';
  name: string;
  description: string;
  icon: React.ElementType;
  iconColorClass: string;
  iconBgClass: string;
  price: number;
}

const nftItems: NftItem[] = [
  {
    id: 'standard',
    name: 'Standard NFT',
    description: 'Обычный NFT для начинающих коллекционеров',
    icon: Trophy,
    iconColorClass: 'text-blue-400',
    iconBgClass: 'bg-blue-500/20',
    price: 10000000,
  },
  {
    id: 'premium',
    name: 'Premium NFT',
    description: 'Премиум NFT для настоящих профессионалов',
    icon: Crown,
    iconColorClass: 'text-pink-400',
    iconBgClass: 'bg-pink-500/20',
    price: 100000000,
  },
];

interface MintPageState {
    score: number;
    ownedNfts: string[];
}

export default function MintPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { currentUser, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [pageState, setPageState] = useState<MintPageState>({
    score: 0,
    ownedNfts: [],
  });

  const loadMintData = useCallback(async (userId: string) => {
    setIsLoading(true);
    try {
      const userDocRef = doc(db, 'users', userId);
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setPageState({
          score: data.score || 0,
          ownedNfts: data.ownedNfts || [],
        });
      }
    } catch (error) {
      console.error("Error loading mint data:", error);
      toast({ variant: "destructive", title: "Ошибка", description: "Не удалось загрузить данные для минтинга." });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
    } else if (currentUser) {
      loadMintData(currentUser.uid);
    }
  }, [currentUser, authLoading, router, loadMintData]);


  const handleMintNft = async (nft: NftItem) => {
    if (!currentUser) return;
    if (pageState.score >= nft.price) {
      const newBalance = pageState.score - nft.price;
      const newOwnedNfts = [...pageState.ownedNfts, nft.id];

      // Optimistic UI update
      setPageState({
        score: newBalance,
        ownedNfts: newOwnedNfts,
      });

      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        await setDoc(userDocRef, { 
            score: newBalance, 
            ownedNfts: newOwnedNfts,
            lastUpdated: serverTimestamp() 
        }, { merge: true });

        toast({
          title: `🎉 ${nft.name} сминтен!`,
          description: `Вы успешно приобрели еще один ${nft.name}. Он добавлен в "Мои NFT".`,
          duration: 5000,
        });

      } catch (error) {
        console.error("Error minting NFT:", error);
        toast({ variant: "destructive", title: "Ошибка", description: "Не удалось сохранить покупку NFT." });
        // Revert UI state if save fails
        loadMintData(currentUser.uid); 
      }

    } else {
      toast({
        variant: "destructive",
        title: "Недостаточно монет",
        description: `Вам не хватает ${ (nft.price - pageState.score).toLocaleString()} монет для покупки ${nft.name}.`,
        duration: 5000,
      });
    }
  };

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-indigo-900/50 text-foreground font-body antialiased selection:bg-primary selection:text-primary-foreground items-center justify-center">
        <Sparkles className="w-16 h-16 animate-spin text-primary" />
        <p className="mt-4 text-lg">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-indigo-900/50 text-foreground font-body antialiased selection:bg-primary selection:text-primary-foreground">
      <div className="flex-grow container mx-auto px-4 pt-10 md:pt-16 pb-20 md:pb-24 text-center">
        <h1 className="text-4xl font-bold mb-8 text-foreground">NFT Mint</h1>

        <Card className="max-w-md mx-auto mb-8 bg-card/80 border-border/50 shadow-lg">
          <CardContent className="p-4 flex items-center justify-center">
            <Coins className="w-6 h-6 mr-3 text-primary" />
            <span className="text-lg font-medium text-foreground">Баланс: </span>
            <span className="text-lg font-semibold text-primary ml-1.5">{pageState.score.toLocaleString()}</span>
          </CardContent>
        </Card>

        <div className="space-y-6 max-w-2xl mx-auto">
          <div className="flex flex-col md:flex-row md:gap-6 space-y-6 md:space-y-0">
            {nftItems.map((nft) => {
              const canAfford = pageState.score >= nft.price;
              const balanceAfterPurchase = pageState.score - nft.price;

              return (
                <div key={nft.id} className="flex-1 md:min-w-0">
                  <Card className="bg-card/80 border-border/50 shadow-lg text-left overflow-hidden h-full flex flex-col">
                    <CardHeader className="p-4 pb-3 bg-card/90 border-b border-border/30">
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2.5 rounded-lg", nft.iconBgClass)}>
                          <nft.icon className={cn("w-7 h-7", nft.iconColorClass)} />
                        </div>
                        <div>
                          <CardTitle className="text-xl font-semibold text-foreground">{nft.name}</CardTitle>
                          <CardDescription className="text-xs text-muted-foreground mt-0.5">{nft.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3 flex-grow flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Стоимость:</span>
                          <span className="font-semibold text-primary">{nft.price.toLocaleString()} монет</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">После покупки:</span>
                          <span className={cn("font-semibold", balanceAfterPurchase >= 0 ? "text-green-400" : "text-red-400")}>
                            {balanceAfterPurchase.toLocaleString()} монет
                          </span>
                        </div>
                      </div>
                      
                      <Button
                        onClick={() => handleMintNft(nft)}
                        disabled={!canAfford}
                        className={cn(
                          "w-full mt-4",
                          canAfford ? "bg-primary hover:bg-primary/90 text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted cursor-not-allowed"
                        )}
                      >
                        {canAfford ? 'Mint NFT' : 'Недостаточно монет'}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>

          <Card className="bg-card/80 border-border/50 shadow-lg text-left">
            <CardHeader className="p-4 pb-3">
              <div className="flex items-center gap-3">
                <div className={cn("p-2.5 rounded-lg bg-indigo-500/20")}>
                  <Sparkles className={cn("w-7 h-7 text-indigo-400")} />
                </div>
                <CardTitle className="text-xl font-semibold text-foreground">Мои NFT</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              {pageState.ownedNfts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {pageState.ownedNfts.map((nftId, index) => {
                    const foundNft = nftItems.find(item => item.id === nftId);
                    if (!foundNft) return null;
                    const IconComponent = foundNft.icon;
                    return (
                      <div key={`${nftId}-${index}`} className={cn("p-3 rounded-lg shadow-md flex flex-col items-center text-center", foundNft.iconBgClass.replace('/20', '/30'))}>
                        <div className={cn("p-2 rounded-full mb-2", foundNft.iconBgClass)}>
                          <IconComponent className={cn("w-6 h-6", foundNft.iconColorClass)} />
                        </div>
                        <span className="text-xs font-medium text-foreground truncate w-full">{foundNft.name}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center py-6 text-muted-foreground">
                  <Info className="w-5 h-5 mr-2" />
                  <p>У вас пока нет созданных NFT.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <BottomNavBar onNavigate={handleNavigation} activeItem="/mint" />
    </div>
  );
}

    