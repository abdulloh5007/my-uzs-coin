
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

interface Case {
    docId: string;
    name: string;
    imageUrl?: string;
}

export default function ManageCasesPage() {
    const { currentUser, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [cases, setCases] = useState<Case[]>([]);

    const fetchCases = useCallback(async () => {
        setIsLoading(true);
        try {
            const caseCollectionRef = collection(db, 'cases');
            const caseQuerySnapshot = await getDocs(caseCollectionRef);
            const fetchedCases: Case[] = caseQuerySnapshot.docs.map(doc => ({
                docId: doc.id,
                name: doc.data().name,
                imageUrl: doc.data().imageUrl,
            }));
            setCases(fetchedCases);
        } catch (error) {
            console.error("Error fetching cases:", error);
            toast({ variant: "destructive", title: "Ошибка", description: "Не удалось загрузить список кейсов." });
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
                    fetchCases();
                } else {
                    router.push('/');
                }
            } catch (error) {
                console.error("Authorization check failed:", error);
                router.push('/');
            }
        };

        checkRoleAndFetch();
    }, [currentUser, authLoading, router, fetchCases]);
    
    const handleDelete = async (caseDocId: string, caseName: string) => {
        try {
            await deleteDoc(doc(db, 'cases', caseDocId));
            toast({
                title: "Кейс удален",
                description: `"${caseName}" был успешно удален.`,
            });
            fetchCases();
        } catch (error) {
             console.error("Error deleting case:", error);
            toast({
                variant: "destructive",
                title: "Ошибка удаления",
                description: "Не удалось удалить кейс.",
            });
        }
    };
    
    if (authLoading || isLoading) {
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
                        <CardTitle>Управление Кейсами</CardTitle>
                        <CardDescription>Просмотр и удаление существующих кейсов.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {cases.length > 0 ? cases.map(caseItem => (
                                <div key={caseItem.docId} className="flex items-center justify-between p-3 rounded-lg bg-input/80">
                                    <div className="flex items-center gap-4">
                                        {caseItem.imageUrl && <Image src={caseItem.imageUrl} alt={caseItem.name} width={40} height={40} className="rounded-md" unoptimized />}
                                        <span className="font-medium text-foreground">{caseItem.name}</span>
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
                                                    Это действие нельзя отменить. Кейс "{caseItem.name}" будет навсегда удален.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Отмена</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(caseItem.docId, caseItem.name)}>Удалить</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            )) : (
                                <p className="text-center text-muted-foreground py-4">Кейсы не найдены.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
