import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface GameControlsProps {
  onClearBets?: () => void;
  onRefreshBalance?: () => void;
  disabled?: boolean;
}

export const GameControls: React.FC<GameControlsProps> = ({
  onClearBets,
  onRefreshBalance,
  disabled = false,
}) => {
  return (
    <View style={styles.container}>
      {Boolean(onClearBets) && (
        <TouchableOpacity
          onPress={onClearBets}
          disabled={disabled}
          style={[styles.btn, styles.clearBtn, disabled && styles.btnDisabled]}
          accessibilityLabel="Clear Bets"
        >
          <MaterialCommunityIcons name="backup-restore" size={16} color="#CBD5E1" />
          <Text style={styles.clearText}>Clear Bets</Text>
        </TouchableOpacity>
      )}

      {Boolean(onRefreshBalance) && (
        <TouchableOpacity
          onPress={onRefreshBalance}
          disabled={disabled}
          style={[styles.btn, styles.refreshBtn, disabled && styles.btnDisabled]}
          accessibilityLabel="Sync Balance"
        >
          <MaterialCommunityIcons name="sync" size={16} color="#FFD700" />
          <Text style={styles.refreshText}>Sync Balance</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    gap: 8,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  clearBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  refreshBtn: {
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.25)',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  clearText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  refreshText: {
    color: '#FFD700',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },
});
