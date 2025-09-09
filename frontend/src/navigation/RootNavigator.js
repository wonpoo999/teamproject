// src/navigation/RootNavigator.jsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View, TouchableOpacity, Text } from 'react-native';
import { useFonts } from 'expo-font';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import { useThemeMode } from '../theme/ThemeContext';

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

// 복구 화면(단일 세트)
import {
  RecoverySetupScreen,
  RecoveryFlowScreen,
  SecurityQnaManagerScreen,
} from '../screens/RecoveryScreens';

const Stack = createNativeStackNavigator();

// 헤더에서 다크모드 토글 버튼
function HeaderThemeToggle() {
  const { toggleTheme, mode, colors } = useThemeMode();
  const { t } = useI18n();
  const label =
    mode === 'dark'
      ? t('LIGHT') || 'Light'
      : t('DARK') || 'Dark';

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={toggleTheme}
      style={{
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.inputBorder,
        backgroundColor: colors.ghostBg,
      }}
    >
      <Text
        style={{
          fontFamily: 'DungGeunMo',
          color: colors.text,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const commonHeader = {
  headerShown: true,
  headerTitle: '',
  headerTransparent: true,
  headerShadowVisible: false,
  headerStyle: { backgroundColor: 'transparent', elevation: 0 },
  headerBackTitleVisible: false,
  headerTintColor: '#fff',
  headerTitleStyle: { fontFamily: 'DungGeunMo', fontSize: 20 },
  // 다크모드 토글 버튼 하나만
  headerRight: () => <HeaderThemeToggle />,
  headerLeft: () => null, // ← 뒤로가기 중첩 방지
};

function AuthStack() {
  const { t } = useI18n();
  return (
    <Stack.Navigator screenOptions={commonHeader}>
      <Stack.Screen
        name="Welcome"
        component={WelcomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen
        name="RecoverySetup"
        component={RecoverySetupScreen}
        options={{ title: t('RECOVERY_SETUP') }}
      />
      <Stack.Screen
        name="RecoveryFlow"
        component={RecoveryFlowScreen}
        options={{ title: t('RECOVERY') }}
      />
      <Stack.Screen
        name="SecurityQnaManager"
        component={SecurityQnaManagerScreen}
        options={{ title: t('SECURITY_QNA') }}
      />
      <Stack.Screen
        name="VoicePicker"
        component={VoicePickerScreen}
        options={{ title: t('VOICE_PICK') || 'VOICE_PICK' }}
      />
    </Stack.Navigator>
  );
}

function AppStack({ initialRouteName = 'Home' }) {
  const { t } = useI18n();
  return (
    <Stack.Navigator
      screenOptions={commonHeader}
      initialRouteName={initialRouteName}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="Goal" component={GoalScreen} />
      <Stack.Screen name="Camera" component={CameraScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="DietLog" component={DietLogScreen} />
      <Stack.Screen name="Data" component={DataScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Burning" component={QuestScreen} />
      <Stack.Screen name="Ranking" component={RankingScreen} />
      <Stack.Screen
        name="RecoverySetup"
        component={RecoverySetupScreen}
        options={{ title: t('RECOVERY_SETUP') }}
      />
      <Stack.Screen
        name="RecoveryFlow"
        component={RecoveryFlowScreen}
        options={{ title: t('RECOVERY') }}
      />
      <Stack.Screen
        name="SecurityQnaManager"
        component={SecurityQnaManagerScreen}
        options={{ title: t('SECURITY_QNA') }}
      />
      <Stack.Screen
        name="HealthyCatch"
        component={HealthyCatchGameScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TACoach"
        component={TACoach}
        options={{ headerShown: true, title: '' }}
      />
      <Stack.Screen
        name="VoicePicker"
        component={VoicePickerScreen}
        options={{ title: t('VOICE_PICK') || 'VOICE_PICK' }}
      />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  const { ready, isAuthenticated, needsGoalSetup } = useAuth();
  const [fontsLoaded] = useFonts({
    DungGeunMo: require('../../assets/fonts/DungGeunMo.otf'),
  });

  if (!ready || !fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
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
