
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import BottomNavBar from '@/components/BottomNavBar';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Coins, Sparkles, Cpu, Wand2, Egg, Info, BarChart, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs, arrayUnion, Timestamp, runTransaction, increment } from 'firebase/firestore';
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';

// --- TYPES ---
interface NftItem {
  docId: string; // The actual document ID in Firestore
  id: string; // The custom ID like 'silver_coin'
  name: string;
  description: string;
  icon?: React.ElementType;
  imageUrl?: string;
  type: 'Простой' | 'Анимированный';
  price: number;
  iconColorClass?: string;
  iconBgClass?: string;
  category: string;
  rarity: number;
  edition: number;
  totalEdition: number;
  backgroundSvg?: string;
}

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
    iconRef.current.style.transform = `perspective(1000px) rotateX(${-y * 25}deg) rotateY(${x * 25}deg) scale3d(1.1, 1.1, 1.1)`;
  };
  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!iconRef.current) return;
    iconRef.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
  };
  const Icon = nft.icon;
  return (
    <div
      ref={iconRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "p-8 rounded-2xl inline-block relative overflow-hidden transition-transform duration-150 ease-out", 
        nft.iconBgClass || 'bg-primary/20'
      )}
      style={{ transformStyle: "preserve-3d" }}
    >
      {nft.imageUrl ? <Image src={nft.imageUrl} alt={nft.name} width={96} height={96} className="w-24 h-24 object-contain pointer-events-none" unoptimized /> : (Icon && <Icon className={cn("w-24 h-24 pointer-events-none", nft.iconColorClass || 'text-primary')} />)}
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
    isBuying: boolean;
}

