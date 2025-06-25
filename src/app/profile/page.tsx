
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Coins, Star, Clock4, Mail, Sparkles, Target, History, TrendingUp, Trophy, AtSign, KeyRound, Edit, Info, Settings, BarChartHorizontal, Camera } from 'lucide-react';
import BottomNavBar from '@/components/BottomNavBar';
import LeagueInfoCard from '@/components/profile/LeagueInfoCard';
import StatCard from '@/components/profile/StatCard';
import LeaderboardModal from '@/components/profile/LeaderboardModal';
import type { Player } from '@/components/profile/LeaderboardModal';
import { getLeagueInfo } from '@/lib/leagues';
import { useRouter } from 'next/navigation';
import { formatDistanceStrict } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { auth, db } from '@/lib/firebase';
import { updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc, collection, query, orderBy, limit, getDocs, where, setDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


const INITIAL_CLICK_POWER_BASE = 1;
const CLICK_POWER_INCREMENT_PER_LEVEL = 1;
const INITIAL_ENERGY_REGEN_RATE_BASE = 1;
const ENERGY_REGEN_INCREMENT_PER_LEVEL = 1;

interface ProfileStats {
  score: number;
  totalScoreCollected: number;
  totalClicks: number;
  gameStartTime: string | null;
  clickPowerLevel: number;
  energyRegenLevel: number;
  nickname: string;
  username?: string;
  photoURL: string | null;
}

export default function ProfilePage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isDataLoading, setIsDataLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stats, setStats] = useState<ProfileStats>({
    score: 0,
    totalScoreCollected: 0,
    totalClicks: 0,
    gameStartTime: null,
    clickPowerLevel: 0,
    energyRegenLevel: 0,
    nickname: '',
    username: '',
    photoURL: null,
  });
  
  const [editableUsername, setEditableUsername] = useState('');
  const [isSavingUsername, setIsSavingUsername] = useState(false);
  const [editableNickname, setEditableNickname] = useState('');
  const [isSavingNickname, setIsSavingNickname] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const [clickPower, setClickPower] = useState(INITIAL_CLICK_POWER_BASE);
  const [energyRegenRate, setEnergyRegenRate] = useState(INITIAL_ENERGY_REGEN_RATE_BASE);
  const [gameTimePlayed, setGameTimePlayed] = useState("0s");

  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [topPlayers, setTopPlayers] = useState<Player[]>([]);
  const [leaguePlayers, setLeaguePlayers] = useState<Player[]>([]);
  const [currentPlayerForLeaderboard, setCurrentPlayerForLeaderboard] = useState<Player | null>(null);
  const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(false);

  const loadProfileData = useCallback(async (userId: string) => {
    setIsDataLoading(true);
    try {
      const userDocRef = doc(db, 'users', userId);
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const profileStats = {
          score: data.score || 0,
          totalScoreCollected: data.totalScoreCollected || data.score || 0,
          totalClicks: data.totalClicks || 0,
          gameStartTime: data.gameStartTime || null,
          clickPowerLevel: data.clickPowerLevel || 0,
          energyRegenLevel: data.energyRegenLevel || 0,
          nickname: data.nickname || currentUser?.displayName || 'Игрок',
          username: data.username || '',
          photoURL: data.photoURL || currentUser?.photoURL || null,
        };
        setStats(profileStats);
        setEditableUsername(profileStats.username ? profileStats.username.substring(1) : '');
        setEditableNickname(profileStats.nickname);
      }
    } catch (error) {
      console.error("Error loading profile data:", error);
    } finally {
      setIsDataLoading(false);
    }
  }, [currentUser]);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !currentUser) return;
    const file = event.target.files[0];
    if (!file) return;

    const MAX_SIZE_MB = 2;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        toast({ variant: 'destructive', title: 'Файл слишком большой', description: `Максимальный размер: ${MAX_SIZE_MB}MB.` });
        return;
    }
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
        toast({ variant: 'destructive', title: 'Неверный тип файла', description: 'Пожалуйста, выберите PNG, JPG или WEBP.' });
        return;
    }
    
    setIsUploadingAvatar(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const dataUrl = reader.result as string;

        // No need to update Firebase Auth profile, only our Firestore doc
        const userDocRef = doc(db, 'users', currentUser.uid);
        await setDoc(userDocRef, { photoURL: dataUrl }, { merge: true });

        setStats(prev => ({ ...prev, photoURL: dataUrl }));

        toast({ title: 'Успешно!', description: 'Аватар обновлен.' });
        setIsUploadingAvatar(false);
      };
      reader.onerror = (error) => {
          console.error("Error reading file:", error);
          toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось прочитать файл.' });
          setIsUploadingAvatar(false);
      }
    } catch (error) {
        console.error("Error processing avatar:", error);
        toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось обработать аватар.' });
        setIsUploadingAvatar(false);
    }
  };

  const handleSaveUsername = useCallback(async () => {
    if (!currentUser) return;
    
    const usernameWithoutAt = editableUsername.trim();

    // Rule: No trailing underscore
    if (usernameWithoutAt.endsWith('_')) {
        toast({
            variant: 'destructive',
            title: 'Неверный формат имени пользователя',
            description: 'Имя пользователя не может заканчиваться символом "_".'
        });
        return;
    }

    // Rule: Character set and length validation
    if (usernameWithoutAt && (!/^[a-zA-Z0-9_]+$/.test(usernameWithoutAt) || usernameWithoutAt.length < 3 || usernameWithoutAt.length > 22)) {
        toast({
            variant: 'destructive',
            title: 'Неверный формат имени пользователя',
            description: 'Имя должно быть от 3 до 22 символов и содержать только латинские буквы, цифры и _.'
        });
        return;
    }

    const finalUsername = usernameWithoutAt ? `@${usernameWithoutAt}` : '';
    const finalUsernameLowercase = finalUsername.toLowerCase();
    
    if (finalUsername === stats.username) {
        return; // No changes have been made
    }

    setIsSavingUsername(true);
    try {
        if (finalUsername) {
            // Rule: Case-insensitive uniqueness check
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('username_lowercase', '==', finalUsernameLowercase));
            const querySnapshot = await getDocs(q);

            const isTaken = querySnapshot.docs.some(doc => doc.id !== currentUser.uid);
            if (isTaken) {
                toast({
                    variant: 'destructive',
                    title: 'Имя пользователя занято',
                    description: 'Это имя пользователя уже используется. Попробуйте другое.'
                });
                setIsSavingUsername(false);
                return;
            }
        }
      
        const userDocRef = doc(db, 'users', currentUser.uid);
        // Save both username and its lowercase version for querying
        await setDoc(userDocRef, { 
            username: finalUsername,
            username_lowercase: finalUsernameLowercase
        }, { merge: true });

        setStats(prev => ({ ...prev, username: finalUsername }));
        toast({
            title: 'Успешно!',
            description: 'Ваше имя пользователя сохранено.'
        });
    } catch (error) {
      console.error("Error saving username:", error);
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось сохранить имя пользователя.' });
    } finally {
      setIsSavingUsername(false);
    }
  }, [currentUser, editableUsername, toast, stats.username]);
  
  const handleSaveNickname = useCallback(async () => {
    if (!currentUser) return;
    const newNickname = editableNickname.trim();

    if (newNickname.length < 2 || newNickname.length > 32) {
        toast({
            variant: 'destructive',
            title: 'Неверная длина никнейма',
            description: 'Никнейм должен содержать от 2 до 32 символов.'
        });
        return;
    }
    if (newNickname === stats.nickname) return;

    setIsSavingNickname(true);
    try {
        await updateProfile(currentUser, { displayName: newNickname });
        const userDocRef = doc(db, 'users', currentUser.uid);
        await setDoc(userDocRef, { nickname: newNickname }, { merge: true });

        setStats(prev => ({ ...prev, nickname: newNickname }));
        toast({
            title: 'Успешно!',
            description: 'Ваш никнейм обновлен.'
        });
    } catch (error) {
        console.error("Error saving nickname:", error);
        toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось сохранить никнейм.' });
    } finally {
        setIsSavingNickname(false);
    }
  }, [currentUser, editableNickname, toast, stats.nickname]);

  const handlePasswordReset = useCallback(async () => {
    if (!currentUser?.email) return;

    setIsSendingReset(true);
    try {
        await sendPasswordResetEmail(auth, currentUser.email);
        toast({
            title: 'Ссылка отправлена',
            description: 'Проверьте свою почту для сброса пароля.'
        });
    } catch (error) {
        console.error("Error sending password reset email:", error);
        toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось отправить письмо для сброса пароля.' });
    } finally {
        setIsSendingReset(false);
    }
  }, [currentUser?.email, toast]);

  useEffect(() => {
    setClickPower(INITIAL_CLICK_POWER_BASE + (stats.clickPowerLevel * CLICK_POWER_INCREMENT_PER_LEVEL));
    setEnergyRegenRate(INITIAL_ENERGY_REGEN_RATE_BASE + (stats.energyRegenLevel * ENERGY_REGEN_INCREMENT_PER_LEVEL));
  }, [stats.clickPowerLevel, stats.energyRegenLevel]);


  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
    } else if (currentUser) {
      loadProfileData(currentUser.uid);
    }
  }, [currentUser, authLoading, router, loadProfileData]);
  
  useEffect(() => {
    if (stats.gameStartTime) {
      const startTime = new Date(stats.gameStartTime);
      const updateTime = () => {
         setGameTimePlayed(formatDistanceStrict(new Date(), startTime, {roundingMethod: 'floor'}));
      };
      updateTime(); 
      const timerId = setInterval(updateTime, 1000); 
      return () => clearInterval(timerId); 
    } else {
      setGameTimePlayed("N/A");
    }
  }, [stats.gameStartTime]);


  const { currentLeague, nextLeague, progressPercentage } = getLeagueInfo(stats.totalScoreCollected);

  const handleOpenLeaderboard = async () => {
    if (!currentUser) return;
    setIsLeaderboardOpen(true);
    setIsLeaderboardLoading(true);
    setTopPlayers([]);
    setLeaguePlayers([]);

    try {
        const usersRef = collection(db, 'users');

        const qTop = query(usersRef, orderBy('totalScoreCollected', 'desc'), limit(100));
        const topSnapshot = await getDocs(qTop);
        const topPlayersData: Player[] = topSnapshot.docs.map((doc, index) => ({
            rank: index + 1,
            name: doc.data().nickname || `Player ${doc.id.substring(0, 5)}`,
            score: doc.data().totalScoreCollected,
            uid: doc.id,
        }));
        setTopPlayers(topPlayersData);

        const qRank = query(usersRef, where('totalScoreCollected', '>', stats.totalScoreCollected));
        const rankSnapshot = await getDocs(qRank);
        const rank = rankSnapshot.size + 1;
        
        setCurrentPlayerForLeaderboard({
            rank: rank,
            name: stats.nickname,
            score: stats.totalScoreCollected,
            uid: currentUser.uid
        });

        let qLeague;
        if (nextLeague) {
            qLeague = query(
                usersRef,
                where('totalScoreCollected', '>=', currentLeague.threshold),
                where('totalScoreCollected', '<', nextLeague.threshold),
                orderBy('totalScoreCollected', 'desc'),
                limit(100)
            );
        } else {
            qLeague = query(
                usersRef,
                where('totalScoreCollected', '>=', currentLeague.threshold),
                orderBy('totalScoreCollected', 'desc'),
                limit(100)
            );
        }
        const leagueSnapshot = await getDocs(qLeague);
        const leaguePlayersData: Player[] = leagueSnapshot.docs.map((doc, index) => ({
            rank: index + 1, 
            name: doc.data().nickname || `Player ${doc.id.substring(0, 5)}`,
            score: doc.data().totalScoreCollected,
            uid: doc.id,
        }));
        setLeaguePlayers(leaguePlayersData);

    } catch (error) {
      console.error("Error fetching leaderboard data:", error);
    } finally {
      setIsLeaderboardLoading(false);
    }
  };


  const handleNavigation = (path: string) => {
    router.push(path);
  };

  if (authLoading || isDataLoading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-gradient-to-br from-background to-indigo-900/50">
        <Sparkles className="w-16 h-16 animate-spin text-primary" />
        <p className="mt-4 text-lg text-foreground">Загрузка профиля...</p>
      </div>
    );
  }
  
  if (!currentUser) return null;
  
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-indigo-900/50 text-foreground font-body antialiased selection:bg-primary selection:text-primary-foreground">
      <main className="flex-grow container mx-auto px-4 pt-10 md:pt-16 pb-20 md:pb-24">
        
        <input
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarUpload}
            accept="image/png, image/jpeg, image/webp"
            className="hidden"
        />

        <div className="max-w-2xl mx-auto text-center">
            {/* --- User Info Header --- */}
            <div className="flex flex-col items-center text-center">
                <div className="relative">
                    <Avatar className="w-24 h-24 mb-4 shadow-lg ring-2 ring-primary/50">
                        <AvatarImage key={stats.photoURL} src={stats.photoURL || `https://api.dicebear.com/8.x/bottts/svg?seed=${currentUser.uid}`} alt="User Avatar" />
                        <AvatarFallback><User className="w-12 h-12 text-muted-foreground" /></AvatarFallback>
                    </Avatar>
                     <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingAvatar}
                        className="absolute bottom-4 -right-1 bg-primary text-primary-foreground rounded-full p-2 border-2 border-background hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Сменить аватар"
                    >
                        {isUploadingAvatar ? <Sparkles className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                    </button>
                </div>
                <h1 className="text-4xl font-bold">{stats.nickname}</h1>
                <p className="text-muted-foreground flex items-center justify-center gap-1.5 mt-1">
                    <Mail className="w-4 h-4"/>{currentUser.email}
                </p>
            </div>

            {/* --- League Card --- */}
            <div className="cursor-pointer mt-6" onClick={handleOpenLeaderboard}>
                <LeagueInfoCard
                    currentLeague={currentLeague}
                    nextLeague={nextLeague}
                    leagueScore={stats.totalScoreCollected} 
                    progressPercentage={progressPercentage}
                />
            </div>
            
            {/* --- Tabs for Stats and Settings --- */}
            <Tabs defaultValue="stats" className="w-full mt-8">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-card/80">
                  <TabsTrigger value="stats">
                      <BarChartHorizontal className="w-4 h-4 mr-2" />
                      Статистика
                  </TabsTrigger>
                  <TabsTrigger value="settings">
                      <Settings className="w-4 h-4 mr-2" />
                      Настройки
                  </TabsTrigger>
              </TabsList>
              
              <TabsContent value="stats" className="text-left">
                <div className="space-y-4">
                    <StatCard icon={Coins} label="Текущий баланс" value={stats.score.toLocaleString()} />
                    <StatCard icon={TrendingUp} label="Всего заработано" value={stats.totalScoreCollected.toLocaleString()} />
                    <StatCard icon={Target} label="Сила клика" value={`+${clickPower}`} />
                    <StatCard icon={History} label="Восстановление" value={`+${energyRegenRate}/сек`} />
                    <StatCard icon={Star} label="Всего кликов" value={stats.totalClicks.toLocaleString()} />
                    <StatCard icon={Clock4} label="Время игры" value={gameTimePlayed} />
                </div>
              </TabsContent>
              
              <TabsContent value="settings">
                 <Card className="bg-card/80 border-border/50 shadow-lg text-left">
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary"/>Настройки профиля</CardTitle>
                        <CardDescription>Изменение данных вашего аккаунта.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8 pt-2">
                        {/* Nickname */}
                        <div className="space-y-2">
                            <Label htmlFor="nickname" className="flex items-center gap-2"><Edit className="w-4 h-4" />Никнейм</Label>
                            <div className="flex items-center gap-2">
                                <Input id="nickname" value={editableNickname} onChange={(e) => setEditableNickname(e.target.value)} disabled={isSavingNickname} className="bg-input/80 border-border" />
                                <Button onClick={handleSaveNickname} disabled={isSavingNickname || editableNickname.trim() === stats.nickname}>
                                    {isSavingNickname ? '...' : 'Сохранить'}
                                </Button>
                            </div>
                        </div>

                        {/* Username */}
                        <div className="space-y-2">
                            <Label htmlFor="username" className="flex items-center gap-2"><AtSign className="w-4 h-4" />Имя пользователя</Label>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center w-full rounded-md border border-input bg-input/80 ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                                    <span className="pl-3 text-muted-foreground">@</span>
                                    <Input id="username" value={editableUsername} onChange={(e) => setEditableUsername(e.target.value)} placeholder="username" className="bg-transparent border-0 h-9 focus-visible:ring-transparent focus-visible:ring-offset-0 flex-1" disabled={isSavingUsername} />
                                </div>
                                <Button onClick={handleSaveUsername} disabled={isSavingUsername || editableUsername.trim() === (stats.username ? stats.username.substring(1) : '')}>
                                    {isSavingUsername ? '...' : 'Сохранить'}
                                </Button>
                            </div>
                        </div>
                        
                        {/* Password */}
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2"><KeyRound className="w-4 h-4" />Пароль</Label>
                            <Button variant="outline" className="w-full justify-start" onClick={handlePasswordReset} disabled={isSendingReset}>
                                {isSendingReset ? 'Отправка...' : 'Отправить ссылку для сброса пароля на почту'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
        </div>

      </main>
      
      <BottomNavBar activeItem="/profile" onNavigate={handleNavigation} />

      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onOpenChange={setIsLeaderboardOpen}
        topPlayers={topPlayers}
        leaguePlayers={leaguePlayers}
        currentPlayer={currentPlayerForLeaderboard}
        isLoading={isLeaderboardLoading}
        currentLeagueName={currentLeague.name}
      />
    </div>
  );
}
