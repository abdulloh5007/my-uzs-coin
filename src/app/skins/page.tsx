
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import BottomNavBar from '@/components/BottomNavBar';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Coins, Sparkles } from 'lucide-react';
import type { Skin } from '@/types/skins';
import SkinCard from '@/components/skins/SkinCard';
import { useToast } from '@/hooks/use-toast';
import { initialSkins } from '@/data/skins';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';


interface SkinsPageState {
  score: number;
  ownedSkins: string[];
  selectedSkinId: string;
}

export default function SkinsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { currentUser, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  const [pageState, setPageState] = useState<SkinsPageState>({
    score: 0,
    ownedSkins: ['classic'],
    selectedSkinId: 'classic',
  });
  const [displaySkins, setDisplaySkins] = useState<Skin[]>([]);
  
  const loadSkinsData = useCallback(async (userId: string) => {
    setIsLoading(true);
    try {
      const userDocRef = doc(db, 'users', userId);
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setPageState({
          score: data.score || 0,
          ownedSkins: data.ownedSkins || ['classic'],
          selectedSkinId: data.selectedSkinId || 'classic',
        });
      }
    } catch (error) {
      console.error("Error loading skins data:", error);
      toast({ variant: "destructive", title: "Ошибка", description: "Не удалось загрузить данные о скинах." });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
    } else if (currentUser) {
      loadSkinsData(currentUser.uid);
    }
  }, [currentUser, authLoading, router, loadSkinsData]);

  useEffect(() => {
    setDisplaySkins(
      initialSkins.map(skin => ({
        ...skin,
        isOwned: pageState.ownedSkins.includes(skin.id),
        isSelected: skin.id === pageState.selectedSkinId,
      }))
    );
  }, [pageState.ownedSkins, pageState.selectedSkinId]);


  const handleBuySkin = async (skinId: string, price: number) => {
    if (!currentUser) return;
    if (pageState.score >= price) {
      const newBalance = pageState.score - price;
      const newOwnedSkins = [...pageState.ownedSkins, skinId];
      
      // Optimistic UI update
      setPageState({
        score: newBalance,
        ownedSkins: newOwnedSkins,
        selectedSkinId: skinId, // Auto-select new skin
      });

      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        await setDoc(userDocRef, { 
            score: newBalance,
            ownedSkins: newOwnedSkins,
            selectedSkinId: skinId,
            lastUpdated: serverTimestamp()
        }, { merge: true });

        toast({
          title: "Скин куплен!",
          description: `Скин "${initialSkins.find(s => s.id === skinId)?.name}" теперь ваш.`,
        });

      } catch(error) {
        console.error("Error buying skin:", error);
        toast({ variant: "destructive", title: "Ошибка", description: "Не удалось сохранить покупку." });
        // Revert UI if save fails
        loadSkinsData(currentUser.uid); 
      }
    } else {
      toast({
        variant: "destructive",
        title: "Недостаточно средств",
        description: "У вас не хватает монет для покупки этого скина.",
      });
    }
  };

  const handleSelectSkin = async (skinId: string) => {
    if (!currentUser) return;
    
    // Optimistic UI update
    setPageState(prevState => ({ ...prevState, selectedSkinId: skinId }));
    
    try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        await setDoc(userDocRef, { 
            selectedSkinId: skinId,
            lastUpdated: serverTimestamp()
        }, { merge: true });

        toast({
            title: "Скин выбран!",
            description: `Скин "${initialSkins.find(s => s.id === skinId)?.name}" активирован.`,
        });
    } catch(error) {
        console.error("Error selecting skin:", error);
        toast({ variant: "destructive", title: "Ошибка", description: "Не удалось сохранить выбор скина." });
        // Revert UI if save fails
        loadSkinsData(currentUser.uid);
    }
  };

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-gradient-to-br from-background to-indigo-900/50">
        <Sparkles className="w-16 h-16 animate-spin text-primary" />
        <p className="mt-4 text-lg text-foreground">Загрузка скинов...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-indigo-900/50 text-foreground font-body antialiased selection:bg-primary selection:text-primary-foreground">
      <div className="flex-grow container mx-auto px-4 pt-10 md:pt-16 pb-20 md:pb-24 text-center">
        <h1 className="text-4xl font-bold mb-8">Скины</h1>

        <Card className="max-w-xs mx-auto mb-8 bg-card/80 border-border/50 shadow-md">
          <CardContent className="p-3 flex items-center justify-center">
            <Coins className="w-5 h-5 mr-2 text-primary" />
            <span className="text-sm font-medium text-foreground">Баланс: </span>
            <span className="text-sm font-semibold text-primary ml-1">{pageState.score.toLocaleString()}</span>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 gap-4 max-w-2xl mx-auto">
          {displaySkins.map((skin) => (
            <SkinCard
              key={skin.id}
              skin={skin}
              userBalance={pageState.score}
              onSelectSkin={handleSelectSkin}
              onBuySkin={handleBuySkin}
            />
          ))}
        </div>
      </div>
      <BottomNavBar onNavigate={handleNavigation} activeItem="/skins"/>
    </div>
  );
}

    