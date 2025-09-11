import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ImageBackground, StyleSheet, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeMode } from '../theme/ThemeContext';
import { useI18n } from '../i18n/I18nContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';

const FONT = 'DungGeunMo';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { isDark, theme } = useThemeMode();
  const { t, setLang, lang } = useI18n();
  const navigation = useNavigation();
  const { logout } = useAuth();

  const bg = isDark ? require('../../assets/background/home_dark.png') : require('../../assets/background/home.png');
  const topTitle = insets.top + 8;
  const contentTop = insets.top + 100;

  const [sfx, setSfx] = useState(true);
  useEffect(()=>{ (async()=>{ const v = await AsyncStorage.getItem('@sfx/on'); if (v != null) setSfx(v==='1'); })(); },[]);
  const onSfx = async (v)=>{ setSfx(v); try{ await AsyncStorage.setItem('@sfx/on', v?'1':'0'); }catch{} };

  const onLogout = async () => { try { await AsyncStorage.multiRemove(['@token','@coins']); } catch {} await logout(); };

  return (
    <ImageBackground source={bg} style={{ flex: 1 }} resizeMode="cover">
      <Text style={[styles.screenTitle, { top: topTitle, color: isDark ? '#fff' : '#000' }]}>{t('SETTINGS') || 'SETTING'}</Text>

      <View style={[styles.wrap, { paddingTop: contentTop }]}>
        <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('LANGUAGE')}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[{k:'ko',label:'KOREAN'},{k:'en',label:'English'},{k:'ja',label:'JAPANESE'},{k:'zh',label:'CHINESE'}].map(it=>{
              const on = lang===it.k;
              return (
                <Pressable key={it.k} onPress={()=>setLang(it.k)} style={{
                  paddingHorizontal:12, height:40, borderRadius:12, borderWidth:1,
                  borderColor:on?theme.inputBorder:theme.cardBorder, backgroundColor:on?theme.chipOn:theme.chipOff,
                  alignItems:'center', justifyContent:'center'
                }}>
                  <Text style={{ fontFamily:FONT, color:on?theme.chipOnText:theme.chipOffText }}>{it.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 18, color: theme.text }]}>{t('SFX')}</Text>
          <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between' }}>
            <Text style={{ fontFamily:FONT, color: theme.mutedText }}>{sfx ? 'ON' : 'OFF'}</Text>
            <Switch value={sfx} onValueChange={onSfx} />
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 18, color: theme.text }]}>{t('VOICE')}</Text>
          <Pressable onPress={() => navigation.navigate('VoicePicker')} style={[styles.voiceBtn, { backgroundColor: '#0f172a' }]}>
            <Text style={styles.voiceBtnText}>{t('VOICE_SELECT')}</Text>
          </Pressable>
          <Text style={[styles.voiceCurrent, { color: theme.mutedText }]}>{t('VOICE_CURRENT')}</Text>

          <Pressable onPress={onLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>{t('LOG_OUT')}</Text>
          </Pressable>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  wrap:{ flex:1, paddingHorizontal:16 },
  screenTitle:{ position:'absolute', left:0, right:0, textAlign:'center', fontFamily:FONT, fontSize:28, zIndex:10 },
  card:{ borderRadius:22, padding:18, gap:12, borderWidth:1 },
  sectionTitle:{ fontFamily:FONT, fontSize:18, lineHeight:24, paddingBottom:2 },
  voiceBtn:{ borderRadius:14, paddingVertical:16, paddingHorizontal:18 },
  voiceBtnText:{ fontFamily:FONT, color:'#fff', fontSize:18, lineHeight:22, paddingBottom:2 },
  voiceCurrent:{ fontFamily:FONT, opacity:0.85, marginTop:6 },
  logoutBtn:{ marginTop:22, backgroundColor:'#ef4444', borderRadius:16, paddingVertical:16, alignItems:'center' },
  logoutText:{ fontFamily:FONT, color:'#fff', fontSize:20, lineHeight:24, paddingBottom:2 },
});
