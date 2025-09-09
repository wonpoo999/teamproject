// src/components/fonts.js
export const fontForLang = (lang = 'ko') => {
  switch (lang) {
    case 'ja':
      return 'NotoJP';
    case 'zh': // 중국어(지금은 TC 파일이 있으므로 TC 사용)
      return 'NotoTC';
    default:
      return 'DungGeunMo';
  }
};
