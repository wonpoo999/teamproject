// src/components/DarkModeButton.jsx
import React from 'react';
import { Pressable, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeMode } from '../theme/ThemeContext';

const FONT = 'DungGeunMo';

export default function DarkModeButton() {
  const { isDark, toggleTheme, colors } = useThemeMode();
  const insets = useSafeAreaInsets();
  return (
    <Pressable
      onPress={(e) => { e.stopPropagation(); toggleTheme(); }} // 뒤로가기 제스처/버블 차단
      hitSlop={10}
      style={{
        position: 'absolute',
        top: insets.top + 6,
        right: 12,
        zIndex: 99,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        backgroundColor: colors.cardBg,
      }}
    >
      <Text style={{ fontFamily: FONT, color: colors.text }}>
        {isDark ? 'Light' : 'Dark'}
      </Text>
    </Pressable>
  );
}
