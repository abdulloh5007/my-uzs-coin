'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Lightbulb } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getDailyTip } from '@/ai/flows/daily-tip-flow';

const getCurrentDateString = () => {
  const today = new Date();
  return today.toISOString().split('T')[0]; // YYYY-MM-DD
};

const DailyTip: React.FC = () => {
  const [tip, setTip] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchOrLoadTip = async () => {
      const todayStr = getCurrentDateString();
      const storedTipData = localStorage.getItem('dailyGameTip');
      let lastFetchedDate: string | null = null;
      let todaysTipFromStorage: string | null = null;

      if (storedTipData) {
        try {
          const parsedData = JSON.parse(storedTipData);
          lastFetchedDate = parsedData.date;
          todaysTipFromStorage = parsedData.tip;
        } catch (e) {
          console.error("Failed to parse stored daily tip:", e);
          localStorage.removeItem('dailyGameTip'); // Clear corrupted data
        }
      }

      if (lastFetchedDate === todayStr && todaysTipFromStorage) {
        setTip(todaysTipFromStorage);
        setIsLoading(false);
      } else {
        setIsLoading(true);
        try {
          const result = await getDailyTip();
          if (result && result.tip) {
            setTip(result.tip);
            localStorage.setItem('dailyGameTip', JSON.stringify({ date: todayStr, tip: result.tip }));
          } else {
            setTip("Не удалось получить совет сегодня. Попробуйте позже!"); // Fallback message
          }
        } catch (error) {
          console.error("Error fetching daily tip:", error);
          setTip("Ой! Что-то пошло не так при получении ежедневного совета."); // Error message
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchOrLoadTip();
  }, []);

  return (
    <Card className="mt-4 mb-2 mx-auto w-full max-w-md bg-card/70 border-border/40 shadow-sm">
      <CardContent className="p-3">
        <div className="flex items-center">
          <Lightbulb className="w-5 h-5 mr-3 text-primary shrink-0" />
          {isLoading ? (
            <div className="space-y-1.5 flex-grow">
              <Skeleton className="h-3 w-10/12" />
              <Skeleton className="h-3 w-8/12" />
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">{tip || "Сегодня нет советов."}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DailyTip;
