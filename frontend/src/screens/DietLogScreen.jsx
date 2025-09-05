import React, { Component } from 'react';
import { View, Text } from 'react-native';

export default class DietLogScreen extends Component {
  render() {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>🥗 식단 기록</Text>
      </View>
    );
  }
}

//  <IconLabeled
//               iconSrc={require('../../assets/icons/camera.png')}
//               labelSrc={require('../../assets/icons/camera_.png')}
//               to="Camera"
//             />