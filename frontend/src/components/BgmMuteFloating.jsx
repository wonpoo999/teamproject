// src/components/BgmMuteFloating.jsx
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBgm } from '../bgm/BgmContext';

export default function BgmMuteFloating() {
  const { enabled, setEnabled } = useBgm();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ position:'absolute', right: 16, top: insets.top + 8 }}>
      <Pressable
        onPress={() => setEnabled(!enabled)}
        style={{ backgroundColor:'#111827', paddingVertical:8, paddingHorizontal:12, borderRadius:12, opacity:0.9 }}
      >
        <Text style={{ color:'#fff', fontFamily:'DungGeunMo' }}>{enabled ? 'BGM ON' : 'BGM OFF'}</Text>
      </Pressable>
    </View>
  );
}
