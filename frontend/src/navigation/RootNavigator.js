// src/navigation/RootNavigator.js
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
import ProfileScreen from '../screens/ProfileScreen';

const Stack = createNativeStackNavigator()


const commonHeader = {
  headerShown: true,
  headerTitle: '',                     
  headerTransparent: true,             
  headerShadowVisible: false,          
  headerStyle: {                       
    backgroundColor: 'transparent',
    elevation: 0,
  },
  headerBackTitleVisible: false,      
  headerTintColor: '#fff',            
  headerTitleStyle: {                 
    fontFamily: 'DungGeunMo',
    fontSize: 20,
  },
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={commonHeader}>
      {/* 웰컴만 헤더 완전 숨김 */}
      <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
    </Stack.Navigator>
  )
}

function AppStack({ initialRouteName = 'Home' }) {
  return (
    <Stack.Navigator screenOptions={commonHeader} initialRouteName={initialRouteName}>
      {/* 홈만 헤더 완전 숨김 */}
      <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      {/* 나머진 뒤로가기만 보임(타이틀 없음) */}
      <Stack.Screen name="Goal" component={GoalScreen} />
      <Stack.Screen name="Camera" component={CameraScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="DietLog" component={DietLogScreen} />
      <Stack.Screen name="Data" component={DataScreen} />
    <Stack.Navigator screenOptions={{ headerShown: true }} initialRouteName={initialRouteName}>
      <Stack.Screen name="Home" component={HomeScreen} options={{headerShown: false}}/>   
      {/* ㄴ 홈 화면에만 헤더바 숨김 */}
      <Stack.Screen name="Goal" component={GoalScreen} options={{title:'🚩 목표설정'}} />
      <Stack.Screen name="Camera" component={CameraScreen} options={{title:'📷 카메라'}}/>
      <Stack.Screen name="Settings" component={SettingsScreen} options={{title:'⚙️ 설정'}}/>
      <Stack.Screen name="DietLog" component={DietLogScreen} options={{title:'🥗식단 기록'}}/>
      <Stack.Screen name="Data" component={DataScreen} options={{title:'👀 한눈에'}}/>
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
      <Stack.Screen name="My" component={ProfileScreen} />
      <Stack.Screen name="MyPage" component={ProfileScreen} />
    </Stack.Navigator>
  )
}

export default function RootNavigator() {
  const { ready, isAuthenticated, needsGoalSetup } = useAuth()

  if (!ready) {
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
