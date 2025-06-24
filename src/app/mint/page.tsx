
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import BottomNavBar from '@/components/BottomNavBar';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Coins, Sparkles, Cpu, Wand2, Egg, Rocket, ShoppingCart, Check, Shield, Star, Crown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';

interface NftItem {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  type: 'Простой' | 'Анимированный';
  price: number;
  iconColorClass: string;
  iconBgClass: string;
}

const nftItems: NftItem[] = [
  {
    id: 'cyberpunk_mask',
    name: 'Маска Киберпанка',
    description: 'Стильная маска из будущего.',
    icon: Cpu,
    type: 'Простой',
    price: 15000000,
    iconColorClass: 'text-cyan-400',
    iconBgClass: 'bg-cyan-500/20',
  },
  {
    id: 'magic_staff',
    name: 'Магический Посох',
    description: 'Древний посох, наполненный магией.',
    icon: Wand2,
    type: 'Анимированный',
    price: 80000000,
    iconColorClass: 'text-purple-400',
    iconBgClass: 'bg-purple-500/20',
  },
  {
    id: 'dragon_egg',
    name: 'Яйцо Дракона',
    description: 'Кто знает, что из него вылупится?',
    icon: Egg,
    type: 'Простой',
    price: 20000000,
    iconColorClass: 'text-red-400',
    iconBgClass: 'bg-red-500/20',
  },
  {
    id: 'starship_deed',
    name: 'Документ на корабль',
    description: 'Право собственности на звёздолёт.',
    icon: Rocket,
    type: 'Анимированный',
    price: 100000000,
    iconColorClass: 'text-slate-400',
    iconBgClass: 'bg-slate-500/20',
  },
];


interface NftShopState {
    score: number;
    ownedNfts: string[];
}

export default function NftShopPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { currentUser, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [pageState, setPageState] = useState<NftShopState>({
    score: 0,
    ownedNfts: [],
  });

  const loadShopData = useCallback(async (userId: string) => {
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
      console.error("Error loading NFT shop data:", error);
      toast({ variant: "destructive", title: "Ошибка", description: "Не удалось загрузить данные магазина." });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
    } else if (currentUser) {
      loadShopData(currentUser.uid);
    }
  }, [currentUser, authLoading, router, loadShopData]);


  const handleBuyNft = async (nft: NftItem) => {
    if (!currentUser) return;
    if (pageState.ownedNfts.includes(nft.id)) {
        toast({ title: "Уже в коллекции", description: "Этот NFT уже есть у вас." });
        return;
    }
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
            ownedNfts: arrayUnion(nft.id),
            lastUpdated: serverTimestamp() 
        }, { merge: true });

        toast({
          title: `🎉 ${nft.name} куплен!`,
          description: `NFT добавлен в вашу коллекцию "Мои NFT".`,
          duration: 5000,
        });

      } catch (error) {
        console.error("Error buying NFT:", error);
        toast({ variant: "destructive", title: "Ошибка", description: "Не удалось сохранить покупку NFT." });
        loadShopData(currentUser.uid); // Revert UI state if save fails
      }

    } else {
      toast({
        variant: "destructive",
        title: "Недостаточно монет",
        description: `Вам не хватает ${ (nft.price - pageState.score).toLocaleString()} монет для покупки.`,
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
        <p className="mt-4 text-lg">Загрузка магазина...</p>
      </div>
    );
  }

  const NftCard: React.FC<{nft: NftItem}> = ({ nft }) => {
    const isOwned = pageState.ownedNfts.includes(nft.id);
    const canAfford = pageState.score >= nft.price;
    const Icon = nft.icon;

    return (
        <Card className="bg-card/80 border-border/50 shadow-lg text-left overflow-hidden h-full flex flex-col">
            <CardHeader className="p-4 pb-3 bg-card/90 border-b border-border/30">
                <div className="flex items-center gap-3">
                    <div className={cn("p-2.5 rounded-lg", nft.iconBgClass)}>
                        <Icon className={cn("w-7 h-7", nft.iconColorClass)} />
                    </div>
                    <div>
                        <CardTitle className="text-lg font-semibold text-foreground">{nft.name}</CardTitle>
                        <CardDescription className="text-xs text-muted-foreground mt-0.5">{nft.description}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3 flex-grow flex flex-col justify-between">
                <div>
                    <div className="flex justify-between items-center text-sm mb-1">
                        <span className="text-muted-foreground">Тип:</span>
                        <span className={cn("font-semibold", nft.type === 'Анимированный' ? 'text-purple-400' : 'text-cyan-400')}>
                            {nft.type}
                        </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Цена:</span>
                        <span className="font-semibold text-primary flex items-center gap-1">
                            <Coins className="w-4 h-4"/>{nft.price.toLocaleString()}
                        </span>
                    </div>
                </div>
                
                <Button
                    onClick={() => handleBuyNft(nft)}
                    disabled={isOwned || !canAfford}
                    className={cn(
                        "w-full mt-4",
                        isOwned 
                            ? "bg-green-600/80 hover:bg-green-600/80 text-white cursor-default"
                            : canAfford
                                ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:bg-muted cursor-not-allowed"
                    )}
                >
                    {isOwned 
                        ? <><Check className="w-4 h-4 mr-2"/>В коллекции</>
                        : canAfford 
                            ? <><ShoppingCart className="w-4 h-4 mr-2"/>Купить</>
                            : 'Недостаточно монет'}
                </Button>
            </CardContent>
        </Card>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-indigo-900/50 text-foreground font-body antialiased selection:bg-primary selection:text-primary-foreground">
      <div className="flex-grow container mx-auto px-4 pt-10 md:pt-16 pb-20 md:pb-24 text-center">
        <h1 className="text-4xl font-bold mb-8 text-foreground">Магазин NFT</h1>

        <Card className="max-w-md mx-auto mb-8 bg-card/80 border-border/50 shadow-lg">
          <CardContent className="p-4 flex items-center justify-center">
            <Coins className="w-6 h-6 mr-3 text-primary" />
            <span className="text-lg font-medium text-foreground">Баланс: </span>
            <span className="text-lg font-semibold text-primary ml-1.5">{pageState.score.toLocaleString()}</span>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-12">
            {nftItems.map((nft) => <NftCard key={nft.id} nft={nft} />)}
        </div>

          <Card className="bg-card/80 border-border/50 shadow-lg text-left max-w-4xl mx-auto">
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
                  {pageState.ownedNfts.map((nftId) => {
                    const foundNft = nftItems.find(item => item.id === nftId);
                    if (!foundNft) return null;
                    const IconComponent = foundNft.icon;
                    return (
                      <div key={nftId} className={cn("p-3 rounded-lg shadow-md flex flex-col items-center text-center", foundNft.iconBgClass.replace('/20', '/30'))}>
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
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  <p>У вас пока нет купленных NFT.</p>
                </div>
              )}
            </CardContent>
          </Card>
      </div>
      <BottomNavBar onNavigate={handleNavigation} activeItem="/mint" />
    </div>
  );
}
