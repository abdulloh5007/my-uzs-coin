
'use client';

import React, { useState, useEffect, useRef } from 'react';
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
import { ArrowLeft, Sparkles, UploadCloud } from 'lucide-react';
import BottomNavBar from '@/components/BottomNavBar';
import { cn } from '@/lib/utils';

const MAX_FILE_SIZE = 5000000; // 5MB
const ACCEPTED_IMAGE_TYPES = {
    'Анимированный': ["image/gif"],
    'Простой': ["image/svg+xml"],
};

const createNftSchema = z.object({
    name: z.string().min(3, { message: "Название должно быть не менее 3 символов." }),
    description: z.string().min(10, { message: "Описание должно быть не менее 10 символов." }),
    type: z.enum(['Анимированный', 'Простой'], { required_error: "Нужно выбрать тип." }),
    rarity: z.coerce.number().min(0.01, "Редкость не может быть 0.").max(100, "Редкость должна быть между 0.01 и 100."),
    edition: z.coerce.number().int("Должно быть целое число.").positive("Количество должно быть положительным числом."),
    price: z.coerce.number().int("Должно быть целое число.").positive("Цена должна быть положительным числом."),
    category: z.string().min(2, { message: "Категория должна быть не менее 2 символов." }),
    image: z.any(),
}).superRefine((data, ctx) => {
    if (!data.image || data.image.length !== 1) {
        ctx.addIssue({ code: 'custom', path: ['image'], message: 'Требуется файл.' });
        return;
    }
    const file = data.image[0];
    const allowedTypes = ACCEPTED_IMAGE_TYPES[data.type];
    const allowedExtensions = allowedTypes.map(t => `.${t.split('/')[1]}`).join(', ');

    if (!allowedTypes.includes(file.type)) {
        ctx.addIssue({ code: 'custom', path: ['image'], message: `Для типа "${data.type}" разрешены только файлы: ${allowedExtensions}.` });
    }

    if (file.size > MAX_FILE_SIZE) {
        ctx.addIssue({ code: 'custom', path: ['image'], message: `Максимальный размер файла 5MB.` });
    }
});


type CreateNftFormValues = z.infer<typeof createNftSchema>;

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
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const form = useForm<CreateNftFormValues>({
        resolver: zodResolver(createNftSchema),
        defaultValues: {
            type: 'Анимированный',
            name: '',
            description: '',
            category: '',
            price: 0,
            rarity: 0,
            edition: 0,
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

    const handleFileSelect = (file: File | undefined) => {
        if (!file) {
            form.setValue("image", undefined, { shouldValidate: true });
            setImagePreview(null);
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
        form.setValue("image", [file], { shouldValidate: true });
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            const currentType = form.getValues("type");
            const allowedTypes = ACCEPTED_IMAGE_TYPES[currentType];
            if (allowedTypes.includes(file.type)) {
                handleFileSelect(file);
            } else {
                 toast({
                    variant: "destructive",
                    title: "Неверный тип файла",
                    description: `Пожалуйста, выберите ${currentType === 'Анимированный' ? 'GIF' : 'SVG'} файл.`,
                });
            }
        }
    };

    const handleDragEvents = (e: React.DragEvent<HTMLDivElement>, isEntering: boolean) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(isEntering);
    };

    const onSubmit = async (data: CreateNftFormValues) => {
        try {
            const imageFile = data.image[0];
            const imageUrl = await toBase64(imageFile);
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
                imageUrl: imageUrl,
                createdAt: serverTimestamp(),
            };

            await addDoc(collection(db, 'nfts'), newNftData);
            
            toast({
                title: "NFT создан!",
                description: `"${data.name}" успешно добавлен в базу данных.`,
            });
            form.reset();
            setImagePreview(null);

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
                <div className="max-w-4xl mx-auto">
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
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        
                                        <div className="space-y-2">
                                            <FormLabel>Файл NFT ({form.watch('type') === 'Анимированный' ? 'GIF' : 'SVG'})</FormLabel>
                                            <div
                                              onDragEnter={(e) => handleDragEvents(e, true)}
                                              onDragLeave={(e) => handleDragEvents(e, false)}
                                              onDragOver={(e) => handleDragEvents(e, true)}
                                              onDrop={handleDrop}
                                              onClick={() => fileInputRef.current?.click()}
                                              className={cn(
                                                "aspect-square w-full rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer transition-colors relative",
                                                isDragging ? "border-primary bg-primary/10" : "hover:border-primary/50"
                                              )}
                                            >
                                                <input
                                                  type="file"
                                                  ref={fileInputRef}
                                                  className="hidden"
                                                  onChange={(e) => handleFileSelect(e.target.files?.[0])}
                                                  accept={form.watch('type') === 'Анимированный' ? 'image/gif' : 'image/svg+xml'}
                                                />
                                                {imagePreview ? (
                                                  <img src={imagePreview} alt="Предпросмотр" className="max-w-full max-h-full p-4 object-contain rounded-md" />
                                                ) : (
                                                  <div className="text-center text-muted-foreground p-4">
                                                    <UploadCloud className="mx-auto h-12 w-12" />
                                                    <p className="mt-2 font-semibold">Перетащите файл сюда</p>
                                                    <p className="text-xs">или нажмите для выбора</p>
                                                  </div>
                                                )}
                                            </div>
                                            <FormField
                                                control={form.control}
                                                name="image"
                                                render={() => (
                                                  <FormItem>
                                                    <FormMessage />
                                                  </FormItem>
                                                )}
                                            />
                                        </div>

                                        <div className="space-y-4 flex flex-col">
                                             <FormField
                                                control={form.control}
                                                name="type"
                                                render={({ field }) => (
                                                    <FormItem className="space-y-3">
                                                    <FormLabel>Тип NFT</FormLabel>
                                                    <FormControl>
                                                        <RadioGroup
                                                        onValueChange={(value) => {
                                                            field.onChange(value);
                                                            handleFileSelect(undefined);
                                                        }}
                                                        defaultValue={field.value}
                                                        className="flex flex-row space-x-4"
                                                        >
                                                        <FormItem className="flex items-center space-x-3 space-y-0">
                                                            <FormControl><RadioGroupItem value="Анимированный" /></FormControl>
                                                            <FormLabel className="font-normal">Анимированный</FormLabel>
                                                        </FormItem>
                                                        <FormItem className="flex items-center space-x-3 space-y-0">
                                                            <FormControl><RadioGroupItem value="Простой" /></FormControl>
                                                            <FormLabel className="font-normal">Простой</FormLabel>
                                                        </FormItem>
                                                        </RadioGroup>
                                                    </FormControl>
                                                    <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
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
                                        </div>
                                    </div>
                                    <Button type="submit" disabled={form.formState.isSubmitting} className="w-full mt-8">
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
