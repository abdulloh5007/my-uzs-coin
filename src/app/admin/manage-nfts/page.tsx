
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { collection, getDocs, doc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trash2 } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Nft {
    docId: string;
    id: string;
    name: string;
    imageUrl?: string;
}

export default function ManageNftsPage() {
    const { currentUser, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [nfts, setNfts] = useState<Nft[]>([]);

    const fetchNfts = useCallback(async () => {
        setIsLoading(true);
        try {
            const nftCollectionRef = collection(db, 'nfts');
            const nftQuerySnapshot = await getDocs(nftCollectionRef);
            const fetchedNfts: Nft[] = nftQuerySnapshot.docs.map(doc => ({
                docId: doc.id,
                id: doc.data().id,
                name: doc.data().name,
                imageUrl: doc.data().imageUrl,
            }));
            setNfts(fetchedNfts);
        } catch (error) {
            console.error("Error fetching NFTs:", error);
            toast({ variant: "destructive", title: "Ошибка", description: "Не удалось загрузить список NFT." });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);
    
    useEffect(() => {
        if (authLoading) return;
        if (!currentUser) {
            router.push('/login');
            return;
        }

        const checkRoleAndFetch = async () => {
            try {
                const userDocRef = doc(db, 'users', currentUser.uid);
                const docSnap = await getDoc(userDocRef);

                if (docSnap.exists() && docSnap.data().role === 'owner') {
                    setIsAuthorized(true);
                    fetchNfts();
                } else {
                    router.push('/');
                }
            } catch (error) {
                console.error("Authorization check failed:", error);
                router.push('/');
            }
        };

        checkRoleAndFetch();
    }, [currentUser, authLoading, router, fetchNfts]);
    
    const handleDelete = async (nftDocId: string, nftName: string) => {
        try {
            await deleteDoc(doc(db, 'nfts', nftDocId));
            toast({
                title: "NFT удален",
                description: `"${nftName}" был успешно удален.`,
            });
            // Refetch NFTs to update the list
            fetchNfts();
        } catch (error) {
             console.error("Error deleting NFT:", error);
            toast({
                variant: "destructive",
                title: "Ошибка удаления",
                description: "Не удалось удалить NFT.",
            });
        }
    };
    
    if (authLoading || isLoading) {
        // Skeleton loader
        return (
            <AppLayout>
                <div className="max-w-4xl mx-auto">
                    <Skeleton className="h-9 w-48 mb-4" />
                    <Card className="bg-card/80">
                        <CardHeader>
                            <Skeleton className="h-8 w-64 mb-2" />
                            <Skeleton className="h-4 w-96" />
                        </CardHeader>
                        <CardContent>
                             <div className="space-y-4">
                                <Skeleton className="h-16 w-full" />
                                <Skeleton className="h-16 w-full" />
                                <Skeleton className="h-16 w-full" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </AppLayout>
        );
    }

    if (!isAuthorized) {
        return null;
    }

    return (
        <AppLayout>
            <div className="max-w-4xl mx-auto">
                <Button variant="ghost" onClick={() => router.push('/admin')} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Назад в админ-панель
                </Button>
                <Card className="bg-card/80">
                    <CardHeader>
                        <CardTitle>Управление NFT</CardTitle>
                        <CardDescription>Просмотр и удаление существующих NFT.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {nfts.length > 0 ? nfts.map(nft => (
                                <div key={nft.docId} className="flex items-center justify-between p-3 rounded-lg bg-input/80">
                                    <div className="flex items-center gap-4">
                                        {nft.imageUrl && <Image src={nft.imageUrl} alt={nft.name} width={40} height={40} className="rounded-md" unoptimized />}
                                        <span className="font-medium text-foreground">{nft.name}</span>
                                    </div>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" size="icon">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Это действие нельзя отменить. NFT "{nft.name}" будет навсегда удален из базы данных.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Отмена</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(nft.docId, nft.name)}>Удалить</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            )) : (
                                <p className="text-center text-muted-foreground py-4">NFT не найдены.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
