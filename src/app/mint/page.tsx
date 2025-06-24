
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import BottomNavBar from '@/components/BottomNavBar';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Coins, Sparkles, Cpu, Wand2, Egg, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, collection, arrayUnion, Timestamp } from 'firebase/firestore';
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import Image from 'next/image';

// --- TYPES ---
interface NftItem {
  id: string;
  name: string;
  description: string;
  icon?: React.ElementType;
  imageUrl?: string;
  type: 'Простой' | 'Анимированный';
  price: number;
  iconColorClass: string;
  iconBgClass: string;
  category: string;
  rarity: number;
  edition: number;
}

const nftItems: NftItem[] = [
  { id: 'cyberpunk_mask', name: 'Маска Киберпанка', description: 'Стильная маска из будущего, улучшающая нейроинтерфейс.', icon: Cpu, type: 'Простой', price: 15000000, iconColorClass: 'text-cyan-400', iconBgClass: 'bg-cyan-500/20', category: 'Киберпанк', rarity: 5, edition: 5000, },
  { id: 'magic_staff', name: 'Магический Посох', description: 'Древний посох, наполненный магией первоэлементов.', icon: Wand2, type: 'Анимированный', price: 80000000, iconColorClass: 'text-purple-400', iconBgClass: 'bg-purple-500/20', category: 'Магия', rarity: 1.5, edition: 1000, },
  { id: 'dragon_egg', name: 'Яйцо Дракона', description: 'Кто знает, что из него вылупится? Ходят слухи о бонусах.', icon: Egg, type: 'Простой', price: 20000000, iconColorClass: 'text-red-400', iconBgClass: 'bg-red-500/20', category: 'Фэнтези', rarity: 3.2, edition: 2500, },
  { id: 'starship_deed', name: 'Документ на ракету', description: 'Право собственности на межгалактический звёздолёт класса "Исследователь".', imageUrl: '/rocket.gif', type: 'Анимированный', price: 100000000, iconColorClass: 'text-slate-400', iconBgClass: 'bg-slate-500/20', category: 'Sci-Fi', rarity: 0.8, edition: 500, },
];

interface NftShopState {
  score: number;
  ownedNfts: { nftId: string; instanceId: string; purchasedAt?: Timestamp; }[];
}

const ParallaxIconDisplay: React.FC<{ nft: NftItem }> = ({ nft }) => {
  const iconRef = useRef<HTMLDivElement>(null);
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (nft.type !== 'Анимированный' || !iconRef.current) return;
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - left) / width - 0.5;
    const y = (e.clientY - top) / height - 0.5;
    e.currentTarget.style.transform = `perspective(1000px) rotateX(${-y * 25}deg) rotateY(${x * 25}deg) scale3d(1.1, 1.1, 1.1)`;
  };
  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!iconRef.current) return;
    e.currentTarget.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
  };
  const Icon = nft.icon;
  return (
    <div
      ref={iconRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "p-8 rounded-2xl inline-block relative overflow-hidden transition-transform duration-150 ease-out", 
        nft.iconBgClass
      )}
      style={{ transformStyle: "preserve-3d" }}
    >
      {nft.imageUrl ? <Image src={nft.imageUrl} alt={nft.name} width={96} height={96} className="w-24 h-24 object-contain pointer-events-none" unoptimized /> : (Icon && <Icon className={cn("w-24 h-24 pointer-events-none", nft.iconColorClass)} />)}
      <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
        <div className="animate-glare-pass absolute top-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12" />
      </div>
    </div>
  );
};


interface NftDetailSheetProps {
    nft: NftItem | null;
    onOpenChange: (open: boolean) => void;
    pageState: NftShopState;
    handleBuyNft: (nft: NftItem) => Promise<void>;
}

