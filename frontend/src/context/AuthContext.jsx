import { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiPost, setAuthToken, clearAuthToken } from "../config/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const t = await AsyncStorage.getItem("token");
      const u = await AsyncStorage.getItem("user");
      if (t) {
        setToken(t);
        setAuthToken(t);
      }
      if (u) setUser(JSON.parse(u));
      setReady(true);
    })();
  }, []);

  const login = async (id, password) => {
    const payload = { id: String(id || "").trim(), password: String(password || "") };
    const data = await apiPost("/api/auth/login", payload);
    const finalToken = data?.token;
    if (!finalToken) throw new Error("서버에서 토큰을 받지 못했어요.");
    await AsyncStorage.setItem("token", finalToken);
    await AsyncStorage.setItem("user", JSON.stringify(data));
    setToken(finalToken);
    setUser(data);
    setAuthToken(finalToken);
    return true;
  };

  const signup = async (form) => {
    const data = await apiPost("/api/auth/signup", {
      id: String(form.id || "").trim(),
      password: String(form.password || ""),
      weight: Number(form.weight),
      age: Number(form.age),
      gender: String(form.gender || "F").toUpperCase(),
      height: Number(form.height),
    });
    const bodyToken = data?.token;
    const headerToken = await AsyncStorage.getItem("__latest_header_token");
    const finalToken = bodyToken || headerToken || "local";
    await AsyncStorage.setItem("token", finalToken);
    await AsyncStorage.setItem("user", JSON.stringify(data));
    setToken(finalToken);
    setUser(data);
    setAuthToken(finalToken);
    return true;
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(["token", "user", "__latest_header_token"]);
    setToken(null);
    setUser(null);
    clearAuthToken();
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
