import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

const AuthContext = createContext(null)

export function AuthProvider({children}){
  const [user,setUser]=useState(null)
  const [token,setToken]=useState(null)
  const [ready,setReady]=useState(false)

  useEffect(()=>{
    ;(async()=>{
      const t=await AsyncStorage.getItem('token')
      const u=await AsyncStorage.getItem('user')
      if(t&&u){ setToken(t); setUser(JSON.parse(u)) }
      setReady(true)
    })()
  },[])

  const login=async (id,password,profile)=>{
    const t='demo-token'
    const u=profile||{id}
    await AsyncStorage.setItem('token',t)
    await AsyncStorage.setItem('user',JSON.stringify(u))
    setToken(t); setUser(u)
  }

  const signup=async (form)=>{
    await login(form.id, form.password, form)
  }

  const logout=async ()=>{
    await AsyncStorage.multiRemove(['token','user'])
    setToken(null); setUser(null)
  }

  const value=useMemo(()=>({user,token,ready,login,logout,signup}),[user,token,ready])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(){ return useContext(AuthContext) }
