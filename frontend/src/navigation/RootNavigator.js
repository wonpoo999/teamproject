import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { ActivityIndicator, View } from 'react-native'
import { useAuth } from '../context/AuthContext'
import WelcomeScreen from '../screens/WelcomeScreen'
import LoginScreen from '../screens/LoginScreen'
import SignupScreen from '../screens/SignupScreen'
import HomeScreen from '../screens/HomeScreen'
import CameraScreen from '../screens/CameraScreen'
import GoalScreen from '../screens/GoalScreen'
import SettingsScreen from '../screens/SettingsScreen'
import DietLogScreen from '../screens/DietLogScreen'
import DataScreen from '../screens/DataScreen'
import ProfileScreen from '../screens/ProfileScreen'
import { useFonts } from 'expo-font'
import QuestScreen from '../screens/QuestScreen'
import RankingScreen from '../screens/RankingScreen'
import HealthyCatchGameScreen from '../screens/HealthyCatchGameScreen'

// >>> [ADDED] 복구 질문 설정 화면 라우트 추가
import RecoverySetup from '../screens/RecoverySetup'

const Stack = createNativeStackNavigator()

const commonHeader = {
  headerShown: true,
  headerTitle: '',
  headerTransparent: true,
  headerShadowVisible: false,
  headerStyle: { backgroundColor: 'transparent', elevation: 0 },
  headerBackTitleVisible: false,
  headerTintColor: '#fff',
  headerTitleStyle: { fontFamily: 'DungGeunMo', fontSize: 20 },
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={commonHeader}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      {/* >>> [FIX] Navigator 직속에는 Screen/Group/Fragment만! 공백/문자열/뷰 금지 */}
    </Stack.Navigator>
  )
}

function AppStack({ initialRouteName = 'Home' }) {
  return (
    <Stack.Navigator screenOptions={commonHeader} initialRouteName={initialRouteName}>
      <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Goal" component={GoalScreen} />
      <Stack.Screen name="Camera" component={CameraScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="DietLog" component={DietLogScreen} />
      <Stack.Screen name="Data" component={DataScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Quest" component={QuestScreen} />
      <Stack.Screen name="Ranking" component={RankingScreen} />

      {/* >>> [ADDED] 복구 질문 설정 라우팅 */}
      <Stack.Screen name="RecoverySetup" component={RecoverySetup} />
      {/* >>> [FIX] 여기에도 공백/문자열/뷰 절대 넣지 마세요 */}
      <Stack.Screen name="HealthyCatch" component={HealthyCatchGameScreen} options={{ headerShown:false }} />
    </Stack.Navigator>
  )
}

export default function RootNavigator() {
  const { ready, isAuthenticated, needsGoalSetup } = useAuth()
  const [fontsLoaded] = useFonts({ DungGeunMo: require('../../assets/fonts/DungGeunMo.otf') })

  if (!ready || !fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    )
  }

  if (!isAuthenticated) return <AuthStack />

  return (
    <AppStack
      key={needsGoalSetup ? 'app-goal' : 'app-home'}
      initialRouteName={needsGoalSetup ? 'Goal' : 'Home'}
    />
  )
}
