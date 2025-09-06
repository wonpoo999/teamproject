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

const FONT = 'DungGeunMo'

export default function LoginScreen({ navigation }) {
  const { login, needsGoalSetup } = useAuth()
  const [id, setId] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const [fontsLoaded] = useFonts({
    [FONT]: require('../../assets/fonts/DungGeunMo.otf'),
  })
  if (!fontsLoaded) return null

  const normalizeLoginError = (raw) => {
    if (raw && typeof raw === 'object') {
      const anyErr = raw
      const status = anyErr.status ?? anyErr.code
      const msg = String(anyErr.message ?? anyErr.error ?? '')
      if (status === 401 || /unauthorized|401/i.test(msg)) return '비밀번호가 틀렸습니다.'
      if (status === 404) return '존재하지 않는 아이디입니다.'
      if (status === 403) return '접근 권한이 없습니다.'
      if (/password/i.test(msg)) return '비밀번호가 틀렸습니다.'
      if (/user.*not.*found|no.*user|unknown.*user/i.test(msg)) return '존재하지 않는 아이디입니다.'
      if (/invalid.*credential|wrong.*credential/i.test(msg)) return '아이디 또는 비밀번호가 올바르지 않습니다.'
      if (msg) return msg
    }
    if (typeof raw === 'string') {
      if (/password/i.test(raw)) return '비밀번호가 틀렸습니다.'
      if (/user.*not.*found|no.*user|unknown.*user/i.test(raw)) return '존재하지 않는 아이디입니다.'
      if (/unauthorized|401/i.test(raw)) return '비밀번호가 틀렸습니다.'
      return raw
    }
    return '아이디 또는 비밀번호가 올바르지 않습니다.'
  }

  const onSubmit = async () => {
    if (loading) return
    if (!id || !password) {
      Alert.alert('입력 필요', '아이디와 비밀번호를 입력해주세요.')
      return
    }
    try {
      setLoading(true)
      const res = await login(id.trim(), password)
      const ok =
        res === true ||
        res === 'ok' ||
        (res && typeof res === 'object' && (res.ok === true || res.success === true))
      if (!ok) {
        const errMsg =
          (res && typeof res === 'object' && (res.message || res.error)) ||
          (typeof res === 'string' ? res : undefined)
        throw new Error(normalizeLoginError(errMsg))
      }
      if (needsGoalSetup) {
        navigation.reset({ index: 0, routes: [{ name: 'Goal' }] })
      } else {
        navigation.reset({ index: 0, routes: [{ name: 'Home' }] })
      }
    } catch (e) {
      const msg = normalizeLoginError(e?.message ?? e)
      Alert.alert('로그인 실패', msg)
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
            color: '#000',
          }}
        >
          LOGIN
        </Text>
        <TextInput
          value={id}
          onChangeText={setId}
          placeholder="ID"
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="username"
          style={inputStyle}
          returnKeyType="next"
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
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
            {loading ? '로그인 중…' : 'Login'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
