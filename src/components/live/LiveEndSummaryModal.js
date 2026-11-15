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

        {/* Host Avatar & Name */}
        <View style={styles.avatarWrapper}>
          <Image
            source={getUserAvatar(host)}
            style={styles.avatar}
          />
        </View>
        <Text style={styles.hostName}>{host?.name || 'YARO Host'}</Text>

        {/* Statistics Card */}
        <View style={styles.statsCard}>
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
    backgroundColor: '#3E3E42',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FF2A85',
    marginBottom: 40,
  },
  avatarWrapper: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  avatar: {
    width: 82,
    height: 82,
    borderRadius: 41,
  },
  hostName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 28,
  },
  statsCard: {
    width: '100%',
    backgroundColor: '#2A2A2E',
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 22,
    paddingHorizontal: 12,
    marginBottom: 40,
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
    borderRadius: 25,
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
