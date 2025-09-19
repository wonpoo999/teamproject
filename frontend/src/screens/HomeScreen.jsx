// src/screens/HomeScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, ImageBackground, Pressable, Image, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeMode } from '../theme/ThemeContext';
import { useI18n } from '../i18n/I18nContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CharacterAvatar from '../components/CharacterAvatar';
import { checkInToday, getStatus } from '../utils/attendance';
import { useBgm } from '../bgm/BgmContext';

const FONT = 'DungGeunMo';
const BG_LIGHT = require('../../assets/background/home.png');
const BG_DARK  = require('../../assets/background/home_dark.png');

const ICONS = {
  profile: require('../../assets/icons/profile.png'),
  quest:   require('../../assets/icons/quest.png'),
  ranking: require('../../assets/icons/ranking.png'),
  setting: require('../../assets/icons/setting.png'),
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { isDark, theme } = useThemeMode();
  const { t } = useI18n();
  const nav = useNavigation();
  const BG = isDark ? BG_DARK : BG_LIGHT;
  const bgm = useBgm();

  const [kcal, setKcal] = useState(0);
  const [coins, setCoins] = useState(0);
  const TARGET = 500;

  useEffect(() => {
    (async () => {
      try { await checkInToday(); } catch {}
      const v = await AsyncStorage.getItem('@kcal/today').catch(() => '0');
      setKcal(Number(v || 0));
    })();
  }, []);

  useFocusEffect(React.useCallback(() => {
    if (bgm?.muted === true || bgm?.enabled === false) {
      bgm?.stop?.();
    } else {
      bgm?.applyRoute?.('Home');
    }
    (async () => {
      const st = await getStatus();
      setCoins(Number(st?.coins || 0));
    })();
    return () => {};
  }, [bgm]));

  const { height: H } = Dimensions.get('window');
  const topY = insets.top + 8;
  const TOOLBAR_H = 40;
  const TAB_ICON = 80;
  const AVATAR_SIZE = Math.max(170, Math.min(200, Math.floor(H * 0.26)));

  return (
    <ImageBackground source={BG} style={{ flex: 1 }} resizeMode="cover">
      <Text
        style={{
          position: 'absolute', left: 0, right: 0,
          top: topY, textAlign: 'center',
          fontFamily: FONT, fontSize: 26, lineHeight: 32,
          color: theme.text, textShadowColor: 'rgba(0,0,0,0.25)',
          textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2, zIndex: 5
        }}
      >
        {t('HOME') || 'Home'}
      </Text>

      <Pressable
        onPress={() => nav.navigate('CoinStore')}
        hitSlop={8}
        style={{
          position: 'absolute', top: topY, left: 12, zIndex: 90,
          backgroundColor: 'rgba(17,24,39,0.9)', borderRadius: 18, paddingHorizontal: 12, height: TOOLBAR_H,
          flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
        }}
      >
        <Text style={{ fontFamily: FONT, color: '#ffd369', fontSize: 16 }}>🪙</Text>
        <Text style={{ fontFamily: FONT, color: '#fff', fontSize: 16 }}>{coins}</Text>
      </Pressable>

      <View style={{
        marginTop: insets.top + 120,
        paddingHorizontal: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
        flexWrap: 'wrap',
      }}>
        <Pressable style={cardStyle} onPress={() => nav.navigate('DietLog')}>
          <Text style={cardTitle}>{t('HOME_MEAL') || 'Meal Log'}</Text>
        </Pressable>
        <Pressable style={cardStyle} onPress={() => nav.navigate('Data')}>
          <Text style={cardTitle}>{t('HOME_OVERALL') || 'Overall'}</Text>
        </Pressable>
        {/* Mini Game 버튼 */}
        <Pressable style={cardStyle} onPress={() => nav.navigate('HealthyCatch')}>
          <Text style={cardTitle}>{'Mini Game'}</Text>
        </Pressable>
      </View>

      <View style={{ marginTop: 18, paddingHorizontal: 24 }}>
        <View style={{
          height: 26, borderWidth: 2, borderRadius: 12, overflow: 'hidden',
          borderColor: isDark ? '#cbd5e1' : '#111827',
          backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
          justifyContent: 'center'
        }}>
          <View style={{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            width: `${Math.min(100, Math.max(0, (kcal / TARGET) * 100))}%`,
            backgroundColor: isDark ? 'rgba(34,197,94,0.9)' : 'rgba(34,197,94,0.85)'
          }}/>
          <Text style={{ fontFamily: FONT, textAlign: 'center', color: isDark ? '#e5e7eb' : '#111' }}>
            {`${Math.max(0, Math.min(TARGET, kcal))} / ${TARGET} kcal`}
          </Text>
        </View>
      </View>

      <View style={{
        position: 'absolute',
        left: 0, right: 0,
        bottom: insets.bottom + TAB_ICON + 16,
        alignItems: 'center'
      }}>
        <CharacterAvatar size={AVATAR_SIZE} />
      </View>

      <View style={{
        position: 'absolute', left: 0, right: 0, bottom: insets.bottom + 10,
        flexDirection: 'row', justifyContent: 'space-around'
      }}>
        {[
          { icon: ICONS.profile, label: t('PROFILE') || 'Profile', to: 'Profile' },
          { icon: ICONS.quest,   label: t('QUEST') || 'Quest',     to: 'Quest' },
          { icon: ICONS.ranking, label: t('RANKING') || 'Ranking', to: 'Ranking' },
          { icon: ICONS.setting, label: t('SETTINGS') || 'Settings', to: 'Settings' },
        ].map((it) => (
          <Pressable key={it.to} onPress={() => nav.navigate(it.to)} style={{ alignItems: 'center' }}>
            <Image source={it.icon} resizeMode="contain" style={{ width: TAB_ICON, height: TAB_ICON, marginBottom: 2 }} />
            <Text style={{
              fontFamily: FONT, fontSize: 16, color: '#ef4444',
              includeFontPadding: true, paddingTop: 1, paddingBottom: 1,
            }}>
              {it.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </ImageBackground>
  );
}

const cardStyle = {
  width: '44%',
  backgroundColor: 'rgba(255,255,255,0.86)',
  borderRadius: 22,
  paddingVertical: 16,
  alignItems: 'center',
};
const cardTitle = {
  fontFamily: FONT, fontSize: 22, color: '#111', includeFontPadding: true, paddingTop: 2, paddingBottom: 2,
};
