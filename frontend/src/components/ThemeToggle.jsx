// src/components/ThemeToggle.jsx
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeMode } from '../theme/ThemeContext';

const FONT = 'DungGeunMo';

/** 화면 우상단 이모지 토글 (라벨 없음) */
export default function ThemeToggle({ align = 'right', topOffset = 8 }) {
  const { isDark, toggle } = useThemeMode();
  const insets = useSafeAreaInsets();
  const icon = isDark ? '☀️' : '🌙';

  return (
    <View
      style={{
        position: 'absolute',
        top: insets.top + topOffset,
        ...(align === 'right' ? { right: 12 } : { left: 12 }),
        zIndex: 999,
      }}
      pointerEvents="box-none"
    >
      <Pressable
        onPress={toggle}
        hitSlop={8}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 14,
          height: 40,
          borderRadius: 18,
          backgroundColor: 'rgba(17,24,39,0.9)',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.18)',
        }}
      >
        <Text style={{ fontFamily: FONT, color: '#fff', fontSize: 18 }}>{icon}</Text>
      </Pressable>
    </View>
  );
}
