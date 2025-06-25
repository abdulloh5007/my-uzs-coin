
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Sparkles, Shield } from 'lucide-react';
import BottomNavBar from '@/components/BottomNavBar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

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
            <div className="flex flex-col min-h-screen items-center justify-center bg-gradient-to-br from-background to-indigo-900/50">
                <Sparkles className="w-16 h-16 animate-spin text-primary" />
                <p className="mt-4 text-lg text-foreground">Проверка доступа...</p>
            </div>
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
        <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-indigo-900/50 text-foreground font-body antialiased">
            <div className="flex-grow container mx-auto px-4 pt-10 md:pt-16 pb-20 md:pb-24 text-center">
                 <div className="mx-auto flex justify-center items-center mb-4 h-20 w-20 rounded-full bg-primary/20">
                    <Shield className="w-10 h-10 text-primary" />
                </div>
                <h1 className="text-4xl font-bold mb-2 text-foreground">Панель администратора</h1>
                <p className="text-muted-foreground mb-8">Добро пожаловать, владелец!</p>

                 <Card className="max-w-2xl mx-auto text-left bg-card/80">
                    <CardHeader>
                        <CardTitle>Статус системы</CardTitle>
                        <CardDescription>Этот раздел находится в разработке.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p>Здесь будет отображаться информация о пользователях, статистика и инструменты управления.</p>
                    </CardContent>
                </Card>
            </div>
             <BottomNavBar onNavigate={handleNavigation} />
        </div>
    );
}
