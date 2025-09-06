import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useAuth } from '../context/AuthContext'
import { useFonts } from 'expo-font'
import { useI18n } from '../i18n/I18nContext' // >>> [ADDED]
import { useNavigation } from '@react-navigation/native' // >>> [ADDED]

const FONT = 'DungGeunMo'

export default function LoginScreen({ navigation: navProp }) {
  const navigation = useNavigation() // >>> [ADDED]
  const { t } = useI18n() // >>> [ADDED]
  const { login, needsGoalSetup } = useAuth()
  const [id, setId] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const [fontsLoaded] = useFonts({
    [FONT]: require('../../assets/fonts/DungGeunMo.otf'),
  })
  if (!fontsLoaded) return null

  const onSubmit = async () => {
    if (loading) return
    if (!id || !password) {
      Alert.alert(t('INPUT_REQUIRED'), t('ENTER_ID_PW'))
      return
    }
    try {
      setLoading(true)
      const ok = await login(id.trim(), password)
      if (!ok) throw new Error(t('TRY_AGAIN'))

      if (needsGoalSetup) {
        navigation.reset({ index: 0, routes: [{ name: 'Goal' }] })
      } else {
        navigation.reset({ index: 0, routes: [{ name: 'Home' }] })
      }
    } catch (e) {
      Alert.alert(t('LOGIN'), e?.message ?? t('TRY_AGAIN'))
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontFamily: FONT,
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          padding: 20,
          gap: 12,
          flexGrow: 1,
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            fontSize: 28,
            textAlign: 'center',
            marginBottom: 8,
            fontFamily: FONT,
          }}
        >
          {t('LOGIN')}
        </Text>

        <TextInput
          value={id}
          onChangeText={setId}
          placeholder={t('EMAIL')}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="username"
          style={inputStyle}
          returnKeyType="next"
        />

        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder={t('PASSWORD_MIN')}
          secureTextEntry
          textContentType="password"
          style={inputStyle}
          returnKeyType="done"
          onSubmitEditing={onSubmit}
        />

        <TouchableOpacity
          onPress={onSubmit}
          disabled={loading}
          style={{
            backgroundColor: loading ? '#93c5fd' : '#2563eb',
            padding: 14,
            borderRadius: 10,
            marginTop: 6,
          }}
        >
          <Text
            style={{
              color: '#fff',
              textAlign: 'center',
              fontFamily: FONT,
            }}
          >
            {loading ? '...' : t('LOGIN')}
          </Text>
        </TouchableOpacity>

        {/* >>> [ADDED] 비밀번호 찾기 진입 */}
        <TouchableOpacity
          onPress={() => navigation.navigate('Recover')}
          style={{ alignItems: 'center', padding: 10 }}
        >
          <Text style={{ fontFamily: FONT, color: '#2563eb' }}>{t('RECOVERY')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
