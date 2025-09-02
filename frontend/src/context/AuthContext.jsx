import { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiPost } from "../config/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const t = await AsyncStorage.getItem("token");
      const u = await AsyncStorage.getItem("user");
      if (t && u) {
        setToken(t);
        setUser(JSON.parse(u));
      }
      setReady(true);
    })();
  }, []);

const login = async (id, password) => {
    try {
        // 백엔드 로그인 API로 POST 요청을 보냅니다.
        const response = await apiPost("/api/auth/login", { id, password });
        
        // 응답으로 받은 토큰과 사용자 정보를 저장합니다.
        await AsyncStorage.setItem("token", response.token);

        // response.id를 user 객체로 저장
        const userData = { id: response.id };
        await AsyncStorage.setItem("user", JSON.stringify(userData));

        setToken(response.token);
        setUser(userData);
        return true;
    } catch (error) {
        console.error("Login failed:", error);
        return false;
    }
};
  const signup = async (form) => {
    try {
      await apiPost("/api/auth/signup", {
        id: String(form.id || "").trim(),
        password: String(form.password || ""),
        weight: Number(form.weight),
        age: Number(form.age),
        gender: String(form.gender || "F").toUpperCase(),
        height: Number(form.height),
      });
      const loginSuccess = await login(form.id, form.password);
      return loginSuccess;
    } catch (error) {
      console.error("Signup failed:", error);
      return false;
    }
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(["token", "user"]);
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, token, ready, login, logout, signup }),
    [user, token, ready]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
