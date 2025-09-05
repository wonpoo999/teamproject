import { createContext, useContext, useEffect, useState, useMemo } from 'react'
import * as SecureStore from 'expo-secure-store'
import { decode as atob } from 'base-64'
import { apiPost, setAuthToken, clearAuthToken } from '../config/api'

const Ctx = createContext(null)
export const useAuth = () => useContext(Ctx)

const goalKey = (userId) =>
  `goalsetup_${String(userId || '').replace(/[^a-zA-Z0-9._-]/g, '_')}`

export default function AuthProvider({ children }) {
  const [ready, setReady] = useState(false)
  const [isAuthenticated, setAuthed] = useState(false)
  const [user, setUser] = useState(null)
  const [needsGoalSetup, setNeedsGoalSetup] = useState(false)

  const parseJwt = (tokenWithPrefix) => {
    try {
      const raw = String(tokenWithPrefix || '').replace(/^Bearer\s+/i, '')
      const payload = raw.split('.')[1]
      const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
      return json || {}
    } catch {
      return {}
    }
  }

  const loadGoalFlag = async (userId) => {
    if (!userId) return false
    const v = await SecureStore.getItemAsync(goalKey(userId))
    return v !== '1'
  }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const token = await SecureStore.getItemAsync('accessToken')
        if (!mounted) return
        if (token) {
          setAuthToken(token)
          let uid = null
          try {
            const payload = parseJwt(token)
            uid = payload.sub ?? null
          } catch {}
          if (!mounted) return
          setUser({ id: uid })
          setAuthed(true)
          try {
            const need = await loadGoalFlag(uid)
            if (mounted) setNeedsGoalSetup(need)
          } catch (e) {
            console.log('[auth] loadGoalFlag error:', e)
          }
        }
      } catch (e) {
        console.log('[auth] bootstrap error:', e)
      } finally {
        if (mounted) setReady(true)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const login = async (id, password) => {
    const res = await apiPost('/api/auth/login', { id, password })
    const token = `${res.tokenType} ${res.token}`
    await SecureStore.setItemAsync('accessToken', token)
    setAuthToken(token)
    const userId = res.id ?? parseJwt(token).sub ?? id
    setUser({ id: userId })
    setAuthed(true)
    setNeedsGoalSetup(await loadGoalFlag(userId))
    return true
  }

  const logout = async () => {
    try {
      await apiPost('/api/auth/logout', {})
    } catch {}
    await SecureStore.deleteItemAsync('accessToken')
    clearAuthToken()
    setUser(null)
    setAuthed(false)
    setNeedsGoalSetup(false)
  }

  const markGoalDone = async () => {
    const uid = user?.id
    if (!uid) return
    await SecureStore.setItemAsync(goalKey(uid), '1')
    setNeedsGoalSetup(false)
  }

  const value = useMemo(
    () => ({
      ready,
      isAuthenticated,
      user,
      needsGoalSetup,
      login,
      logout,
      markGoalDone,
    }),
    [ready, isAuthenticated, user, needsGoalSetup]
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
