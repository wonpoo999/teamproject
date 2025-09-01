import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { apiPost } from '../config/api'

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

  const login=async(id,password)=>{
    const fauxUser={id}
    await AsyncStorage.setItem('token','local')
    await AsyncStorage.setItem('user',JSON.stringify(fauxUser))
    setToken('local'); setUser(fauxUser)
  }

  const signup=async(form)=>{
    const payload={
      id: form.id,
      password: form.password,
      weight: Number(form.weight),
      age: Number(form.age),
      gender: form.gender,
      height: Number(form.height)
    }
    const data = await apiPost('/api/auth/signup', payload)
    await AsyncStorage.setItem('token','local')
    await AsyncStorage.setItem('user', JSON.stringify(data))
    setToken('local'); setUser(data)
  }

  const logout=async()=>{
    await AsyncStorage.multiRemove(['token','user'])
    setToken(null); setUser(null)
  }

  const value=useMemo(()=>({user,token,ready,login,logout,signup}),[user,token,ready])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(){ return useContext(AuthContext) }