const NftDetailSheet: React.FC<NftDetailSheetProps> = ({ 
    nft, 
    onOpenChange, 
    pageState, 
    handleBuyNft,
    isBuying
}) => {
    if (!nft) return null;
    const canAfford = pageState.score >= nft.price;
    const isSoldOut = nft.edition <= 0;
    const bgPattern = encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path d='M12 2L10.5 6H6.5L8 10.5L7 14H17L16 10.5L17.5 6H13.5L12 2Z' fill='hsl(var(--primary))' opacity='0.1'/></svg>`);
    
    const backgroundStyle = nft.backgroundSvg
        ? { backgroundImage: `url("data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(nft.backgroundSvg)))}")`, backgroundSize: 'cover' }
        : { backgroundImage: `url("data:image/svg+xml,${bgPattern}")` };

    return (
      <Sheet open={!!nft} onOpenChange={onOpenChange}>
          <SheetContent side="bottom" className="bg-background border-t-border/50 rounded-t-2xl p-0 max-h-[90vh] text-left w-full">
               <div className="flex flex-col lg:flex-row h-full">
                  {/* LEFT PANE (Top on mobile) */}
                  <div 
                    className="p-6 pt-8 text-center lg:w-1/2 lg:flex lg:flex-col lg:justify-center lg:items-center lg:border-r lg:border-border/50 bg-center" 
                    style={backgroundStyle}>
                      <ParallaxIconDisplay nft={nft} />
                      <SheetTitle className="text-3xl font-bold mt-4 text-foreground">{nft.name}</SheetTitle>
                      <CardDescription className="text-muted-foreground mt-1">{nft.description}</CardDescription>
                  </div>
                  
                  {/* RIGHT PANE (Bottom on mobile) */}
                  <div className="flex flex-col flex-1 lg:w-1/2">
                    <div className="p-6 flex-1 overflow-y-auto">
                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between items-center border-b border-border/30 pb-3">
                                <span className="text-muted-foreground flex items-center gap-2"><Coins className="w-4 h-4"/>Цена</span>
                                <span className="font-semibold text-primary flex items-center gap-1.5">{nft.price.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-border/30 pb-3">
                                <span className="text-muted-foreground flex items-center gap-2"><Info className="w-4 h-4"/>Категория</span>
                                <span className="font-semibold text-foreground">{nft.category}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-border/30 pb-3">
                                <span className="text-muted-foreground flex items-center gap-2"><BarChart className="w-4 h-4"/>Редкость</span>
                                <span className="font-semibold text-primary">{nft.rarity}%</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-border/30 pb-3">
                                <span className="text-muted-foreground flex items-center gap-2"><Package className="w-4 h-4"/>Осталось</span>
                                <span className={`font-semibold ${nft.edition > 10 ? 'text-foreground' : 'text-amber-500'}`}>{nft.edition.toLocaleString()} из {nft.totalEdition.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                    <SheetFooter className="p-6 border-t border-border/50 bg-background mt-auto">
                        <Button className="w-full" disabled={!canAfford || isBuying || isSoldOut} onClick={() => handleBuyNft(nft)}>
                             {isBuying ? 'Покупка...' : isSoldOut ? 'Закончилось' : canAfford ? (<>Купить за <Coins className="w-5 h-5 mx-2" /> {nft.price.toLocaleString()}</>) : 'Недостаточно монет'}
                        </Button>
                    </SheetFooter>
                  </div>
              </div>
          </SheetContent>
      </Sheet>
    );
};


const NftCard: React.FC<{nft: NftItem, onClick: () => void}> = ({ nft, onClick }) => {
    const Icon = nft.icon;
    const cardRef = useRef<HTMLDivElement>(null);

    const svgToBgUrl = (svg: string) => `url("data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}")`;

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        e.currentTarget.style.setProperty('--x', `${x}px`);
        e.currentTarget.style.setProperty('--y', `${y}px`);
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
        e.currentTarget.style.removeProperty('--x');
        e.currentTarget.style.removeProperty('--y');
    };

    return (
        <Card
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="card-glow-effect border-border/50 text-left h-full flex flex-col overflow-hidden"
        >
            {nft.backgroundSvg && (
                <div
                    className="absolute inset-0 bg-cover bg-center z-0"
                    style={{ backgroundImage: svgToBgUrl(nft.backgroundSvg) }}
                />
            )}
            <CardHeader className="p-4 pb-3 bg-transparent border-b border-border/30 z-10">
                <div className="flex items-center gap-3">
                    <div className={cn("p-2.5 rounded-lg", nft.iconBgClass || 'bg-primary/20')}>
                        {nft.imageUrl ? <Image src={nft.imageUrl} alt={nft.name} width={28} height={28} unoptimized /> : (Icon && <Icon className={cn("w-7 h-7", nft.iconColorClass || 'text-primary')} />)}
                    </div>
                    <div>
                        <CardTitle className="text-lg font-semibold text-foreground">{nft.name}</CardTitle>
                        <CardDescription className="text-xs text-muted-foreground mt-0.5">{nft.category}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3 flex-grow flex flex-col justify-between bg-transparent z-10">
                <div>
                    <div className="flex justify-between items-center text-sm mb-1"><span className="text-muted-foreground">Тип:</span><Badge variant={nft.type === 'Анимированный' ? 'default' : 'secondary'} className={cn('text-xs', nft.type === 'Анимированный' ? 'bg-purple-500/80 border-purple-400/50 hover:bg-purple-500/80' : 'bg-cyan-500/80 border-cyan-400/50')}>{nft.type}</Badge></div>
                    <div className="flex justify-between items-center text-sm"><span className="text-muted-foreground">Цена:</span><span className="font-semibold text-primary flex items-center gap-1"><Coins className="w-4 h-4"/>{nft.price.toLocaleString()}</span></div>
                     <div className="flex justify-between items-center text-sm mt-1">
                        <span className="text-muted-foreground">Осталось:</span>
                        <span className={`font-semibold ${nft.edition > 10 ? 'text-foreground' : 'text-amber-500'}`}>
                            {nft.edition > 0 ? `${nft.edition.toLocaleString()} из ${nft.totalEdition.toLocaleString()}` : 'Нет'}
                        </span>
                    </div>
                </div>
                <Button onClick={onClick} variant="outline" className="w-full mt-4" disabled={nft.edition <= 0}>
                   {nft.edition > 0 ? <><Info className="w-4 h-4 mr-2" />Подробнее</> : 'Закончилось'}
                </Button>
            </CardContent>
        </Card>
    );
}

export default function NftShopPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { currentUser, loading: authLoading } = useAuth();
  
  const [selectedNft, setSelectedNft] = useState<NftItem | null>(null);
  const [pageState, setPageState] = useState<NftShopState>({ score: 0, ownedNfts: [] });
  const [shopItems, setShopItems] = useState<NftItem[]>([]);
  const [isBuying, setIsBuying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadShopData = useCallback(async (userId?: string) => {
    setIsLoading(true);
    try {
      if (userId) {
        const userDocRef = doc(db, 'users', userId);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          setPageState({
            score: data.score || 0,
            ownedNfts: data.ownedNfts || [],
          });
        }
      }

      const nftCollectionRef = collection(db, 'nfts');
      const nftQuerySnapshot = await getDocs(nftCollectionRef);
      const fetchedNfts: NftItem[] = nftQuerySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
              docId: doc.id,
              id: data.id,
              name: data.name,
              description: data.description,
              type: data.type,
              price: data.price,
              category: data.category,
              rarity: data.rarity,
              edition: data.edition,
              totalEdition: data.totalEdition || data.edition,
              imageUrl: data.imageUrl,
              backgroundSvg: data.backgroundSvg,
              iconColorClass: 'text-primary',
              iconBgClass: 'bg-primary/20',
          } as NftItem;
      });
      setShopItems(fetchedNfts);

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
    } else {
      loadShopData(currentUser?.uid);
    }
  }, [currentUser, authLoading, router, loadShopData]);

  const handleBuyNft = async (nft: NftItem) => {
    if (!currentUser || isBuying) return;

    if (pageState.score < nft.price) {
        toast({ variant: "destructive", title: "Недостаточно монет", description: `Вам не хватает ${(nft.price - pageState.score).toLocaleString()} монет.` });
        return;
    }
    if (nft.edition <= 0) {
        toast({ variant: "destructive", title: "Предмет закончился", description: "К сожалению, все экземпляры этого NFT были распроданы." });
        return;
    }
    
    setIsBuying(true);
    const userDocRef = doc(db, 'users', currentUser.uid);
    const nftDocRef = doc(db, 'nfts', nft.docId);

    try {
        await runTransaction(db, async (transaction) => {
            const nftDoc = await transaction.get(nftDocRef);
            const userDoc = await transaction.get(userDocRef);

            if (!nftDoc.exists() || !userDoc.exists()) {
                throw "Документ не найден! Пожалуйста, обновите страницу.";
            }

            const nftData = nftDoc.data();
            const userData = userDoc.data();

            if (nftData.edition <= 0) {
                throw "Этот предмет только что закончился.";
            }

            if (userData.score < nftData.price) {
                throw "Недостаточно монет.";
            }
            
            const copyNumber = nftData.totalEdition ? (nftData.totalEdition - nftData.edition + 1) : undefined;
            const newInstanceId = doc(collection(db, "dummy")).id;
            const purchaseTimestamp = Timestamp.now();
            const newOwnedNft = { nftId: nft.id, instanceId: newInstanceId, purchasedAt: purchaseTimestamp, copyNumber };

            transaction.update(nftDocRef, { edition: increment(-1) });
            transaction.update(userDocRef, {
                score: increment(-nftData.price),
                ownedNfts: arrayUnion(newOwnedNft),
                lastUpdated: serverTimestamp()
            });
        });
        
        toast({
          title: `🎉 ${nft.name} куплен!`,
          description: `NFT добавлен в вашу коллекцию.`,
          duration: 5000,
        });
        setSelectedNft(null);
        loadShopData(currentUser.uid); // Refresh data from DB to show new counts and balance

    } catch (e: any) {
        console.error("Transaction failed: ", e);
        toast({
            variant: "destructive",
            title: "Ошибка покупки",
            description: typeof e === 'string' ? e : "Не удалось совершить покупку. Попробуйте снова.",
        });
        loadShopData(currentUser.uid); // Also refresh on error to get latest state
    } finally {
        setIsBuying(false);
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
            {shopItems.map((nft) => <NftCard key={nft.id} nft={nft} onClick={() => setSelectedNft(nft)} />)}
        </div>
      </div>

       <NftDetailSheet
           nft={selectedNft} 
           onOpenChange={(isOpen) => !isOpen && setSelectedNft(null)}
           pageState={pageState}
           handleBuyNft={handleBuyNft}
           isBuying={isBuying}
       />

      <BottomNavBar onNavigate={handleNavigation} activeItem="/mint" />
    </div>
  );
}
