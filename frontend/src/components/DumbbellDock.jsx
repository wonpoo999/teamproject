import React from 'react';
import { View, Image, Text, Pressable } from 'react-native';
import { useI18n } from '../i18n/I18nContext';
import { useThemeMode } from '../theme/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

const FONT = 'DungGeunMo';
const ICON = {
  profile:  require('../../assets/icons/profile.png'),
  quest:    require('../../assets/icons/quest.png'),
  ranking:  require('../../assets/icons/ranking.png'),
  setting:  require('../../assets/icons/setting.png'),
};

export default function DumbbellDock() {
  const { t } = useI18n();
  const { isDark } = useThemeMode();
  const nav = useNavigation();
  const insets = useSafeAreaInsets();

  const items = [
    { k: 'PROFILE', to: 'Profile', icon: ICON.profile },
    { k: 'QUEST', to: 'Quest',   icon: ICON.quest },   // 
    { k: 'RANKING', to: 'Ranking', icon: ICON.ranking },
    { k: 'SETTINGS',to: 'Settings',icon: ICON.setting },
  ];

  return (
    <View style={{
      position: 'absolute',
      left: 0, right: 0, bottom: insets.bottom + 10,
      flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end',
    }}>
      {items.map(it => (
        <Pressable key={it.k} onPress={() => nav.navigate(it.to)} style={{ alignItems: 'center', gap: 6 }}>
          <Image source={it.icon} style={{ width: 64, height: 48, resizeMode: 'contain', opacity: 0.92 }} />
          <Text style={{
            fontFamily: FONT, fontSize: 18,
            color: isDark ? '#e5e7eb' : '#111827',
            includeFontPadding: true, lineHeight: 20,
          }}>
            {t(it.k)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
