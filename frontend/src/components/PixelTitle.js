import React from 'react';
import { Text } from 'react-native';

export default function PixelTitle({ children, size = 36, style }) {
  const line = Math.max(size + 8, size * 1.25);
  return (
    <Text
      style={[{ fontFamily: 'DungGeunMo', fontSize: size, lineHeight: line, paddingBottom: 2, textAlign: 'center', includeFontPadding: true }, style]}
      numberOfLines={1}
      adjustsFontSizeToFit
    >
      {children}
    </Text>
  );
}
