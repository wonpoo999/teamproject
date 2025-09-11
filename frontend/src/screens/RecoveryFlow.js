import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useI18n } from '../i18n/I18nContext';
import { useThemeMode } from '../theme/ThemeContext';
import { apiPost } from '../config/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const FONT = 'DungGeunMo';

export default function RecoveryFlow() {
  const route = useRoute();
  const mode = route.params?.mode === 'findId' ? 'findId' : 'resetPw';
  const { t } = useI18n();
   const { theme: colors } = useThemeMode();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const inputStyle = {
    borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 14, minHeight: 48, lineHeight: 22,
    fontFamily: FONT, color: colors.text, backgroundColor: colors.inputBg, textAlignVertical: 'center',
  };

  const onStart = async () => {
    if (!email.trim()) return Alert.alert(t('INPUT_REQUIRED'), t('RECOVERY_ID'));
    try {
      setLoading(true);
      // ✅ 통일: 보안질문 시작 엔드포인트는 /api/recover/start
      const body = { email: email.trim(), mode };
      const res = await apiPost('/api/recover/start', body);

      // 서버가 ok:false + status 제공하는 케이스 방어
      if (res?.ok === false && res?.status === 403) {
        const tip = mode === 'findId' ? t('RECOVERY_START_DESC_ID') : t('SECURITY_POLICY');
        Alert.alert(t('PW_RECOVERY'), tip);
        return;
      }

      Alert.alert(t('CONFIRM'), 'OK');
    } catch (e) {
      // ❗️원시 에러 메시지 그대로 노출 금지
      Alert.alert(t('PW_RECOVERY'), t('TRY_LATER'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={{
        paddingTop: insets.top + 24, padding: 20, gap: 12,
        backgroundColor: colors.bg, flexGrow: 1
      }}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={{ fontFamily: FONT, fontSize: 28, textAlign: 'center', color: colors.text }}>
        {mode === 'findId' ? t('FIND_ID') : t('PW_RECOVERY')}
      </Text>

      <Text style={{ fontFamily: FONT, color: colors.mutedText, textAlign: 'center', lineHeight: 20 }}>
        {mode === 'findId' ? t('RECOVERY_START_DESC_ID') : t('RECOVERY_START_DESC')}
      </Text>

      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder={t('RECOVERY_ID')}
        placeholderTextColor={colors.mutedText}
        style={inputStyle}
        autoCapitalize="none"
        keyboardType="email-address"
        inputMode="email"
      />

      <TouchableOpacity
        onPress={onStart}
        disabled={loading}
        style={{ backgroundColor: '#111827', padding: 14, borderRadius: 12 }}
      >
        <Text style={{ color:'#fff', textAlign:'center', fontFamily: FONT }}>
          {loading ? '…' : t('RECOVERY_START')}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
