import { createNativeStackNavigator } from '@react-navigation/native-stack'
import HomeScreen from '../screens/HomeScreen'
import LoginScreen from '../screens/LoginScreen'
import SignupScreen from '../screens/SignupScreen'
import CameraScreen from '../screens/CameraScreen'
import SettingsScreen from '../screens/SettingsScreen'
import NavBar from '../components/NavBar'

const Stack=createNativeStackNavigator()

export default function RootNavigator(){
  return (
    <Stack.Navigator initialRouteName="Home" screenOptions={{ header: () => <NavBar/> }}>
      <Stack.Screen name="Home" component={HomeScreen}/>
      <Stack.Screen name="Login" component={LoginScreen}/>
      <Stack.Screen name="Signup" component={SignupScreen}/>
      <Stack.Screen name="Camera" component={CameraScreen}/>
      <Stack.Screen name="Settings" component={SettingsScreen}/>
    </Stack.Navigator>
  )
}
