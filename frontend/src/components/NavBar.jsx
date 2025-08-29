import { View, Text, Pressable } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '../context/AuthContext'

export default function NavBar(){
  const nav=useNavigation()
  const { user, logout } = useAuth()
  const insets = useSafeAreaInsets()
  return (
    <View style={{paddingTop:insets.top, backgroundColor:'#111827'}}>
      <View style={{height:52, paddingHorizontal:16, flexDirection:'row', alignItems:'center', justifyContent:'space-between'}}>
        <Pressable onPress={()=>nav.navigate('Home')}>
          <Text style={{color:'#fff', fontSize:20, fontWeight:'800'}}>MyApp</Text>
        </Pressable>
        <View style={{flexDirection:'row', alignItems:'center'}}>
          <Pressable onPress={()=>nav.navigate('Camera')} style={{paddingHorizontal:8, paddingVertical:6, marginLeft:8}}>
            <Text style={{color:'#fff', fontSize:16}}>Camera</Text>
          </Pressable>
          {!user && (
            <>
              <Pressable onPress={()=>nav.navigate('Login')} style={{paddingHorizontal:8, paddingVertical:6, marginLeft:8}}>
                <Text style={{color:'#fff', fontSize:16}}>Login</Text>
              </Pressable>
              <Pressable onPress={()=>nav.navigate('Signup')} style={{paddingHorizontal:8, paddingVertical:6, marginLeft:8}}>
                <Text style={{color:'#fff', fontSize:16}}>Sign Up</Text>
              </Pressable>
            </>
          )}
          {!!user && (
            <Pressable onPress={logout} style={{paddingHorizontal:8, paddingVertical:6, marginLeft:8}}>
              <Text style={{color:'#fff', fontSize:16}}>Logout</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  )
}
