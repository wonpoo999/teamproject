import { Platform } from 'react-native'

const EMU = Platform.OS==='android' ? '10.0.2.2' : 'localhost'
export const API_BASE = __DEV__ ? (process.env.EXPO_PUBLIC_API_BASE || `http://${EMU}:8080`) : process.env.EXPO_PUBLIC_API_BASE

export async function apiPost(path, body){
  const res = await fetch(`${API_BASE}${path}`, {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify(body)
  })
  const text = await res.text()
  const data = text ? JSON.parse(text) : null
  if(!res.ok) throw new Error(`${res.status} ${text}`)
  return data
}
