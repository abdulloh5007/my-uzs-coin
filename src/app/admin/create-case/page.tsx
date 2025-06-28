
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { doc, getDoc, collection, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Sparkles, UploadCloud, Box, PackageCheck } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';

interface NftDefinition {
    docId: string;
    id: string;
    name: string;
    imageUrl?: string;
}

const MAX_FILE_SIZE = 5000000;
const ACCEPTED_IMAGE_TYPES = ["image/gif", "image/svg+xml", "image/png", "image/jpeg", "image/webp"];

const createCaseSchema = z.object({
    name: z.string().min(3, { message: "Название должно быть не менее 3 символов." }),
    description: z.string().min(10, { message: "Описание должно быть не менее 10 символов." }),
    price: z.coerce.number().int("Должно быть целое число.").positive("Цена должна быть положительным числом."),
    image: z.any().refine((files) => files?.length == 1, "Требуется изображение кейса.").refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, `Максимальный размер файла 5MB.`).refine(
        (files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
        "Поддерживаются только .gif, .svg, .png, .jpg, .webp"
    ),
    nftIds: z.array(z.string()).refine((value) => value.length > 0, {
        message: 'Нужно выбрать хотя бы один NFT для кейса.',
    }),
});

type CreateCaseFormValues = z.infer<typeof createCaseSchema>;

const fileToBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
});

export default function CreateCasePage() {
    const { currentUser, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [nfts, setNfts] = useState<NftDefinition[]>([]);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const form = useForm<CreateCaseFormValues>({
        resolver: zodResolver(createCaseSchema),
        defaultValues: {
            name: '',
            description: '',
            price: 0,
            nftIds: [],
        },
    });

    useEffect(() => {
        if (authLoading) return;
        if (!currentUser) {
            router.push('/login');
            return;
        }

        const checkRoleAndFetchNfts = async () => {
            try {
                const userDocRef = doc(db, 'users', currentUser.uid);
                const docSnap = await getDoc(userDocRef);

                if (docSnap.exists() && docSnap.data().role === 'owner') {
                    setIsAuthorized(true);
                    
                    const nftCollectionRef = collection(db, 'nfts');
                    const nftQuerySnapshot = await getDocs(nftCollectionRef);
                    const fetchedNfts: NftDefinition[] = nftQuerySnapshot.docs.map(doc => ({
                        docId: doc.id,
                        id: doc.data().id,
                        name: doc.data().name,
                        imageUrl: doc.data().imageUrl,
                    }));
                    setNfts(fetchedNfts);
                } else {
                    router.push('/');
                }
            } catch (error) {
                console.error("Error loading page data:", error);
                router.push('/');
            } finally {
                setIsLoading(false);
            }
        };

        checkRoleAndFetchNfts();
    }, [currentUser, authLoading, router]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            form.setValue('image', e.target.files, { shouldValidate: true });
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const onSubmit = async (data: CreateCaseFormValues) => {
        try {
            const imageUrl = await fileToBase64(data.image[0]);

            const newCaseData = {
                name: data.name,
                description: data.description,
                price: data.price,
                imageUrl: imageUrl,
                itemPool: data.nftIds, // Array of NFT IDs
                createdAt: serverTimestamp(),
            };

            await addDoc(collection(db, 'cases'), newCaseData);
            
            toast({
                title: "Кейс создан!",
                description: `Кейс "${data.name}" успешно добавлен в базу данных.`,
            });
            form.reset();
            setPreviewUrl(null);

        } catch (error) {
            console.error("Error creating case:", error);
            toast({
                variant: "destructive",
                title: "Ошибка создания кейса",
                description: "Произошла ошибка при сохранении данных.",
            });
        }
    };

    if (isLoading || authLoading) {
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
                             <div className="space-y-6">
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-20 w-full" />
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-40 w-full" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </AppLayout>
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
        <AppLayout>
             <div className="max-w-4xl mx-auto">
                <Button variant="ghost" onClick={() => router.push('/admin')} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Назад в админ-панель
                </Button>
                <Card className="bg-card/80">
                    <CardHeader>
                        <CardTitle className="text-2xl flex items-center gap-2"><Box className="text-primary"/>Создать новый кейс</CardTitle>
                        <CardDescription>Заполните форму, чтобы добавить новый кейс в магазин.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Название кейса</FormLabel>
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
                                            name="price"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Цена (монеты)</FormLabel>
                                                    <FormControl><Input type="number" placeholder="100000" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="image"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Изображение кейса</FormLabel>
                                                    <FormControl>
                                                        <Input type="file" onChange={handleFileChange} accept={ACCEPTED_IMAGE_TYPES.join(',')} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        {previewUrl && (
                                            <div className="mt-2">
                                                <FormLabel>Предпросмотр</FormLabel>
                                                <div className="mt-1 aspect-square w-full max-w-xs rounded-lg border border-dashed border-border flex items-center justify-center p-2">
                                                    <img src={previewUrl} alt="Предпросмотр" className="max-w-full max-h-full object-contain" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-4">
                                        <FormField
                                            control={form.control}
                                            name="nftIds"
                                            render={() => (
                                                <FormItem>
                                                     <div className="mb-4">
                                                        <FormLabel className="text-base flex items-center gap-2"><PackageCheck/>Содержимое кейса</FormLabel>
                                                        <p className="text-sm text-muted-foreground">Выберите, какие NFT могут выпасть из этого кейса.</p>
                                                    </div>
                                                    <ScrollArea className="h-72 w-full rounded-md border p-4">
                                                        <div className="space-y-4">
                                                        {nfts.map((item) => (
                                                            <FormField
                                                                key={item.id}
                                                                control={form.control}
                                                                name="nftIds"
                                                                render={({ field }) => (
                                                                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                                                        <FormControl>
                                                                            <Checkbox
                                                                                checked={field.value?.includes(item.id)}
                                                                                onCheckedChange={(checked) => {
                                                                                    return checked
                                                                                        ? field.onChange([...(field.value || []), item.id])
                                                                                        : field.onChange(
                                                                                            field.value?.filter(
                                                                                                (value) => value !== item.id
                                                                                            )
                                                                                        );
                                                                                }}
                                                                            />
                                                                        </FormControl>
                                                                        <div className="flex items-center gap-2">
                                                                            {item.imageUrl && (
                                                                                <Image src={item.imageUrl} alt={item.name} width={24} height={24} className="rounded-sm" unoptimized/>
                                                                            )}
                                                                            <FormLabel className="font-normal">{item.name}</FormLabel>
                                                                        </div>
                                                                    </FormItem>
                                                                )}
                                                            />
                                                        ))}
                                                        </div>
                                                    </ScrollArea>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                               </div>

                                <Button type="submit" disabled={form.formState.isSubmitting} className="w-full mt-8">
                                    {form.formState.isSubmitting ? 'Сохранение...' : 'Создать кейс'}
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

