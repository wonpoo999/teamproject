import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { apiGet, API_BASE_DEBUG } from '../config/api';

export default function SettingsScreen() {
  const [loading, setLoading] = useState(false);
  const [base, setBase] = useState('');

  useEffect(() => {
    setBase(API_BASE_DEBUG); 
  }, []);

  const ping = async () => {
    try {
      setLoading(true);
      const r = await apiGet('/api/ping');
      Alert.alert('PING', typeof r === 'string' ? r : JSON.stringify(r));
    } catch (e) {
      Alert.alert('실패', String(e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex:1, padding:20, gap:12 }}>
      <Text style={{ fontSize:16, color:'#6b7280' }}>Detected Base</Text>
      <Text style={{ fontSize:18, fontWeight:'700' }}>{base}</Text>

      <TouchableOpacity
        onPress={ping}
        disabled={loading}
        style={{ backgroundColor:'#10b981', padding:12, borderRadius:10, opacity:loading?0.6:1 }}
      >
        <Text style={{ color:'#fff', textAlign:'center' }}>
          {loading ? '확인 중…' : '/api/ping 테스트'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
