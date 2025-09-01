import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

const EMU = Platform.OS==='android' ? '10.0.2.2' : 'localhost'
const DEFAULT_BASE = __DEV__ ? (process.env.EXPO_PUBLIC_API_BASE || `http://${EMU}:8080`) : process.env.EXPO_PUBLIC_API_BASE

export async function getApiBase(){ const v=await AsyncStorage.getItem('api_base'); return v||DEFAULT_BASE }
export async function setApiBase(v){ await AsyncStorage.setItem('api_base', v) }

export async function apiGet(path){
  const base=await getApiBase()
  const res=await fetch(`${base}${path}`)
  const t=await res.text()
  const d=t?JSON.parse(t):null
  if(!res.ok) throw new Error(d?.message||t||String(res.status))
  return d
}

export async function apiPost(path, body){
  const base=await getApiBase()
  const res=await fetch(`${base}${path}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
  const t=await res.text()
  const d=t?JSON.parse(t):null
  if(!res.ok) throw new Error(d?.message||t||String(res.status))
  return d
}
