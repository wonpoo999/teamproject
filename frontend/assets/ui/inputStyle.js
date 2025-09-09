// src/ui/inputStyle.js
export const makeInputStyle = (colors, lang, fontSize = 16) => ({
  borderWidth: 1,
  borderColor: colors.inputBorder,
  backgroundColor: colors.inputBg,
  borderRadius: 12,
  paddingHorizontal: 12,
  paddingVertical: 14 + ((lang === 'ja' || lang === 'zh') ? 2 : 0),
  minHeight: 48,
  fontSize,
  lineHeight: Math.max(fontSize + 4, 22),
  textAlignVertical: 'center',
  color: colors.text,
  fontFamily: 'DungGeunMo',
});
