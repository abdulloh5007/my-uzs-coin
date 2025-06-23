
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import BottomNavBar from '@/components/BottomNavBar';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Users, Gift, Check, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

interface FriendsPageState {
  referralCode: string;
  referredUsers: Array<{ uid: string; nickname: string }>;
  totalReferralBonus: number;
}

export default function FriendsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { currentUser, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [pageState, setPageState] = useState<FriendsPageState>({
    referralCode: '',
    referredUsers: [],
    totalReferralBonus: 0,
  });
  const [referralLink, setReferralLink] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const link = `${window.location.origin}/register?ref=${pageState.referralCode}`;
      setReferralLink(link);
    }
  }, [pageState.referralCode]);

  const loadFriendsData = useCallback(async (userId: string) => {
    setIsLoading(true);
    try {
      const userDocRef = doc(db, 'users', userId);
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setPageState({
          referralCode: data.referralCode || '',
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

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
    } else if (currentUser) {
      loadFriendsData(currentUser.uid);
    }
  }, [currentUser, authLoading, router, loadFriendsData]);

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
      <div className="flex-grow container mx-auto px-4 pt-10 md:pt-16 pb-20 md:pb-24 text-center">
        <div className="mx-auto flex justify-center items-center mb-4 h-20 w-20 rounded-full bg-primary/20">
            <Users className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-4xl font-bold mb-2">Пригласить друзей</h1>
        <p className="text-muted-foreground mb-8">Пригласите друга и получите по 25,000 монет каждый!</p>

        <div className="max-w-md mx-auto space-y-6">
          <Card className="bg-card/80 border-border/50 shadow-lg text-left">
            <CardHeader>
              <CardTitle className="text-xl">Ваша реферальная ссылка</CardTitle>
              <CardDescription>Поделитесь этой ссылкой с друзьями, чтобы они присоединились к игре.</CardDescription>
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
