import { View, Text } from 'react-native'
import { useAuth } from '../context/AuthContext'

export default function HomeScreen(){
  const {user}=useAuth()
  return (
    <View style={{flex:1,alignItems:'center',justifyContent:'center'}}>
      <Text style={{fontSize:20}}>{user? `Hello, ${user.id}`:'Home'}</Text>
    </View>
  )
}
