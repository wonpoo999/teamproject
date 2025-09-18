// src/bgm/BgmFab.js
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBgm } from './BgmContext';

export default function BgmFab({ align = 'right' }) {
  const { enabled, setEnabled, volume, setVolume } = useBgm();
  const insets = useSafeAreaInsets();
  const onToggle = () => setEnabled(!enabled);

  return (
    <View
      style={{
        position: 'absolute',
        top: insets.top + 10,
        [align]: 12,
        zIndex: 99,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
      }}
      pointerEvents="box-none"
    >
      <Pressable
        onPress={onToggle}
        style={{
          width: 44, height: 44, borderRadius: 22,
          backgroundColor: enabled ? 'rgba(16,185,129,0.9)' : 'rgba(55,65,81,0.9)',
          alignItems: 'center', justifyContent: 'center',
          borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
        }}
        hitSlop={10}
      >
        <Text style={{ color: '#fff', fontSize: 18 }}>{enabled ? '🔊' : '🔇'}</Text>
      </Pressable>
    </View>
  );
}
