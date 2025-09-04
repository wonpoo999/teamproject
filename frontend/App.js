import { NavigationContainer } from '@react-navigation/native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import RootNavigator from './src/navigation/RootNavigator'
import AuthProvider, { useAuth } from './src/context/AuthContext'
import { StatusBar } from 'expo-status-bar'

function AppShell() {
  const { isAuthenticated } = useAuth()
  return (
    <NavigationContainer key={isAuthenticated ? 'nav-app' : 'nav-auth'}>
      <RootNavigator />
    </NavigationContainer>
  )
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor="#111827" />
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </SafeAreaProvider>
  )
}