const NftDetailSheet: React.FC<NftDetailSheetProps> = ({ 
    nft, 
    onOpenChange, 
    pageState, 
    handleBuyNft
}) => {
    if (!nft) return null;
    const canAfford = pageState.score >= nft.price;
    const bgPattern = encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path d='M12 2L10.5 6H6.5L8 10.5L7 14H17L16 10.5L17.5 6H13.5L12 2Z' fill='hsl(var(--primary))' opacity='0.1'/></svg>`);
    
    return (
      <Sheet open={!!nft} onOpenChange={onOpenChange}>
          <SheetContent side="bottom" className="bg-background border-t-border/50 rounded-t-2xl p-0 max-h-[90vh] flex flex-col text-left">
              <div className="flex flex-col h-full">
                  <div className="p-6 pt-8 text-center" style={{ backgroundImage: `url("data:image/svg+xml,${bgPattern}")` }}>
                      <ParallaxIconDisplay nft={nft} />
                      <SheetTitle className="text-3xl font-bold mt-4 text-foreground">{nft.name}</SheetTitle>
                      <CardDescription className="text-muted-foreground mt-1">{nft.description}</CardDescription>
                  </div>
                  <div className="p-6 flex-1 overflow-y-auto">
                      <div className="space-y-4 text-sm">
                          <div className="flex justify-between items-center border-b border-border/30 pb-3">
                              <span className="text-muted-foreground">Цена</span>
                              <span className="font-semibold text-primary flex items-center gap-1.5"><Coins className="w-4 h-4"/>{nft.price.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center border-b border-border/30 pb-3">
                              <span className="text-muted-foreground">Категория</span>
                              <span className="font-semibold text-foreground">{nft.category}</span>
                          </div>
                      </div>
                  </div>
                  <SheetFooter className="p-6 border-t border-border/50 bg-background">
                      <Button className="w-full" disabled={!canAfford} onClick={() => handleBuyNft(nft)}>
                          {canAfford ? (<>Купить за <Coins className="w-5 h-5 mx-2" /> {nft.price.toLocaleString()}</>) : ('Недостаточно монет')}
                      </Button>
                  </SheetFooter>
              </div>
          </SheetContent>
      </Sheet>
    );
};


const NftCard: React.FC<{nft: NftItem, onClick: () => void}> = ({ nft, onClick }) => {
    const Icon = nft.icon;
    return (
        <Card className="bg-card/80 border-border/50 shadow-lg text-left overflow-hidden h-full flex flex-col relative">
            <CardHeader className="p-4 pb-3 bg-card/90 border-b border-border/30">
                <div className="flex items-center gap-3">
                    <div className={cn("p-2.5 rounded-lg", nft.iconBgClass)}>
                        {nft.imageUrl ? <Image src={nft.imageUrl} alt={nft.name} width={28} height={28} unoptimized /> : (Icon && <Icon className={cn("w-7 h-7", nft.iconColorClass)} />)}
                    </div>
                    <div>
                        <CardTitle className="text-lg font-semibold text-foreground">{nft.name}</CardTitle>
                        <CardDescription className="text-xs text-muted-foreground mt-0.5">{nft.category}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3 flex-grow flex flex-col justify-between">
                <div>
                    <div className="flex justify-between items-center text-sm mb-1"><span className="text-muted-foreground">Тип:</span><span className={cn("font-semibold", nft.type === 'Анимированный' ? 'text-purple-400' : 'text-cyan-400')}>{nft.type}</span></div>
                    <div className="flex justify-between items-center text-sm"><span className="text-muted-foreground">Цена:</span><span className="font-semibold text-primary flex items-center gap-1"><Coins className="w-4 h-4"/>{nft.price.toLocaleString()}</span></div>
                </div>
                <Button onClick={onClick} variant="outline" className="w-full mt-4"><Info className="w-4 h-4 mr-2" />Подробнее</Button>
            </CardContent>
        </Card>
    );
}

export default function NftShopPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { currentUser, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedNft, setSelectedNft] = useState<NftItem | null>(null);
  const [pageState, setPageState] = useState<NftShopState>({ score: 0, ownedNfts: [] });

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
    
    if (pageState.score >= nft.price) {
      const newBalance = pageState.score - nft.price;
      const newInstanceId = doc(collection(db, "dummy")).id;
      
      const newOwnedNftForFirestore = { nftId: nft.id, instanceId: newInstanceId, purchasedAt: serverTimestamp() };
      const newOwnedNftForState = { nftId: nft.id, instanceId: newInstanceId, purchasedAt: Timestamp.now() };

      // Optimistic UI update
      setPageState(prev => ({ 
        ...prev, 
        score: newBalance, 
        ownedNfts: [...prev.ownedNfts, newOwnedNftForState] 
      }));

      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        await setDoc(userDocRef, { 
            score: newBalance, 
            ownedNfts: arrayUnion(newOwnedNftForFirestore),
            lastUpdated: serverTimestamp() 
        }, { merge: true });

        toast({
          title: `🎉 ${nft.name} куплен!`,
          description: `NFT добавлен в вашу коллекцию.`,
          duration: 5000,
        });
        setSelectedNft(null);

      } catch (error) {
        console.error("Error buying NFT:", error);
        toast({ variant: "destructive", title: "Ошибка", description: "Не удалось сохранить покупку NFT." });
        loadShopData(currentUser.uid); // Revert on error
      }

    } else {
      toast({
        variant: "destructive",
        title: "Недостаточно монет",
        description: `Вам не хватает ${ (nft.price - pageState.score).toLocaleString()} монет для покупки.`,
      });
    }
  };
  
  const handleNavigation = (path: string) => router.push(path);
  
  if (authLoading || isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-indigo-900/50 text-foreground font-body items-center justify-center">
        <Sparkles className="w-16 h-16 animate-spin text-primary" />
        <p className="mt-4 text-lg">Загрузка магазина...</p>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-indigo-900/50 text-foreground font-body antialiased">
      <div className="flex-grow container mx-auto px-4 pt-10 md:pt-16 pb-20 md:pb-24 text-center">
        <div className="mx-auto flex justify-center items-center mb-4 h-20 w-20 rounded-full bg-primary/20">
            <Sparkles className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-4xl font-bold mb-8 text-foreground">Магазин NFT</h1>
        <Card className="max-w-md mx-auto mb-8 bg-card/80 border-border/50 shadow-lg"><CardContent className="p-4 flex items-center justify-center"><Coins className="w-6 h-6 mr-3 text-primary" /><span className="text-lg font-medium text-foreground">Баланс: </span><span className="text-lg font-semibold text-primary ml-1.5">{pageState.score.toLocaleString()}</span></CardContent></Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-12">
            {nftItems.map((nft) => <NftCard key={nft.id} nft={nft} onClick={() => setSelectedNft(nft)} />)}
        </div>
      </div>

       <NftDetailSheet
           nft={selectedNft} 
           onOpenChange={(isOpen) => !isOpen && setSelectedNft(null)}
           pageState={pageState}
           handleBuyNft={handleBuyNft}
       />

      <BottomNavBar onNavigate={handleNavigation} activeItem="/mint" />
    </div>
  );
}
