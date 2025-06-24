
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import BottomNavBar from '@/components/BottomNavBar';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Coins, Sparkles, Cpu, Wand2, Egg, ShoppingCart, Check, Info, User, Shield, BarChart, Package, Send, Cog, Mail, History, Inbox, ArrowRight, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, arrayUnion, onSnapshot, collection, query, where, writeBatch, getDocs, Timestamp, orderBy, limit } from 'firebase/firestore';
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from '@/components/ui/input';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';

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
  rarity: number; // as a percentage
  edition: number;
}

const nftItems: NftItem[] = [
  { id: 'cyberpunk_mask', name: 'Маска Киберпанка', description: 'Стильная маска из будущего, улучшающая нейроинтерфейс.', icon: Cpu, type: 'Простой', price: 15000000, iconColorClass: 'text-cyan-400', iconBgClass: 'bg-cyan-500/20', category: 'Киберпанк', rarity: 5, edition: 5000, },
  { id: 'magic_staff', name: 'Магический Посох', description: 'Древний посох, наполненный магией первоэлементов.', icon: Wand2, type: 'Анимированный', price: 80000000, iconColorClass: 'text-purple-400', iconBgClass: 'bg-purple-500/20', category: 'Магия', rarity: 1.5, edition: 1000, },
  { id: 'dragon_egg', name: 'Яйцо Дракона', description: 'Кто знает, что из него вылупится? Ходят слухи о бонусах.', icon: Egg, type: 'Простой', price: 20000000, iconColorClass: 'text-red-400', iconBgClass: 'bg-red-500/20', category: 'Фэнтези', rarity: 3.2, edition: 2500, },
  { id: 'starship_deed', name: 'Документ на ракету', description: 'Право собственности на межгалактический звёздолёт класса "Исследователь".', imageUrl: '/rocket.gif', type: 'Анимированный', price: 100000000, iconColorClass: 'text-slate-400', iconBgClass: 'bg-slate-500/20', category: 'Sci-Fi', rarity: 0.8, edition: 500, },
];

interface OwnedNft {
  nftId: string;
  instanceId: string;
}

interface SelectedNft extends NftItem {
  instanceId: string;
}

interface NftTransfer {
  id: string; // doc id
  nftId: string;
  instanceId: string;
  senderId: string;
  senderNickname: string;
  recipientId?: string;
  recipientUsername: string;
  status: 'pending' | 'claimed';
  sentAt: Date;
}

interface NftShopState {
  score: number;
  ownedNfts: OwnedNft[];
}

interface FoundUser {
  uid: string;
  username: string;
  nickname: string;
}

interface SendNftDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedNft: SelectedNft | null;
  currentUser: any; // Simplified for brevity
  pageState: NftShopState;
  setPageState: React.Dispatch<React.SetStateAction<NftShopState>>;
  setSelectedNft: React.Dispatch<React.SetStateAction<SelectedNft | null>>;
}

