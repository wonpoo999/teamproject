// src/audio/compat.js
let AudioModule = null;

try {
  // Expo SDK 52+의 expo-audio
  // eslint-disable-next-line import/no-extraneous-dependencies
  AudioModule = require('expo-audio').Audio;
} catch (e1) {
  try {
    // 폴백: 예전 expo-av
    // eslint-disable-next-line import/no-extraneous-dependencies
    AudioModule = require('expo-av').Audio;
    console.warn('[audio] expo-audio not found. Falling back to expo-av.');
  } catch (e2) {
    throw new Error('No audio module found. Install "expo-audio" (or expo-av).');
  }
}

export const Audio = AudioModule;
