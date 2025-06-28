
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Sparkles, Shield, PlusCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import AppLayout from '@/components/AppLayout';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminPage() {
    const { currentUser, loading: authLoading } = useAuth();
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (authLoading) {
            return;
        }
        if (!currentUser) {
            router.push('/login');
            return;
        }

        const checkRole = async () => {
            try {
                const userDocRef = doc(db, 'users', currentUser.uid);
                const docSnap = await getDoc(userDocRef);

                if (docSnap.exists() && docSnap.data().role === 'owner') {
                    setIsAuthorized(true);
                } else {
                    router.push('/'); // Redirect non-owners to home
                }
            } catch (error) {
                console.error("Authorization check failed:", error);
                router.push('/');
            } finally {
                setIsLoading(false);
            }
        };

        checkRole();
    }, [currentUser, authLoading, router]);

    const handleNavigation = (path: string) => {
        router.push(path);
    };

    if (isLoading || authLoading) {
        return (
            <AppLayout contentClassName="text-center">
                <Skeleton className="h-20 w-20 rounded-full mx-auto mb-4" />
                <Skeleton className="h-10 w-3/5 mx-auto mb-2" />
                <Skeleton className="h-5 w-2/5 mx-auto mb-8" />

                <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto text-left">
                    <Card className="bg-card/80">
                        <CardHeader>
                            <Skeleton className="h-6 w-32 mb-2" />
                            <Skeleton className="h-4 w-48" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-4 w-full" />
                        </CardContent>
                    </Card>
                     <Card className="bg-card/80">
                        <CardHeader>
                            <Skeleton className="h-6 w-32 mb-2" />
                            <Skeleton className="h-4 w-48" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-4 w-full" />
                        </CardContent>
                    </Card>
                </div>
            </AppLayout>
        );
    }
    
    if (!isAuthorized) {
        // This is a fallback while redirecting, user should be sent away quickly.
        return (
            <div className="flex flex-col min-h-screen items-center justify-center bg-gradient-to-br from-background to-indigo-900/50">
                 <p className="mt-4 text-lg text-foreground">Доступ запрещен.</p>
            </div>
        );
    }

    return (
        <AppLayout contentClassName="text-center">
            <div className="mx-auto flex justify-center items-center mb-4 h-20 w-20 rounded-full bg-primary/20">
                <Shield className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-2 text-foreground">Панель администратора</h1>
            <p className="text-muted-foreground mb-8">Добро пожаловать, владелец!</p>

            <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto text-left">
                <Card className="bg-card/80">
                    <CardHeader>
                        <CardTitle>Статус системы</CardTitle>
                        <CardDescription>Этот раздел находится в разработке.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p>Здесь будет отображаться информация о пользователях, статистика и инструменты управления.</p>
                    </CardContent>
                </Card>
                 <Card 
                    onClick={() => handleNavigation('/admin/create-nft')} 
                    className="bg-card/80 hover:bg-card/90 cursor-pointer transition-colors"
                >
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><PlusCircle className="text-primary"/>Создать NFT</CardTitle>
                        <CardDescription>Добавить новый предмет в магазин.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p>Форма для создания новых анимированных или простых NFT для игроков.</p>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
