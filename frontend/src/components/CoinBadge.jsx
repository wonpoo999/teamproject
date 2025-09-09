// [ADDED] 홈 상단용 코인 뱃지 (HomeScreen에 배치)
import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { getStatus } from '../utils/attendance';

export default function CoinBadge() {
  const [coins, setCoins] = useState(0);
  useEffect(() => { getStatus().then(s => setCoins(s.coins||0)); }, []);
  return (
    <View style={{ position:'absolute', right:16, top:16, backgroundColor:'rgba(0,0,0,0.55)', borderRadius:999, paddingHorizontal:12, paddingVertical:8 }}>
      <Text style={{ color:'#ffd166', fontWeight:'900' }}>🪙 {coins}</Text>
    </View>
  );
}
