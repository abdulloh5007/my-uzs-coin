
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import BottomNavBar from '@/components/BottomNavBar';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Coins, Trophy, Crown, Sparkles, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

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

export default function MintPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const [userBalance, setUserBalance] = useState(0);
  const [ownedNfts, setOwnedNfts] = useState<string[]>([]);

  useEffect(() => {
    setIsClient(true);
    const storedBalance = localStorage.getItem('userScore');
    if (storedBalance) {
      setUserBalance(parseInt(storedBalance, 10));
    }
    const storedOwnedNfts = localStorage.getItem('ownedNfts');
    if (storedOwnedNfts) {
      setOwnedNfts(JSON.parse(storedOwnedNfts));
    }
  }, []);

  const handleMintNft = (nft: NftItem) => {
    if (userBalance >= nft.price) {
      const newBalance = userBalance - nft.price;
      setUserBalance(newBalance);
      localStorage.setItem('userScore', newBalance.toString());

      const newOwnedNfts = [...ownedNfts, nft.id];
      setOwnedNfts(newOwnedNfts);
      localStorage.setItem('ownedNfts', JSON.stringify(newOwnedNfts));

      toast({
        title: `🎉 ${nft.name} сминтен!`,
        description: `Вы успешно приобрели ${nft.name}. Он добавлен в "Мои NFT".`,
        duration: 5000,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Недостаточно монет",
        description: `Вам не хватает ${ (nft.price - userBalance).toLocaleString()} монет для покупки ${nft.name}.`,
        duration: 5000,
      });
    }
  };

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  if (!isClient) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-indigo-900/50 text-foreground font-body antialiased selection:bg-primary selection:text-primary-foreground items-center justify-center">
        <Sparkles className="w-16 h-16 animate-spin text-primary" />
        <p className="mt-4 text-lg">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-indigo-900/50 text-foreground font-body antialiased selection:bg-primary selection:text-primary-foreground">
      <div className="flex-grow container mx-auto px-4 py-8 pt-10 md:pt-16 text-center">
        <h1 className="text-4xl font-bold mb-8 text-foreground">NFT Mint</h1>

        <Card className="max-w-md mx-auto mb-8 bg-card/80 border-border/50 shadow-lg">
          <CardContent className="p-4 flex items-center justify-center">
            <Coins className="w-6 h-6 mr-3 text-primary" />
            <span className="text-lg font-medium text-foreground">Баланс: </span>
            <span className="text-lg font-semibold text-primary ml-1.5">{userBalance.toLocaleString()}</span>
          </CardContent>
        </Card>

        <div className="space-y-6 max-w-md mx-auto">
          {nftItems.map((nft) => {
            const canAfford = userBalance >= nft.price;
            const isOwned = ownedNfts.includes(nft.id);
            const balanceAfterPurchase = userBalance - nft.price;

            return (
              <Card key={nft.id} className="bg-card/80 border-border/50 shadow-lg text-left overflow-hidden">
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
                <CardContent className="p-4 space-y-3">
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
                  
                  {isOwned ? (
                     <Button
                        className="w-full mt-2 bg-green-600 hover:bg-green-600/90 text-white"
                        disabled
                      >
                        Уже куплен
                      </Button>
                  ) : (
                    <Button
                      onClick={() => handleMintNft(nft)}
                      disabled={!canAfford}
                      className={cn(
                        "w-full mt-2",
                        canAfford ? "bg-primary hover:bg-primary/90 text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted cursor-not-allowed"
                      )}
                    >
                      {canAfford ? 'Mint NFT' : 'Недостаточно монет'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}

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
              {ownedNfts.length > 0 ? (
                <div className="space-y-2">
                  {ownedNfts.map(nftId => {
                    const foundNft = nftItems.find(item => item.id === nftId);
                    return (
                      <div key={nftId} className="p-2 bg-card/50 rounded-md text-sm text-muted-foreground">
                        {foundNft ? foundNft.name : `NFT с ID: ${nftId}`}
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

