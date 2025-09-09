import React from 'react';
import { Text as RNText } from 'react-native';
import { useI18n } from '../i18n/I18nContext';
import { fontForLang, lineH } from '../../src/components/fonts';

export default function Txt({ style, ...rest }) {
  const { lang } = useI18n();
  const size =
    (Array.isArray(style) ? style.find(s => s && s.fontSize)?.fontSize : style?.fontSize) || 16;

  return (
    <RNText
      {...rest}
      style={[
        { fontFamily: fontForLang(lang), lineHeight: lineH(size), includeFontPadding: true },
        style,
      ]}
    />
  );
}
