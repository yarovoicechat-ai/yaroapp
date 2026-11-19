import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

interface GameLoadingProps {
  message?: string;
}

export const GameLoading: React.FC<GameLoadingProps> = ({
  message = 'Loading Cocos 3.8.x Game Engine...',
}) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#FF007F" />
      <Text style={styles.message}>{message}</Text>
      <Text style={styles.subMessage}>Connecting to verified game server...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    padding: 24,
  },
  message: {
    marginTop: 14,
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
    textAlign: 'center',
  },
  subMessage: {
    marginTop: 6,
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
  },
});
