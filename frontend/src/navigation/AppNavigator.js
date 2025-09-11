// ...기존 import...
import SettingsScreen from '../screens/SettingsScreen';
import VoiceSelectScreen from '../screens/VoiceSelectScreen'; // 반드시 존재해야 함

// 예: 설정 스택
const SettingsStack = createNativeStackNavigator();
function SettingsStackScreen() {
  return (
    <SettingsStack.Navigator screenOptions={{ headerShown: false }}>
      <SettingsStack.Screen name="Settings" component={SettingsScreen} />
      <SettingsStack.Screen name="VoiceSelect" component={VoiceSelectScreen} />
    </SettingsStack.Navigator>
  );
}
