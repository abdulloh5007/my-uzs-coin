
"use client";

import React, { useState, useEffect } from 'react';
import BottomNavBar from '@/components/BottomNavBar';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Coins } from 'lucide-react';
import type { Skin } from '@/types/skins';
import SkinCard from '@/components/skins/SkinCard';
import { useToast } from '@/hooks/use-toast';
import { Palette as PaletteIcon } from 'lucide-react';
import RainbowPaletteIcon from '@/components/skins/RainbowPaletteIcon';

const initialSkins: Skin[] = [
  {
    id: 'classic',
    name: 'Классическая',
    iconComponent: PaletteIcon,
    iconColorClass: 'text-yellow-400',
    iconBgClass: 'bg-purple-500/40',
    cardBgClass: 'bg-purple-600/30 hover:bg-purple-600/40',
    price: 0,
  },
  {
    id: 'silver',
    name: 'Серебряная',
    iconComponent: PaletteIcon,
    iconColorClass: 'text-slate-300',
    iconBgClass: 'bg-slate-600/40',
    cardBgClass: 'bg-slate-700/30 hover:bg-slate-700/40',
    price: 1000,
  },
  {
    id: 'ruby',
    name: 'Рубиновая',
    iconComponent: PaletteIcon,
    iconColorClass: 'text-red-300',
    iconBgClass: 'bg-red-600/40',
    cardBgClass: 'bg-red-700/30 hover:bg-red-700/40',
    price: 5000,
  },
  {
    id: 'emerald',
    name: 'Изумрудная',
    iconComponent: PaletteIcon,
    iconColorClass: 'text-green-300',
    iconBgClass: 'bg-green-600/40',
    cardBgClass: 'bg-green-700/30 hover:bg-green-700/40',
    price: 10000,
  },
  {
    id: 'diamond',
    name: 'Алмазная',
    iconComponent: PaletteIcon,
    iconColorClass: 'text-blue-300',
    iconBgClass: 'bg-blue-600/40',
    cardBgClass: 'bg-blue-700/30 hover:bg-blue-700/40',
    price: 25000,
  },
  {
    id: 'rainbow',
    name: 'Радужная',
    iconComponent: RainbowPaletteIcon,
    iconColorClass: '', // Not needed for SVG component
    iconBgClass: 'bg-indigo-600/40',
    cardBgClass: 'bg-indigo-700/30 hover:bg-indigo-700/40',
    price: 50000,
  },
];

export default function SkinsPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [userBalance, setUserBalance] = useState(0);
  const [ownedSkins, setOwnedSkins] = useState<string[]>(['classic']);
  const [selectedSkinId, setSelectedSkinId] = useState<string>('classic');
  const [skins, setSkins] = useState<Skin[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const storedBalance = localStorage.getItem('userScore');
    if (storedBalance) {
      setUserBalance(parseInt(storedBalance, 10));
    }

    const storedOwnedSkins = localStorage.getItem('ownedSkins');
    if (storedOwnedSkins) {
      setOwnedSkins(JSON.parse(storedOwnedSkins));
    } else {
      localStorage.setItem('ownedSkins', JSON.stringify(['classic']));
    }

    const storedSelectedSkin = localStorage.getItem('selectedSkinId');
    if (storedSelectedSkin) {
      setSelectedSkinId(storedSelectedSkin);
    } else {
      localStorage.setItem('selectedSkinId', 'classic');
    }
  }, []);

  useEffect(() => {
    setSkins(
      initialSkins.map(skin => ({
        ...skin,
        isOwned: ownedSkins.includes(skin.id),
        isSelected: skin.id === selectedSkinId,
      }))
    );
  }, [ownedSkins, selectedSkinId]);


  const handleBuySkin = (skinId: string, price: number) => {
    if (userBalance >= price) {
      const newBalance = userBalance - price;
      setUserBalance(newBalance);
      localStorage.setItem('userScore', newBalance.toString());

      const newOwnedSkins = [...ownedSkins, skinId];
      setOwnedSkins(newOwnedSkins);
      localStorage.setItem('ownedSkins', JSON.stringify(newOwnedSkins));
      
      // Automatically select the newly bought skin
      setSelectedSkinId(skinId);
      localStorage.setItem('selectedSkinId', skinId);

      toast({
        title: "Скин куплен!",
        description: `Скин "${initialSkins.find(s => s.id === skinId)?.name}" теперь ваш.`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Недостаточно средств",
        description: "У вас не хватает монет для покупки этого скина.",
      });
    }
  };

  const handleSelectSkin = (skinId: string) => {
    setSelectedSkinId(skinId);
    localStorage.setItem('selectedSkinId', skinId);
    toast({
        title: "Скин выбран!",
        description: `Скин "${initialSkins.find(s => s.id === skinId)?.name}" активирован.`,
      });
  };

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  if (!isClient) {
    return null; // Or a loading spinner
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-indigo-900/50 text-foreground font-body antialiased selection:bg-primary selection:text-primary-foreground">
      <div className="flex-grow container mx-auto px-4 pt-10 md:pt-16 pb-20 md:pb-24 text-center">
        <h1 className="text-4xl font-bold mb-8">Скины</h1>

        <Card className="max-w-xs mx-auto mb-8 bg-card/80 border-border/50 shadow-md">
          <CardContent className="p-3 flex items-center justify-center">
            <Coins className="w-5 h-5 mr-2 text-primary" />
            <span className="text-sm font-medium text-foreground">Баланс: </span>
            <span className="text-sm font-semibold text-primary ml-1">{userBalance.toLocaleString()}</span>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 gap-4 max-w-2xl mx-auto">
          {skins.map((skin) => (
            <SkinCard
              key={skin.id}
              skin={skin}
              userBalance={userBalance}
              onSelectSkin={handleSelectSkin}
              onBuySkin={handleBuySkin}
            />
          ))}
        </div>
      </div>
      <BottomNavBar onNavigate={handleNavigation} />
    </div>
  );
}
