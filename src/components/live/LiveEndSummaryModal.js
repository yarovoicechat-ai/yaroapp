import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { getUserAvatar } from '../../utils/avatarUtil';

export default function LiveEndSummaryModal({
  visible,
  onReturnHome,
  host,
  durationText = '00min 00s',
  income = 0,
  viewerCount = 0,
}) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={onReturnHome}
    >
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1E1E24" />

        <Text style={styles.title}>Live has ended</Text>

        {/* Unified Summary Card (matching reference Screenshot) */}
        <View style={styles.mainCard}>
          {/* Host Avatar & Name */}
          <View style={styles.avatarWrapper}>
            <Image
              source={getUserAvatar(host)}
              style={styles.avatar}
            />
          </View>
          <Text style={styles.hostName}>{host?.name || 'YARO Host'}</Text>

          {/* Thin Divider Line */}
          <View style={styles.divider} />

          {/* Statistics Row */}
          <View style={styles.statsRow}>
            <View style={styles.statColumn}>
              <Text style={styles.statValue}>{durationText}</Text>
              <Text style={styles.statLabel}>Live duration</Text>
            </View>
            <View style={styles.statColumn}>
              <Text style={styles.statValue}>{income}</Text>
              <Text style={styles.statLabel}>Income</Text>
            </View>
            <View style={styles.statColumn}>
              <Text style={styles.statValue}>{viewerCount}</Text>
              <Text style={styles.statLabel}>Viewers</Text>
            </View>
          </View>
        </View>

        {/* Return to homepage button */}
        <TouchableOpacity
          onPress={onReturnHome}
          activeOpacity={0.85}
          style={styles.buttonWrapper}
        >
          <LinearGradient
            colors={['#FF007F', '#B000FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>Return to homepage</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#38383D',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FF2A85',
    marginBottom: 32,
    letterSpacing: 0.3,
  },
  mainCard: {
    width: '100%',
    backgroundColor: '#26262B',
    borderRadius: 20,
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 22,
    paddingHorizontal: 16,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  avatarWrapper: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    overflow: 'hidden',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  hostName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  divider: {
    width: '100%',
    height: StyleSheet.hairlineWidth || 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    marginBottom: 20,
  },
  statsRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statColumn: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  buttonWrapper: {
    width: '100%',
    borderRadius: 26,
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 26,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
