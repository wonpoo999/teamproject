import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { useThemeMode } from '../theme/ThemeContext';

export default function ThemeToggleChip() {
  const { toggleTheme, isDark, theme } = useThemeMode();

  return (
    <TouchableOpacity
      onPress={toggleTheme}
      style={{
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.cardBorder,
        backgroundColor: theme.cardBg,
      }}
    >
      <Text style={{ fontFamily: 'DungGeunMo', color: theme.text }}>
        {isDark ? 'Light' : 'Dark'}
      </Text>
    </TouchableOpacity>
  );
}
