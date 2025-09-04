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
import RegisterScreen from '../screens/RegisterScreen'
import DietLogScreen from '../screens/DietLogScreen'
import DataScreen from '../screens/DataScreen'

const Stack = createNativeStackNavigator()

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
    </Stack.Navigator>
  )
}

function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Goal" component={GoalScreen} />
      <Stack.Screen name="Camera" component={CameraScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Rester" component={RegisterScreen} />
      <Stack.Screen name="DietLog" component={DietLogScreen} />
      <Stack.Screen name="Data" component={DataScreen} />
    </Stack.Navigator>
  )
}

export default function RootNavigator() {
  const { ready, isAuthenticated } = useAuth()

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    )
  }

  return isAuthenticated ? <AppStack /> : <AuthStack />
}
