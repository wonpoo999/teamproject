import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useI18n } from '../i18n/I18nContext';
import { useThemeMode } from '../theme/ThemeContext';
import { apiPost } from '../config/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const FONT = 'DungGeunMo';

export default function SecurityQnaManager() {
  const { t } = useI18n();
  const { theme: colors } = useThemeMode();
  const insets = useSafeAreaInsets();

  const [qna, setQna] = useState([
    { code: 'BIRTHPLACE', labelKey: 'QUESTION_BIRTHPLACE', answer: '' },
    { code: 'CHILDHOOD_AREA', labelKey: 'QUESTION_CHILDHOOD_AREA', answer: '' },
    { code: 'PET_NAME', labelKey: 'QUESTION_PET_NAME', answer: '' },
    { code: 'MOTHER_NAME', labelKey: 'QUESTION_MOTHER_NAME', answer: '' },
    { code: 'ROLE_MODEL', labelKey: 'QUESTION_ROLE_MODEL', answer: '' },
  ]);
  const setQ = (idx, v) => setQna(arr => arr.map((x,i)=> i===idx ? ({...x, answer: v}) : x));

  const inputStyle = {
    borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontFamily: FONT,
    color: colors.text, backgroundColor: colors.inputBg,
  };

  const onSave = async () => {
    const answers = qna.filter(x => (x.answer || '').trim()).map(x => ({ code: x.code, answer: x.answer.trim() }));
    if (!answers.length) { Alert.alert(t('INPUT_REQUIRED'), t('SECURITY_QNA')); return; }
    try {
      await apiPost('/api/recover/register', { answers });
      Alert.alert(t('EDIT_DONE'), t('UPDATE_OK'));
    } catch (e) {
      Alert.alert(t('UPDATE_FAIL'), String(e?.message || e));
    }
  };

  return (
    <ScrollView contentContainerStyle={{ paddingTop: insets.top + 16, padding: 20, gap: 12, backgroundColor: colors.bg, flexGrow: 1 }}>
      <Text style={{ fontFamily: FONT, fontSize: 26, color: colors.text, textAlign:'center' }}>{t('SECURITY_QNA')}</Text>
      <Text style={{ fontFamily: FONT, color: colors.mutedText, lineHeight: 20 }}>{t('SECURITY_POLICY')}</Text>

      {qna.map((row, idx) => (
        <View key={row.code} style={{ gap: 6 }}>
          <Text style={{ fontFamily: FONT, color: colors.text }}>{t(row.labelKey)}</Text>
          <TextInput
            value={row.answer}
            onChangeText={(v)=>setQ(idx, v)}
            placeholder={t('ANSWER')}
            placeholderTextColor={colors.mutedText}
            style={inputStyle}
          />
        </View>
      ))}

      <TouchableOpacity onPress={onSave} style={{ backgroundColor: '#111827', padding: 14, borderRadius: 12 }}>
        <Text style={{ color:'#fff', textAlign:'center', fontFamily: FONT }}>{t('EDIT_DONE')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
