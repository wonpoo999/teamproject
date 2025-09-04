import React, { useMemo } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';

import RootNavigator from './src/navigation/RootNavigator';
import AuthProvider, { useAuth } from './src/context/AuthContext';

function applyGlobalFont(fontFamily) {
  if (Text.__globalFontPatched) return;
  const oldRender = Text.render;
  Text.render = function (...args) {
    const origin = oldRender.call(this, ...args);
    return React.cloneElement(origin, {
      style: [origin.props.style, { fontFamily }],
    });
  };
  Text.__globalFontPatched = true;
}

function Loading() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" />
    </View>
  );
}

function AppShell() {
  const { isAuthenticated } = useAuth();
  return (
    <NavigationContainer key={isAuthenticated ? 'nav-app' : 'nav-auth'}>
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    DungGeunMo: require('./assets/fonts/DungGeunMo.otf'),
  });


  useMemo(() => {
    if (fontsLoaded) applyGlobalFont('DungGeunMo');
  }, [fontsLoaded]);

  if (!fontsLoaded) return <Loading />;

  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor="#111827" />
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000',
  },
});
