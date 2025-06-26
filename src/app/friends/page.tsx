
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import BottomNavBar from '@/components/BottomNavBar';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Users, Gift, Check, Sparkles, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, getDocs, collection, query, where, writeBatch, increment, arrayUnion } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import TopBar from '@/components/TopBar';

const REFERRAL_BONUS = 25000;

interface FriendsPageState {
  referredUsers: Array<{ uid: string; nickname: string }>;
  totalReferralBonus: number;
}

export default function FriendsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { currentUser, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [pageState, setPageState] = useState<FriendsPageState>({
    referredUsers: [],
    totalReferralBonus: 0,
  });
  const [referralLink, setReferralLink] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && currentUser?.uid) {
      const link = `${window.location.origin}/register?refId=${currentUser.uid}`;
      setReferralLink(link);
    }
  }, [currentUser]);

  const loadFriendsData = useCallback(async (userId: string) => {
    setIsLoading(true);
    try {
      const userDocRef = doc(db, 'users', userId);
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setPageState({
          referredUsers: data.referredUsers || [],
          totalReferralBonus: data.totalReferralBonus || 0,
        });
      }
    } catch (error) {
      console.error("Error loading friends data:", error);
      toast({ variant: "destructive", title: "Ошибка", description: "Не удалось загрузить данные друзей." });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const claimPendingReferrals = useCallback(async (userId: string) => {
    try {
        const referralsRef = collection(db, 'referrals');
        const q = query(referralsRef, where('referrerId', '==', userId), where('awarded', '==', false));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return false;
        }

        const batch = writeBatch(db);
        let totalBonus = 0;
        const newFriends: { uid: string; nickname: string }[] = [];

        querySnapshot.forEach(docSnap => {
            const referralData = docSnap.data();
            totalBonus += referralData.bonusAmount || REFERRAL_BONUS;
            newFriends.push({ uid: referralData.newUserId, nickname: referralData.newUserName });
            batch.update(docSnap.ref, { awarded: true });
        });

        if (totalBonus > 0) {
            const userDocRef = doc(db, 'users', userId);
            batch.update(userDocRef, {
                score: increment(totalBonus),
                totalScoreCollected: increment(totalBonus),
                totalReferralBonus: increment(totalBonus),
                referredUsers: arrayUnion(...newFriends),
            });

            await batch.commit();

            toast({
                title: `🎉 Получен бонус за ${newFriends.length} друзей!`,
                description: `Вам начислено ${totalBonus.toLocaleString()} монет.`,
            });
            return true;
        }
        return false;
    } catch (error) {
        console.error("Error claiming referrals:", error);
        toast({ variant: "destructive", title: "Ошибка", description: "Не удалось получить реферальный бонус." });
        return false;
    }
  }, [toast]);

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
    } else if (currentUser) {
      claimPendingReferrals(currentUser.uid).finally(() => {
        loadFriendsData(currentUser.uid);
      });
    }
  }, [currentUser, authLoading, router, loadFriendsData, claimPendingReferrals]);

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      toast({
        title: "Ссылка скопирована!",
        description: "Теперь вы можете поделиться ей с друзьями.",
      });
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleNavigation = (path: string) => {
    router.push(path);
  };
  
  const PageLoader = () => (
    <div className="flex flex-col min-h-screen items-center justify-center bg-gradient-to-br from-background to-indigo-900/50">
      <Sparkles className="w-16 h-16 animate-spin text-primary" />
      <p className="mt-4 text-lg text-foreground">Загрузка...</p>
    </div>
  );
  
  if (authLoading || isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-indigo-900/50 text-foreground font-body antialiased selection:bg-primary selection:text-primary-foreground">
      <TopBar />
      <div className="flex-grow container mx-auto px-4 pt-24 md:pt-28 pb-20 md:pb-24 text-center">
        <div className="mx-auto flex justify-center items-center mb-4 h-20 w-20 rounded-full bg-primary/20">
            <Users className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-4xl font-bold mb-8">Пригласить друзей</h1>

        <div className="max-w-md mx-auto space-y-6">
          <Card className="bg-card/80 border-border/50 shadow-lg text-left">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl">Ваша реферальная ссылка</CardTitle>
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-5 w-5 p-0">
                        <Info className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" align="start" className="max-w-xs text-sm p-3">
                      <p>Поделитесь этой ссылкой с друзьями, чтобы они присоединились к игре. от каждого приглашенного вы и приглашенный пользователь получаете по 25.000 UZSCOIN в качестве бонуса.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <Skeleton className="h-10 w-full" />
                ) : (
                    <div className="flex items-center space-x-2">
                        <Input value={referralLink} readOnly className="bg-input/80 border-border text-foreground" />
                        <Button variant="outline" size="icon" onClick={handleCopyToClipboard}>
                            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                    </div>
                )}
            </CardContent>
          </Card>

          <Card className="bg-card/80 border-border/50 shadow-lg text-left">
             <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-xl flex items-center gap-2"><Gift className="w-5 h-5 text-primary"/>Приглашённые друзья</CardTitle>
                    <span className="text-lg font-bold text-primary">{pageState.referredUsers.length}</span>
                </div>
              <CardDescription>Вы получите бонус за каждого друга, который зарегистрируется по вашей ссылке.</CardDescription>
            </CardHeader>
            <CardContent>
              {pageState.referredUsers.length > 0 ? (
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                  {pageState.referredUsers.map((friend) => (
                    <div key={friend.uid} className="flex items-center justify-between p-3 rounded-lg bg-input/80">
                      <span className="font-medium text-foreground">{friend.nickname}</span>
                      <span className="text-sm font-semibold text-green-400">+25,000 монет</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <p>Вы пока никого не пригласили.</p>
                  <p className="text-xs">Начните делиться своей ссылкой!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
      <BottomNavBar onNavigate={handleNavigation} activeItem="/friends" />
    </div>
  );
}
