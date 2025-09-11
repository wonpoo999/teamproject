// src/navigation/RootNavigator.jsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View, TouchableOpacity, Text } from 'react-native';
import { useFonts } from 'expo-font';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import { useThemeMode } from '../theme/ThemeContext';

// Screens
import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import HomeScreen from '../screens/HomeScreen';
import CameraScreen from '../screens/CameraScreen';
import GoalScreen from '../screens/GoalScreen';
import SettingsScreen from '../screens/SettingsScreen';
import DietLogScreen from '../screens/DietLogScreen';
import DataScreen from '../screens/DataScreen';
import ProfileScreen from '../screens/ProfileScreen';
import QuestScreen from '../screens/QuestScreen';
import RankingScreen from '../screens/RankingScreen';
import HealthyCatchGameScreen from '../screens/HealthyCatchGameScreen';
import TACoach from '../screens/TACoach';
import VoicePickerScreen from '../screens/VoicePickerScreen';

import {
  RecoverySetupScreen,
  RecoveryFlowScreen,
  SecurityQnaManagerScreen,
} from '../screens/RecoveryScreens';

const Stack = createNativeStackNavigator();

/** 헤더 우측 다크/라이트 토글 (전역 단일) */
function HeaderThemeToggle() {
  const { toggleTheme, mode, theme } = useThemeMode();
  const { t } = useI18n();
  const label = mode === 'dark' ? (t('LIGHT') || 'LIGHT') : (t('DARK') || 'DARK');
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={toggleTheme}
      style={{
        paddingVertical: 6, paddingHorizontal: 14,
        borderRadius: 16, borderWidth: 1,
        borderColor: theme.inputBorder, backgroundColor: theme.ghostBg,
      }}
    >
      <Text style={{ fontFamily: 'DungGeunMo', color: theme.text }}>{label}</Text>
    </TouchableOpacity>
  );
}

const commonHeader = {
  headerShown: true,
  headerTitle: '',
  headerTransparent: true,
  headerShadowVisible: false,
  headerStyle: { backgroundColor: 'transparent' },
  headerTintColor: '#fff',
  headerRight: () => <HeaderThemeToggle />,
};

function AuthStack() {
  const { t } = useI18n();
  return (
    <Stack.Navigator screenOptions={commonHeader}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="RecoverySetup" component={RecoverySetupScreen} options={{ title: t('RECOVERY_SETUP') }} />
      <Stack.Screen name="RecoveryFlow" component={RecoveryFlowScreen} options={{ title: t('RECOVERY') }} />
      <Stack.Screen name="SecurityQnaManager" component={SecurityQnaManagerScreen} options={{ title: t('SECURITY_QNA') }} />
      <Stack.Screen name="VoicePicker" component={VoicePickerScreen} options={{ title: t('VOICE_PICK') || 'VOICE PICK' }} />
    </Stack.Navigator>
  );
}

function AppStack({ initialRouteName = 'Home' }) {
  const { t } = useI18n();
  return (
    <Stack.Navigator screenOptions={commonHeader} initialRouteName={initialRouteName}>
      {/* 홈은 헤더 숨김(홈 전용 토글/코인 배치 유지) */}
      <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Goal" component={GoalScreen} />
      <Stack.Screen name="Camera" component={CameraScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: t('SETTING') || 'SETTING' }} />

      <Stack.Screen name="DietLog" component={DietLogScreen} options={{ title: t('FOOD_LOG') || '식단 기록' }} />
      <Stack.Screen name="FoodLog" component={DietLogScreen} options={{ title: t('FOOD_LOG') || '식단 기록' }} />

      <Stack.Screen name="Data" component={DataScreen} options={{ title: t('AT_A_GLANCE') || '한눈에' }} />
      <Stack.Screen name="Overview" component={DataScreen} options={{ title: t('AT_A_GLANCE') || '한눈에' }} />

      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: t('PROFILE') || '프로필' }} />
      <Stack.Screen name="Quest" component={QuestScreen} options={{ title: t('DAILY_QUEST') || '일일 퀘스트' }} />
      <Stack.Screen name="Ranking" component={RankingScreen} options={{ title: t('RANKING') || '랭킹' }} />

      <Stack.Screen name="RecoverySetup" component={RecoverySetupScreen} options={{ title: t('RECOVERY_SETUP') }} />
      <Stack.Screen name="RecoveryFlow" component={RecoveryFlowScreen} options={{ title: t('RECOVERY') }} />
      <Stack.Screen name="SecurityQnaManager" component={SecurityQnaManagerScreen} options={{ title: t('SECURITY_QNA') }} />

      <Stack.Screen name="HealthyCatch" component={HealthyCatchGameScreen} options={{ headerShown: false }} />
      <Stack.Screen name="TACoach" component={TACoach} options={{ title: '' }} />
      <Stack.Screen name="VoicePicker" component={VoicePickerScreen} options={{ title: t('VOICE_PICK') || 'VOICE PICK' }} />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  const { ready, isAuthenticated, needsGoalSetup } = useAuth();
  const [fontsLoaded] = useFonts({ DungGeunMo: require('../../assets/fonts/DungGeunMo.otf') });

  if (!ready || !fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }
  if (!isAuthenticated) return <AuthStack />;

  return (
    <AppStack
      key={needsGoalSetup ? 'app-goal' : 'app-home'}
      initialRouteName={needsGoalSetup ? 'Goal' : 'Home'}
    />
  );
}
