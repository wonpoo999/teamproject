// src/components/AttendanceCalendar.js
// 설치: npx expo install react-native-calendars
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useThemeMode } from '../theme/ThemeContext';

const FONT = 'DungGeunMo';

export default function AttendanceCalendar({ dates = [], onMonthChange }) {
  const { theme, isDark } = useThemeMode();

  const marked = useMemo(() => {
    const m = {};
    dates.forEach((d) => {
      m[d] = {
        selected: true,
        selectedColor: '#ef4444',
        selectedTextColor: '#ffffff',
      };
    });
    return m;
  }, [dates]);

  const today = new Date();
  const initial = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

  return (
    <View style={{ borderRadius: 12, overflow: 'hidden' }}>
      <Calendar
        theme={{
          backgroundColor: 'transparent',
          calendarBackground: 'transparent',
          textSectionTitleColor: theme.mutedText,
          monthTextColor: theme.text,
          dayTextColor: theme.text,
          todayTextColor: '#f59e0b',
          arrowColor: isDark ? '#fff' : '#111',
          textDayFontFamily: FONT,
          textMonthFontFamily: FONT,
          textDayHeaderFontFamily: FONT,
        }}
        firstDay={1}
        markedDates={marked}
        onMonthChange={onMonthChange}
        initialDate={`${initial}-01`}
        enableSwipeMonths
      />
    </View>
  );
}
