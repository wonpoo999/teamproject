// src/ui/langFix.js
export const langFix = (lang) => {
  const baseLine = 22;

  if (lang === 'zh') {
    return {
      text: { includeFontPadding: true, paddingTop: 2, paddingBottom: 3 },
      input: {
        includeFontPadding: true,
        paddingTop: 18,
        paddingBottom: 6,
        minHeight: 50,
        lineHeight: baseLine + 6,
        textAlignVertical: 'center',
      },
    };
  }

  if (lang === 'ja') {
    return {
      text: { includeFontPadding: true, paddingTop: 2, paddingBottom: 2 },
      input: {
        includeFontPadding: true,
        paddingTop: 16,
        paddingBottom: 4,
        minHeight: 48,
        lineHeight: baseLine + 4,
        textAlignVertical: 'center',
      },
    };
  }

  // ko / en
  return {
    text: { includeFontPadding: true, paddingTop: 1, paddingBottom: 1 },
    input: {
      includeFontPadding: true,
      paddingTop: 14,
      paddingBottom: 4,
      minHeight: 48,
      lineHeight: baseLine,
      textAlignVertical: 'center',
    },
  };
};
