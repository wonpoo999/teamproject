import { registerRootComponent } from 'expo';
import React, { useEffect } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';

import RootNavigator from './src/navigation/RootNavigator';
import AuthProvider from './src/context/AuthContext';
import { I18nProvider, useI18n } from './src/i18n/I18nContext';
import { ThemeProvider, useThemeMode } from './src/theme/ThemeContext';
import { fontForLang } from './src/components/fonts';

function applyGlobalFont(fontFamily) {
  if (Text.__globalFontPatched) {
    Text.__lastFontFamily = fontFamily;
    return;
  }
  const oldRender = Text.render;
  Text.render = function (...args) {
    const origin = oldRender.call(this, ...args);
    const mergedStyle = [origin.props.style, { fontFamily, includeFontPadding: true }];
    return React.cloneElement(origin, { style: mergedStyle });
  };
  Text.__globalFontPatched = true;
  Text.__lastFontFamily = fontFamily;
}

function Loading() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" />
    </View>
  );
}

function AppShell() {
  const { isDark } = useThemeMode();
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </>
  );
}

function FontApplier() {
  const { lang } = useI18n();
  useEffect(() => {
    applyGlobalFont(fontForLang(lang));
  }, [lang]);
  return null;
}

export default function App() {
  const [fontsLoaded] = useFonts({
    DungGeunMo: require('./assets/fonts/DungGeunMo.otf'),
    NotoJP: require('./assets/fonts/NotoSansJP-VariableFont_wght.ttf'),
    NotoTC: require('./assets/fonts/NotoSansTC-VariableFont_wght.ttf'), // ⬅️ 실제 파일명과 일치
  });

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

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
});

registerRootComponent(App);
