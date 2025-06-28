
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Coins, Sparkles, Cpu, Wand2, Egg, ShoppingCart, Check, Info, User, Shield, BarChart, Package, Send, Cog, Mail, History, Inbox, ArrowRight, X, LayoutGrid, Clock, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, arrayUnion, onSnapshot, collection, query, where, writeBatch, getDocs, Timestamp, orderBy, limit } from 'firebase/firestore';
import { Dialog, DialogContent as DialogModalContent, DialogDescription as DialogModalDescription, DialogFooter as DialogModalFooter, DialogHeader as DialogModalHeader, DialogTitle as DialogModalTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from '@/components/ui/input';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '@/components/AppLayout';

// --- TYPES ---
interface NftItem {
  id: string;
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
  totalEdition?: number;
  backgroundSvg?: string;
}

interface OwnedNft {
  nftId: string;
  instanceId: string;
  purchasedAt?: Timestamp;
  copyNumber?: number;
}

interface SelectedNft extends NftItem {
  instanceId: string;
  purchasedAt?: Timestamp;
  copyNumber?: number;
}

interface NftTransfer {
  id: string;
  nftId: string;
  instanceId: string;
  copyNumber?: number;
  senderId: string;
  senderNickname: string;
  senderUsername?: string;
  senderPhotoURL?: string | null;
  senderIsVerified?: boolean;
  recipientId?: string;
  recipientUsername: string;
  recipientPhotoURL?: string | null;
  recipientIsVerified?: boolean;
  status: 'pending' | 'claimed';
  sentAt: Date;
}

interface CollectionState {
  ownedNfts: OwnedNft[];
}

interface FoundUser {
  uid: string;
  username: string;
  nickname: string;
  photoURL?: string | null;
  isVerified?: boolean;
}

// --- Independent Components to prevent re-rendering issues ---

const SendNftDialog: React.FC<{
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedNft: SelectedNft | null;
  currentUser: any;
  pageState: CollectionState;
  setSelectedNft: React.Dispatch<React.SetStateAction<SelectedNft | null>>;
}> = ({ isOpen, onOpenChange, selectedNft, currentUser, pageState, setSelectedNft }) => {
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
                    if(data.username && data.nickname){
                        users.push({
                            uid: doc.id,
                            username: data.username,
                            nickname: data.nickname,
                            photoURL: data.photoURL || null,
                            isVerified: data.isVerified || false,
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
      if (selectedRecipient.uid === currentUser.uid) {
        toast({ variant: 'destructive', title: 'Ошибка', description: 'Невозможно отправить NFT самому себе.' });
        return;
      }
      setIsSending(true);
      try {
          const senderDocRef = doc(db, 'users', currentUser.uid);
          const senderDocSnap = await getDoc(senderDocRef);
          const senderData = senderDocSnap.data() || {};
          
          const batch = writeBatch(db);
          const userDocRef = doc(db, 'users', currentUser.uid);
          const newOwnedNfts = pageState.ownedNfts.filter(item => item.instanceId !== selectedNft.instanceId);

          batch.update(userDocRef, { ownedNfts: newOwnedNfts });

          const transferDocRef = doc(collection(db, 'nft_transfers'));
          batch.set(transferDocRef, {
              nftId: selectedNft.id,
              instanceId: selectedNft.instanceId,
              copyNumber: selectedNft.copyNumber || null,
              senderId: currentUser.uid,
              senderNickname: senderData.nickname || currentUser.displayName || 'Аноним',
              senderUsername: senderData.username || '',
              senderPhotoURL: senderData.photoURL || currentUser.photoURL || null,
              senderIsVerified: senderData.isVerified || false,
              recipientId: selectedRecipient.uid,
              recipientUsername: selectedRecipient.username,
              recipientPhotoURL: selectedRecipient.photoURL || null,
              recipientIsVerified: selectedRecipient.isVerified || false,
              status: 'pending',
              sentAt: serverTimestamp()
          });

          await batch.commit();
          
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
        <DialogModalContent className="sm:max-w-lg bg-background border-border p-0 shadow-2xl flex flex-col max-h-[85vh] md:max-h-[80vh]">
            <DialogModalHeader className="p-6 pb-4 border-b border-border/50 text-left">
              <DialogModalTitle className="text-xl">Отправить "{selectedNft?.name}"</DialogModalTitle>
              <DialogModalDescription>Найдите пользователя по его @username.</DialogModalDescription>
            </DialogModalHeader>
            
            <div className="p-6 border-b border-border/50">
                {selectedRecipient ? (
                     <div className="space-y-3">
                        <Label>Получатель:</Label>
                        <Card className="bg-card/90">
                           <CardContent className="p-3 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        {selectedRecipient.isVerified ? (
                                            <TooltipProvider delayDuration={0}>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="relative">
                                                            <Avatar>
                                                                <AvatarImage src={selectedRecipient.photoURL || `https://api.dicebear.com/8.x/bottts/svg?seed=${selectedRecipient.uid}`} alt={selectedRecipient.nickname || 'Пользователь'} />
                                                                <AvatarFallback>{selectedRecipient.nickname?.charAt(0) || '?'}</AvatarFallback>
                                                            </Avatar>
                                                            <CheckCircle2 className="absolute bottom-0 right-0 w-4 h-4 bg-background text-primary rounded-full" />
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Верифицированный пользователь</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        ) : (
                                            <Avatar>
                                                <AvatarImage src={selectedRecipient.photoURL || `https://api.dicebear.com/8.x/bottts/svg?seed=${selectedRecipient.uid}`} alt={selectedRecipient.nickname || 'Пользователь'} />
                                                <AvatarFallback>{selectedRecipient.nickname?.charAt(0) || '?'}</AvatarFallback>
                                            </Avatar>
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-foreground">{selectedRecipient.nickname || 'Пользователь'}</p>
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
                                        <div className="relative">
                                            {user.isVerified ? (
                                                <TooltipProvider delayDuration={0}>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div className="relative">
                                                                <Avatar>
                                                                    <AvatarImage src={user.photoURL || `https://api.dicebear.com/8.x/bottts/svg?seed=${user.uid}`} alt={user.nickname || 'Пользователь'}/>
                                                                    <AvatarFallback>{user.nickname?.charAt(0) || '?'}</AvatarFallback>
                                                                </Avatar>
                                                                <CheckCircle2 className="absolute bottom-0 right-0 w-4 h-4 bg-background text-primary rounded-full" />
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Верифицированный пользователь</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            ) : (
                                                <Avatar>
                                                    <AvatarImage src={user.photoURL || `https://api.dicebear.com/8.x/bottts/svg?seed=${user.uid}`} alt={user.nickname || 'Пользователь'}/>
                                                    <AvatarFallback>{user.nickname?.charAt(0) || '?'}</AvatarFallback>
                                                </Avatar>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-foreground">{user.nickname || 'Пользователь'}</p>
                                            <p className="text-sm text-muted-foreground">{user.username}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : searchQuery.length >= 2 && <p className="text-center text-muted-foreground py-4">Пользователь не найден.</p>
                )}
            </div>
            
            <DialogModalFooter className="p-6 border-t border-border/50 bg-background mt-auto">
                <Button className="w-full" onClick={handleSend} disabled={!selectedRecipient || isSending}>
                    {isSending ? 'Отправка...' : 'Отправить'}
                </Button>
            </DialogModalFooter>
        </DialogModalContent>
    </Dialog>
  );
};


const NftDetailSheet: React.FC<{
    nft: SelectedNft | null;
    onOpenChange: (open: boolean) => void;
    currentUser: any;
    setIsSendDialogOpen: (open: boolean) => void;
}> = ({ nft, onOpenChange, currentUser, setIsSendDialogOpen }) => {
    if (!nft) return null;
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
                                <span className="text-muted-foreground flex items-center gap-2"><User className="w-4 h-4"/>Владелец</span>
                                <span className="font-semibold text-foreground">{currentUser?.displayName || 'Вы'}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-border/30 pb-3">
                                <span className="text-muted-foreground flex items-center gap-2"><Shield className="w-4 h-4"/>Тип</span>
                                <Badge variant={nft.type === 'Анимированный' ? 'default' : 'secondary'} className={cn(nft.type === 'Анимированный' ? 'bg-purple-500/80 border-purple-400/50 hover:bg-purple-500/80' : 'bg-cyan-500/80 border-cyan-400/50')}>{nft.type}</Badge>
                            </div>
                            <div className="flex justify-between items-center border-b border-border/30 pb-3">
                                <span className="text-muted-foreground flex items-center gap-2"><BarChart className="w-4 h-4"/>Редкость</span>
                                <span className="font-semibold text-primary">{nft.rarity}%</span>
                            </div>
                             {nft.copyNumber && nft.totalEdition ? (
                                <div className="flex justify-between items-center border-b border-border/30 pb-3">
                                    <span className="text-muted-foreground flex items-center gap-2"><Package className="w-4 h-4"/>Экземпляр</span>
                                    <span className="font-semibold text-foreground">#{nft.copyNumber} из {nft.totalEdition.toLocaleString()}</span>
                                </div>
                            ) : (
                                <div className="flex justify-between items-center border-b border-border/30 pb-3">
                                    <span className="text-muted-foreground flex items-center gap-2"><Package className="w-4 h-4"/>Выпущено</span>
                                    <span className="font-semibold text-foreground">{nft.edition.toLocaleString()}</span>
                                </div>
                            )}
                            {nft.purchasedAt && (
                              <div className="flex justify-between items-center border-b border-border/30 pb-3">
                                  <span className="text-muted-foreground flex items-center gap-2"><Clock className="w-4 h-4"/>Приобретено</span>
                                  <span className="font-semibold text-foreground">{formatDistanceToNow(nft.purchasedAt.toDate(), { addSuffix: true, locale: ru })}</span>
                              </div>
                            )}
                        </div>
                    </div>
                    <SheetFooter className="p-6 border-t border-border/50 bg-background mt-auto">
                        <div className="w-full flex flex-col sm:flex-row gap-2">
                            <Button className="w-full" variant="outline" disabled><Cog className="w-4 h-4 mr-2" /> Использовать</Button>
                            <Button className="w-full" onClick={() => setIsSendDialogOpen(true)}><Send className="w-4 h-4 mr-2" /> Отправить</Button>
                        </div>
                    </SheetFooter>
                  </div>
              </div>
          </SheetContent>
      </Sheet>
    );
};

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

export default function CollectionsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { currentUser, loading: authLoading } = useAuth();
  
  const [pageState, setPageState] = useState<CollectionState>({ ownedNfts: [] });
  const [allNfts, setAllNfts] = useState<NftItem[]>([]);
  const [mailbox, setMailbox] = useState<NftTransfer[]>([]);
  const [transferHistory, setTransferHistory] = useState<NftTransfer[]>([]);

  const [selectedNft, setSelectedNft] = useState<SelectedNft | null>(null);
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [isNftsLoading, setIsNftsLoading] = useState(true);

  const isLoading = authLoading || isUserLoading || isNftsLoading;

  // Real-time listener for user's owned NFTs
  useEffect(() => {
    if (!currentUser) {
      setIsUserLoading(false);
      return;
    }

    const userDocRef = doc(db, 'users', currentUser.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setPageState({ ownedNfts: data.ownedNfts || [] });
      }
      setIsUserLoading(false);
    }, (error) => {
      console.error("Error listening to user data:", error);
      toast({ variant: "destructive", title: "Ошибка", description: "Не удалось обновить данные коллекции." });
      setIsUserLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, toast]);

  // One-time fetch for all NFT definitions
  useEffect(() => {
    const fetchAllNfts = async () => {
      setIsNftsLoading(true);
      try {
        const nftCollectionRef = collection(db, 'nfts');
        const nftQuerySnapshot = await getDocs(nftCollectionRef);
        const fetchedNfts: NftItem[] = nftQuerySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: data.id,
                name: data.name,
                description: data.description,
                type: data.type,
                price: data.price,
                category: data.category,
                rarity: data.rarity,
                edition: data.edition,
                totalEdition: data.totalEdition,
                imageUrl: data.imageUrl,
                backgroundSvg: data.backgroundSvg,
                iconColorClass: 'text-primary',
                iconBgClass: 'bg-primary/20',
            } as NftItem;
        });
        setAllNfts(fetchedNfts);
      } catch (error) {
        console.error("Error fetching all NFTs:", error);
        toast({ variant: "destructive", title: "Ошибка", description: "Не удалось загрузить определения NFT." });
      } finally {
        setIsNftsLoading(false);
      }
    };
    fetchAllNfts();
  }, [toast]);
  
  // Real-time listeners for mailbox and transfer history
  useEffect(() => {
    if (!currentUser) return;

    const transfersRef = collection(db, 'nft_transfers');

    // Mailbox listener for pending items
    const qMailbox = query(transfersRef, where('recipientId', '==', currentUser.uid), where('status', '==', 'pending'), orderBy('sentAt', 'desc'));
    const unsubscribeMailbox = onSnapshot(qMailbox, (snapshot) => {
      const received: NftTransfer[] = snapshot.docs.map(d => ({ id: d.id, ...d.data(), sentAt: (d.data().sentAt as Timestamp)?.toDate() ?? new Date() } as NftTransfer));
      setMailbox(received);
    }, (error) => console.error("Mailbox listener error:", error));
    
    // History listeners
    let sentItems: NftTransfer[] = [];
    let receivedClaimedItems: NftTransfer[] = [];

    const combineAndSetHistory = () => {
      const combined = [...sentItems, ...receivedClaimedItems];
      combined.sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime());
      setTransferHistory(combined);
    };

    // Listener for items sent by the user
    const qSent = query(transfersRef, where('senderId', '==', currentUser.uid), orderBy('sentAt', 'desc'));
    const unsubscribeSent = onSnapshot(qSent, (snapshot) => {
      sentItems = snapshot.docs.map(d => ({ id: d.id, ...d.data(), sentAt: (d.data().sentAt as Timestamp)?.toDate() ?? new Date() } as NftTransfer));
      combineAndSetHistory();
    }, (error) => console.error("Sent history listener error:", error));

    // Listener for items received and claimed by the user
    const qReceivedClaimed = query(transfersRef, where('recipientId', '==', currentUser.uid), where('status', '==', 'claimed'), orderBy('sentAt', 'desc'));
    const unsubscribeReceivedClaimed = onSnapshot(qReceivedClaimed, (snapshot) => {
      receivedClaimedItems = snapshot.docs.map(d => ({ id: d.id, ...d.data(), sentAt: (d.data().sentAt as Timestamp)?.toDate() ?? new Date() } as NftTransfer));
      combineAndSetHistory();
    }, (error) => console.error("Received claimed history listener error:", error));


    return () => {
      unsubscribeMailbox();
      unsubscribeSent();
      unsubscribeReceivedClaimed();
    };
  }, [currentUser]);

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, authLoading, router]);
  
  const handleClaimNft = async (transfer: NftTransfer) => {
    if (!currentUser) return;
    try {
      const batch = writeBatch(db);
      const userDocRef = doc(db, 'users', currentUser.uid);
      const newOwnedNft = { 
        nftId: transfer.nftId, 
        instanceId: transfer.instanceId, 
        purchasedAt: Timestamp.now(),
        copyNumber: transfer.copyNumber || undefined,
      };

      batch.update(userDocRef, { ownedNfts: arrayUnion(newOwnedNft) });
      
      const transferDocRef = doc(db, 'nft_transfers', transfer.id);
      batch.update(transferDocRef, { status: 'claimed' });
      
      await batch.commit();
      toast({ title: 'NFT получен!', description: 'Предмет добавлен в вашу коллекцию "Мои NFT".' });
    } catch(error) {
       console.error("Error claiming NFT:", error);
       toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось получить NFT.' });
    }
  };
  
  if (isLoading) {
    return (
      <AppLayout activeItem="/collections" contentClassName="text-center">
          <Skeleton className="h-20 w-20 rounded-full mx-auto mb-4" />
          <Skeleton className="h-10 w-3/5 mx-auto mb-8" />
          
          <div className="w-full max-w-4xl mx-auto">
              <Skeleton className="h-10 w-full mb-6" />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="flex flex-col items-center p-3 rounded-lg bg-card/50">
                        <Skeleton className="w-8 h-8 rounded-full mb-2" />
                        <Skeleton className="h-4 w-16" />
                    </div>
                ))}
              </div>
          </div>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout activeItem="/collections" contentClassName="text-center">
      <div className="mx-auto flex justify-center items-center mb-4 h-20 w-20 rounded-full bg-primary/20">
          <LayoutGrid className="w-10 h-10 text-primary" />
      </div>
      <h1 className="text-4xl font-bold mb-8 text-foreground">Моя коллекция</h1>
      
      <Tabs defaultValue="inventory" className="w-full max-w-4xl mx-auto">
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-card/80">
              <TabsTrigger value="inventory">Мои NFT ({pageState.ownedNfts.length})</TabsTrigger>
              <TabsTrigger value="mailbox">Почта ({mailbox.length})</TabsTrigger>
              <TabsTrigger value="history">История ({transferHistory.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="inventory">
               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                <AnimatePresence>
                  {pageState.ownedNfts.length > 0 ? (
                    pageState.ownedNfts.map((ownedNft) => {
                      const foundNft = allNfts.find(item => item.id === ownedNft.nftId);
                      if (!foundNft) return null;
                      const IconComponent = foundNft.icon;
                      return (
                         <motion.div
                            key={ownedNft.instanceId}
                            layout
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.3 }}
                            className="h-full"
                         >
                          <button onClick={() => { setSelectedNft({...foundNft, instanceId: ownedNft.instanceId, purchasedAt: ownedNft.purchasedAt, copyNumber: ownedNft.copyNumber}) }} className={cn("p-3 rounded-lg shadow-md flex flex-col items-center text-center transition-colors hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary w-full h-full", (foundNft.iconBgClass || 'bg-primary/20').replace('/20', '/30'))}>
                            <div className={cn("p-2 rounded-full mb-2", foundNft.iconBgClass || 'bg-primary/20')}>{foundNft.imageUrl ? <Image src={foundNft.imageUrl} alt={foundNft.name} width={24} height={24} unoptimized /> : (IconComponent && <IconComponent className={cn("w-6 h-6", foundNft.iconColorClass || 'text-primary')} />)}</div>
                            <span className="text-xs font-medium text-foreground truncate w-full">{foundNft.name}</span>
                          </button>
                         </motion.div>
                      );
                    })
                  ) : (
                    !isLoading && <motion.div
                      key="empty-inventory"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="col-span-full"
                    >
                       <div className="flex flex-col items-center justify-center py-10 text-muted-foreground"><ShoppingCart className="w-8 h-8 mb-2" /><p>Ваша коллекция пуста.</p></div>
                    </motion.div>
                  )}
                 </AnimatePresence>
              </div>
          </TabsContent>
          <TabsContent value="mailbox">
              {mailbox.length > 0 ? (<div className="space-y-3">
                  <AnimatePresence>
                  {mailbox.map(transfer => {
                      const nft = allNfts.find(n => n.id === transfer.nftId);
                      if (!nft) return null;
                      return (
                      <motion.div 
                        key={transfer.id}
                        layout
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -300 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Card className="bg-card/80 text-left"><CardContent className="p-3 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                    {transfer.senderIsVerified ? (
                                        <TooltipProvider delayDuration={0}>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="relative">
                                                        <Avatar>
                                                            <AvatarImage src={transfer.senderPhotoURL || `https://api.dicebear.com/8.x/bottts/svg?seed=${transfer.senderId}`} alt={transfer.senderNickname} />
                                                            <AvatarFallback>{transfer.senderNickname?.charAt(0) || '?'}</AvatarFallback>
                                                        </Avatar>
                                                        <CheckCircle2 className="absolute bottom-0 right-0 w-4 h-4 bg-background text-primary rounded-full" />
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Верифицированный пользователь</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    ) : (
                                        <Avatar>
                                            <AvatarImage src={transfer.senderPhotoURL || `https://api.dicebear.com/8.x/bottts/svg?seed=${transfer.senderId}`} alt={transfer.senderNickname} />
                                            <AvatarFallback>{transfer.senderNickname?.charAt(0) || '?'}</AvatarFallback>
                                        </Avatar>
                                    )}
                              </div>
                              <div>
                                <p className="text-sm font-semibold">{nft.name}</p>
                                <p className="text-xs text-muted-foreground">от {transfer.senderUsername || transfer.senderNickname}</p>
                              </div>
                            </div>
                            <Button size="sm" onClick={() => handleClaimNft(transfer)}>Получить</Button>
                        </CardContent></Card>
                      </motion.div>
                      );
                  })}
                  </AnimatePresence>
              </div>) : (<div className="flex flex-col items-center justify-center py-10 text-muted-foreground"><Inbox className="w-8 h-8 mb-2" /><p>Ваша почта пуста.</p></div>)}
          </TabsContent>
          <TabsContent value="history">
               {transferHistory.length > 0 ? (<div className="space-y-3">
                  {transferHistory.map(transfer => {
                      const nft = allNfts.find(n => n.id === transfer.nftId);
                      if (!nft) return null;

                      const isSender = transfer.senderId === currentUser?.uid;
                      const otherPartyUsername = isSender ? transfer.recipientUsername : (transfer.senderUsername || transfer.senderNickname);
                      const otherPartyPhotoURL = isSender ? transfer.recipientPhotoURL : transfer.senderPhotoURL;
                      const otherPartyId = isSender ? transfer.recipientId : transfer.senderId;
                      const otherPartyIsVerified = isSender ? (transfer.recipientIsVerified || false) : (transfer.senderIsVerified || false);
                      const actionText = isSender ? `Отправлено ${otherPartyUsername}` : `Получено от ${otherPartyUsername}`;
                      
                      return (<Card key={transfer.id} className="bg-card/80 text-left"><CardContent className="p-3 flex items-center justify-between gap-3">
                         <div className="flex items-center gap-3">
                             <div className="relative">
                                 {otherPartyIsVerified ? (
                                      <TooltipProvider delayDuration={0}>
                                          <Tooltip>
                                              <TooltipTrigger asChild>
                                                 <div className="relative">
                                                     <Avatar>
                                                          <AvatarImage src={otherPartyPhotoURL || `https://api.dicebear.com/8.x/bottts/svg?seed=${otherPartyId}`} alt={otherPartyUsername}/>
                                                          <AvatarFallback>{otherPartyUsername?.charAt(isSender ? 1 : 0) || '?'}</AvatarFallback>
                                                     </Avatar>
                                                     <CheckCircle2 className="absolute bottom-0 right-0 w-4 h-4 bg-background text-primary rounded-full" />
                                                 </div>
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                  <p>Верифицированный пользователь</p>
                                              </TooltipContent>
                                          </Tooltip>
                                      </TooltipProvider>
                                 ) : (
                                     <Avatar>
                                          <AvatarImage src={otherPartyPhotoURL || `https://api.dicebear.com/8.x/bottts/svg?seed=${otherPartyId}`} alt={otherPartyUsername}/>
                                          <AvatarFallback>{otherPartyUsername?.charAt(isSender ? 1 : 0) || '?'}</AvatarFallback>
                                     </Avatar>
                                 )}
                             </div>
                             <div>
                                 <p className="text-sm font-semibold">{nft.name}</p>
                                 <p className="text-xs text-muted-foreground">{actionText} • {formatDistanceToNow(transfer.sentAt, { addSuffix: true, locale: ru })}</p>
                             </div>
                         </div>
                         <Badge variant={transfer.status === 'claimed' ? 'default' : 'secondary'} className={cn(transfer.status === 'claimed' ? 'bg-green-500/80' : 'bg-yellow-500/80')}>{transfer.status === 'claimed' ? 'Получено' : 'В ожидании'}</Badge>
                      </CardContent></Card>);
                  })}
              </div>) : (<div className="flex flex-col items-center justify-center py-10 text-muted-foreground"><History className="w-8 h-8 mb-2" /><p>История транзакций пуста.</p></div>)}
          </TabsContent>
      </Tabs>

     <NftDetailSheet
         nft={selectedNft} 
         onOpenChange={(isOpen) => !isOpen && setSelectedNft(null)}
         currentUser={currentUser}
         setIsSendDialogOpen={setIsSendDialogOpen}
     />
     <SendNftDialog
          isOpen={isSendDialogOpen}
          onOpenChange={setIsSendDialogOpen}
          selectedNft={selectedNft}
          currentUser={currentUser}
          pageState={pageState}
          setSelectedNft={setSelectedNft}
      />
    </AppLayout>
  );
}
