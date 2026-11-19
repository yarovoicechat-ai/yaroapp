import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface GameErrorProps {
  error?: string;
  onRetry: () => void;
  onClose: () => void;
}

export const GameError: React.FC<GameErrorProps> = ({
  error = 'Could not establish connection to the game server.',
  onRetry,
  onClose,
}) => {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name="alert-circle-outline" size={44} color="#EF4444" />
      <Text style={styles.title}>Game Connection Error</Text>
      <Text style={styles.message}>{error}</Text>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          onPress={onClose}
          style={[styles.btn, styles.cancelBtn]}
          accessibilityLabel="Cancel"
        >
          <Text style={styles.cancelText}>Close</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onRetry}
          style={[styles.btn, styles.retryBtn]}
          accessibilityLabel="Retry"
        >
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
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
  title: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  message: {
    marginTop: 6,
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  btn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  retryBtn: {
    backgroundColor: '#FF007F',
  },
  cancelText: {
    color: '#CBD5E1',
    fontWeight: '700',
    fontSize: 13,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
});
