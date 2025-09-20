import React, { useMemo } from 'react';
import { format, subDays } from 'date-fns';
import type { Entry } from '../lib/firebase-client';
import { SmilePlus, Smile, Meh, Frown, Frown as FrownPlus } from 'lucide-react';
import { MoodGraph } from './MoodGraph';

// Define the mood values and icons
const MOOD_CONFIG = {
  joyful: { value: 5, icon: SmilePlus, color: 'text-[#FFD93D]', label: 'Joyful' },
  calm: { value: 4, icon: Smile, color: 'text-[#6DD3CE]', label: 'Calm' },
  anxious: { value: 3, icon: Meh, color: 'text-[#F4A261]', label: 'Anxious' },
  sad: { value: 2, icon: Frown, color: 'text-[#4A4E69]', label: 'Sad' },
  angry: { value: 1, icon: FrownPlus, color: 'text-[#D7263D]', label: 'Angry' }
} as const;

type MoodName = keyof typeof MOOD_CONFIG;

type DayEntry = {
  date: string;
  entries: Entry[];
};

export function MoodTracking({ entries }: { entries: Entry[] }) {
  // Filter entries to only include those with mood tags and within last 10 days
  const moodEntries = useMemo(() => {
    const tenDaysAgo = subDays(new Date(), 9).setHours(0, 0, 0, 0);
    return entries.filter(entry => {
      const entryDate = new Date(entry.created_at).getTime();
      return entryDate >= tenDaysAgo && entry.tags?.some(tag => tag.startsWith('mood:'));
    });
  }, [entries]);

  const moodData = useMemo(() => {
    const today = new Date();
    const dateRange = Array.from({ length: 10 }, (_, i) => {
      const date = subDays(today, i); // Start from today and go backwards
      return format(date, 'yyyy-MM-dd');
    });

    return dateRange.map(date => {
      const dayEntries = entries.filter(entry => {
        const entryDate = format(new Date(entry.created_at), 'yyyy-MM-dd');
        return entryDate === date && entry.tags?.some(tag => tag.startsWith('mood:'));
      }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return { date, entries: dayEntries };
    });
  }, [entries]);

  const getMoodFromEntry = (entry: Entry): MoodName | null => {
    const moodTag = entry.tags?.find(tag => tag.startsWith('mood:'));
    if (!moodTag) return null;
    return moodTag.split(':')[1] as MoodName;
  };

  return (
    <div className="space-y-1">
      <MoodGraph entries={moodEntries} days={10} />
      
      <div className="space-y-1">
        {moodData.map((day: DayEntry) => (
          <div 
            key={day.date}
            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg ${
              day.entries.length > 0 ? 'bg-white/5' : 'bg-white/5 opacity-50'
            }`}
          >
            <span className="text-xs font-medium text-white/60 w-20 shrink-0">
              {format(new Date(day.date), 'EEE, MMM d')}
            </span>
            
            {day.entries.length > 0 ? (
              <div className="flex items-center gap-2 overflow-x-auto flex-1">
                {day.entries.map((entry, index) => {
                  const mood = getMoodFromEntry(entry);
                  const moodConfig = mood ? MOOD_CONFIG[mood] : null;
                  const Icon = moodConfig?.icon;
                  
                  return (
                    <div key={index} className="flex items-center gap-1.5 shrink-0">
                      {index > 0 && <span className="text-white/20">•</span>}
                      <div className={`p-1 rounded-lg ${moodConfig ? `bg-${moodConfig.color.split('-')[1]}/20` : 'bg-white/10'}`}>
                        {Icon && <Icon size={14} className={moodConfig.color} />}
                      </div>
                      <span className="text-xs text-white/60">
                        {format(new Date(entry.created_at), 'h:mm a')}
                      </span>
                      <span className="text-xs text-white/80 max-w-[200px] truncate">
                        {entry.content.split('\n')[0]}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <span className="text-xs text-white/40">
                No mood entries
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}