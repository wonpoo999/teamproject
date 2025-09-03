import { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiPost } from "../config/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [ready, setReady] = useState(false);      
  const [loading, setLoading] = useState(false);  
  const safeParse = (str) => {
    try { return JSON.parse(str); } catch { return null; }
  };


  useEffect(() => {
    (async () => {
      try {
        const [t, u] = await AsyncStorage.multiGet(["token", "user"]);
        const tokenVal = t?.[1] || null;
        const userVal = u?.[1] ? safeParse(u[1]) : null;

        if (tokenVal && userVal?.id) {
          setToken(tokenVal);
          setUser(userVal);
        } else {
          await AsyncStorage.multiRemove(["token", "user"]);
        }
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const persistAuth = async (bearer, userData) => {
    await AsyncStorage.multiSet([
      ["token", bearer],
      ["user", JSON.stringify(userData)],
    ]);
    setToken(bearer);
    setUser(userData);
  };

  const login = async (id, password) => {
    setLoading(true);
    try {
      const body = { id: String(id || "").trim(), password: String(password || "") };
      if (!body.id || !body.password) return false;

      const res = await apiPost("/api/auth/login", body);
      const tok = res?.token || res?.accessToken;
      const type = res?.tokenType || res?.token_type || "Bearer";
      if (!tok) return false;

      const bearer = `${type} ${tok}`;
      const userData = { id: res?.id ?? body.id };

      await persistAuth(bearer, userData);
      return true;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (form) => {
    setLoading(true);
    try {
      const id = String(form?.id || "").trim();
      const password = String(form?.password || "");
      const age = Number(form?.age);
      const height = Number(form?.height);
      const weight = Number(form?.weight);
      const genderRaw = String(form?.gender || "F").toUpperCase();
      const gender = genderRaw === "M" ? "M" : "F";

      if (!id || !password || Number.isNaN(age) || Number.isNaN(height) || Number.isNaN(weight)) {
        return false;
      }

      await apiPost("/api/auth/signup", {
        id, password, age, height, weight, gender,
      });

      const ok = await login(id, password);
      return ok;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.multiRemove(["token", "user"]);
    } finally {
      setToken(null);
      setUser(null);
    }
  };

  const value = useMemo(
    () => ({
      user,
      token,
      ready,
      loading,
      isAuthenticated: !!user && !!token,
      login,
      logout,
      signup,
    }),
    [user, token, ready, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
