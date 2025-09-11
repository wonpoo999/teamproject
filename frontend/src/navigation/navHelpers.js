// src/navigation/navHelpers.js
export function resetToLogin(navigation) {
  navigation.reset({
    index: 0,
    routes: [{ name: 'Login' }],   // ✅ 존재하는 라우트만 사용
  });
}
