import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  View as ScreenBackgroundView,
  StatusBar as ScreenBackgroundStatusBar,
  StyleSheet as ScreenBackgroundStyleSheet
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import IonIcon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { apiUtil } from '../../utils/apiUtil';
import { AuthContext } from '../../context/AuthProvider';
import { useTranslation } from 'react-i18next';
import AnimatedTitleLine from '../../components/AnimatedTitleLine';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';

import { getUserAvatar } from '../../utils/avatarUtil';
import AvatarWithFrame from '../../components/AvatarWithFrame';
import avatar from '../../assets/avtar.webp';

const { width, height } = Dimensions.get('window');

const Frame = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomPadding = getStackScreenBottomPadding(insets.bottom, 42);
  const { user, equippedFrame, setEquippedFrame } = useContext(AuthContext);
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [selectedFrame, setSelectedFrame] = useState(user?.equippedFrame || equippedFrame || 'Galaxy Wings');

  // Local mock list matching the mockup image precisely
  const frameList = [
    { id: '4', level: '4', name: 'Silver Ring', color: '#a855f7', border: '#cbd5e1', isLocked: false, isDefault: false },
    { id: '5', level: '5', name: 'Galaxy Wings', color: '#c084fc', border: '#a855f7', isLocked: false, isDefault: false },
    { id: '6', level: '6', name: 'Golden Crown', color: '#facc15', border: '#eab308', isLocked: true, isDefault: false },
    { id: '7', level: '7', name: 'Neon Rockstar', color: '#03dcfe', border: '#3b82f6', isLocked: true, isDefault: false },
    { id: 'default', level: 'D', name: 'Default Frame', color: '#64748b', border: 'rgba(255,255,255,0.2)', isLocked: false, isDefault: true },
  ];

  useEffect(() => {
    // Mimic API loading
    setTimeout(() => {
      setLoading(false);
    }, 400);
  }, []);

  const renderFrameBadge = (name) => {
    // Renders visual frame outline mockup based on frame name
    if (name === 'Silver Ring') {
      return (
        <View style={[styles.frameRingOuter, { borderColor: '#94a3b8' }]}>
          <View style={[styles.frameRingInner, { borderColor: '#e2e8f0', borderStyle: 'dashed' }]}>
            <IonIcon name="person" size={16} color="rgba(255,255,255,0.4)" />
          </View>
        </View>
      );
    }
    if (name === 'Galaxy Wings') {
      return (
        <View style={[styles.frameRingOuter, { borderColor: '#a855f7' }]}>
          <LinearGradient
            colors={['#c084fc', '#8b5cf6']}
            style={[styles.frameRingInner, { borderWidth: 1 }]}
          >
            {/* Wing decoration absolute items */}
            <View style={[styles.wingLeft, { backgroundColor: '#a855f7' }]} />
            <View style={[styles.wingRight, { backgroundColor: '#a855f7' }]} />
            <IonIcon name="person" size={16} color="rgba(255,255,255,0.4)" />
          </LinearGradient>
        </View>
      );
    }
    if (name === 'Golden Crown') {
      return (
        <View style={[styles.frameRingOuter, { borderColor: '#eab308' }]}>
          <View style={[styles.frameRingInner, { borderColor: '#facc15' }]}>
            <IonIcon name="crown" size={8} color="#facc15" style={{ position: 'absolute', top: -4 }} />
            <IonIcon name="person" size={16} color="rgba(255,255,255,0.4)" />
          </View>
        </View>
      );
    }
    if (name === 'Neon Rockstar') {
      return (
        <View style={[styles.frameRingOuter, { borderColor: '#03dcfe' }]}>
          <View style={[styles.frameRingInner, { borderColor: '#3b82f6', borderWidth: 2 }]}>
            <IonIcon name="person" size={16} color="rgba(255,255,255,0.4)" />
          </View>
        </View>
      );
    }
    return (
      <View style={[styles.frameRingOuter, { borderColor: 'rgba(255, 255, 255, 0.15)' }]}>
        <View style={styles.frameRingInner}>
          <IonIcon name="person" size={16} color="rgba(255,255,255,0.3)" />
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <ScreenBackgroundView style={[{ flex: 1, backgroundColor: '#F8FAFC' }, { justifyContent: 'center', alignItems: 'center' }]}>
        <ScreenBackgroundStatusBar translucent backgroundColor="transparent" barStyle="dark-content" animated />
        <LinearGradient colors={['#F8FAFC', '#F1F5F9', '#E2E8F0']} style={ScreenBackgroundStyleSheet.absoluteFillObject} />
        <ActivityIndicator size="large" color="#6366F1" />
      </ScreenBackgroundView>
    );
  }

  return (
    <ScreenBackgroundView style={[{ flex: 1, backgroundColor: '#F8FAFC' }]}>
      <ScreenBackgroundStatusBar translucent backgroundColor="transparent" barStyle="dark-content" animated />
      <LinearGradient colors={['#F8FAFC', '#F1F5F9', '#E2E8F0']} style={ScreenBackgroundStyleSheet.absoluteFillObject} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topSafeInset + 8 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <IonIcon name="chevron-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('frame.title') || 'Frame'}</Text>
        <View style={{ width: 44 }} />
      </View>
      <AnimatedTitleLine />

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]} showsVerticalScrollIndicator={false}>
        
        {/* Current Frame Card */}
        <View style={styles.cardWrapper}>
          <View style={styles.cardBorder}>
            <View style={styles.cardBody}>
              {/* User Avatar Details */}
              <View style={styles.leftCol}>
                <View style={styles.avatarWrap}>
                  <AvatarWithFrame
                    user={user}
                    frame={selectedFrame}
                    size={64}
                    showOnlineDot={false}
                  />
                  {/* Badge */}
                  <View style={styles.avatarLevelBadge}>
                    <Text style={styles.avatarLevelText}>Lv.5</Text>
                  </View>
                </View>
              </View>

              {/* Progress and Frame Selection text */}
              <View style={styles.middleCol}>
                <Text style={styles.voiceChatTitle}>Yaro Voice Chat</Text>
                
                <View style={styles.levelBadgeRow}>
                  <IonIcon name="star" size={10} color="#fff" style={{ marginRight: 4 }} />
                  <Text style={styles.levelBadgeText}>Level 5</Text>
                </View>

                <View style={styles.progressRow}>
                  <Text style={styles.progressLabel}>To Next Level 6</Text>
                  <Text style={styles.progressVal}>83 / 150</Text>
                </View>
                
                {/* Horizontal Progress Bar */}
                <View style={styles.progressBarBg}>
                  <LinearGradient
                    colors={['#6366F1', '#4F46E5']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.progressBarFill, { width: '55%' }]}
                  />
                </View>
              </View>

              {/* Current Frame Display Box */}
              <View style={styles.rightCol}>
                <View style={styles.currentFrameBox}>
                  {/* Outer glowing frame border mockup */}
                  <View style={[styles.galaxyBoxBorder, { borderColor: '#8B5CF6' }]}>
                    <View style={styles.galaxyBoxInside}>
                      <IonIcon name="person" size={24} color="#94A3B8" />
                    </View>
                  </View>
                </View>
                <Text style={styles.currentFrameLabel}>Current Frame</Text>
                <Text style={styles.currentFrameName}>{selectedFrame}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Levels & Frames Table */}
        <View style={styles.tableCard}>
          <View style={styles.tableInner}>
            {/* Table Header Row */}
            <View style={styles.tableHeaderRow}>
              <Text style={styles.headerCellLeft}>Level</Text>
              <Text style={styles.headerCellRight}>Frame</Text>
            </View>

            {/* Table Rows list */}
            {frameList.map((item, idx) => {
              const isActive = selectedFrame === item.name;
              return (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={item.isLocked ? 1 : 0.85}
                  onPress={() => {
                    if (!item.isLocked) {
                      setSelectedFrame(item.name);
                      setEquippedFrame?.(item.name);
                    }
                  }}
                  style={[
                    styles.tableRow,
                    isActive && styles.tableRowActive,
                  ]}
                >
                  {/* Left Column (Level Badge & title) */}
                  <View style={styles.rowLeftCol}>
                    <LinearGradient
                      colors={item.isDefault ? ['#94A3B8', '#64748B'] : item.isLocked ? ['#F59E0B', '#D97706'] : ['#8B5CF6', '#6366F1']}
                      style={styles.rowBadgeHex}
                    >
                      <Text style={styles.rowBadgeText}>{item.level}</Text>
                    </LinearGradient>
                    <Text style={styles.rowLevelTitle}>
                      {item.isDefault ? 'Default' : `Level ${item.level}`}
                    </Text>
                  </View>

                  {/* Middle Column (Frame graphic and name) */}
                  <View style={styles.rowMiddleCol}>
                    {renderFrameBadge(item.name)}
                    <View style={styles.rowMiddleDetails}>
                      <Text style={styles.rowFrameName}>{item.name}</Text>
                      {isActive && (
                        <View style={styles.inUseTag}>
                          <Text style={styles.inUseTagText}>In Use</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Right Column (Checkbox circle/lock status) */}
                  <View style={styles.rowRightCol}>
                    {item.isLocked ? (
                      <View style={styles.lockBadge}>
                        <IonIcon name="lock-closed" size={12} color="#94A3B8" />
                      </View>
                    ) : isActive ? (
                      <View style={styles.checkboxChecked}>
                        <IonIcon name="checkmark" size={12} color="#fff" />
                      </View>
                    ) : (
                      <View style={styles.checkboxUnchecked} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* How to Unlock bottom card encouragement banner */}
        <View style={styles.footerBanner}>
          <View style={styles.footerInner}>
            <View style={styles.footerLeft}>
              <IonIcon name="ribbon-outline" size={24} color="#6366F1" />
            </View>
            <View style={styles.footerMiddle}>
              <Text style={styles.footerTitle}>How to Unlock Frames?</Text>
              <Text style={styles.footerSubtitle}>Upgrade your level and unlock exclusive frames to stand out in every call.</Text>
            </View>
            <TouchableOpacity style={styles.footerBtn}>
              <Text style={styles.footerBtnText}>Upgrade Now</Text>
              <IonIcon name="chevron-forward" size={10} color="#fff" style={{ marginLeft: 3 }} />
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </ScreenBackgroundView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
  },

  // Current Frame Card
  cardWrapper: {
    width: '100%',
    marginBottom: 20,
  },
  cardBorder: {
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  cardBody: {
    flexDirection: 'row',
    borderRadius: 22.5,
    padding: 14,
    alignItems: 'center',
  },
  leftCol: {
    width: '23%',
    alignItems: 'center',
  },
  avatarWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    padding: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImg: {
    width: 59,
    height: 59,
    borderRadius: 29.5,
    backgroundColor: '#E2E8F0',
  },
  avatarLevelBadge: {
    position: 'absolute',
    bottom: -6,
    backgroundColor: '#6366F1',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
  },
  avatarLevelText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
  },

  middleCol: {
    width: '47%',
    paddingHorizontal: 10,
  },
  voiceChatTitle: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },
  levelBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  levelBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  progressLabel: {
    color: '#64748B',
    fontSize: 8,
    fontWeight: '600',
  },
  progressVal: {
    color: '#0F172A',
    fontSize: 8,
    fontWeight: '700',
  },
  progressBarBg: {
    width: '100%',
    height: 5,
    backgroundColor: '#E2E8F0',
    borderRadius: 2.5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2.5,
  },

  rightCol: {
    width: '30%',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#E2E8F0',
    paddingLeft: 6,
  },
  currentFrameBox: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  galaxyBoxBorder: {
    width: 38,
    height: 38,
    borderRadius: 4,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  galaxyBoxInside: {
    width: 32,
    height: 32,
    borderRadius: 2,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentFrameLabel: {
    color: '#64748B',
    fontSize: 8,
    fontWeight: '600',
    marginBottom: 2,
  },
  currentFrameName: {
    color: '#6366F1',
    fontSize: 9,
    fontWeight: '800',
    textAlign: 'center',
  },

  // Levels & Frames Table
  tableCard: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  tableInner: {
    flex: 1,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F1F5F9',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerCellLeft: {
    flex: 1,
    color: '#334155',
    fontWeight: '800',
    fontSize: 12,
  },
  headerCellRight: {
    flex: 1.5,
    color: '#334155',
    fontWeight: '800',
    fontSize: 12,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tableRowActive: {
    backgroundColor: '#EEF2FF',
    borderLeftWidth: 3,
    borderLeftColor: '#6366F1',
  },
  rowLeftCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowBadgeHex: {
    width: 22,
    height: 22,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  rowBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '900',
  },
  rowLevelTitle: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
  },

  rowMiddleCol: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  frameRingOuter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    backgroundColor: '#F8FAFC',
  },
  frameRingInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  wingLeft: {
    position: 'absolute',
    left: -4,
    width: 4,
    height: 12,
    borderRadius: 2,
    transform: [{ rotate: '-15deg' }],
  },
  wingRight: {
    position: 'absolute',
    right: -4,
    width: 4,
    height: 12,
    borderRadius: 2,
    transform: [{ rotate: '15deg' }],
  },
  rowMiddleDetails: {
    flex: 1,
  },
  rowFrameName: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  inUseTag: {
    backgroundColor: '#EEF2FF',
    borderWidth: 0.8,
    borderColor: '#C7D2FE',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  inUseTagText: {
    color: '#4F46E5',
    fontSize: 7,
    fontWeight: '800',
  },

  rowRightCol: {
    width: 36,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  lockBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxUnchecked: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },

  // Footer Banner
  footerBanner: {
    width: '100%',
    marginBottom: 30,
  },
  footerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  footerLeft: {
    marginRight: 10,
  },
  footerMiddle: {
    flex: 1,
  },
  footerTitle: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 2,
  },
  footerSubtitle: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '600',
  },
  footerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  footerBtnText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
  },
});

export default Frame;
