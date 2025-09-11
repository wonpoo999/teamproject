import { registerRootComponent } from 'expo';
import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import RootNavigator from './src/navigation/RootNavigator';
import AuthProvider from './src/context/AuthContext';
import { I18nProvider, useI18n } from './src/i18n/I18nContext';
import { ThemeProvider, useThemeMode } from './src/theme/ThemeContext';
import { fontForLang } from './src/components/fonts';
import ThemeToggle from './src/components/ThemeToggle';  // ✅ 전역 고정

function applyGlobalFontWithLang(fontFamily, lang) {
  if (!Text.defaultProps) Text.defaultProps = {};
  Text.defaultProps.includeFontPadding = true;
  const ZH_FIX = { padTop: 1, padBottom: 3, extraLine: 6 };
  if (!Text.__globalPatched) {
    const oldRender = Text.render;
    Text.render = function (...args) {
      const origin = oldRender.call(this, ...args);
      const s = Array.isArray(origin.props.style) ? Object.assign({}, ...origin.props.style) : (origin.props.style || {});
      const fs = Number(s.fontSize || 16);
      const curLang = Text.__currentLang || 'ko';
      const zhAdjust = curLang === 'zh' ? {
        paddingTop: (s.paddingTop ?? 0) + ZH_FIX.padTop,
        paddingBottom: (s.paddingBottom ?? 0) + ZH_FIX.padBottom,
        lineHeight: Math.max(Number(s.lineHeight || 0), fs + ZH_FIX.extraLine),
      } : null;
      const mergedStyle = [origin.props.style, { fontFamily: Text.__currentFont, includeFontPadding: true }, zhAdjust];
      return React.cloneElement(origin, { style: mergedStyle });
    };
    Text.__globalPatched = true;
  }
  Text.__currentFont = fontFamily; Text.__currentLang = lang;
}

function Loading() {
  return (<View style={styles.loading}><ActivityIndicator size="large" /></View>);
}

function AppShell() {
  const { isDark } = useThemeMode();
  return (
    <View style={{ flex: 1 }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
      {/* ✅ 모든 화면에 고정(중복 금지) */}
      <ThemeToggle />
    </View>
  );
}

function FontApplier() {
  const { lang } = useI18n();
  useEffect(() => { applyGlobalFontWithLang(fontForLang(lang), lang); }, [lang]);
  return null;
}

export default function App() {
  const [fontsLoaded] = useFonts({
    DungGeunMo: require('./assets/fonts/DungGeunMo.otf'),
    Zpix: require('./assets/fonts/zpix.ttf'),
    PixelMplus12: require('./assets/fonts/PixelMplus12-Regular.ttf'),
  });

  useEffect(() => { if (fontsLoaded) applyGlobalFontWithLang('DungGeunMo', 'ko'); }, [fontsLoaded]);

  if (!fontsLoaded) return <Loading />;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <I18nProvider>
          <FontApplier />
          <AuthProvider>
            <AppShell />
          </AuthProvider>
        </I18nProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({ loading:{ flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'#000' } });
registerRootComponent(App);
