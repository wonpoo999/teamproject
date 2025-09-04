import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function MainScreen({ navigation }) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      {/* 캐릭터 자리 */}
      <Text style={{ fontSize: 40 }}>🐯</Text>

      {/* 캐릭터 위 좌우 버튼 */}
      <View style={styles.topContainer}>
        <TouchableOpacity
          style={styles.box}
          onPress={() => navigation.navigate('DietLog')}
        >
          <Text style={styles.boxText}>식단 기록</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.box}
          onPress={() => navigation.navigate('WeightCompare')}
        >
          <Text style={styles.boxText}>체중 비교</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topContainer: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 20,
  },
  box: {
    backgroundColor: 'tomato',
    padding: 10,
    borderRadius: 8,
  },
  boxText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
