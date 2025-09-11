// src/components/fonts.js
// 언어별 기본 폰트 선택 (폴백 금지)
export function fontForLang(lang = 'ko') {
  switch (lang) {
    case 'ja':
      // 일본어: 픽셀 M+ 12
      return 'PixelMplus12';
    case 'zh':
      // 중국어: zpix
      return 'Zpix';
    default:
      // 한국어/영어: 둥근모
      return 'DungGeunMo';
  }
}
