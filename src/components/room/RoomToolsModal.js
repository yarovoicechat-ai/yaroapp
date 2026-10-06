import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function RoomToolsModal({
  visible,
  onClose,
  isMuted,
  onToggleMic,
  onFollowRoom,
  onTakeSeat,
  onRoomSettings,
  onLockSeats,
  onClearChat,
  onOpenMusic,
  onOpenSeatSettings,
  onOpenThemeModal,
  onOpenSeatSkinModal,
  seatCount = 8,
  isHost,
  bottomSafePadding = 16,
}) {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <TouchableOpacity
          style={styles.backdropDismissArea}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={[styles.sheetContainer, { paddingBottom: bottomSafePadding + 16 }]} pointerEvents="auto">
          <View style={styles.sheetHandle} />

          {/* Top Quick Actions: Follow the room + Take a seat */}
          <View style={styles.topPillsRow}>
            <TouchableOpacity
              style={styles.actionPillBtn}
              onPress={() => {
                onClose();
                onFollowRoom && onFollowRoom();
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.actionPillText}>Follow the room</Text>
              <View style={styles.actionPillIconCircle}>
                <Icon name="star-outline" size={16} color="#FFF" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionPillBtn}
              onPress={() => {
                onClose();
                onTakeSeat && onTakeSeat();
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.actionPillText}>Take a seat</Text>
              <View style={styles.actionPillIconCircle}>
                <MaterialCommunityIcons name="chair-rolling" size={16} color="#FFF" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Section Title */}
          <Text style={styles.sectionTitle}>Room Tools</Text>

          {/* Tools Grid / Row */}
          <View style={styles.toolsRow}>
            {/* Mute */}
            <TouchableOpacity
              style={styles.toolCol}
              onPress={() => {
                onClose();
                onToggleMic && onToggleMic();
              }}
              activeOpacity={0.8}
            >
              <View style={[styles.toolCircle, isMuted && styles.toolCircleMuted]}>
                <Icon name={isMuted ? 'volume-mute' : 'volume-high'} size={22} color="#8B5CF6" />
              </View>
              <Text style={styles.toolLabel}>Mute</Text>
            </TouchableOpacity>

            {/* Music Player */}
            <TouchableOpacity
              style={styles.toolCol}
              onPress={() => {
                onClose();
                setTimeout(() => {
                  onOpenMusic && onOpenMusic();
                }, 450);
              }}
              activeOpacity={0.8}
            >
              <View style={[styles.toolCircle, { borderColor: '#C084FC' }]}>
                <MaterialCommunityIcons name="music" size={22} color="#C084FC" />
              </View>
              <Text style={styles.toolLabel}>Music 🎵</Text>
            </TouchableOpacity>

            {/* Broadcast */}
            <TouchableOpacity
              style={styles.toolCol}
              onPress={() => {
                onClose();
              }}
              activeOpacity={0.8}
            >
              <View style={styles.toolCircle}>
                <MaterialCommunityIcons name="bullhorn-outline" size={22} color="#8B5CF6" />
              </View>
              <Text style={styles.toolLabel}>Broadcast</Text>
            </TouchableOpacity>

            {/* Seat Layout (if host) */}
            {isHost && (
              <TouchableOpacity
                style={styles.toolCol}
                onPress={() => {
                  onClose();
                  setTimeout(() => {
                    onOpenSeatSettings && onOpenSeatSettings();
                  }, 450);
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.toolCircle, { borderColor: '#F59E0B' }]}>
                  <MaterialCommunityIcons name="seat-passenger" size={22} color="#F59E0B" />
                </View>
                <Text style={styles.toolLabel}>Seats ({seatCount || 8})</Text>
              </TouchableOpacity>
            )}

            {/* Room Settings (if host) */}
            {isHost && (
              <TouchableOpacity
                style={styles.toolCol}
                onPress={() => {
                  onClose();
                  onRoomSettings && onRoomSettings();
                }}
                activeOpacity={0.8}
              >
                <View style={styles.toolCircle}>
                  <MaterialCommunityIcons name="cog-outline" size={22} color="#8B5CF6" />
                </View>
                <Text style={styles.toolLabel}>Settings</Text>
              </TouchableOpacity>
            )}

            {/* Lock Seats */}
            {isHost && (
              <TouchableOpacity
                style={styles.toolCol}
                onPress={() => {
                  onClose();
                  onLockSeats && onLockSeats();
                }}
                activeOpacity={0.8}
              >
                <View style={styles.toolCircle}>
                  <MaterialCommunityIcons name="lock-outline" size={22} color="#8B5CF6" />
                </View>
                <Text style={styles.toolLabel}>Lock Seats</Text>
              </TouchableOpacity>
            )}

            {/* Clear Chat */}
            <TouchableOpacity
              style={styles.toolCol}
              onPress={() => {
                onClose();
                onClearChat && onClearChat();
              }}
              activeOpacity={0.8}
            >
              <View style={styles.toolCircle}>
                <MaterialCommunityIcons name="broom" size={22} color="#8B5CF6" />
              </View>
              <Text style={styles.toolLabel}>Clear Chat</Text>
            </TouchableOpacity>
          </View>

          {/* OWNER TOOLS SECTION (Only Host / Room Owner) */}
          {isHost && (
            <View style={styles.ownerToolsSection}>
              <View style={styles.ownerHeaderRow}>
                <MaterialCommunityIcons name="shield-crown" size={16} color="#F59E0B" />
                <Text style={styles.ownerSectionTitle}>OWNER TOOLS</Text>
              </View>
              <View style={styles.toolsRow}>
                {/* 1. Theme */}
                <TouchableOpacity
                  style={styles.toolCol}
                  onPress={() => {
                    onClose();
                    setTimeout(() => {
                      onOpenThemeModal && onOpenThemeModal();
                    }, 400);
                  }}
                  activeOpacity={0.8}
                >
                  <View style={[styles.toolCircle, { borderColor: '#F59E0B' }]}>
                    <MaterialCommunityIcons name="palette" size={22} color="#F59E0B" />
                  </View>
                  <Text style={styles.toolLabel}>Theme</Text>
                </TouchableOpacity>

                {/* 2. Seat Skin */}
                <TouchableOpacity
                  style={styles.toolCol}
                  onPress={() => {
                    onClose();
                    setTimeout(() => {
                      onOpenSeatSkinModal && onOpenSeatSkinModal();
                    }, 400);
                  }}
                  activeOpacity={0.8}
                >
                  <View style={[styles.toolCircle, { borderColor: '#10B981' }]}>
                    <MaterialCommunityIcons name="chair-rolling" size={22} color="#10B981" />
                  </View>
                  <Text style={styles.toolLabel}>Seat Skin</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  backdropDismissArea: {
    flex: 1,
    width: '100%',
  },
  sheetContainer: {
    width: '100%',
    backgroundColor: '#121424',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    elevation: 25,
    zIndex: 100,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#334155',
    alignSelf: 'center',
    marginBottom: 16,
  },
  topPillsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionPillBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E2338',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.25)',
  },
  actionPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
  },
  actionPillIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#94A3B8',
    marginBottom: 14,
    letterSpacing: 0.5,
  },
  toolsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    marginBottom: 12,
  },
  toolCol: {
    alignItems: 'center',
    width: 60,
  },
  toolCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1D223B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 6,
  },
  toolCircleMuted: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#EF4444',
  },
  toolLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    textAlign: 'center',
  },
  ownerToolsSection: {
    marginTop: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  ownerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  ownerSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F59E0B',
    letterSpacing: 0.8,
  },
});
