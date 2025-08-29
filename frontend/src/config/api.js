import { Platform } from 'react-native'

const EMU = Platform.OS==='android' ? '10.0.2.2' : 'localhost'
const DEV = `http://${EMU}:8080`

export const API_BASE = __DEV__ ? (process.env.EXPO_PUBLIC_API_BASE || DEV) : process.env.EXPO_PUBLIC_API_BASE

export async function api(path, opts={}){
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type':'application/json', ...(opts.headers||{}) },
    ...opts
  })
  const text = await res.text()
  const data = text ? JSON.parse(text) : null
  if(!res.ok) throw new Error(String(res.status))
  return data
}
