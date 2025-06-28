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

      // This function is called when a new service worker has finished installing
      // and is waiting to take control. This is the perfect time to prompt the user.
      const onSWWaiting = () => {
        toast({
          title: (
            <div className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-primary" />
              <span>Доступно обновление!</span>
            </div>
          ),
          description: "Новая версия приложения загружена. Обновите, чтобы применить изменения.",
          duration: Infinity, // Keep the toast open until the user acts
          action: (
            <ToastAction
              altText="Обновить"
              onClick={() => {
                // When the user clicks "Update", tell the new service worker to take over.
                wb.messageSkipWaiting();
              }}
            >
              Обновить
            </ToastAction>
          ) as ToastActionElement,
        });
      };
      
      // This function is called when the new service worker has taken control.
      // We reload the page to ensure all assets are from the new version.
      const onSWActivated = () => {
         window.location.reload();
      };

      // Add event listeners for the waiting and controlling states.
      wb.addEventListener('waiting', onSWWaiting);
      wb.addEventListener('controlling', onSWActivated);
      
      // Proactively check for updates when the user returns to the tab.
      const handleVisibilityChange = () => {
          if (document.visibilityState === 'visible') {
              wb.update();
          }
      };
      document.addEventListener("visibilitychange", handleVisibilityChange);

      // Check if a new service worker is already waiting on page load.
      // This handles the case where a new version was deployed while the user was away.
      wb.getSW().then(sw => {
        if (sw?.waiting) {
          onSWWaiting();
        }
      });

      // Cleanup listeners when the component unmounts.
      return () => {
         wb.removeEventListener('waiting', onSWWaiting);
         wb.removeEventListener('controlling', onSWActivated);
         document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [toast]);

  return null;
}
