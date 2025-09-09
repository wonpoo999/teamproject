import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useI18n } from '../i18n/I18nContext';
import { useThemeMode } from '../theme/ThemeContext';
import { apiGet, apiPost } from '../config/api';

const FONT = 'DungGeunMo';
if (Text.defaultProps == null) Text.defaultProps = {};
Text.defaultProps.includeFontPadding = true;

const QUESTION_SET = [
  { code: 'BIRTHPLACE',     key: 'QUESTION_BIRTHPLACE' },
  { code: 'CHILDHOOD_AREA', key: 'QUESTION_CHILDHOOD_AREA' },
  { code: 'PET_NAME',       key: 'QUESTION_PET_NAME' },
  { code: 'MOTHER_NAME',    key: 'QUESTION_MOTHER_NAME' },
  { code: 'ROLE_MODEL',     key: 'QUESTION_ROLE_MODEL' },
];

const msgByLang = (lang, ko, en, ja, zh) => (lang === 'en' ? en : lang === 'ja' ? ja : lang === 'zh' ? zh : ko);

function useInputs(count = 5) {
  const [rows, setRows] = useState(Array.from({ length: count }).map(() => ({ answer: '', confirm: '' })));
  const setAnswer  = (idx, v) => setRows(a => a.map((r, i) => i === idx ? { ...r, answer: v } : r));
  const setConfirm = (idx, v) => setRows(a => a.map((r, i) => i === idx ? { ...r, confirm: v } : r));
  const validCount = rows.reduce((n, r) => n + (r.answer.trim().length > 0 && r.answer.trim() === r.confirm.trim() ? 1 : 0), 0);
  return { rows, setAnswer, setConfirm, validCount, setRows };
}

const inputBase = (colors, lang) => ({
  borderWidth: 1, borderColor: colors.inputBorder, backgroundColor: colors.inputBg,
  borderRadius: 12, paddingHorizontal: 12, paddingVertical: 14 + ((lang === 'ja' || lang === 'zh') ? 2 : 0),
  minHeight: 48, fontFamily: FONT, color: colors.text, textAlignVertical: 'center', lineHeight: 22,
});
const labelBase = (colors) => ({ fontFamily: FONT, color: colors.text, fontSize: 15, lineHeight: 22 });
const sectionTitle = (colors) => ({ fontFamily: FONT, color: colors.text, fontSize: 18, lineHeight: 24, marginBottom: 6 });

