// src/components/CoinBadge.jsx
import React, { useEffect, useState } from 'react';
import { View, Text, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const FONT = 'DungGeunMo';

export default function CoinBadge({ align = 'left', top = 6, offset = 0, showDelta = true }) {
  const insets = useSafeAreaInsets();
  const [coins, setCoins] = useState(0);
  const [today, setToday] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        // 호환: @att/coins(정식) + @coins(구버전) 합산
        const [a, b, tc] = await Promise.all([
          AsyncStorage.getItem('@att/coins'),
          AsyncStorage.getItem('@coins'),
          AsyncStorage.getItem('@att/todayCoins'),
        ]);
        const sum = Number(a || 0) + Number(b || 0);
        setCoins(Number.isFinite(sum) ? sum : 0);
        setToday(Number(tc || 0));
      } catch {}
    })();
  }, []);

  return (
    <View
      style={{
        position: 'absolute',
        top: insets.top + top + offset,
        ...(align === 'right' ? { right: 12 } : { left: 12 }),
        zIndex: 90,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(17,24,39,0.9)',
        paddingHorizontal: 12,
        height: 40, // ▶︎ ThemeToggle 과 동일 높이
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
      }}
      pointerEvents="box-none"
    >
      <Image
        source={require('../../assets/ui/coin.png')}
        style={{ width: 16, height: 16, marginRight: 6, resizeMode: 'contain' }}
      />
      <Text style={{ color: '#fff', fontFamily: FONT, fontSize: 16, lineHeight: 16, includeFontPadding: true }}>
        {String(coins)}{showDelta && today > 0 ? ` (+${today})` : ''}
      </Text>
    </View>
  );
}
