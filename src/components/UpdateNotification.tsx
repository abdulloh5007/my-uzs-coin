'use client';

import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from "@/components/ui/toast";
import type { ToastActionElement } from "@/components/ui/toast";
import { Rocket } from 'lucide-react';

export default function UpdateNotification() {
  const { toast } = useToast();

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      window.workbox !== undefined
    ) {
      const wb = window.workbox;

      const onSWActivated = () => {
         window.location.reload();
      };

      const onSWWaiting = () => {
        toast({
          title: (
            <div className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-primary" />
              <span>Доступно обновление!</span>
            </div>
          ),
          description: "Новая версия сайта загружена. Обновите, чтобы применить изменения.",
          duration: Infinity, 
          action: (
            <ToastAction
              altText="Обновить"
              onClick={() => {
                wb.messageSkipWaiting();
              }}
            >
              Обновить
            </ToastAction>
          ) as ToastActionElement,
        });
      };

      wb.addEventListener('controlling', onSWActivated);
      wb.addEventListener('waiting', onSWWaiting);
      
      wb.getSW().then(sw => {
        if (sw?.waiting) {
          onSWWaiting();
        }
      });

      return () => {
         wb.removeEventListener('controlling', onSWActivated);
         wb.removeEventListener('waiting', onSWWaiting);
      };
    }
  }, [toast]);

  return null;
}
