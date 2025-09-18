// src/i18n/I18nContext.js

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DICT = {
  ko: {
    LOGIN:'로그인', SIGN_UP:'회원가입', EMAIL:'이메일', EMAIL_PH:'이메일',
    PASSWORD:'비밀번호', PW_PH:'비밀번호 (8자리 이상)', PASSWORD_MIN:'비밀번호 (8자리 이상)',
    PASSWORD_8:'비밀번호 (8자리 이상)', PASSWORD_CONFIRM:'새 비밀번호 확인', INPUT_REQUIRED:'입력 필요',
    ENTER_ID_PW:'아이디와 비밀번호를 입력해주세요.', TRY_AGAIN:'다시 시도해주세요.', CONFIRM:'확인',
    CANCEL:'취소', EDIT:'수정', EDIT_DONE:'수정 완료', LOADING:'불러오는 중…', LOGOUT:'로그아웃',
    GO_SIGNUP:'회원가입', FIND_ID:'아이디 찾기', PW_RECOVERY:'비밀번호 복구', REQUIRED:'필수 입력',
    REQUIRED_ALL:'모든 항목을 입력해 주세요.', FORMAT_ERROR:'형식 오류',
    PW_MIN_8:'비밀번호는 8자리 이상이어야 합니다.', NUM_ONLY:'숫자로 입력하세요.', PROCESSING:'처리 중…',
    CREATE_ACCOUNT:'계정 만들기', ALREADY_HAVE_ACCOUNT:'이미 계정이 있나요?',

    ERR_WRONG_PW:'비밀번호가 틀렸습니다.', ERR_NO_USER:'존재하지 않는 아이디입니다.',
    ERR_FORBIDDEN:'접근 권한이 없습니다.', ERR_INVALID_CRED:'아이디 또는 비밀번호가 올바르지 않습니다.',
    EMAIL_INVALID:'이메일 형식이 올바르지 않습니다.', PW_TOO_SHORT:'새 비밀번호는 8자 이상이어야 합니다.',
    PW_MISMATCH:'새 비밀번호 확인이 일치하지 않습니다.', UPDATE_OK:'수정이 완료되었습니다.',
    UPDATE_FAIL:'수정에 실패했습니다.', TRY_LATER:'나중에 다시 시도해 주세요.',

    PROFILE_TITLE:'프로필', ACCOUNT_INFO:'계정 정보', CURRENT_EMAIL:'현재 이메일',
    PROFILE_INFO:'프로필', WEIGHT:'체중(kg)', HEIGHT:'키(cm)', WEIGHT_KG:'체중(kg)',
    HEIGHT_CM:'키(cm)', AGE:'나이', GENDER:'성별', MALE:'남성', FEMALE:'여성', GENDER_MALE: '남성', GENDER_FEMALE: '여성',
    TARGET_WEIGHT:'목표 체중(kg)', TARGET_CALORIES:'목표 칼로리(kcal)',

    DARK:'다크', LIGHT:'라이트', PROFILE:'프로필', SETTINGS:'설정', RANKING:'랭킹', QUEST:'퀘스트',

    FOOD_LOG:'식단 기록', AT_A_GLANCE:'한눈에', HOME_MEAL:'식단 기록', HOME_DATA:'한눈에',
    HOME_OVERALL:'한눈에',

    ATTENDANCE:'출석', FIRST_DAY:'첫날',
    TOTAL_LOGIN_DAYS:'통산 로그인 일자',
    CONSECUTIVE_LOGIN_DAYS:'연속 로그인 일자',
    UNTIL_NEXT_TOTAL_LOGIN_BONUS:'다음 통산 로그인 보너스까지 앞으로',
    DETAILS: '자세히',
    INFORMATION:'정보',

    // 추가
    COINS:'코인',

    COIN_INFO:'코인 보너스 정보',
    LOGIN_COIN_IN:(d)=>`로그인 코인 득까지 앞으로 ${d}일 로그인`,
    WEEKLY_STREAK_BONUS_IN:(d)=>`연속 7일 보너스까지 앞으로 ${d}일 로그인`,
    MONTHLY_BONUS_COIN_IN:(d)=>`월별 보너스 코인 득까지 앞으로 ${d}일 로그인`,
    CLOSE:'닫기',

    LANGUAGE:'언어', SFX:'SFX', VOICE:'보이스', VOICE_SELECT:'보이스 선택', VOICE_CURRENT:'현재: 기본 보이스',
    LOG_OUT:'로그아웃',

    VOICE_PICK:'보이스 선택', USE_DEFAULT_VOICE:'기본 보이스 사용', PREVIEW:'미리듣기', SELECT:'선택', ALL:'전체',

    DAILY_QUESTS:'오늘의 일일 퀘스트', WALK:'걷기', START_SQUAT:'스쿼트 시작', START_PUSHUP:'푸시업 시작',
    RESET_QUESTS:'퀘스트 초기화',

    RECOVERY:'비밀번호 복구', RECOVERY_SETUP:'보안 질문', SECURITY_QNA:'보안 질문',
    SECURITY_QNA_OPTIONAL:'보안 질문 (선택)',
    SECURITY_DESC_SIGNUP:'아래 질문 중 원하시는 것을 입력하세요. 최소 2개 등록을 권장합니다.',
    SECURITY_POLICY:'비밀번호 복구: 최소 2개의 답변 필요. 아이디 복구: 5개 모두 필요. 5개 미만이면 비밀번호만 복구 가능합니다.',
    RECOVERY_REGISTER_DESC:'5개 질문 중 최소 2개 이상 정답/확인을 등록하세요.',
    RECOVERY_START_DESC:'아이디(이메일)를 입력하면 질문 2개가 출제됩니다.',
    RECOVERY_START_DESC_ID:'아이디 복구를 사용하려면 5개 모든 질문에 대한 답이 등록되어 있어야 합니다.',
    RECOVERY_ID:'아이디(이메일)', RECOVERY_START:'질문 받기', RECOVERY_ANSWER:'정답 제출',
    RECOVERY_NEW_PW:'새 비밀번호', RECOVERY_RESET:'비밀번호 재설정', ANSWER:'정답', ANSWER_CONFIRM:'정답 확인',
    QUESTION_BIRTHPLACE:'내가 태어난 곳은?', QUESTION_CHILDHOOD_AREA:'어린 시절 살던 동네는?', QUESTION_PET_NAME:'내 애완동물 이름은?',
    QUESTION_MOTHER_NAME:'내 어머니의 이름은?', QUESTION_ROLE_MODEL:'나의 롤모델은 누구인가?',

    LANG_KO_NATIVE:'한국어', LANG_EN_NATIVE:'English', LANG_JA_NATIVE:'日本語', LANG_ZH_NATIVE:'中文',
  },

  en: {
    LOGIN:'Login', SIGN_UP:'Sign up', EMAIL:'Email', EMAIL_PH:'Email',
    PASSWORD:'Password', PW_PH:'Password (min 8 chars)', PASSWORD_MIN:'Password (min 8 chars)',
    PASSWORD_8:'Password (min 8 chars)', PASSWORD_CONFIRM:'Confirm new password',
    INPUT_REQUIRED:'Input required', ENTER_ID_PW:'Please enter email and password.', TRY_AGAIN:'Please try again.',
    CONFIRM:'Confirm', CANCEL:'Cancel', EDIT:'Edit', EDIT_DONE:'Saved', LOADING:'Loading…',
    LOGOUT:'Log out', GO_SIGNUP:'Create account', FIND_ID:'Find ID', PW_RECOVERY:'Password recovery',
    REQUIRED:'Required', REQUIRED_ALL:'Please fill in all fields.', FORMAT_ERROR:'Format error',
    PW_MIN_8:'Password must be at least 8 characters.', NUM_ONLY:'Numbers only.', PROCESSING:'Processing…',
    CREATE_ACCOUNT:'Create account', ALREADY_HAVE_ACCOUNT:'Already have an account?',

    ERR_WRONG_PW:'Wrong password.', ERR_NO_USER:'User not found.', ERR_FORBIDDEN:'Forbidden.',
    ERR_INVALID_CRED:'Invalid email or password.', EMAIL_INVALID:'Invalid email format.',
    PW_TOO_SHORT:'New password must be at least 8 characters.', PW_MISMATCH:'Password confirmation does not match.',
    UPDATE_OK:'Updated successfully.', UPDATE_FAIL:'Failed to update.', TRY_LATER:'Please try again later.',

    PROFILE_TITLE:'PROFILE', ACCOUNT_INFO:'Account', CURRENT_EMAIL:'Current email',
    PROFILE_INFO:'Profile', WEIGHT:'Weight (kg)', HEIGHT:'Height (cm)', WEIGHT_KG:'Weight (kg)', HEIGHT_CM:'Height (cm)',
    AGE:'Age', GENDER:'Gender', GENDER_MALE: 'Male', GENDER_FEMALE: 'Female', MALE:'Male', FEMALE:'Female', TARGET_WEIGHT:'Target weight (kg)', TARGET_CALORIES:'Target calories (kcal)',

    DARK:'Dark', LIGHT:'Light', PROFILE:'Profile', SETTINGS:'Setting', RANKING:'Ranking', QUEST:'Quest',

    FOOD_LOG:'Food log', AT_A_GLANCE:'Overview', HOME_MEAL:'Food log', HOME_DATA:'Overview', HOME_OVERALL:'Overview',

    ATTENDANCE:'Attendance', FIRST_DAY:'First day',
    TOTAL_LOGIN_DAYS:'Total login days',
    CONSECUTIVE_LOGIN_DAYS:'Consecutive login days',
    UNTIL_NEXT_TOTAL_LOGIN_BONUS:'Until next total-login bonus',
    INFORMATION:'Information',

    // 추가
    COINS:'Coins', DETAILS: 'DETAILS',

    COIN_INFO:'Coin bonus info',
    LOGIN_COIN_IN:(d)=>`Daily login coin in ${d} day(s)`,
    WEEKLY_STREAK_BONUS_IN:(d)=>`7-day streak bonus in ${d} day(s)`,
    MONTHLY_BONUS_COIN_IN:(d)=>`Monthly bonus coin in ${d} day(s)`,
    CLOSE:'Close',

    LANGUAGE:'Language', SFX:'SFX', VOICE:'Voice', VOICE_SELECT:'Voice select', VOICE_CURRENT:'Voice current',
    LOG_OUT:'Log out',

    VOICE_PICK:'Voice selection', USE_DEFAULT_VOICE:'Use default voice', PREVIEW:'Preview', SELECT:'Select', ALL:'All',

    DAILY_QUESTS:'Today’s daily quests', WALK:'Walk', START_SQUAT:'Start squat', START_PUSHUP:'Start push-up',
    RESET_QUESTS:'Reset quests',

    RECOVERY:'Password recovery', RECOVERY_SETUP:'Security Q&A', SECURITY_QNA:'Security Q&A',
    SECURITY_QNA_OPTIONAL:'Security Q&A (optional)', SECURITY_DESC_SIGNUP:'Answer any questions you like. We recommend at least two.',
    SECURITY_POLICY:'Password recovery: at least 2 answers. ID recovery: all 5 answers required. With fewer than 5, only password recovery is allowed.',
    RECOVERY_REGISTER_DESC:'Register answers/confirmation for at least two of the five questions.',
    RECOVERY_START_DESC:'Enter your email to get 2 questions.', RECOVERY_START_DESC_ID:'ID recovery requires all 5 answers to be registered.',
    RECOVERY_ID:'Email', RECOVERY_START:'Get questions', RECOVERY_ANSWER:'Submit answers',
    RECOVERY_NEW_PW:'New password', RECOVERY_RESET:'Reset password', ANSWER:'Answer', ANSWER_CONFIRM:'Confirm',

    LANG_KO_NATIVE:'한국어', LANG_EN_NATIVE:'English', LANG_JA_NATIVE:'日本語', LANG_ZH_NATIVE:'中文',
  },

  ja: {
    LOGIN:'ログイン', SIGN_UP:'新規登録', EMAIL:'メール', EMAIL_PH:'メール',
    PASSWORD:'パスワード', PW_PH:'パスワード（8文字以上）', PASSWORD_MIN:'パスワード（8文字以上）',
    PASSWORD_8:'パスワード（8文字以上）', PASSWORD_CONFIRM:'新しいパスワード（確認）', INPUT_REQUIRED:'入力必須',
    ENTER_ID_PW:'メールとパスワードを入力してください。', TRY_AGAIN:'もう一度お試しください。', CONFIRM:'確認', CANCEL:'キャンセル',
    EDIT:'編集', EDIT_DONE:'保存しました', LOADING:'読み込み中…', LOGOUT:'ログアウト', GO_SIGNUP:'アカウント作成',
    FIND_ID:'ID 検索', PW_RECOVERY:'パスワード復旧', REQUIRED:'必須', REQUIRED_ALL:'すべて入力してください。',
    FORMAT_ERROR:'形式エラー', PW_MIN_8:'パスワードは8文字以上が必要です。', NUM_ONLY:'数値のみ入力してください。',
    PROCESSING:'処理中…', CREATE_ACCOUNT:'アカウント作成', ALREADY_HAVE_ACCOUNT:'すでにアカウントがありますか？',

    PROFILE_TITLE:'PROFILE', ACCOUNT_INFO:'アカウント', CURRENT_EMAIL:'現在のメール', PROFILE_INFO:'プロフィール',
    WEIGHT:'体重(kg)', HEIGHT:'身長(cm)', WEIGHT_KG:'体重(kg)', HEIGHT_CM:'身長(cm)', AGE:'年齢', GENDER:'性別', GENDER_MALE: '男性', GENDER_FEMALE: '女性',
    MALE:'男性', FEMALE:'女性', TARGET_WEIGHT:'目標体重(kg)', TARGET_CALORIES:'目標カロリー(kcal)',

    DARK:'ダーク', LIGHT:'ライト', PROFILE:'プロフィール', SETTINGS:'設定', RANKING:'ランキング', QUEST:'クエスト',

    FOOD_LOG:'食事記録', AT_A_GLANCE:'ひと目で', HOME_MEAL:'食事記録', HOME_DATA:'ひと目で', HOME_OVERALL:'概要',

    ATTENDANCE:'出席', FIRST_DAY:'初日',
    TOTAL_LOGIN_DAYS:'通算ログイン日数',
    CONSECUTIVE_LOGIN_DAYS:'連続ログイン日数',
    UNTIL_NEXT_TOTAL_LOGIN_BONUS:'次の通算ログインボーナスまで',
    INFORMATION:'情報', DETAILS: '詳細',

    CUM_LOGIN_DAYS:'通算ログイン日数',
    CONSEC_LOGIN_DAYS:'連続ログイン日数',
    NEXT_LOGIN_BONUS:'次の通算ログインボーナスまで',
    INFO:'情報',

    COIN_INFO:'コインボーナス情報',
    LOGIN_COIN_IN:(d)=>`ログインコインまで残り ${d}日`,
    WEEKLY_STREAK_BONUS_IN:(d)=>`7日連続ボーナスまで残り ${d}日`,
    MONTHLY_BONUS_COIN_IN:(d)=>`月間ボーナスコインまで残り ${d}日`,
    CLOSE:'閉じる',

    LANGUAGE:'言語', SFX:'SFX', VOICE:'ボイス', VOICE_SELECT:'ボイス選択', VOICE_CURRENT:'現在のボイス',
    LOG_OUT:'ログアウト',

    VOICE_PICK:'ボイス選択', USE_DEFAULT_VOICE:'デフォルトボイスを使用', PREVIEW:'試聴', SELECT:'選択', ALL:'すべて',

    DAILY_QUESTS:'本日のデイリークエスト', WALK:'ウォーキング', START_SQUAT:'スクワット開始', START_PUSHUP:'腕立て開始',
    RESET_QUESTS:'クエストをリセット',

    RECOVERY:'パスワード復旧', RECOVERY_SETUP:'セキュリティQ&A', SECURITY_QNA:'セキュリティQ&A',
    SECURITY_QNA_OPTIONAL:'セキュリティQ&A（任意）', SECURITY_DESC_SIGNUP:'お好きな質問に回答してください。最低2つの登録を推奨します。',
    SECURITY_POLICY:'パスワード復旧：2問以上。ID復旧：5問すべて必須。5未満の場合はパスワードのみ復旧可。',
    RECOVERY_REGISTER_DESC:'5問のうち少なくとも2問の回答/確認を登録してください。', RECOVERY_START_DESC:'メールを入力すると2問が出題されます。',
    RECOVERY_START_DESC_ID:'ID復旧には5問すべての回答登録が必要です。', RECOVERY_ID:'メール', RECOVERY_START:'質問を取得',
    RECOVERY_ANSWER:'回答送信', RECOVERY_NEW_PW:'新しいパスワード', RECOVERY_RESET:'パスワード再設定',
    ANSWER:'回答', ANSWER_CONFIRM:'確認',

    LANG_KO_NATIVE:'한국어', LANG_EN_NATIVE:'English', LANG_JA_NATIVE:'日本語', LANG_ZH_NATIVE:'中文',
  },

  zh: {
    LOGIN:'登录', SIGN_UP:'注册', EMAIL:'邮箱', EMAIL_PH:'邮箱',
    PASSWORD:'密码', PW_PH:'密码（至少8位）', PASSWORD_MIN:'密码（至少8位）',
    PASSWORD_8:'密码（至少8位）', PASSWORD_CONFIRM:'确认新密码', INPUT_REQUIRED:'需要输入',
    ENTER_ID_PW:'请输入邮箱和密码。', TRY_AGAIN:'请重试。', CONFIRM:'确定', CANCEL:'取消',
    EDIT:'编辑', EDIT_DONE:'已保存', LOADING:'加载中…', LOGOUT:'退出登录', GO_SIGNUP:'创建账户',
    REQUIRED:'必填', REQUIRED_ALL:'请填写所有项目。', FORMAT_ERROR:'格式错误',
    PW_MIN_8:'密码至少需要8位。', NUM_ONLY:'请输入数字。', PROCESSING:'处理中…',
    CREATE_ACCOUNT:'创建账户', ALREADY_HAVE_ACCOUNT:'已有账户？', ERR_WRONG_PW:'密码错误。',
    ERR_NO_USER:'找不到该用户。', ERR_FORBIDDEN:'无权限。', ERR_INVALID_CRED:'邮箱或密码不正确。',
    EMAIL_INVALID:'邮箱格式不正确。', PW_TOO_SHORT:'新密码至少需要8位。', PW_MISMATCH:'两次输入的密码不一致。',
    UPDATE_OK:'已成功更新。', UPDATE_FAIL:'更新失败。', TRY_LATER:'稍后再试。',

    PROFILE_TITLE:'PROFILE', ACCOUNT_INFO:'账户', CURRENT_EMAIL:'当前邮箱', PROFILE_INFO:'个人资料',
    WEIGHT:'体重(kg)', HEIGHT:'身高(cm)', WEIGHT_KG:'体重(kg)', HEIGHT_CM:'身高(cm)', AGE:'年龄', GENDER:'性别', GENDER_MALE: '男性', GENDER_FEMALE: '女性',
    MALE:'男', FEMALE:'女', TARGET_WEIGHT:'目标体重(kg)', TARGET_CALORIES:'目标卡路里(kcal)',

    DARK:'深色', LIGHT:'浅色', PROFILE:'个人资料', SETTINGS:'设置', RANKING:'排行榜', QUEST:'任务',

    FOOD_LOG:'饮食记录', AT_A_GLANCE:'一目了然', HOME_MEAL:'饮食记录', HOME_DATA:'一目了然', HOME_OVERALL:'总览',

    ATTENDANCE:'出勤', FIRST_DAY:'第一天',
    TOTAL_LOGIN_DAYS:'累计登录天数',
    CONSECUTIVE_LOGIN_DAYS:'连续登录天数',
    UNTIL_NEXT_TOTAL_LOGIN_BONUS:'距离下次累计登录奖励还需',
    INFORMATION:'信息', DETAILS: '详细',

    CUM_LOGIN_DAYS:'累计登录天数',
    CONSEC_LOGIN_DAYS:'连续登录天数',
    NEXT_LOGIN_BONUS:'距离下次累计登录奖励还需',
    INFO:'信息',

    COIN_INFO:'硬币奖励信息',
    LOGIN_COIN_IN:(d)=>`登录硬币还需登录 ${d} 天`,
    WEEKLY_STREAK_BONUS_IN:(d)=>`7天连登奖励还需 ${d} 天`,
    MONTHLY_BONUS_COIN_IN:(d)=>`月度奖励硬币还需 ${d} 天`,
    CLOSE:'关闭',

    LANGUAGE:'语言', SFX:'SFX', VOICE:'语音', VOICE_SELECT:'语音选择', VOICE_CURRENT:'当前语音',
    LOG_OUT:'退出登录',

    VOICE_PICK:'语音选择', USE_DEFAULT_VOICE:'使用默认语音', PREVIEW:'预听', SELECT:'选择', ALL:'全部',

    DAILY_QUESTS:'今日日常任务', WALK:'步行', START_SQUAT:'开始深蹲', START_PUSHUP:'开始俯卧撑',
    RESET_QUESTS:'重置任务',

    RECOVERY:'找回密码', RECOVERY_SETUP:'安全问答', SECURITY_QNA:'安全问答',
    SECURITY_QNA_OPTIONAL:'安全问答（可选）', SECURITY_DESC_SIGNUP:'从下列问题中任选回答，建议至少登记两项。',
    SECURITY_POLICY:'找回密码：至少2个答案。找回ID：5个答案全部必需。少于5个只能找回密码。',
    RECOVERY_REGISTER_DESC:'5个问题中至少登记2个的答案/确认。', RECOVERY_START_DESC:'输入邮箱后将出现2个问题。',
    RECOVERY_START_DESC_ID:'找回ID需要登记所有5个问题的答案。', RECOVERY_ID:'邮箱', RECOVERY_START:'获取问题',
    RECOVERY_ANSWER:'提交答案', RECOVERY_NEW_PW:'新密码', RECOVERY_RESET:'重置密码',
    ANSWER:'答案', ANSWER_CONFIRM:'确认',

    LANG_KO_NATIVE:'한국어', LANG_EN_NATIVE:'English', LANG_JA_NATIVE:'日本語', LANG_ZH_NATIVE:'中文',
  },
};

const Ctx = createContext(null);
export const useI18n = () => useContext(Ctx);

export function I18nProvider({ children }) {
  const [lang, setLang] = useState('ko');

  useEffect(() => {
    (async () => {
      const v = await AsyncStorage.getItem('@i18n/lang');
      if (v) setLang(v);
    })();
  }, []);

  const t = useMemo(() => {
    const table = DICT[lang] || DICT.ko;
    return (key) => {
      const v = table[String(key || '').trim()];
      return typeof v !== 'undefined' ? v : key;
    };
  }, [lang]);

  const value = useMemo(() => ({
    lang,
    t,
    setLang: async (next) => {
      const v = ['ko','en','ja','zh'].includes(next) ? next : 'ko';
      setLang(v);
      try { await AsyncStorage.setItem('@i18n/lang', v); } catch {}
    }
  }), [lang, t]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
