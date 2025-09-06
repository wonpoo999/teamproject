import { View, ScrollView, TouchableOpacity, Text, Switch } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '../context/AuthContext'

// >>> [ADDED] i18n
import { useI18n } from '../i18n/I18nContext' // <<< NEW
import { useState, useEffect } from 'react' // <<< NEW
import AsyncStorage from '@react-native-async-storage/async-storage' // <<< NEW

export default function SettingsScreen() {
  const { logout } = useAuth()
  const insets = useSafeAreaInsets()
  const { t, lang, setLang } = useI18n() // >>> [ADDED]

  const [sfx, setSfx] = useState(true) // >>> [ADDED] 효과음 on/off (UI만)
  useEffect(() => { (async () => {
    const v = await AsyncStorage.getItem('@settings/sfx')
    if (v != null) setSfx(v === '1')
  })() }, [])
  const toggleSfx = async () => {
    const next = !sfx
    setSfx(next)
    try { await AsyncStorage.setItem('@settings/sfx', next ? '1' : '0') } catch {}
  }

  const onLogout = async () => {
    await logout()
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top, paddingHorizontal: 20, paddingBottom: 20, rowGap: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: '700' }}>{t('SETTINGS')}</Text>

        {/* >>> [ADDED] 언어 변경 */}
        <View style={{ marginTop: 20, gap: 10 }}>
          <Text style={{ fontWeight: '700' }}>{t('LANGUAGE')}</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {[
              { k: 'ko', label: '한국어' },
              { k: 'en', label: 'English' },
              { k: 'ja', label: '日本語' },
              { k: 'zh', label: '中文' },
            ].map(item => (
              <TouchableOpacity
                key={item.k}
                onPress={() => setLang(item.k)}
                style={{
                  paddingHorizontal: 12, paddingVertical: 8,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: lang === item.k ? '#111827' : '#ddd',
                  backgroundColor: lang === item.k ? '#111827' : 'white'
                }}
              >
                <Text style={{ color: lang === item.k ? 'white' : '#111827' }}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* >>> [ADDED] 효과음 on/off (버튼만 구현) */}
        <View style={{ marginTop: 20, gap: 10, flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontWeight: '700', marginRight: 8 }}>{t('SOUND')}</Text>
          <Switch value={sfx} onValueChange={toggleSfx} />
          <Text style={{ marginLeft: 8 }}>{sfx ? t('ON') : t('OFF')}</Text>
        </View>

        <View style={{ height: 24 }} />
        <TouchableOpacity onPress={onLogout} style={{ backgroundColor: '#ef4444', padding: 14, borderRadius: 10, marginTop: 40 }}>
          <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '700' }}>{t('LOGOUT')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}
