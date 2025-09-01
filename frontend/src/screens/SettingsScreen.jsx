import { useEffect, useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native'
import { getApiBase, setApiBase, apiGet } from '../config/api'

export default function SettingsScreen(){
  const [url,setUrl]=useState('')
  const [loading,setLoading]=useState(false)

  useEffect(()=>{ (async()=>{ setUrl(await getApiBase()) })() },[])

  const save=async()=>{ await setApiBase(url.trim()); Alert.alert('저장됨') }
  const ping=async()=>{
    try{ setLoading(true); const r=await apiGet('/ping'); Alert.alert('PING', JSON.stringify(r)) }
    catch(e){ Alert.alert('실패', String(e)) }
    finally{ setLoading(false) }
  }

  return (
    <View style={{flex:1,padding:20,gap:12}}>
      <Text style={{fontSize:20,fontWeight:'700'}}>API Base URL</Text>
      <TextInput value={url} onChangeText={setUrl} placeholder="http://192.168.x.x:8080" autoCapitalize="none" style={{borderWidth:1,borderColor:'#ddd',borderRadius:10,padding:12}}/>
      <TouchableOpacity onPress={save} style={{backgroundColor:'#111827',padding:12,borderRadius:10}}>
        <Text style={{color:'#fff',textAlign:'center'}}>저장</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={ping} disabled={loading} style={{backgroundColor:'#10b981',padding:12,borderRadius:10,opacity:loading?0.6:1}}>
        <Text style={{color:'#fff',textAlign:'center'}}>{loading?'확인 중…':'/ping 테스트'}</Text>
      </TouchableOpacity>
    </View>
  )
}
