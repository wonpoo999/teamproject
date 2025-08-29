import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native'
import { useAuth } from '../context/AuthContext'

export default function LoginScreen({navigation}){
  const {login}=useAuth()
  const [id,setId]=useState('')
  const [password,setPassword]=useState('')

  const onSubmit=async()=>{
    if(!id||!password){ Alert.alert('입력 필요'); return }
    await login(id,password)
    navigation.replace('Home')
  }

  return (
    <View style={{flex:1,justifyContent:'center',padding:20,gap:12}}>
      <Text style={{fontSize:24,fontWeight:'700'}}>Login</Text>
      <TextInput value={id} onChangeText={setId} placeholder="ID" autoCapitalize="none" style={{borderWidth:1,borderColor:'#ddd',borderRadius:10,padding:12}}/>
      <TextInput value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry style={{borderWidth:1,borderColor:'#ddd',borderRadius:10,padding:12}}/>
      <TouchableOpacity onPress={onSubmit} style={{backgroundColor:'#2563eb',padding:14,borderRadius:10}}>
        <Text style={{color:'#fff',textAlign:'center'}}>Login</Text>
      </TouchableOpacity>
    </View>
  )
}
