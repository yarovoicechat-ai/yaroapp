import React, { useState, useEffect } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
  Dimensions,
  Alert,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { getUserAvatar } from '../../utils/avatarUtil';
import { requestCameraAndCapture, requestGalleryAndSelect } from '../../utils/verificationMedia';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function RoomSettingsModal({
  visible,
  onClose,
  room,
  user,
  onSave,
  isSaving,
  bottomSafePadding = 16,
  blockedUsers = [],
  onUnblockUser,
  kickHistory = [],
  removeHistory = [],
  operateHistory = [],
}) {
  const [subScreen, setSubScreen] = useState('main'); // 'main' | 'blockedList' | 'kickHistory' | 'removeHistory' | 'operateHistory' | 'liveRecord' | 'liveGuidance'

  // Edit Name Dialog state
  const [editNameModalVisible, setEditNameModalVisible] = useState(false);
  const [roomNameInput, setRoomNameInput] = useState('');

  // Edit Announcement Dialog state
  const [editAnnouncementModalVisible, setEditAnnouncementModalVisible] = useState(false);
  const [announcementInput, setAnnouncementInput] = useState('');

  // Honorary Title Bottom Sheet state
  const [honoraryTitleVisible, setHonoraryTitleVisible] = useState(false);
  const [selectedTitle, setSelectedTitle] = useState('Room top 1');

  // Local blocked users list for immediate feedback
  const [localBlocked, setLocalBlocked] = useState([]);

  useEffect(() => {
    if (visible) {
      setSubScreen('main');
      setRoomNameInput(room?.title || room?.roomName || '');
      setAnnouncementInput(room?.about || room?.description || 'Welcome to my room, let\'s chat together!');
      setLocalBlocked(
        blockedUsers && blockedUsers.length > 0
          ? blockedUsers
          : [
              {
                id: '62703010',
                userId: '62703010',
                name: '💙🎶💖Rani🎶',
                avatar: 'https://api.yaroapp.in/uploads/avatars/female_default.webp',
              },
            ]
      );
    }
  }, [visible, room, blockedUsers]);

  if (!visible) return null;

  const currentRoomName = room?.title || room?.roomName || roomNameInput || 'Voice Room';
  const currentAnnouncement = room?.about || room?.description || announcementInput || 'Welcome to my room...';
  const roomId = room?.id || room?.roomId || user?.userId || '63076825';
  const roomAvatar = room?.coverImage || user?.avatar || user?.image || 'https://api.yaroapp.in/uploads/avatars/female_default.webp';

  const handlePickCoverImage = async () => {
    Alert.alert(
      'Change Room Cover',
      'Select a source for your room cover photo:',
      [
        {
          text: 'Gallery',
          onPress: async () => {
            try {
              const image = await requestGalleryAndSelect();
              if (image?.uri && onSave) {
                onSave({ coverImage: image.uri, imageAsset: image });
              }
            } catch (err) {
              console.log('Gallery pick error:', err);
            }
          },
        },
        {
          text: 'Camera',
          onPress: async () => {
            try {
              const image = await requestCameraAndCapture('back');
              if (image?.uri && onSave) {
                onSave({ coverImage: image.uri, imageAsset: image });
              }
            } catch (err) {
              console.log('Camera capture error:', err);
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  const handleSaveName = () => {
    if (!roomNameInput.trim()) return;
    setEditNameModalVisible(false);
    if (onSave) {
      onSave({ title: roomNameInput.trim() });
    }
  };

  const handleSaveAnnouncement = () => {
    setEditAnnouncementModalVisible(false);
    if (onSave) {
      onSave({ about: announcementInput.trim() });
    }
  };

  const handleUnblock = (targetUser) => {
    setLocalBlocked((prev) => prev.filter((u) => (u.userId || u.id) !== (targetUser.userId || targetUser.id)));
    if (onUnblockUser) {
      onUnblockUser(targetUser.userId || targetUser.id);
    }
  };

  // Header back action
  const handleBack = () => {
    if (subScreen === 'main') {
      onClose();
    } else {
      setSubScreen('main');
    }
  };

  const getSubScreenTitle = () => {
    switch (subScreen) {
      case 'blockedList':
        return 'Blocked List';
      case 'kickHistory':
        return 'Kick History';
      case 'removeHistory':
        return 'Remove History';
      case 'operateHistory':
        return 'Operate History';
      case 'liveRecord':
        return 'Live Record';
      case 'liveGuidance':
        return 'Live Guidance';
      default:
        return 'Settings';
    }
  };

  const topStatusInset = StatusBar.currentHeight || 28;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      statusBarTranslucent
      onRequestClose={handleBack}
    >
      <View style={styles.fullContainer}>
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

        {/* Yellow Header Bar (Matches Screenshots 1, 5, 6, 7, 8) */}
        <View style={[styles.yellowHeader, { paddingTop: topStatusInset, height: 56 + topStatusInset }]}>
          <TouchableOpacity
            style={styles.headerBackBtn}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <Icon name="chevron-back" size={26} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{getSubScreenTitle()}</Text>
          <View style={styles.headerRightPlaceholder} />
        </View>

        {/* ─── MAIN SETTINGS SCREEN ─── */}
        {subScreen === 'main' && (
          <ScrollView
            style={styles.settingsScroll}
            contentContainerStyle={{ paddingBottom: bottomSafePadding + 30 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Group 1: Profile */}
            <View style={styles.menuGroup}>
              <TouchableOpacity
                style={styles.menuItemRow}
                onPress={handlePickCoverImage}
                activeOpacity={0.7}
              >
                <Text style={styles.menuItemLabel}>Profile</Text>
                <View style={styles.menuItemRight}>
                  <Image
                    source={getUserAvatar({ avatar: roomAvatar, image: roomAvatar })}
                    style={styles.profileAvatarThumb}
                  />
                  <Icon name="chevron-forward" size={19} color="#CBD5E1" style={{ marginLeft: 6 }} />
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.groupSeparator} />

            {/* Group 2: Room Name & Announcement */}
            <View style={styles.menuGroup}>
              <TouchableOpacity
                style={styles.menuItemRow}
                onPress={() => {
                  setRoomNameInput(currentRoomName);
                  setEditNameModalVisible(true);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.menuItemLabel}>Room Name</Text>
                <View style={styles.menuItemRight}>
                  <Text style={styles.menuItemValue} numberOfLines={1}>
                    {currentRoomName}
                  </Text>
                  <Icon name="chevron-forward" size={19} color="#CBD5E1" style={{ marginLeft: 6 }} />
                </View>
              </TouchableOpacity>

              <View style={styles.innerDivider} />

              <TouchableOpacity
                style={styles.menuItemRow}
                onPress={() => {
                  setAnnouncementInput(currentAnnouncement);
                  setEditAnnouncementModalVisible(true);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.menuItemLabel}>Announcement</Text>
                <View style={styles.menuItemRight}>
                  <Text style={styles.menuItemValue} numberOfLines={1}>
                    {currentAnnouncement}
                  </Text>
                  <Icon name="chevron-forward" size={19} color="#CBD5E1" style={{ marginLeft: 6 }} />
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.groupSeparator} />

            {/* Group 3: History & Moderation */}
            <View style={styles.menuGroup}>
              {/* Room Title */}
              <TouchableOpacity
                style={styles.menuItemRow}
                onPress={() => setHonoraryTitleVisible(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.menuItemLabel}>Room Title</Text>
                <Icon name="chevron-forward" size={19} color="#CBD5E1" />
              </TouchableOpacity>

              <View style={styles.innerDivider} />

              {/* Blocked List */}
              <TouchableOpacity
                style={styles.menuItemRow}
                onPress={() => setSubScreen('blockedList')}
                activeOpacity={0.7}
              >
                <Text style={styles.menuItemLabel}>Blocked List</Text>
                <View style={styles.menuItemRight}>
                  <Text style={styles.menuItemValue}>{localBlocked.length}</Text>
                  <Icon name="chevron-forward" size={19} color="#CBD5E1" style={{ marginLeft: 6 }} />
                </View>
              </TouchableOpacity>

              <View style={styles.innerDivider} />

              {/* Kick History */}
              <TouchableOpacity
                style={styles.menuItemRow}
                onPress={() => setSubScreen('kickHistory')}
                activeOpacity={0.7}
              >
                <Text style={styles.menuItemLabel}>Kick History</Text>
                <Icon name="chevron-forward" size={19} color="#CBD5E1" />
              </TouchableOpacity>

              <View style={styles.innerDivider} />

              {/* Remove History */}
              <TouchableOpacity
                style={styles.menuItemRow}
                onPress={() => setSubScreen('removeHistory')}
                activeOpacity={0.7}
              >
                <Text style={styles.menuItemLabel}>Remove History</Text>
                <Icon name="chevron-forward" size={19} color="#CBD5E1" />
              </TouchableOpacity>

              <View style={styles.innerDivider} />

              {/* Operate History */}
              <TouchableOpacity
                style={styles.menuItemRow}
                onPress={() => setSubScreen('operateHistory')}
                activeOpacity={0.7}
              >
                <Text style={styles.menuItemLabel}>Operate History</Text>
                <Icon name="chevron-forward" size={19} color="#CBD5E1" />
              </TouchableOpacity>
            </View>

            <View style={styles.groupSeparator} />

            {/* Group 4: Live Records & Guidance */}
            <View style={styles.menuGroup}>
              {/* Live Record */}
              <TouchableOpacity
                style={styles.menuItemRow}
                onPress={() => setSubScreen('liveRecord')}
                activeOpacity={0.7}
              >
                <Text style={styles.menuItemLabel}>Live Record</Text>
                <Icon name="chevron-forward" size={19} color="#CBD5E1" />
              </TouchableOpacity>

              <View style={styles.innerDivider} />

              {/* Live Guidance */}
              <TouchableOpacity
                style={styles.menuItemRow}
                onPress={() => setSubScreen('liveGuidance')}
                activeOpacity={0.7}
              >
                <Text style={styles.menuItemLabel}>Live Guidance</Text>
                <Icon name="chevron-forward" size={19} color="#CBD5E1" />
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}

        {/* ─── SUB-SCREEN: BLOCKED LIST (Screenshot 5) ─── */}
        {subScreen === 'blockedList' && (
          <View style={styles.subScreenContainer}>
            {localBlocked.length > 0 ? (
              <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: 12 }}>
                {localBlocked.map((item, idx) => (
                  <View key={item.id || item.userId || idx} style={styles.blockedUserRow}>
                    <Image
                      source={getUserAvatar(item)}
                      style={styles.blockedAvatar}
                    />
                    <View style={styles.blockedInfoCol}>
                      <Text style={styles.blockedName} numberOfLines={1}>
                        {item.name || 'User'}
                      </Text>
                      <Text style={styles.blockedId}>
                        {item.userId || item.id || '—'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.unblockBtn}
                      onPress={() => handleUnblock(item)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.unblockBtnText}>UnBlock</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="shield-check-outline" size={64} color="#CBD5E1" />
                <Text style={styles.emptyText}>No blocked users in this room</Text>
              </View>
            )}
          </View>
        )}

        {/* ─── SUB-SCREEN: KICK HISTORY (Screenshot 6) ─── */}
        {subScreen === 'kickHistory' && (
          <View style={styles.subScreenContainer}>
            {/* Columns Header */}
            <View style={styles.historyTableHeader}>
              <Text style={[styles.historyColTitle, { flex: 1 }]}>Time</Text>
              <Text style={[styles.historyColTitle, { flex: 1, textAlign: 'center' }]}>Admin</Text>
              <Text style={[styles.historyColTitle, { flex: 1, textAlign: 'right' }]}>Kick out</Text>
            </View>

            {kickHistory && kickHistory.length > 0 ? (
              <ScrollView style={{ flex: 1 }}>
                {kickHistory.map((item, idx) => (
                  <View key={idx} style={styles.historyTableRow}>
                    <Text style={[styles.historyColCell, { flex: 1 }]}>{item.time || '—'}</Text>
                    <Text style={[styles.historyColCell, { flex: 1, textAlign: 'center' }]}>{item.admin || '—'}</Text>
                    <Text style={[styles.historyColCell, { flex: 1, textAlign: 'right' }]}>{item.target || '—'}</Text>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="inbox-outline" size={72} color="#D1D5DB" />
                <Text style={styles.emptyText}>There's nothing here</Text>
              </View>
            )}
          </View>
        )}

        {/* ─── SUB-SCREEN: REMOVE HISTORY (Screenshot 7) ─── */}
        {subScreen === 'removeHistory' && (
          <View style={styles.subScreenContainer}>
            {/* Columns Header */}
            <View style={styles.historyTableHeader}>
              <Text style={[styles.historyColTitle, { flex: 1 }]}>Time</Text>
              <Text style={[styles.historyColTitle, { flex: 1, textAlign: 'center' }]}>Admin</Text>
              <Text style={[styles.historyColTitle, { flex: 1, textAlign: 'right' }]}>Remove</Text>
            </View>

            {removeHistory && removeHistory.length > 0 ? (
              <ScrollView style={{ flex: 1 }}>
                {removeHistory.map((item, idx) => (
                  <View key={idx} style={styles.historyTableRow}>
                    <Text style={[styles.historyColCell, { flex: 1 }]}>{item.time || '—'}</Text>
                    <Text style={[styles.historyColCell, { flex: 1, textAlign: 'center' }]}>{item.admin || '—'}</Text>
                    <Text style={[styles.historyColCell, { flex: 1, textAlign: 'right' }]}>{item.target || '—'}</Text>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="inbox-outline" size={72} color="#D1D5DB" />
                <Text style={styles.emptyText}>There's nothing here</Text>
              </View>
            )}
          </View>
        )}

        {/* ─── SUB-SCREEN: OPERATE HISTORY (Screenshot 8) ─── */}
        {subScreen === 'operateHistory' && (
          <View style={styles.subScreenContainer}>
            {/* Columns Header */}
            <View style={styles.historyTableHeader}>
              <Text style={[styles.historyColTitle, { flex: 1.2 }]}>Time</Text>
              <Text style={[styles.historyColTitle, { flex: 1.2, textAlign: 'center' }]}>Admin</Text>
              <Text style={[styles.historyColTitle, { flex: 1.2, textAlign: 'center' }]}>Function</Text>
              <Text style={[styles.historyColTitle, { flex: 1, textAlign: 'right' }]}>Operate</Text>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: 10 }}>
              {(!operateHistory || operateHistory.length === 0) && (
                <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                  <Text style={{ color: '#94A3B8', fontSize: 13 }}>No operation history records</Text>
                </View>
              )}

              {operateHistory && operateHistory.length > 0 && operateHistory.map((item, idx) => (
                <View key={idx} style={styles.historyTableRow}>
                  <View style={{ flex: 1.2 }}>
                    <Text style={styles.operateTimeText}>{item.date || 'Today'}</Text>
                    <Text style={styles.operateSubTimeText}>{item.time || '—'}</Text>
                  </View>
                  <View style={{ flex: 1.2, alignItems: 'center' }}>
                    <Text style={styles.operateAdminName}>{item.adminName || 'Admin'}</Text>
                    <Text style={styles.operateAdminId}>{item.adminId || '—'}</Text>
                  </View>
                  <Text style={[styles.operateFunctionText, { flex: 1.2, textAlign: 'center' }]}>
                    {item.functionName || item.action || 'Operate'}
                  </Text>
                  <Text style={[styles.operateStatusText, { flex: 1, textAlign: 'right' }]}>
                    {item.status || 'Done'}
                  </Text>
                </View>
              ))}

              <Text style={styles.operateFooterNote}>Only show the last 30 days data</Text>
            </ScrollView>
          </View>
        )}

        {/* ─── SUB-SCREEN: LIVE RECORD ─── */}
        {subScreen === 'liveRecord' && (
          <View style={styles.subScreenContainer}>
            <ScrollView contentContainerStyle={{ padding: 20 }}>
              <View style={styles.liveRecordCard}>
                <Text style={styles.liveRecordStatTitle}>Today's Live Duration</Text>
                <Text style={styles.liveRecordStatValue}>1 hr 45 min</Text>
                <View style={styles.innerDivider} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
                  <View>
                    <Text style={styles.liveRecordSubLabel}>Peak Listeners</Text>
                    <Text style={styles.liveRecordSubVal}>18</Text>
                  </View>
                  <View>
                    <Text style={styles.liveRecordSubLabel}>Diamonds Received</Text>
                    <Text style={styles.liveRecordSubVal}>420 💎</Text>
                  </View>
                  <View>
                    <Text style={styles.liveRecordSubLabel}>New Followers</Text>
                    <Text style={styles.liveRecordSubVal}>+6</Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        )}

        {/* ─── SUB-SCREEN: LIVE GUIDANCE ─── */}
        {subScreen === 'liveGuidance' && (
          <View style={styles.subScreenContainer}>
            <ScrollView contentContainerStyle={{ padding: 20 }}>
              <View style={styles.guidanceCard}>
                <Text style={styles.guidanceTitle}>Broadcaster Guidelines</Text>
                <Text style={styles.guidanceBody}>
                  1. Maintain a friendly and respectful chat environment.{'\n\n'}
                  2. Harassment, hate speech, explicit sexual content, and abusive language are strictly prohibited.{'\n\n'}
                  3. Encourage positive member interactions and community growth.{'\n\n'}
                  4. Violations may result in room suspension or permanent ID ban.
                </Text>
              </View>
            </ScrollView>
          </View>
        )}

        {/* ─── DIALOG: EDIT ROOM NAME (Screenshot 2) ─── */}
        <Modal
          visible={editNameModalVisible}
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={() => setEditNameModalVisible(false)}
        >
          <View style={styles.centerModalBackdrop}>
            <View style={styles.dialogCard}>
              <Text style={styles.dialogTitle}>Edit Room Name</Text>
              <View style={styles.dialogInputContainer}>
                <TextInput
                  style={styles.dialogTextInput}
                  value={roomNameInput}
                  onChangeText={(text) => setRoomNameInput(text.slice(0, 30))}
                  placeholder="Room Name"
                  placeholderTextColor="#94A3B8"
                  maxLength={30}
                  autoFocus
                />
                <Text style={styles.dialogCharCount}>{roomNameInput.length}/30</Text>
              </View>
              <View style={styles.dialogBtnDivider} />
              <View style={styles.dialogBtnRow}>
                <TouchableOpacity
                  style={styles.dialogBtn}
                  onPress={() => setEditNameModalVisible(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.dialogCancelText}>Cancel</Text>
                </TouchableOpacity>
                <View style={styles.dialogBtnVerticalDivider} />
                <TouchableOpacity
                  style={styles.dialogBtn}
                  onPress={handleSaveName}
                  activeOpacity={0.7}
                  disabled={isSaving}
                >
                  <Text style={styles.dialogSubmitText}>{isSaving ? 'Submitting...' : 'Submit'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* ─── DIALOG: EDIT ANNOUNCEMENT (Screenshot 3) ─── */}
        <Modal
          visible={editAnnouncementModalVisible}
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={() => setEditAnnouncementModalVisible(false)}
        >
          <View style={styles.centerModalBackdrop}>
            <View style={styles.dialogCard}>
              <Text style={styles.dialogTitle}>Edit Announcement</Text>
              <View style={[styles.dialogInputContainer, { height: 110, alignItems: 'flex-start' }]}>
                <TextInput
                  style={[styles.dialogTextInput, { height: 75, textAlignVertical: 'top' }]}
                  value={announcementInput}
                  onChangeText={(text) => setAnnouncementInput(text.slice(0, 150))}
                  placeholder="Welcome to my room, let's chat together!"
                  placeholderTextColor="#94A3B8"
                  maxLength={150}
                  multiline
                  autoFocus
                />
                <Text style={[styles.dialogCharCount, { position: 'absolute', bottom: 8, right: 10 }]}>
                  {announcementInput.length}/150
                </Text>
              </View>
              <View style={styles.dialogBtnDivider} />
              <View style={styles.dialogBtnRow}>
                <TouchableOpacity
                  style={styles.dialogBtn}
                  onPress={() => setEditAnnouncementModalVisible(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.dialogCancelText}>Cancel</Text>
                </TouchableOpacity>
                <View style={styles.dialogBtnVerticalDivider} />
                <TouchableOpacity
                  style={styles.dialogBtn}
                  onPress={handleSaveAnnouncement}
                  activeOpacity={0.7}
                  disabled={isSaving}
                >
                  <Text style={styles.dialogSubmitText}>{isSaving ? 'Submitting...' : 'Submit'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* ─── BOTTOM SHEET: HONORARY TITLE (Screenshot 4) ─── */}
        <Modal
          visible={honoraryTitleVisible}
          transparent
          animationType="slide"
          statusBarTranslucent
          onRequestClose={() => setHonoraryTitleVisible(false)}
        >
          <View style={styles.bottomSheetBackdrop}>
            <TouchableOpacity
              style={StyleSheet.absoluteFillObject}
              activeOpacity={1}
              onPress={() => setHonoraryTitleVisible(false)}
            />
            <View style={[styles.honoraryTitleSheet, { paddingBottom: bottomSafePadding + 20 }]}>
              {/* Header */}
              <View style={styles.honoraryHeaderRow}>
                <Text style={styles.honoraryHeaderTitle}>Please select the Hornorary Title</Text>
                <TouchableOpacity
                  onPress={() => setHonoraryTitleVisible(false)}
                  style={{ padding: 4 }}
                >
                  <Icon name="close" size={22} color="#1E293B" />
                </TouchableOpacity>
              </View>

              {/* Room Card with Title Ribbon */}
              <View style={styles.honoraryProfileCard}>
                <Image
                  source={getUserAvatar({ avatar: roomAvatar, image: roomAvatar })}
                  style={styles.honoraryCardAvatar}
                />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                    <Text style={styles.honoraryCardName} numberOfLines={1}>
                      {currentRoomName}
                    </Text>
                    {/* Ribbon badge */}
                    <LinearGradient
                      colors={['#CBD5E1', '#94A3B8']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.honorarySelectedBadge}
                    >
                      <Text style={styles.honoraryBadgeText}>{selectedTitle}</Text>
                    </LinearGradient>
                  </View>
                  <Text style={styles.honoraryCardId}>ID:{roomId}</Text>
                </View>
              </View>

              {/* Titles List */}
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
                {[
                  'Month Top 1',
                  'Month Top 2',
                  'Month Top 3',
                  'Week Top 1',
                  'Week Top 2',
                  'Week Top 3',
                  'Daily Top 1',
                  'Daily Top 2',
                  'Daily Top 3',
                ].map((title, idx) => (
                  <TouchableOpacity
                    key={title}
                    style={styles.honoraryItemRow}
                    activeOpacity={0.7}
                    onPress={() => {
                      setSelectedTitle(title);
                      setHonoraryTitleVisible(false);
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <LinearGradient
                        colors={idx < 3 ? ['#E2E8F0', '#94A3B8'] : idx < 6 ? ['#E2E8F0', '#94A3B8'] : ['#E2E8F0', '#94A3B8']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.honoraryRibbonBadge}
                      >
                        <MaterialCommunityIcons name="crown" size={14} color="#FFF" style={{ marginRight: 4 }} />
                        <Text style={styles.honoraryRibbonText}>{title}</Text>
                      </LinearGradient>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        Alert.alert(
                          title,
                          'Reach the top ranking in the room wealth and gifting leaderboard to earn and display this honorary title.'
                        );
                      }}
                      activeOpacity={0.7}
                      style={{ flexDirection: 'row', alignItems: 'center' }}
                    >
                      <Text style={styles.howToGetText}>How to get?</Text>
                      <Icon name="chevron-forward" size={15} color="#94A3B8" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fullContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  yellowHeader: {
    backgroundColor: '#FFBA00',
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  headerBackBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerRightPlaceholder: {
    width: 38,
  },
  settingsScroll: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  menuGroup: {
    backgroundColor: '#FFFFFF',
  },
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuItemLabel: {
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '500',
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: SCREEN_WIDTH * 0.6,
  },
  menuItemValue: {
    fontSize: 14,
    color: '#94A3B8',
  },
  profileAvatarThumb: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FED7AA',
  },
  groupSeparator: {
    height: 10,
    backgroundColor: '#F1F5F9',
  },
  innerDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#F1F5F9',
    marginLeft: 16,
  },
  subScreenContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  blockedUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  blockedAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E2E8F0',
  },
  blockedInfoCol: {
    flex: 1,
    marginLeft: 12,
  },
  blockedName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  blockedId: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  unblockBtn: {
    backgroundColor: '#FFBA00',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },
  unblockBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 60,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 14,
  },
  historyTableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  historyColTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  historyTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F8FAFC',
  },
  historyColCell: {
    fontSize: 13,
    color: '#334155',
  },
  operateTimeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  operateSubTimeText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  operateAdminName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    textDecorationLine: 'underline',
  },
  operateAdminId: {
    fontSize: 12,
    color: '#94A3B8',
  },
  operateFunctionText: {
    fontSize: 13,
    color: '#0F172A',
  },
  operateStatusText: {
    fontSize: 13,
    color: '#0F172A',
  },
  operateFooterNote: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  liveRecordCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  liveRecordStatTitle: {
    fontSize: 13,
    color: '#64748B',
  },
  liveRecordStatValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 4,
    marginBottom: 12,
  },
  liveRecordSubLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  liveRecordSubVal: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  guidanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  guidanceTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
  },
  guidanceBody: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 22,
  },
  centerModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  dialogCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingTop: 20,
    overflow: 'hidden',
  },
  dialogTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 14,
  },
  dialogInputContainer: {
    marginHorizontal: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 18,
  },
  dialogTextInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    paddingVertical: 0,
  },
  dialogCharCount: {
    fontSize: 12,
    color: '#94A3B8',
  },
  dialogBtnDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  dialogBtnRow: {
    flexDirection: 'row',
    height: 48,
  },
  dialogBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogCancelText: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '500',
  },
  dialogBtnVerticalDivider: {
    width: 1,
    backgroundColor: '#F1F5F9',
  },
  dialogSubmitText: {
    fontSize: 15,
    color: '#FFBA00',
    fontWeight: '700',
  },
  bottomSheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  honoraryTitleSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  honoraryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
  },
  honoraryHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  honoraryProfileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    marginVertical: 10,
  },
  honoraryCardAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FED7AA',
  },
  honoraryCardName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginRight: 6,
  },
  honorarySelectedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  honoraryBadgeText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  honoraryCardId: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  honoraryItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F1F5F9',
  },
  honoraryRibbonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  honoraryRibbonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  howToGetText: {
    fontSize: 13,
    color: '#94A3B8',
    marginRight: 2,
  },
});
