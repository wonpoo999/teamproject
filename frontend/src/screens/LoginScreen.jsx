// src/screens/LoginScreen.js
import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Alert,
  ScrollView, KeyboardAvoidingView, Platform
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!id || !password) {
      Alert.alert('입력 필요', '아이디와 비밀번호를 입력해주세요.');
      return;
    }
    try {
      setLoading(true);
      const ok = await login(id, password);
      if (!ok) throw new Error('로그인 실패');
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    } catch (e) {
      Alert.alert('로그인 실패', e?.message ?? '다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
        <Text style={{ fontSize: 24, fontWeight: '700' }}>Login</Text>

        <TextInput
          value={id}
          onChangeText={setId}
          placeholder="ID"
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="username"
          style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12 }}
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry
          textContentType="password"
          style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12 }}
        />

        <TouchableOpacity
          onPress={onSubmit}
          disabled={loading}
          style={{ backgroundColor: loading ? '#93c5fd' : '#2563eb', padding: 14, borderRadius: 10 }}
        >
          <Text style={{ color: '#fff', textAlign: 'center' }}>
            {loading ? '로그인 중…' : 'Login'}
          </Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 8 }}>
          <Text style={{ color: '#6b7280' }}>계정이 없으신가요? </Text>
          <TouchableOpacity onPress={() => navigation.replace('Signup')}>
            <Text style={{ color: '#2563eb', fontWeight: '700' }}>회원가입</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