const SendNftDialog: React.FC<SendNftDialogProps> = ({
  isOpen,
  onOpenChange,
  selectedNft,
  currentUser,
  pageState,
  setPageState,
  setSelectedNft,
}) => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<FoundUser[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<FoundUser | null>(null);
  const [isSending, setIsSending] = useState(false);

  const handleSearchQueryChange = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      setSelectedRecipient(null);
    }
  };

  const handleClearRecipient = () => {
    setSelectedRecipient(null);
    setSearchQuery('');
  };
  
  const onRecipientSelect = (user: FoundUser) => {
      setSelectedRecipient(user);
      setSearchResults([]);
      setSearchQuery('');
  };

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setSelectedRecipient(null);
      setIsSending(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    
    const searchUsers = async () => {
        setIsSearching(true);
        try {
            const usersRef = collection(db, 'users');
            const q = query(
                usersRef,
                where('username', '>=', `@${searchQuery}`),
                where('username', '<=', `@${searchQuery}\uf8ff`),
                limit(5)
            );
            const querySnapshot = await getDocs(q);
            const users: FoundUser[] = [];
            querySnapshot.forEach(doc => {
                if (doc.id !== currentUser?.uid) {
                    const data = doc.data();
                    if(data.username){
                        users.push({
                            uid: doc.id,
                            username: data.username,
                            nickname: data.nickname,
                        });
                    }
                }
            });
            setSearchResults(users);
        } catch (error) {
            console.error("Error searching for users:", error);
            toast({ variant: "destructive", title: "Ошибка", description: "Не удалось выполнить поиск." });
        } finally {
            setIsSearching(false);
        }
    };

    const debounceTimeout = setTimeout(() => {
        searchUsers();
    }, 300);

    return () => clearTimeout(debounceTimeout);
  }, [searchQuery, currentUser?.uid, toast]);

  const handleSend = async () => {
      if (!currentUser || !selectedNft || !selectedRecipient || isSending) return;

      setIsSending(true);
      try {
          const batch = writeBatch(db);
          const senderDocRef = doc(db, 'users', currentUser.uid);
          const newOwnedNfts = pageState.ownedNfts.filter(item => item.instanceId !== selectedNft.instanceId);

          batch.update(senderDocRef, { ownedNfts: newOwnedNfts });

          const transferDocRef = doc(collection(db, 'nft_transfers'));
          batch.set(transferDocRef, {
              nftId: selectedNft.id,
              instanceId: selectedNft.instanceId,
              senderId: currentUser.uid,
              senderNickname: currentUser.displayName || 'Аноним',
              recipientId: selectedRecipient.uid,
              recipientUsername: selectedRecipient.username,
              status: 'pending',
              sentAt: serverTimestamp()
          });

          await batch.commit();
          
          setPageState(prev => ({ ...prev, ownedNfts: newOwnedNfts }));
          
          toast({ title: 'Успешно!', description: `NFT "${selectedNft.name}" отправлен пользователю ${selectedRecipient.username}.` });
          
          onOpenChange(false);
          setSelectedNft(null);

      } catch (error) {
          console.error("Error sending NFT:", error);
          toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось отправить NFT.' });
      } finally {
          setIsSending(false);
      }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg bg-background border-border p-0 shadow-2xl flex flex-col max-h-[85vh] md:max-h-[80vh]">
            <DialogHeader className="p-6 pb-4 border-b border-border/50 text-left">
              <DialogTitle className="text-xl">Отправить "{selectedNft?.name}"</DialogTitle>
              <DialogDescription>Найдите пользователя по его @username.</DialogDescription>
            </DialogHeader>
            
            <div className="p-6 border-b border-border/50">
                {selectedRecipient ? (
                     <div className="space-y-3">
                        <Label>Получатель:</Label>
                        <Card className="bg-card/90">
                           <CardContent className="p-3 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src={`https://api.dicebear.com/8.x/bottts/svg?seed=${selectedRecipient.uid}`} alt={selectedRecipient.nickname} />
                                        <AvatarFallback>{selectedRecipient.nickname.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold text-foreground">{selectedRecipient.nickname}</p>
                                        <p className="text-sm text-muted-foreground">{selectedRecipient.username}</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={handleClearRecipient}>
                                    <X className="w-4 h-4" />
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                        <Input 
                            value={searchQuery}
                            onChange={(e) => handleSearchQueryChange(e.target.value)}
                            placeholder="username" 
                            className="pl-7 bg-input/80 border-border text-foreground"
                        />
                    </div>
                )}
            </div>

            <div className="flex-1 p-6 pt-3 overflow-y-auto">
                {!selectedRecipient && (
                    isSearching ? (
                        <div className="space-y-2">
                            {Array.from({length: 3}).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                        </div>
                    ) : searchResults.length > 0 ? (
                        <div className="space-y-2">
                             <p className="text-sm text-muted-foreground mb-2">Результаты поиска:</p>
                             {searchResults.map(user => (
                                <Card key={user.uid} className="cursor-pointer hover:bg-accent transition-colors" onClick={() => onRecipientSelect(user)}>
                                    <CardContent className="p-3 flex items-center gap-3">
                                         <Avatar>
                                            <AvatarImage src={`https://api.dicebear.com/8.x/bottts/svg?seed=${user.uid}`} alt={user.nickname}/>
                                            <AvatarFallback>{user.nickname.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold text-foreground">{user.nickname}</p>
                                            <p className="text-sm text-muted-foreground">{user.username}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : searchQuery.length >= 2 && <p className="text-center text-muted-foreground py-4">Пользователь не найден.</p>
                )}
            </div>
            
            <DialogFooter className="p-6 border-t border-border/50 bg-background mt-auto">
                <Button className="w-full" onClick={handleSend} disabled={!selectedRecipient || isSending}>
                    {isSending ? 'Отправка...' : 'Отправить'}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
  );
};

const ParallaxIconDisplay: React.FC<{ nft: NftItem }> = ({ nft }) => {
  const iconRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!iconRef.current || nft.type !== 'Анимированный') return;
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - left) / width - 0.5;
    const y = (e.clientY - top) / height - 0.5;
    e.currentTarget.style.transform = `perspective(1000px) rotateX(${-y * 25}deg) rotateY(${x * 25}deg) scale3d(1.1, 1.1, 1.1)`;
  };
  
  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!iconRef.current) return;
    e.currentTarget.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    setIsHovering(false);
  };

  const Icon = nft.icon;

  return (
    <div
      className="relative group/parallax"
      style={{ transformStyle: "preserve-3d", perspective: "1000px" }}
    >
      <div
        ref={iconRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseEnter={() => setIsHovering(true)}
        className={cn("p-8 rounded-2xl inline-block transition-transform duration-300 ease-out relative overflow-hidden", nft.iconBgClass)}
        style={{ transformStyle: "preserve-3d" }}
      >
        {nft.imageUrl ? <Image src={isHovering ? nft.imageUrl : (nft.imageUrl.replace('.gif', '_static.png'))} alt={nft.name} width={96} height={96} className="w-24 h-24 object-contain pointer-events-none" unoptimized onError={(e) => { const target = e.target as HTMLImageElement; if (target.src.includes('_static.png')) target.src = nft.imageUrl!; }} /> : (Icon && <Icon className={cn("w-24 h-24 pointer-events-none", nft.iconColorClass)} />)}
        <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
          <div className="animate-glare-pass absolute top-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12" />
        </div>
      </div>
    </div>
  );
};


interface NftDetailSheetProps {
    nft: SelectedNft | null;
    onOpenChange: (open: boolean) => void;
    pageState: NftShopState;
    currentUser: any;
    viewSource: 'shop' | 'inventory';
    handleBuyNft: (nft: NftItem) => Promise<void>;
    setIsSendDialogOpen: (open: boolean) => void;
}

const NftDetailSheet: React.FC<NftDetailSheetProps> = ({ 
    nft, 
    onOpenChange, 
    pageState, 
    currentUser, 
    viewSource, 
    handleBuyNft, 
    setIsSendDialogOpen 
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
                          {viewSource === 'inventory' && (
                              <div className="flex justify-between items-center border-b border-border/30 pb-3">
                                  <span className="text-muted-foreground flex items-center gap-2"><User className="w-4 h-4"/>Владелец</span>
                                  <span className="font-semibold text-foreground">{currentUser?.displayName || 'Вы'}</span>
                              </div>
                          )}
                          <div className="flex justify-between items-center border-b border-border/30 pb-3">
                              <span className="text-muted-foreground flex items-center gap-2"><Shield className="w-4 h-4"/>Тип</span>
                              <Badge variant={nft.type === 'Анимированный' ? 'default' : 'secondary'} className={cn(nft.type === 'Анимированный' ? 'bg-purple-500/80 border-purple-400/50' : 'bg-cyan-500/80 border-cyan-400/50')}>{nft.type}</Badge>
                          </div>
                          <div className="flex justify-between items-center border-b border-border/30 pb-3">
                              <span className="text-muted-foreground flex items-center gap-2"><BarChart className="w-4 h-4"/>Редкость</span>
                              <span className="font-semibold text-primary">{nft.rarity}%</span>
                          </div>
                          <div className="flex justify-between items-center border-b border-border/30 pb-3">
                              <span className="text-muted-foreground flex items-center gap-2"><Package className="w-4 h-4"/>Выпущено</span>
                              <span className="font-semibold text-foreground">{nft.edition.toLocaleString()}</span>
                          </div>
                          {viewSource === 'shop' && (
                            <div className="flex justify-between items-center border-b border-border/30 pb-3">
                                  <span className="text-muted-foreground flex items-center gap-2"><Coins className="w-4 h-4"/>Цена</span>
                                  <span className="font-semibold text-primary">{nft.price.toLocaleString()}</span>
                            </div>
                          )}
                      </div>
                  </div>
                  <SheetFooter className="p-6 border-t border-border/50 bg-background">
                      {viewSource === 'inventory' ? (
                          <div className="w-full flex flex-col sm:flex-row gap-2">
                              <Button className="w-full" variant="outline" disabled><Cog className="w-4 h-4 mr-2" /> Использовать</Button>
                              <Button className="w-full" onClick={() => setIsSendDialogOpen(true)}><Send className="w-4 h-4 mr-2" /> Отправить</Button>
                          </div>
                      ) : (
                          <Button className="w-full" disabled={!canAfford} onClick={() => handleBuyNft(nft)}>
                              {canAfford ? (<>Купить за <Coins className="w-5 h-5 mx-2" /> {nft.price.toLocaleString()}</>) : ('Недостаточно монет')}
                          </Button>
                      )}
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
  
  const [selectedNft, setSelectedNft] = useState<SelectedNft | null>(null);
  const [pageState, setPageState] = useState<NftShopState>({ score: 0, ownedNfts: [] });
  const [viewSource, setViewSource] = useState<'shop' | 'inventory'>('shop');
  
  const [mailbox, setMailbox] = useState<NftTransfer[]>([]);
  const [sentHistory, setSentHistory] = useState<NftTransfer[]>([]);
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);

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
    if (!currentUser) return;

    const transfersRef = collection(db, 'nft_transfers');

    const qMailbox = query(transfersRef, where('recipientId', '==', currentUser.uid), where('status', '==', 'pending'), orderBy('sentAt', 'desc'));
    const unsubscribeMailbox = onSnapshot(qMailbox, (snapshot) => {
      const received: NftTransfer[] = snapshot.docs.map(d => ({ id: d.id, ...d.data(), sentAt: (d.data().sentAt as Timestamp).toDate() } as NftTransfer));
      setMailbox(received);
    }, (error) => {
      console.error("Mailbox listener error:", error);
    });

    const qSent = query(transfersRef, where('senderId', '==', currentUser.uid), orderBy('sentAt', 'desc'));
    const unsubscribeSent = onSnapshot(qSent, (snapshot) => {
      const sent: NftTransfer[] = snapshot.docs.map(d => ({ id: d.id, ...d.data(), sentAt: (d.data().sentAt as Timestamp).toDate() } as NftTransfer));
      setSentHistory(sent);
    }, (error) => {
        console.error("Sent history listener error:", error);
    });

    return () => {
      unsubscribeMailbox();
      unsubscribeSent();
    };
  }, [currentUser]);

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
      const newOwnedNft: OwnedNft = { nftId: nft.id, instanceId: newInstanceId };

      const newOwnedNftsList = [...pageState.ownedNfts, newOwnedNft];
      setPageState(prev => ({ ...prev, score: newBalance, ownedNfts: newOwnedNftsList }));

      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        await setDoc(userDocRef, { 
            score: newBalance, 
            ownedNfts: newOwnedNftsList,
            lastUpdated: serverTimestamp() 
        }, { merge: true });

        toast({
          title: `🎉 ${nft.name} куплен!`,
          description: `NFT добавлен в вашу коллекцию "Мои NFT".`,
          duration: 5000,
        });
        setSelectedNft(null);

      } catch (error) {
        console.error("Error buying NFT:", error);
        toast({ variant: "destructive", title: "Ошибка", description: "Не удалось сохранить покупку NFT." });
        loadShopData(currentUser.uid); // Revert
      }

    } else {
      toast({
        variant: "destructive",
        title: "Недостаточно монет",
        description: `Вам не хватает ${ (nft.price - pageState.score).toLocaleString()} монет для покупки.`,
      });
    }
  };
  
  const handleClaimNft = async (transfer: NftTransfer) => {
    if (!currentUser) return;
    try {
      const batch = writeBatch(db);

      const userDocRef = doc(db, 'users', currentUser.uid);
      batch.update(userDocRef, {
        ownedNfts: arrayUnion({ nftId: transfer.nftId, instanceId: transfer.instanceId })
      });
      
      const transferDocRef = doc(db, 'nft_transfers', transfer.id);
      batch.update(transferDocRef, {
        status: 'claimed',
      });
      
      await batch.commit();
      toast({ title: 'NFT получен!', description: 'Предмет добавлен в вашу коллекцию "Мои NFT".' });
    } catch(error) {
       console.error("Error claiming NFT:", error);
       toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось получить NFT.' });
    }
  };

  const handleNavigation = (path: string) => router.push(path);
  
  const handleSendNftClick = () => {
    setIsSendDialogOpen(true);
  };
  
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
        <h1 className="text-4xl font-bold mb-8 text-foreground">Магазин NFT</h1>
        <Card className="max-w-md mx-auto mb-8 bg-card/80 border-border/50 shadow-lg"><CardContent className="p-4 flex items-center justify-center"><Coins className="w-6 h-6 mr-3 text-primary" /><span className="text-lg font-medium text-foreground">Баланс: </span><span className="text-lg font-semibold text-primary ml-1.5">{pageState.score.toLocaleString()}</span></CardContent></Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-12">{nftItems.map((nft) => <NftCard key={nft.id} nft={nft} onClick={() => { setSelectedNft({...nft, instanceId: ''}); setViewSource('shop'); }} />)}</div>
        <Tabs defaultValue="inventory" className="w-full max-w-4xl mx-auto">
            <TabsList className="grid w-full grid-cols-3 mb-6 bg-card/80"><TabsTrigger value="inventory">Мои NFT ({pageState.ownedNfts.length})</TabsTrigger><TabsTrigger value="mailbox">Почта ({mailbox.length})</TabsTrigger><TabsTrigger value="history">История</TabsTrigger></TabsList>
            <TabsContent value="inventory">
                {pageState.ownedNfts.length > 0 ? (<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {pageState.ownedNfts.map((ownedNft) => {
                    const foundNft = nftItems.find(item => item.id === ownedNft.nftId);
                    if (!foundNft) return null;
                    const IconComponent = foundNft.icon;
                    return (
                      <button key={ownedNft.instanceId} onClick={() => { setSelectedNft({...foundNft, instanceId: ownedNft.instanceId}); setViewSource('inventory'); }} className={cn("p-3 rounded-lg shadow-md flex flex-col items-center text-center transition-colors hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary", foundNft.iconBgClass.replace('/20', '/30'))}>
                        <div className={cn("p-2 rounded-full mb-2", foundNft.iconBgClass)}>{foundNft.imageUrl ? <Image src={foundNft.imageUrl} alt={foundNft.name} width={24} height={24} unoptimized /> : (IconComponent && <IconComponent className={cn("w-6 h-6", foundNft.iconColorClass)} />)}</div>
                        <span className="text-xs font-medium text-foreground truncate w-full">{foundNft.name}</span>
                      </button>
                    );
                  })}
                </div>) : (<div className="flex flex-col items-center justify-center py-10 text-muted-foreground"><ShoppingCart className="w-8 h-8 mb-2" /><p>У вас пока нет купленных NFT.</p></div>)}
            </TabsContent>
            <TabsContent value="mailbox">
                {mailbox.length > 0 ? (<div className="space-y-3">
                    {mailbox.map(transfer => {
                        const nft = nftItems.find(n => n.id === transfer.nftId);
                        if (!nft) return null;
                        const Icon = nft.icon;
                        return (<Card key={transfer.id} className="bg-card/80 text-left"><CardContent className="p-3 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3"><div className={cn("p-2 rounded-lg", nft.iconBgClass)}>{nft.imageUrl ? <Image src={nft.imageUrl} alt={nft.name} width={20} height={20} unoptimized /> : (Icon && <Icon className={cn("w-5 h-5", nft.iconColorClass)} />)}</div>
                            <div><p className="text-sm font-semibold">{nft.name}</p><p className="text-xs text-muted-foreground">от {transfer.senderNickname}</p></div></div>
                            <Button size="sm" onClick={() => handleClaimNft(transfer)}>Получить</Button>
                        </CardContent></Card>);
                    })}
                </div>) : (<div className="flex flex-col items-center justify-center py-10 text-muted-foreground"><Inbox className="w-8 h-8 mb-2" /><p>Ваша почта пуста.</p></div>)}
            </TabsContent>
            <TabsContent value="history">
                 {sentHistory.length > 0 ? (<div className="space-y-3">
                    {sentHistory.map(transfer => {
                        const nft = nftItems.find(n => n.id === transfer.nftId);
                        if (!nft) return null;
                        const Icon = nft.icon;
                        return (<Card key={transfer.id} className="bg-card/80 text-left"><CardContent className="p-3 flex items-center justify-between gap-3">
                           <div className="flex items-center gap-3"><div className={cn("p-2 rounded-lg", nft.iconBgClass)}>{nft.imageUrl ? <Image src={nft.imageUrl} alt={nft.name} width={20} height={20} unoptimized /> : (Icon && <Icon className={cn("w-5 h-5", nft.iconColorClass)} />)}</div>
                           <div><p className="text-sm font-semibold">{nft.name}</p><p className="text-xs text-muted-foreground">Отправлено {transfer.recipientUsername} • {formatDistanceToNow(transfer.sentAt, { addSuffix: true, locale: ru })}</p></div></div>
                           <Badge variant={transfer.status === 'claimed' ? 'default' : 'secondary'} className={cn(transfer.status === 'claimed' ? 'bg-green-500/80' : 'bg-yellow-500/80')}>{transfer.status === 'claimed' ? 'Получено' : 'В ожидании'}</Badge>
                        </CardContent></Card>);
                    })}
                </div>) : (<div className="flex flex-col items-center justify-center py-10 text-muted-foreground"><History className="w-8 h-8 mb-2" /><p>Вы еще не отправляли NFT.</p></div>)}
            </TabsContent>
        </Tabs>
      </div>

       <NftDetailSheet
           nft={selectedNft} 
           onOpenChange={(isOpen) => !isOpen && setSelectedNft(null)}
           pageState={pageState}
           currentUser={currentUser}
           viewSource={viewSource}
           handleBuyNft={handleBuyNft}
           setIsSendDialogOpen={setIsSendDialogOpen}
       />
       <SendNftDialog
            isOpen={isSendDialogOpen}
            onOpenChange={setIsSendDialogOpen}
            selectedNft={selectedNft}
            currentUser={currentUser}
            pageState={pageState}
            setPageState={setPageState}
            setSelectedNft={setSelectedNft}
        />

      <BottomNavBar onNavigate={handleNavigation} activeItem="/mint" />
    </div>
  );
}
