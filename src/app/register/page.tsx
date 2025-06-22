
"use client";

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { AuthError } from 'firebase/auth';
import { Coins } from 'lucide-react';

const registerSchema = z.object({
  nickname: z.string().min(3, { message: "Никнейм должен быть не менее 3 символов." }).max(20, { message: "Никнейм должен быть не более 20 символов." }),
  email: z.string().email({ message: "Некорректный email." }),
  password: z.string().min(6, { message: "Пароль должен быть не менее 6 символов." }),
  confirmPassword: z.string().min(6, { message: "Подтверждение пароля должно быть не менее 6 символов." }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Пароли не совпадают.",
  path: ["confirmPassword"], // a path to the field that will be blamed
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { register, currentUser, loading } = useAuth();
  const { toast } = useToast();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      nickname: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (!loading && currentUser) {
      router.push('/');
    }
  }, [currentUser, loading, router]);

  const onSubmit = async (data: RegisterFormValues) => {
    const result = await register(data.email, data.password, data.nickname);
    if ('code' in result) { // AuthError
      const firebaseError = result as AuthError;
      let errorMessage = "Ошибка регистрации. Пожалуйста, попробуйте еще раз.";
      if (firebaseError.code === 'auth/email-already-in-use') {
        errorMessage = "Этот email уже зарегистрирован.";
      } else if (firebaseError.code === 'auth/invalid-email') {
        errorMessage = "Некорректный формат email.";
      } else if (firebaseError.code === 'auth/weak-password') {
        errorMessage = "Пароль слишком слабый.";
      }
      toast({
        variant: "destructive",
        title: "Ошибка регистрации",
        description: errorMessage,
      });
    } else { // User
      toast({
        title: "Регистрация успешна!",
        description: "Добро пожаловать в UZS!",
      });
      router.push('/');
    }
  };

  if (loading) {
     return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-gradient-to-br from-background to-indigo-900/50">
        <Coins className="w-16 h-16 animate-spin text-primary" />
         <p className="mt-4 text-lg text-foreground">Загрузка...</p>
      </div>
    );
  }

  if (!loading && currentUser) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-indigo-900/50 p-4">
      <Card className="w-full max-w-md bg-card/80 border-border/50 shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex items-center justify-center">
             <Coins className="w-12 h-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">Регистрация в UZS</CardTitle>
          <CardDescription className="text-muted-foreground">Создайте аккаунт, чтобы начать играть.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="nickname"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Никнейм</FormLabel>
                    <FormControl>
                      <Input placeholder="Ваш ник" {...field} className="bg-input/80 border-border text-foreground placeholder:text-muted-foreground" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Email</FormLabel>
                    <FormControl>
                      <Input placeholder="you@example.com" {...field} className="bg-input/80 border-border text-foreground placeholder:text-muted-foreground" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Пароль</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} className="bg-input/80 border-border text-foreground placeholder:text-muted-foreground" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Подтвердите пароль</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} className="bg-input/80 border-border text-foreground placeholder:text-muted-foreground" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground pt-2" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Регистрация..." : "Зарегистрироваться"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col items-center text-center">
          <p className="text-sm text-muted-foreground">
            Уже есть аккаунт?{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Войти
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
