import React, { useState, useEffect, useContext, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  StatusBar,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';
import { AuthContext } from '../../context/AuthProvider';
import { apiUtil } from '../../utils/apiUtil';

const { width } = Dimensions.get('window');

// Sample realistic room session history (when room turned on, duration, gifts/beans received)
const SAMPLE_ROOM_SESSIONS = [
  {
    id: 'room-session-1',
    date: 'Today, 23 Sep 2026',
    startTime: '08:15 PM',
    endTime: '10:30 PM',
    duration: '2h 15m',
    durationMinutes: 135,
    giftCount: 78,
    beansReceived: 36400,
    peakListeners: 42,
    roomTitle: 'Evening Musical Vibes 🎸 & Chat',
    status: 'Completed',
  },
  {
    id: 'room-session-2',
    date: 'Yesterday, 22 Sep 2026',
    startTime: '09:00 PM',
    endTime: '10:45 PM',
    duration: '1h 45m',
    durationMinutes: 105,
    giftCount: 54,
    beansReceived: 24800,
    peakListeners: 35,
    roomTitle: 'Late Night Talk & Chill ☕',
    status: 'Completed',
  },
  {
    id: 'room-session-3',
    date: '21 Sep 2026',
    startTime: '04:30 PM',
    endTime: '06:00 PM',
    duration: '1h 30m',
    durationMinutes: 90,
    giftCount: 41,
    beansReceived: 18200,
    peakListeners: 28,
    roomTitle: 'Q&A Fun Session 🎉',
    status: 'Completed',
  },
  {
    id: 'room-session-4',
    date: '20 Sep 2026',
    startTime: '07:00 PM',
    endTime: '09:30 PM',
    duration: '2h 30m',
    durationMinutes: 150,
    giftCount: 92,
    beansReceived: 45000,
    peakListeners: 50,
    roomTitle: 'Weekend Special Party 🚀',
    status: 'Completed',
  },
  {
    id: 'room-session-5',
    date: '19 Sep 2026',
    startTime: '08:00 PM',
    endTime: '09:15 PM',
    duration: '1h 15m',
    durationMinutes: 75,
    giftCount: 30,
    beansReceived: 14500,
    peakListeners: 22,
    roomTitle: 'Daily Catch-Up 💬',
    status: 'Completed',
  },
];

// Sample voice call logs for voice hosting
const SAMPLE_VOICE_CALLS = [
  {
    id: 'vc-1',
    callerName: 'Aarav Patel',
    date: 'Today, 06:45 PM',
    duration: '14m 20s',
    rate: '120 Beans/min',
    beansEarned: 1720,
    giftsReceived: 3,
  },
  {
    id: 'vc-2',
    callerName: 'Vikram Singh',
    date: 'Today, 04:10 PM',
    duration: '22m 05s',
    rate: '120 Beans/min',
    beansEarned: 2640,
    giftsReceived: 5,
  },
  {
    id: 'vc-3',
    callerName: 'Rohan Sharma',
    date: 'Yesterday, 11:30 PM',
    duration: '35m 12s',
    rate: '120 Beans/min',
    beansEarned: 4220,
    giftsReceived: 8,
  },
  {
    id: 'vc-4',
    callerName: 'Sameer Khan',
    date: '21 Sep, 09:15 PM',
    duration: '18m 40s',
    rate: '120 Beans/min',
    beansEarned: 2240,
    giftsReceived: 2,
  },
];

// Sample video call logs for video hosting
const SAMPLE_VIDEO_CALLS = [
  {
    id: 'vdc-1',
    callerName: 'Anand Verma',
    date: 'Today, 07:15 PM',
    duration: '12m 30s',
    rate: '250 Beans/min',
    beansEarned: 3125,
    giftsReceived: 6,
  },
  {
    id: 'vdc-2',
    callerName: 'Kunal Joshi',
    date: 'Yesterday, 08:45 PM',
    duration: '19m 10s',
    rate: '250 Beans/min',
    beansEarned: 4790,
    giftsReceived: 11,
  },
  {
    id: 'vdc-3',
    callerName: 'Deepak Roy',
    date: '20 Sep, 10:00 PM',
    duration: '26m 45s',
    rate: '250 Beans/min',
    beansEarned: 6680,
    giftsReceived: 14,
  },
];

export default function DataCenter() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomPadding = getStackScreenBottomPadding(insets.bottom, 24);
  const { user } = useContext(AuthContext);

  const [liveAgency, setLiveAgency] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchStatus = async () => {
      try {
        const res = await apiUtil.get('/host/my-status');
        if (isMounted && res.data?.data) {
          setLiveAgency(res.data.data.agencyDetails || res.data.data.agency || res.data.data);
        }
      } catch (e) {
        // Fallback gracefully
      }
    };
    fetchStatus();
    return () => { isMounted = false; };
  }, []);

  // Agency info
  const agencyName = liveAgency?.agencyName || liveAgency?.name || user?.agencyName || user?.agency?.name || 'Yaro Royal Talent Agency';
  const agencyNumber = liveAgency?.agencyCode || liveAgency?.code || user?.agencyCode || user?.agencyId || user?.agency?.code || 'AG-89421';
  const agencyContact = liveAgency?.agencyNumber || liveAgency?.phoneNumber || liveAgency?.mobileNumber || user?.agencyPhone || '+91 98765 43210';
  const agencyLeader = liveAgency?.agencyLeader || liveAgency?.leaderName || user?.agencyLeader || 'Rahul Sharma (Leader)';
  const hostId = user?.userId || user?._id || '888888';

  // Determine which hosting types this host is approved for
  // Users can have 1, 2, or 3 of: ['voice', 'video', 'room']
  const availableTabs = useMemo(() => {
    const tabs = [];
    const userTypes = liveAgency?.hostingTypes || user?.hostingTypes || user?.hostTypes || ['voice', 'video', 'room'];

    const hasVoice = (liveAgency?.canVoiceCall !== false && user?.canVoiceCall !== false) &&
      (userTypes.includes('voice') || userTypes.includes('voice_call'));
    const hasVideo = (liveAgency?.canVideoCall !== false && user?.canVideoCall !== false) &&
      (userTypes.includes('video') || userTypes.includes('video_call'));
    const hasRoom = (liveAgency?.canRoomHost !== false && user?.canRoomHost !== false) &&
      (userTypes.includes('room') || userTypes.includes('room_hosting'));

    if (hasVoice) {
      tabs.push({ id: 'voice', label: 'Voice Call', icon: 'call-outline', mIcon: 'phone' });
    }
    if (hasVideo) {
      tabs.push({ id: 'video', label: 'Video Call', icon: 'videocam-outline', mIcon: 'videocam' });
    }
    if (hasRoom) {
      tabs.push({ id: 'room', label: 'Room Hosting', icon: 'radio-outline', mIcon: 'mic' });
    }

    // Default to at least room if none specified
    if (tabs.length === 0) {
      tabs.push({ id: 'room', label: 'Room Hosting', icon: 'radio-outline', mIcon: 'mic' });
    }
    return tabs;
  }, [liveAgency, user]);

  const [activeTab, setActiveTab] = useState(availableTabs[0]?.id || 'room');

  // Stats calculation
  const totalRoomMinutes = SAMPLE_ROOM_SESSIONS.reduce((acc, s) => acc + s.durationMinutes, 0);
  const totalRoomBeans = SAMPLE_ROOM_SESSIONS.reduce((acc, s) => acc + s.beansReceived, 0);
  const totalRoomGifts = SAMPLE_ROOM_SESSIONS.reduce((acc, s) => acc + s.giftCount, 0);

  const totalVoiceBeans = SAMPLE_VOICE_CALLS.reduce((acc, c) => acc + c.beansEarned, 0);
  const totalVideoBeans = SAMPLE_VIDEO_CALLS.reduce((acc, c) => acc + c.beansEarned, 0);

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Top Header Bar */}
      <LinearGradient
        colors={['#1E1B4B', '#312E81', '#4338CA']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerContainer, { paddingTop: topSafeInset + 8 }]}
      >
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Host Data Center</Text>
          <View style={styles.verifiedHostBadge}>
            <MaterialIcons name="verified" size={14} color="#10B981" />
            <Text style={styles.verifiedHostText}>Active Host</Text>
          </View>
        </View>

        {/* Agency Information Card */}
        <View style={styles.agencyInfoCard}>
          <View style={styles.agencyRowTop}>
            <View style={styles.agencyIconCircle}>
              <MaterialIcons name="business" size={24} color="#FBBF24" />
            </View>
            <View style={styles.agencyNameCol}>
              <Text style={styles.agencyNameLabel}>{agencyName}</Text>
              <View style={styles.agencyCodesRow}>
                <View style={styles.agencyCodePill}>
                  <Text style={styles.agencyCodeText}>Agency ID: {agencyNumber}</Text>
                </View>
                <View style={[styles.agencyCodePill, { backgroundColor: 'rgba(59, 130, 246, 0.25)', borderColor: 'rgba(59, 130, 246, 0.4)' }]}>
                  <Icon name="call" size={10} color="#93C5FD" style={{ marginRight: 3 }} />
                  <Text style={[styles.agencyCodeText, { color: '#BFDBFE' }]}>No: {agencyContact}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.agencyDivider} />

          <View style={styles.agencyMetaRow}>
            <View style={styles.agencyMetaItem}>
              <Text style={styles.agencyMetaLabel}>Host ID</Text>
              <Text style={styles.agencyMetaVal}>{hostId}</Text>
            </View>
            <View style={styles.agencyMetaDivider} />
            <View style={styles.agencyMetaItem}>
              <Text style={styles.agencyMetaLabel}>Agency Leader</Text>
              <Text style={styles.agencyMetaVal}>{agencyLeader}</Text>
            </View>
            <View style={styles.agencyMetaDivider} />
            <View style={styles.agencyMetaItem}>
              <Text style={styles.agencyMetaLabel}>Hosting Status</Text>
              <Text style={[styles.agencyMetaVal, { color: '#10B981' }]}>Approved</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Dynamic Hosting Tabs (Shows Voice Call, Video Call, Room Hosting based on user approval) */}
      <View style={styles.tabsContainer}>
        <View style={styles.tabsWrapper}>
          {availableTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tabButton, isActive && styles.tabButtonActive]}
                onPress={() => setActiveTab(tab.id)}
                activeOpacity={0.8}
              >
                <Icon
                  name={tab.icon}
                  size={18}
                  color={isActive ? '#4F46E5' : '#64748B'}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.tabButtonText, isActive && styles.tabButtonTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Tab Contents */}
      <ScrollView
        style={styles.contentScrollView}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: bottomPadding + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ===================== TAB 1: ROOM HOSTING ===================== */}
        {activeTab === 'room' && (
          <View>
            {/* Overview Summary Cards */}
            <View style={styles.overviewGrid}>
              <View style={styles.overviewCard}>
                <LinearGradient
                  colors={['#EEF2FF', '#E0E7FF']}
                  style={styles.overviewCardInner}
                >
                  <MaterialCommunityIcons name="clock-outline" size={22} color="#4F46E5" />
                  <Text style={styles.overviewVal}>
                    {Math.floor(totalRoomMinutes / 60)}h {totalRoomMinutes % 60}m
                  </Text>
                  <Text style={styles.overviewLabel}>Total Room Time</Text>
                </LinearGradient>
              </View>

              <View style={styles.overviewCard}>
                <LinearGradient
                  colors={['#FEF3C7', '#FDE68A']}
                  style={styles.overviewCardInner}
                >
                  <MaterialCommunityIcons name="gift-outline" size={22} color="#D97706" />
                  <Text style={styles.overviewVal}>{totalRoomGifts}</Text>
                  <Text style={styles.overviewLabel}>Gifts Received</Text>
                </LinearGradient>
              </View>

              <View style={styles.overviewCard}>
                <LinearGradient
                  colors={['#ECFDF5', '#D1FAE5']}
                  style={styles.overviewCardInner}
                >
                  <Text style={{ fontSize: 20 }}>🫘</Text>
                  <Text style={styles.overviewVal}>{totalRoomBeans.toLocaleString()}</Text>
                  <Text style={styles.overviewLabel}>Beans Collected</Text>
                </LinearGradient>
              </View>
            </View>

            {/* Room Session History Heading */}
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleWithIcon}>
                <MaterialCommunityIcons name="history" size={20} color="#0F172A" />
                <Text style={styles.sectionTitle}>Room Turn-On History & Gifts</Text>
              </View>
              <Text style={styles.sectionSubtitleBadge}>
                {SAMPLE_ROOM_SESSIONS.length} Sessions Logged
              </Text>
            </View>

            {/* List of room sessions with time turned on, duration, and gifts received */}
            {SAMPLE_ROOM_SESSIONS.map((session) => (
              <View key={session.id} style={styles.sessionCard}>
                <View style={styles.sessionTopRow}>
                  <View style={styles.sessionDateCol}>
                    <View style={styles.sessionLivePill}>
                      <View style={styles.greenLiveDot} />
                      <Text style={styles.sessionLiveText}>{session.status}</Text>
                    </View>
                    <Text style={styles.sessionDateText}>{session.date}</Text>
                  </View>

                  <View style={styles.durationPill}>
                    <Icon name="time-outline" size={14} color="#4F46E5" style={{ marginRight: 4 }} />
                    <Text style={styles.durationPillText}>{session.duration}</Text>
                  </View>
                </View>

                <Text style={styles.roomSessionTitle}>{session.roomTitle}</Text>

                <View style={styles.sessionTimeDetailsRow}>
                  <Text style={styles.sessionTimeLabel}>
                    Started: <Text style={styles.sessionTimeBold}>{session.startTime}</Text> • Ended: <Text style={styles.sessionTimeBold}>{session.endTime}</Text>
                  </Text>
                </View>

                {/* Gifts & Earnings breakdown bar */}
                <View style={styles.sessionStatsBar}>
                  <View style={styles.sessionStatItem}>
                    <Text style={styles.sessionStatLabel}>Gifts Received</Text>
                    <View style={styles.sessionStatValRow}>
                      <MaterialCommunityIcons name="gift" size={16} color="#EC4899" />
                      <Text style={styles.sessionStatValPink}>{session.giftCount} Gifts</Text>
                    </View>
                  </View>

                  <View style={styles.sessionBarDivider} />

                  <View style={styles.sessionStatItem}>
                    <Text style={styles.sessionStatLabel}>Beans Earned</Text>
                    <View style={styles.sessionStatValRow}>
                      <Text style={{ fontSize: 13, marginRight: 2 }}>🫘</Text>
                      <Text style={styles.sessionStatValGreen}>+{session.beansReceived.toLocaleString()}</Text>
                    </View>
                  </View>

                  <View style={styles.sessionBarDivider} />

                  <View style={styles.sessionStatItem}>
                    <Text style={styles.sessionStatLabel}>Peak Listeners</Text>
                    <View style={styles.sessionStatValRow}>
                      <Icon name="people" size={15} color="#3B82F6" />
                      <Text style={styles.sessionStatValBlue}>{session.peakListeners}</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ===================== TAB 2: VOICE CALL HOSTING ===================== */}
        {activeTab === 'voice' && (
          <View>
            {/* Overview Summary */}
            <View style={styles.overviewGrid}>
              <View style={styles.overviewCard}>
                <LinearGradient
                  colors={['#EEF2FF', '#E0E7FF']}
                  style={styles.overviewCardInner}
                >
                  <MaterialIcons name="phone-in-talk" size={22} color="#4F46E5" />
                  <Text style={styles.overviewVal}>1h 30m</Text>
                  <Text style={styles.overviewLabel}>Talk Time</Text>
                </LinearGradient>
              </View>

              <View style={styles.overviewCard}>
                <LinearGradient
                  colors={['#FEF3C7', '#FDE68A']}
                  style={styles.overviewCardInner}
                >
                  <Icon name="call" size={20} color="#D97706" />
                  <Text style={styles.overviewVal}>{SAMPLE_VOICE_CALLS.length}</Text>
                  <Text style={styles.overviewLabel}>Total Calls</Text>
                </LinearGradient>
              </View>

              <View style={styles.overviewCard}>
                <LinearGradient
                  colors={['#ECFDF5', '#D1FAE5']}
                  style={styles.overviewCardInner}
                >
                  <Text style={{ fontSize: 20 }}>🫘</Text>
                  <Text style={styles.overviewVal}>{totalVoiceBeans.toLocaleString()}</Text>
                  <Text style={styles.overviewLabel}>Beans Earned</Text>
                </LinearGradient>
              </View>
            </View>

            {/* Voice Call History Heading */}
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleWithIcon}>
                <Icon name="call" size={18} color="#0F172A" />
                <Text style={styles.sectionTitle}>1-on-1 Voice Call Records</Text>
              </View>
              <Text style={styles.sectionSubtitleBadge}>Rate: 120 Beans/min</Text>
            </View>

            {SAMPLE_VOICE_CALLS.map((call) => (
              <View key={call.id} style={styles.callRecordCard}>
                <View style={styles.callRecordAvatarBox}>
                  <Icon name="person" size={22} color="#6366F1" />
                </View>
                <View style={styles.callRecordInfo}>
                  <Text style={styles.callCallerName}>{call.callerName}</Text>
                  <Text style={styles.callDateText}>{call.date} • {call.duration}</Text>
                </View>
                <View style={styles.callEarningsBox}>
                  <Text style={styles.callBeansText}>+{call.beansEarned.toLocaleString()} 🫘</Text>
                  <Text style={styles.callGiftsText}>{call.giftsReceived} gifts received</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ===================== TAB 3: VIDEO CALL HOSTING ===================== */}
        {activeTab === 'video' && (
          <View>
            {/* Overview Summary */}
            <View style={styles.overviewGrid}>
              <View style={styles.overviewCard}>
                <LinearGradient
                  colors={['#EEF2FF', '#E0E7FF']}
                  style={styles.overviewCardInner}
                >
                  <MaterialIcons name="videocam" size={22} color="#4F46E5" />
                  <Text style={styles.overviewVal}>58m 25s</Text>
                  <Text style={styles.overviewLabel}>Video Talk Time</Text>
                </LinearGradient>
              </View>

              <View style={styles.overviewCard}>
                <LinearGradient
                  colors={['#FEF3C7', '#FDE68A']}
                  style={styles.overviewCardInner}
                >
                  <MaterialIcons name="video-call" size={22} color="#D97706" />
                  <Text style={styles.overviewVal}>{SAMPLE_VIDEO_CALLS.length}</Text>
                  <Text style={styles.overviewLabel}>Video Calls</Text>
                </LinearGradient>
              </View>

              <View style={styles.overviewCard}>
                <LinearGradient
                  colors={['#ECFDF5', '#D1FAE5']}
                  style={styles.overviewCardInner}
                >
                  <Text style={{ fontSize: 20 }}>🫘</Text>
                  <Text style={styles.overviewVal}>{totalVideoBeans.toLocaleString()}</Text>
                  <Text style={styles.overviewLabel}>Beans Earned</Text>
                </LinearGradient>
              </View>
            </View>

            {/* Video Call History Heading */}
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleWithIcon}>
                <Icon name="videocam" size={18} color="#0F172A" />
                <Text style={styles.sectionTitle}>1-on-1 Video Call Records</Text>
              </View>
              <Text style={styles.sectionSubtitleBadge}>Rate: 250 Beans/min</Text>
            </View>

            {SAMPLE_VIDEO_CALLS.map((call) => (
              <View key={call.id} style={styles.callRecordCard}>
                <View style={[styles.callRecordAvatarBox, { backgroundColor: '#FDF2F8' }]}>
                  <Icon name="videocam" size={22} color="#EC4899" />
                </View>
                <View style={styles.callRecordInfo}>
                  <Text style={styles.callCallerName}>{call.callerName}</Text>
                  <Text style={styles.callDateText}>{call.date} • {call.duration}</Text>
                </View>
                <View style={styles.callEarningsBox}>
                  <Text style={styles.callBeansText}>+{call.beansEarned.toLocaleString()} 🫘</Text>
                  <Text style={styles.callGiftsText}>{call.giftsReceived} gifts received</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  verifiedHostBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    gap: 4,
  },
  verifiedHostText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A7F3D0',
  },
  agencyInfoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  agencyRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  agencyIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.4)',
  },
  agencyNameCol: {
    flex: 1,
  },
  agencyNameLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  agencyCodesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  agencyCodePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  agencyCodeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FEF3C7',
  },
  agencyDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginVertical: 10,
  },
  agencyMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  agencyMetaItem: {
    flex: 1,
    alignItems: 'center',
  },
  agencyMetaLabel: {
    fontSize: 10,
    color: '#CBD5E1',
    fontWeight: '500',
    marginBottom: 2,
  },
  agencyMetaVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  agencyMetaDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  tabsContainer: {
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 6,
  },
  tabsWrapper: {
    flexDirection: 'row',
    backgroundColor: '#EEF2FF',
    borderRadius: 14,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#4F46E5',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  tabButtonTextActive: {
    color: '#4F46E5',
    fontWeight: '800',
  },
  contentScrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  overviewGrid: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 12,
  },
  overviewCard: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  overviewCardInner: {
    padding: 12,
    alignItems: 'center',
    borderRadius: 14,
  },
  overviewVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 4,
    marginBottom: 2,
  },
  overviewLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    marginBottom: 10,
  },
  sectionTitleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionSubtitleBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4F46E5',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  sessionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  sessionTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sessionDateCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sessionLivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  greenLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  sessionLiveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  sessionDateText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  durationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  durationPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4F46E5',
  },
  roomSessionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  sessionTimeDetailsRow: {
    marginBottom: 12,
  },
  sessionTimeLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  sessionTimeBold: {
    color: '#334155',
    fontWeight: '700',
  },
  sessionStatsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sessionStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  sessionStatLabel: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 2,
  },
  sessionStatValRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionStatValPink: {
    fontSize: 12,
    fontWeight: '800',
    color: '#DB2777',
    marginLeft: 3,
  },
  sessionStatValGreen: {
    fontSize: 12,
    fontWeight: '800',
    color: '#059669',
  },
  sessionStatValBlue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2563EB',
    marginLeft: 3,
  },
  sessionBarDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#CBD5E1',
  },
  callRecordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  callRecordAvatarBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  callRecordInfo: {
    flex: 1,
  },
  callCallerName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  callDateText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  callEarningsBox: {
    alignItems: 'flex-end',
  },
  callBeansText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#059669',
  },
  callGiftsText: {
    fontSize: 10,
    color: '#EC4899',
    fontWeight: '600',
    marginTop: 2,
  },
});
