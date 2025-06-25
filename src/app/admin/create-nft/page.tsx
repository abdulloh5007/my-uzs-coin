
'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Sparkles } from 'lucide-react';
import BottomNavBar from '@/components/BottomNavBar';

const MAX_FILE_SIZE = 5000000; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/gif"];

const createNftSchema = z.object({
    name: z.string().min(3, { message: "Название должно быть не менее 3 символов." }),
    description: z.string().min(10, { message: "Описание должно быть не менее 10 символов." }),
    image: z.any()
        .refine((files) => files?.length == 1, "Требуется гиф-файл.")
        .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, `Максимальный размер файла 5MB.`)
        .refine(
            (files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
            "Только .gif файлы."
        ),
    type: z.enum(['Анимированный', 'Простой'], { required_error: "Нужно выбрать тип." }),
    rarity: z.coerce.number().min(0.01, "Редкость не может быть 0.").max(100, "Редкость должна быть между 0.01 и 100."),
    edition: z.coerce.number().int("Должно быть целое число.").positive("Количество должно быть положительным числом."),
    price: z.coerce.number().int("Должно быть целое число.").positive("Цена должна быть положительным числом."),
    category: z.string().min(2, { message: "Категория должна быть не менее 2 символов." }),
});

type CreateNftFormValues = z.infer<typeof createNftSchema>;

// Helper to convert file to Base64
const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
});

export default function CreateNftPage() {
    const { currentUser, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const form = useForm<CreateNftFormValues>({
        resolver: zodResolver(createNftSchema),
        defaultValues: {
            type: 'Анимированный',
            name: '',
            description: '',
            category: '',
        },
    });

    useEffect(() => {
        if (authLoading) return;
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
                    router.push('/');
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
    
    const onSubmit = async (data: CreateNftFormValues) => {
        try {
            const imageFile = data.image[0];
            const imageUrl = await toBase64(imageFile);

            // This ID is just for the hardcoded list, which we are moving away from.
            // Firestore will generate its own unique ID.
            const newNftId = data.name.toLowerCase().replace(/\s+/g, '_');

            const newNftData = {
                id: newNftId,
                name: data.name,
                description: data.description,
                type: data.type,
                rarity: data.rarity,
                edition: data.edition,
                price: data.price,
                category: data.category,
                imageUrl: imageUrl, // Storing as base64 data URI
                // The icon, iconColorClass, iconBgClass are omitted as we now use imageUrl
                createdAt: serverTimestamp(),
            };

            await addDoc(collection(db, 'nfts'), newNftData);
            
            toast({
                title: "NFT создан!",
                description: `"${data.name}" успешно добавлен в базу данных.`,
            });
            form.reset();

        } catch (error) {
            console.error("Error creating NFT:", error);
            toast({
                variant: "destructive",
                title: "Ошибка создания NFT",
                description: "Произошла ошибка при сохранении данных.",
            });
        }
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
        return (
            <div className="flex flex-col min-h-screen items-center justify-center bg-gradient-to-br from-background to-indigo-900/50">
                <p className="mt-4 text-lg text-foreground">Доступ запрещен.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-indigo-900/50 text-foreground font-body antialiased">
             <div className="flex-grow container mx-auto px-4 pt-10 md:pt-16 pb-20 md:pb-24">
                <div className="max-w-2xl mx-auto">
                    <Button variant="ghost" onClick={() => router.push('/admin')} className="mb-4">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Назад в админ-панель
                    </Button>
                    <Card className="bg-card/80">
                        <CardHeader>
                            <CardTitle className="text-2xl">Создать новый NFT</CardTitle>
                            <CardDescription>Заполните форму, чтобы добавить новый предмет в магазин.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Название NFT</FormLabel>
                                                <FormControl><Input placeholder="Название..." {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Описание</FormLabel>
                                                <FormControl><Textarea placeholder="Описание..." {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="image"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>GIF-файл</FormLabel>
                                                 <FormControl>
                                                    <Input 
                                                        type="file" 
                                                        accept=".gif"
                                                        className="pt-2 text-sm file:text-foreground"
                                                        onChange={(e) => field.onChange(e.target.files)}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="category"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Категория</FormLabel>
                                                <FormControl><Input placeholder="Киберпанк" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="price"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Цена (монеты)</FormLabel>
                                                    <FormControl><Input type="number" placeholder="15000000" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="rarity"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Редкость (%)</FormLabel>
                                                    <FormControl><Input type="number" step="0.1" placeholder="5" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="edition"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Количество</FormLabel>
                                                    <FormControl><Input type="number" placeholder="5000" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                     <FormField
                                        control={form.control}
                                        name="type"
                                        render={({ field }) => (
                                            <FormItem className="space-y-3">
                                            <FormLabel>Тип NFT</FormLabel>
                                            <FormControl>
                                                <RadioGroup
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                                className="flex flex-row space-x-4"
                                                >
                                                <FormItem className="flex items-center space-x-3 space-y-0">
                                                    <FormControl>
                                                    <RadioGroupItem value="Анимированный" />
                                                    </FormControl>
                                                    <FormLabel className="font-normal">
                                                    Анимированный
                                                    </FormLabel>
                                                </FormItem>
                                                <FormItem className="flex items-center space-x-3 space-y-0">
                                                    <FormControl>
                                                    <RadioGroupItem value="Простой" />
                                                    </FormControl>
                                                    <FormLabel className="font-normal">
                                                    Простой
                                                    </FormLabel>
                                                </FormItem>
                                                </RadioGroup>
                                            </FormControl>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
                                        {form.formState.isSubmitting ? 'Сохранение...' : 'Создать NFT'}
                                    </Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </div>
             </div>
             <BottomNavBar onNavigate={(path) => router.push(path)} />
        </div>
    );
}
