import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format, subDays } from 'date-fns';
import type { Entry } from '../lib/firebase-client';
import { Timestamp } from 'firebase/firestore';

type MoodGraphProps = {
  entries: Entry[];
  days?: number;
};

const MOOD_VALUES = {
  'mood:joyful': { value: 5, color: '#FFD93D' },
  'mood:calm': { value: 4, color: '#6DD3CE' },
  'mood:anxious': { value: 3, color: '#F4A261' },
  'mood:sad': { value: 2, color: '#4A4E69' },
  'mood:angry': { value: 1, color: '#D7263D' },
};

// Helper function to convert Firebase Timestamp to Date
const toDate = (timestamp: Timestamp | string): Date => {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  return new Date(timestamp);
};

export function MoodGraph({ entries, days = 10 }: MoodGraphProps) {
  // Process entries to get mood data points
  const moodData = React.useMemo(() => {
    const today = new Date();
    const dateRange = Array.from({ length: days }, (_, i) => {
      const date = subDays(today, days - 1 - i); // Count backwards to show most recent on right
      return format(date, 'MMM d');
    });

    const moodsByDate = new Map<string, { values: number[]; color: string }>();
    
    // Initialize all dates with empty arrays
    dateRange.forEach(date => {
      moodsByDate.set(date, { values: [], color: '' });
    });
    
    // Group mood values by date
    entries.forEach(entry => {
      const date = format(toDate(entry.created_at), 'MMM d');
      const moodTag = entry.tags.find(tag => tag.startsWith('mood:'));
      if (moodTag && MOOD_VALUES[moodTag as keyof typeof MOOD_VALUES]) {
        const { value, color } = MOOD_VALUES[moodTag as keyof typeof MOOD_VALUES];
        const existing = moodsByDate.get(date) || { values: [], color };
        moodsByDate.set(date, {
          values: [...existing.values, value],
          color: color // Use the last mood's color for the dot
        });
      }
    });

    // Calculate average mood for each date
    return dateRange.map(date => {
      const data = moodsByDate.get(date);
      if (!data || data.values.length === 0) {
        return { date, mood: null, color: null };
      }
      return {
        date,
        mood: data.values.reduce((sum, val) => sum + val, 0) / data.values.length,
        color: data.color
      };
    });
  }, [entries, days]);

  return (
    <div className="w-full h-32 mb-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={moodData} margin={{ top: 10, right: 5, bottom: 5, left: -20 }}>
          <XAxis
            dataKey="date"
            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            tickLine={false}
          />
          <YAxis
            domain={[0.75, 5.25]}
            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            tickLine={false}
            width={25}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(26,26,26,0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              padding: '8px'
            }}
            labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
            itemStyle={{ color: '#2d9edb' }}
            formatter={(value: number) => [
              ['Angry', 'Sad', 'Anxious', 'Calm', 'Joyful'][Math.round(value) - 1],
              ''
            ]}
          />
          {/* Add reference line at 3.0 */}
          <ReferenceLine
            y={3.0}
            stroke="rgba(255,255,255,0.25)"
            strokeDasharray="3 3"
            strokeWidth={1}
          />
          <Line
            type="monotone"
            dataKey="mood"
            stroke="#2d9edb"
            strokeWidth={2}
            connectNulls={true}
            dot={(props) => {
              const { cx, cy, payload } = props;
              if (!payload.mood) return null;
              return (
                <circle
                  cx={cx}
                  cy={cy}
                  r={3}
                  fill={payload.color}
                  stroke="#1a1a1a"
                  strokeWidth={1}
                />
              );
            }}
            activeDot={{ r: 4, fill: '#2d9edb' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}