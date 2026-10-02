import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';

export default function DiamondBalance({
  balance = 0,
  requiredAmount = 0,
  lastDeduction = 0,
  onTopUp,
}) {
  const isInsufficient = requiredAmount > 0 && balance < requiredAmount;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (lastDeduction > 0) {
      floatAnim.setValue(0);
      opacityAnim.setValue(1);

      Animated.parallel([
        Animated.timing(floatAnim, {
          toValue: -20,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [lastDeduction, floatAnim, opacityAnim]);

  return (
    <View style={styles.container}>
      <View style={styles.balanceCol}>
        <View style={styles.balanceRow}>
          <Text style={styles.diamondIcon}>💎</Text>
          <Text style={styles.balanceValue}>{balance.toLocaleString()}</Text>
          <Text style={styles.balanceLabel}>Diamonds</Text>

          {/* Floating -X Diamonds indicator */}
          {lastDeduction > 0 && (
            <Animated.View
              style={[
                styles.deductionBadge,
                {
                  opacity: opacityAnim,
                  transform: [{ translateY: floatAnim }],
                },
              ]}
            >
              <Text style={styles.deductionText}>-{lastDeduction}</Text>
            </Animated.View>
          )}
        </View>

        {isInsufficient && (
          <View style={styles.insufficientRow}>
            <Icon name="alert-circle" size={11} color="#EF4444" />
            <Text style={styles.insufficientText}>
              Need {requiredAmount.toLocaleString()} Diamonds
            </Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={styles.topUpButton}
        onPress={onTopUp}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#F59E0B', '#D97706']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.topUpGradient}
        >
          <Text style={styles.topUpText}>RECHARGE</Text>
          <Icon name="chevron-forward" size={12} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  balanceCol: {
    flexDirection: 'column',
    justifyContent: 'center',
    position: 'relative',
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  diamondIcon: {
    fontSize: 16,
  },
  balanceValue: {
    color: '#F8FAFC',
    fontSize: 14.5,
    fontWeight: '800',
  },
  balanceLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  deductionBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
    marginLeft: 6,
  },
  deductionText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  insufficientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  insufficientText: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '600',
  },
  topUpButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  topUpGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 2,
  },
  topUpText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