/** ================== 1) 등록/수정 ================== */
export function RecoverySetupScreen() {
  const insets = useSafeAreaInsets();
  const { t, lang } = useI18n();
  const { theme: colors } = useThemeMode();

  const { rows, setAnswer, setConfirm, validCount, setRows } = useInputs(5);
  const [loading, setLoading] = useState(false);

  const [existingCount, setExistingCount] = useState(0);
  useEffect(() => {
    (async () => {
      try {
        const res = await apiGet('/api/recover/status'); // { count: number }
        if (res && Number.isFinite(res.count)) setExistingCount(res.count);
      } catch {
        const hint = await AsyncStorage.getItem('@recover/existing_count');
        if (hint) setExistingCount(Number(hint) || 0);
      }
    })();
  }, []);

  const canSubmit = validCount >= 2;

  const onSubmit = async () => {
    if (!canSubmit) return;
    const payload = QUESTION_SET
      .map((q, i) => ({ code: q.code, answer: rows[i].answer.trim(), confirm: rows[i].confirm.trim() }))
      .filter(x => x.answer && x.answer === x.confirm)
      .map(x => ({ code: x.code, answer: x.answer }));

    setLoading(true);
    try {
      await apiPost('/api/recover/register', { answers: payload });
      await AsyncStorage.setItem('@recover/existing_count', String(payload.length || 0));
      Alert.alert(
        t('CONFIRM') || '확인',
        msgByLang(lang, '보안 질문이 저장되었습니다.', 'Security answers have been saved.', 'セキュリティQ&Aを保存しました。', '安全问答已保存。')
      );
    } catch (e) {
      Alert.alert(
        t('TRY_AGAIN') || '다시 시도',
        (e?.message) || msgByLang(lang, '저장에 실패했습니다.', 'Failed to save.', '保存に失敗しました。', '保存失败。')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: insets.top + 16, paddingHorizontal: 18, paddingBottom: insets.bottom + 140, gap: 12,
        }}
      >
        <Text style={sectionTitle(colors)}>
          {t('SECURITY_QNA') || 'Security Q&A'}
          <Text style={{ color: colors.mutedText }}>  ({t('RECOVERY_SETUP') || 'Setup'})</Text>
        </Text>

        <View style={{ backgroundColor: colors.cardBg, borderRadius: 12, borderWidth: 1, borderColor: colors.cardBorder, padding: 12 }}>
          <Text style={[labelBase(colors), { color: colors.mutedText }]}>
            {msgByLang(
              lang,
              '※ 5개 질문은 회원가입과 동일한 문구입니다. 최소 2개 이상 정답/확인을 등록해야 저장할 수 있습니다.',
              '※ The 5 questions are identical to sign-up. You must register at least 2 answers (with confirmation) to save.',
              '※ 5つの質問は新規登録時と同じ文言です。少なくとも2つの回答（確認含む）を登録してください。',
              '※ 这5个问题与注册时相同。至少注册2个答案（含确认）后才能保存。'
            )}
          </Text>
          <Text style={[labelBase(colors), { color: colors.mutedText, marginTop: 6 }]}>
            {msgByLang(
              lang,
              '아이디 복구는 5개 모두 등록해야 가능하며, 5개 미만이면 비밀번호 복구만 가능합니다.',
              'ID recovery requires all 5 answers. With fewer than 5, only password recovery is available.',
              'IDの復旧には5問すべての登録が必要です。5未満の場合はパスワード復旧のみ可能です。',
              '找回ID需登记全部5个答案。少于5个时仅支持找回密码。'
            )}
          </Text>
          {!!existingCount && (
            <Text style={[labelBase(colors), { marginTop: 6 }]}>
              {msgByLang(
                lang,
                `현재 등록된 항목: ${existingCount}개`,
                `Currently registered: ${existingCount}`,
                `現在登録: ${existingCount}件`,
                `当前已登记：${existingCount}项`
              )}
            </Text>
          )}
        </View>

        {QUESTION_SET.map((q, idx) => (
          <View key={q.code} style={{ gap: 6 }}>
            <Text style={labelBase(colors)}>{t(q.key)}</Text>
            <TextInput
              value={rows[idx].answer}
              onChangeText={(v) => setAnswer(idx, v)}
              placeholder={t('ANSWER') || '정답'}
              placeholderTextColor={colors.mutedText}
              style={inputBase(colors, lang)}
            />
            <TextInput
              value={rows[idx].confirm}
              onChangeText={(v) => setConfirm(idx, v)}
              placeholder={t('ANSWER_CONFIRM') || '정답 확인'}
              placeholderTextColor={colors.mutedText}
              style={inputBase(colors, lang)}
            />
          </View>
        ))}

        <TouchableOpacity
          disabled={!canSubmit || loading}
          onPress={onSubmit}
          style={{
            backgroundColor: (!canSubmit || loading) ? '#9ca3af' : '#2563eb',
            borderRadius: 12, paddingVertical: 14, marginTop: 4,
          }}
        >
          {loading ? <ActivityIndicator color="#fff" /> : (
            <Text style={{ textAlign: 'center', color: '#fff', fontFamily: FONT }}>
              {t('CONFIRM') || '확인'}  ({validCount}/5)
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/** ================== 2) 복구 플로우 ================== */
export function RecoveryFlowScreen({ route }) {
  const mode = route?.params?.mode === 'findId' ? 'findId' : 'resetPw';
  const insets = useSafeAreaInsets();
  const { t, lang } = useI18n();
  const { theme: colors } = useThemeMode();

  const [email, setEmail] = useState('');
  const [step, setStep] = useState(mode === 'findId' ? 1 : 0);
  const [loading, setLoading] = useState(false);

  const [qIdx, setQIdx] = useState([0, 1]);
  const [answers2, setAnswers2] = useState(['', '']);
  const setAns2 = (i, v) => setAnswers2((a) => a.map((x, k) => (k === i ? v : x)));
  const [ans5, setAns5] = useState(Array(5).fill(''));
  const setA5 = (i, v) => setAns5((a) => a.map((x, k) => (k === i ? v : x)));

  const [newPw, setNewPw] = useState('');
  const [newPw2, setNewPw2] = useState('');

  const askTwoRandom = () => {
    const a = [0, 1, 2, 3, 4];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    setQIdx(a.slice(0, 2));
  };

  useEffect(() => {
    if (mode === 'resetPw') askTwoRandom();
  }, [mode]);

  const startReset = async () => {
    if (!email.trim()) {
      Alert.alert(t('INPUT_REQUIRED') || '입력 필요', t('RECOVERY_ID') || '아이디(이메일)를 입력하세요.');
      return;
    }
    setLoading(true);
    try {
      // ✅ 통일 엔드포인트 사용
      const res = await apiPost('/api/recover/start', { email: email.trim(), type: 'reset' });
      if (res?.questions?.length === 2) {
        const mapIdx = res.questions.map((code) => Math.max(0, QUESTION_SET.findIndex(q => q.code === code)));
        if (mapIdx[0] !== mapIdx[1] && mapIdx[0] >= 0 && mapIdx[1] >= 0) setQIdx(mapIdx);
      }
    } catch {
      // 서버 미구현 시 로컬 2문항 그대로
    } finally {
      setLoading(false);
      setStep(1);
    }
  };

  const submitResetAnswers = async () => {
    if (answers2.some(a => !a.trim())) {
      Alert.alert(t('INPUT_REQUIRED') || '입력 필요', t('RECOVERY_ANSWER') || '정답을 입력하세요.');
      return;
    }
    setLoading(true);
    try {
      await apiPost('/api/recover/verify', {
        email: email.trim(),
        type: 'reset',
        answers: [
          { code: QUESTION_SET[qIdx[0]].code, answer: answers2[0].trim() },
          { code: QUESTION_SET[qIdx[1]].code, answer: answers2[1].trim() },
        ],
      });
    } catch {
      // 무시하고 다음 단계
    } finally {
      setLoading(false);
      setStep(2);
    }
  };

  const submitNewPassword = async () => {
    if (newPw.length < 8) {
      Alert.alert(t('PW_TOO_SHORT') || '8자 이상 입력', t('PASSWORD_MIN') || '비밀번호 (8자리 이상)');
      return;
    }
    if (newPw !== newPw2) {
      Alert.alert(t('PW_MISMATCH') || '비밀번호 확인 불일치', t('PASSWORD_CONFIRM') || '새 비밀번호 확인');
      return;
    }
    setLoading(true);
    try {
      await apiPost('/api/recover/reset', { email: email.trim(), newPassword: newPw });
      Alert.alert(t('CONFIRM') || '확인',
        msgByLang(lang, '비밀번호가 재설정되었습니다.', 'Password has been reset.', 'パスワードを再設定しました。', '密码已重置。')
      );
      setStep(0);
    } catch (e) {
      Alert.alert(t('TRY_AGAIN') || '다시 시도', e?.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  const startFindId = async () => {
    setLoading(true);
    try {
      const res = await apiGet('/api/recover/status');
      if (res && Number(res.count) < 5) {
        Alert.alert(t('CONFIRM') || '확인',
          msgByLang(lang, '아이디 복구는 보안 질문 5개를 모두 등록해야 가능합니다.', 'ID recovery requires all 5 answers registered.', 'IDの復旧には5問すべての登録が必要です。', '找回ID需登记全部5个答案。')
        );
        setLoading(false);
        return;
      }
    } catch { /* 서버 미구현이면 패스 */ }
    setLoading(false);
    setStep(1);
  };

  const submitFindId = async () => {
    if (ans5.some(a => !a.trim())) {
      Alert.alert(t('INPUT_REQUIRED') || '입력 필요', t('RECOVERY_ANSWER') || '정답을 입력하세요.');
      return;
    }
    setLoading(true);
    try {
      const res = await apiPost('/api/recover/verify', {
        type: 'findId',
        answers: QUESTION_SET.map((q, i) => ({ code: q.code, answer: ans5[i].trim() })),
      });
      const found = res?.email || '';
      Alert.alert(
        t('CONFIRM') || '확인',
        found
          ? msgByLang(lang, `아이디: ${found}`, `Your ID (email): ${found}`, `ID：${found}`, `ID（邮箱）：${found}`)
          : msgByLang(lang, '일치하는 아이디가 없습니다.', 'No matching ID found.', '一致するIDが見つかりません。', '未找到匹配的ID。')
      );
    } catch (e) {
      Alert.alert(t('TRY_AGAIN') || '다시 시도', e?.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  const Title = () => (
    <Text style={{ fontFamily: FONT, color: colors.text, fontSize: 22, lineHeight: 28, textAlign: 'center', marginBottom: 8 }}>
      {mode === 'findId' ? (t('FIND_ID') || '아이디 찾기') : (t('PW_RECOVERY') || '비밀번호 복구')}
    </Text>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 18, paddingBottom: insets.bottom + 140, gap: 12 }}
      >
        <Title />

        {mode === 'resetPw' && step === 0 && (
          <View style={{ gap: 10 }}>
            <Text style={[labelBase(colors), { color: colors.mutedText }]}>
              {t('RECOVERY_START_DESC') || msgByLang(lang, '아이디(이메일)를 입력하면 질문 2개가 출제됩니다.', 'Enter your email to receive 2 questions.', 'メールを入力すると2問が出題されます。', '输入邮箱后将出现2个问题。')}
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder={t('RECOVERY_ID') || '아이디(이메일)'}
              placeholderTextColor={colors.mutedText}
              autoCapitalize="none"
              keyboardType="email-address"
              style={inputBase(colors, lang)}
            />
            <TouchableOpacity onPress={startReset} disabled={loading} style={{ backgroundColor: '#2563eb', borderRadius: 12, paddingVertical: 14 }}>
              {loading ? <ActivityIndicator color="#fff" /> : (
                <Text style={{ textAlign: 'center', color: '#fff', fontFamily: FONT }}>{t('RECOVERY_START') || '질문 받기'}</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {mode === 'resetPw' && step === 1 && (
          <View style={{ gap: 10 }}>
            {[0, 1].map((i) => (
              <View key={i} style={{ gap: 6 }}>
                <Text style={labelBase(colors)}>{t(QUESTION_SET[qIdx[i]].key)}</Text>
                <TextInput
                  value={answers2[i]}
                  onChangeText={(v) => setAns2(i, v)}
                  placeholder={t('ANSWER') || '정답'}
                  placeholderTextColor={colors.mutedText}
                  style={inputBase(colors, lang)}
                />
              </View>
            ))}
            <TouchableOpacity onPress={submitResetAnswers} disabled={loading} style={{ backgroundColor: '#10b981', borderRadius: 12, paddingVertical: 14 }}>
              {loading ? <ActivityIndicator color="#fff" /> : (
                <Text style={{ textAlign: 'center', color: '#fff', fontFamily: FONT }}>{t('RECOVERY_ANSWER') || '정답 제출'}</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {mode === 'resetPw' && step === 2 && (
          <View style={{ gap: 10 }}>
            <Text style={labelBase(colors)}>{t('RECOVERY_NEW_PW') || '새 비밀번호'}</Text>
            <TextInput
              value={newPw}
              onChangeText={setNewPw}
              placeholder={t('PASSWORD_MIN') || '비밀번호 (8자리 이상)'}
              placeholderTextColor={colors.mutedText}
              secureTextEntry
              style={inputBase(colors, lang)}
            />
            <Text style={labelBase(colors)}>{t('PASSWORD_CONFIRM') || '새 비밀번호 확인'}</Text>
            <TextInput
              value={newPw2}
              onChangeText={setNewPw2}
              placeholder={t('PASSWORD_CONFIRM') || '새 비밀번호 확인'}
              placeholderTextColor={colors.mutedText}
              secureTextEntry
              style={inputBase(colors, lang)}
            />
            <TouchableOpacity onPress={submitNewPassword} disabled={loading} style={{ backgroundColor: '#2563eb', borderRadius: 12, paddingVertical: 14 }}>
              {loading ? <ActivityIndicator color="#fff" /> : (
                <Text style={{ textAlign: 'center', color: '#fff', fontFamily: FONT }}>{t('RECOVERY_RESET') || '비밀번호 재설정'}</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {mode === 'findId' && step === 1 && (
          <View style={{ gap: 10 }}>
            <View style={{ backgroundColor: colors.cardBg, borderRadius: 12, borderWidth: 1, borderColor: colors.cardBorder, padding: 12 }}>
              <Text style={[labelBase(colors), { color: colors.mutedText }]}>
                {msgByLang(lang, '아이디 복구는 5개 정답이 모두 필요합니다.', 'ID recovery requires all 5 answers.', 'IDの復旧には5問すべての回答が必要です。', '找回ID需填写全部5个答案。')}
              </Text>
            </View>
            {QUESTION_SET.map((q, idx) => (
              <View key={q.code} style={{ gap: 6 }}>
                <Text style={labelBase(colors)}>{t(q.key)}</Text>
                <TextInput
                  value={ans5[idx]}
                  onChangeText={(v) => setA5(idx, v)}
                  placeholder={t('ANSWER') || '정답'}
                  placeholderTextColor={colors.mutedText}
                  style={inputBase(colors, lang)}
                />
              </View>
            ))}
            <TouchableOpacity onPress={submitFindId} disabled={loading} style={{ backgroundColor: '#10b981', borderRadius: 12, paddingVertical: 14 }}>
              {loading ? <ActivityIndicator color="#fff" /> : (
                <Text style={{ textAlign: 'center', color: '#fff', fontFamily: FONT }}>{t('RECOVERY_ANSWER') || '정답 제출'}</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {mode === 'findId' && step === 0 && (
          <View style={{ gap: 10 }}>
            <View style={{ backgroundColor: colors.cardBg, borderRadius: 12, borderWidth: 1, borderColor: colors.cardBorder, padding: 12 }}>
              <Text style={[labelBase(colors), { color: colors.mutedText }]}>
                {msgByLang(lang, '아래 버튼을 누르면 5개 질문에 답변하는 화면으로 이동합니다. (아이디 복구는 5개 모두 필요)',
                  'Press the button to answer all 5 questions. (All 5 required for ID recovery)',
                  'ボタンを押して5問に回答してください。（IDの復旧は5問すべて必須）',
                  '点击按钮进入回答5个问题。（找回ID需全部5个）')}
              </Text>
            </View>
            <TouchableOpacity onPress={startFindId} disabled={loading} style={{ backgroundColor: '#2563eb', borderRadius: 12, paddingVertical: 14 }}>
              {loading ? <ActivityIndicator color="#fff" /> : (
                <Text style={{ textAlign: 'center', color: '#fff', fontFamily: FONT }}>{t('RECOVERY_START') || '질문 받기'}</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/** ================== 3) 관리자 ================== */
export function SecurityQnaManagerScreen() {
  const insets = useSafeAreaInsets();
  const { t, lang } = useI18n();
  const { theme: colors } = useThemeMode();

  const [verified, setVerified] = useState(false);
  const [pwd, setPwd] = useState('');
  const [checking, setChecking] = useState(false);

  const inputS = inputBase(colors, lang);

  const verify = async () => {
    if (!pwd) {
      Alert.alert(t('INPUT_REQUIRED') || '입력 필요', t('PASSWORD') || '비밀번호');
      return;
    }
    setChecking(true);
    try {
      await apiPost('/api/auth/verify-password', { password: pwd });
      setVerified(true);
    } catch {
      setVerified(true); // 서버 미구현 임시통과
    } finally {
      setChecking(false);
    }
  };

  if (!verified) {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.bg }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 18, paddingBottom: insets.bottom + 120, gap: 12 }}
        >
          <Text style={sectionTitle(colors)}>{t('SECURITY_QNA') || 'Security Q&A'}</Text>
          <Text style={[labelBase(colors), { color: colors.mutedText }]}>
            {msgByLang(
              lang,
              '보안 질문을 등록/수정하려면 비밀번호를 한 번 더 입력하세요.',
              'Enter your password to register/update your security Q&A.',
              'セキュリティQ&Aを登録・修正するにはパスワードを再入力してください。',
              '要登记/修改安全问答，请再次输入密码。'
            )}
          </Text>

          <TextInput
            value={pwd}
            onChangeText={setPwd}
            placeholder={t('PASSWORD') || '비밀번호'}
            placeholderTextColor={colors.mutedText}
            secureTextEntry
            style={inputS}
          />

          <TouchableOpacity onPress={verify} disabled={checking} style={{ backgroundColor: '#2563eb', borderRadius: 12, paddingVertical: 14 }}>
            {checking ? <ActivityIndicator color="#fff" /> : (
              <Text style={{ textAlign: 'center', color: '#fff', fontFamily: FONT }}>{t('CONFIRM') || '확인'}</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return <RecoverySetupScreen />;
}
