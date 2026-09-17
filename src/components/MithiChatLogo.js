import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

/**
 * Yaro wordmark. The component name remains stable so legacy callers do not
 * need navigation or business-logic changes.
 */
const MithiChatLogo = ({ style, size }) => {
  const iconDimension = size || Math.min(width * 0.45, 170);
  const fontSize = Math.round(iconDimension * 0.43);

  return (
    <View style={[styles.container, { width: iconDimension, height: iconDimension }, style]}>
      <View style={styles.wordmarkRow}>
        <Text
          allowFontScaling={false}
          style={[styles.wordmark, { fontSize, lineHeight: Math.round(fontSize * 1.08) }]}
        >
          Yaro
        </Text>
        <Text
          allowFontScaling={false}
          style={[styles.heart, { fontSize: Math.round(fontSize * 0.36), top: -Math.round(fontSize * 0.14) }]}
        >
          ♥
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wordmark: {
    color: '#7A35EB',
    fontWeight: '900',
    letterSpacing: -3,
    shadowColor: '#C026D3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
  },
  heart: {
    color: '#F22589',
    fontWeight: '900',
    marginLeft: -4,
  },
});

export default MithiChatLogo;
