import React from 'react';
import {
  View,
  Image,
  StyleSheet,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');
const YaroLogoImg = require('../assets/yaro_logo.png');

/**
 * Yaro mascot and brand logo component.
 */
const MithiChatLogo = ({ style, size }) => {
  const iconDimension = size || Math.min(width * 0.45, 170);

  return (
    <View style={[styles.container, { width: iconDimension, height: iconDimension }, style]}>
      <Image
        source={YaroLogoImg}
        style={{
          width: iconDimension,
          height: iconDimension,
          borderRadius: Math.round(iconDimension * 0.22),
        }}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default MithiChatLogo;

