// src/screens/CoinStoreScreen.js — 최종본 (레트로 아이템 아트 + 코인 결제)
import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, ScrollView, ImageBackground, Pressable, Alert, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useI18n } from '../i18n/I18nContext';
import { useThemeMode } from '../theme/ThemeContext';
import { getStatus, spendCoins } from '../utils/attendance';

const FONT = 'DungGeunMo';
const COIN_KRW = 250;

const BG_LIGHT = require('../../assets/background/home.png');
const BG_DARK  = require('../../assets/background/home_dark.png');

const CAT = {
  coupang:  { title: '쿠팡 이츠', emoji: '🍔' },
  nexon:    { title: '넥슨 게임머니', emoji: '🎮' },
  dept:     { title: 'NC백화점 상품권', emoji: '🛍️' },
  cashback: { title: '캐시백', emoji: '💸' },
};

const RAW = {
  coupang:  [{ name: '음식 할인 3,000원',  krw: 3000 }, { name: '음식 할인 10,000원', krw: 10000 }],
  nexon:    [{ name: '게임머니 5,000원',   krw: 5000 }, { name: '게임머니 10,000원', krw: 10000 }, { name: '게임머니 20,000원', krw: 20000 }],
  dept:     [{ name: '상품권 10,000원',   krw: 10000 }, { name: '상품권 30,000원',   krw: 30000 }],
  cashback: [{ name: '캐시백 5,000원',    krw: 5000 },  { name: '캐시백 20,000원',  krw: 20000 }],
};

const toCoins = (krw) => Math.ceil(Number(krw) / COIN_KRW);

function RetroArt({ emoji }) {
  // 레트로 타일: 픽셀 보더 + 그라디언트 + 이모지
  return (
    <View style={{ height: 84, borderRadius: 12, overflow: 'hidden' }}>
      <View style={{ position:'absolute', inset:0, backgroundColor:'#0b1220' }} />
      <View style={{
        position:'absolute', inset:1, borderRadius: 11, overflow:'hidden',
        backgroundColor: '#111827'
      }}>
        <View style={{
          position:'absolute', inset:0,
          opacity:0.95,
          backgroundColor:'#111827'
        }}/>
        <View style={{
          position:'absolute', left:-20, top:-20, width:160, height:160,
          borderRadius:80, backgroundColor:'rgba(34,197,94,0.18)'
        }}/>
        <View style={{
          position:'absolute', right:-10, bottom:-10, width:120, height:120,
          borderRadius:60, backgroundColor:'rgba(59,130,246,0.18)'
        }}/>
      </View>
      <View style={{ flex:1, alignItems:'center', justifyContent:'center' }}>
        <Text style={{ fontSize: 38, textAlign:'center' }}>{emoji}</Text>
      </View>
    </View>
  );
}

export default function CoinStoreScreen() {
  const insets = useSafeAreaInsets();
  const { isDark, theme } = useThemeMode();
  const { t } = useI18n();

  const [coins, setCoins] = useState(0);
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    (async () => {
      try { const st = await getStatus(); setCoins(Number(st.coins || 0)); } catch {}
    })();
  }, []);

  const BG = isDark ? BG_DARK : BG_LIGHT;

  const data = useMemo(() => Object.keys(RAW).map(key => ({
    key,
    title: CAT[key].title,
    emoji: CAT[key].emoji,
    items: RAW[key].map(it => ({ ...it, coin: toCoins(it.krw) })),
  })), []);

  const buy = async (it) => {
    if (coins < it.coin) return Alert.alert('코인 부족', `필요 코인: ${it.coin}개`);
    const ok = await spendCoins(it.coin);
    if (!ok) return Alert.alert('코인 부족', '잔액이 부족합니다.');
    setCoins(c => c - it.coin);
    setReceipt({ item: it.name, coin: it.coin, code: `V-${Date.now().toString().slice(-8)}` });
  };

  const Card = ({ children, onPress }) => (
    <Pressable
      onPress={onPress}
      style={{
        width: '48%', backgroundColor: theme.cardBg, borderColor: theme.cardBorder, borderWidth: 1,
        borderRadius: 16, padding: 12, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6,
      }}
    >
      {children}
    </Pressable>
  );

  return (
    <ImageBackground source={BG} style={{ flex: 1 }} resizeMode="cover">
      <Text style={{ position:'absolute', left:0, right:0, top: insets.top + 8, textAlign:'center', fontFamily: FONT, fontSize: 26, color: theme.text }}>
        {t('STORE') || 'Store'}
      </Text>

      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 70, paddingBottom: insets.bottom + 120, paddingHorizontal: 16 }}>
        {/* 잔액 배지 */}
        <View style={{
          alignSelf:'flex-start', backgroundColor:'rgba(17,24,39,0.9)', borderRadius:18, paddingHorizontal:12, height:36,
          flexDirection:'row', alignItems:'center', gap:6, borderWidth:1, borderColor:'rgba(255,255,255,0.2)', marginBottom:12
        }}>
          <Text style={{ fontFamily: FONT, color:'#ffd369' }}>🪙</Text>
          <Text style={{ fontFamily: FONT, color:'#fff' }}>{coins}</Text>
        </View>

        {data.map((cat) => (
          <View key={cat.key} style={{ marginBottom: 18 }}>
            <Text style={{ fontFamily: FONT, color: theme.text, fontSize: 18, marginBottom: 8 }}>{cat.title}</Text>
            <View style={{ flexDirection:'row', flexWrap:'wrap', justifyContent:'space-between' }}>
              {cat.items.map((it) => (
                <Card key={it.name} onPress={() => buy(it)}>
                  <RetroArt emoji={cat.emoji} />
                  <Text style={{ fontFamily: FONT, color: theme.text, marginTop: 10, marginBottom: 6 }}>{it.name}</Text>
                  <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between' }}>
                    <Text style={{ fontFamily: FONT, color: theme.mutedText }}>{it.krw.toLocaleString()}원</Text>
                    <Text style={{ fontFamily: FONT, color: '#fbbf24' }}>🪙 {it.coin}</Text>
                  </View>
                </Card>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* 영수증 */}
      <Modal visible={!!receipt} transparent animationType="fade" onRequestClose={() => setReceipt(null)}>
        <View style={{ flex:1, backgroundColor:'rgba(0,0,0,0.6)', alignItems:'center', justifyContent:'center', padding:16 }}>
          <View style={{ width:'100%', borderRadius:16, backgroundColor: theme.cardBg, borderColor: theme.cardBorder, borderWidth:1, padding:16, gap:10 }}>
            <Text style={{ fontFamily: FONT, color: theme.text, fontSize: 18 }}>구매 완료</Text>
            <Text style={{ fontFamily: FONT, color: theme.text }}>상품: {receipt?.item}</Text>
            <Text style={{ fontFamily: FONT, color: theme.text }}>결제 코인: {receipt?.coin}</Text>
            <Text style={{ fontFamily: FONT, color: '#22c55e' }}>바우처 코드: {receipt?.code}</Text>
            <Pressable onPress={() => setReceipt(null)} style={{ backgroundColor: theme.primary, padding:12, borderRadius:10, alignItems:'center' }}>
              <Text style={{ color:'#fff', fontFamily: FONT }}>확인</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
}
