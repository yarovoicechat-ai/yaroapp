import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  Dimensions,
  Platform,
  Animated,
  ActivityIndicator,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Asset imports
const calcFrameImg = require('../../assets/calculator/calc_frame.png');
const calcHelpBtnImg = require('../../assets/calculator/calc_help_btn.png');
const calcCloseBtnImg = require('../../assets/calculator/calc_close_btn.png');
const calcBadgeImg = require('../../assets/calculator/calc_badge.png');
const calcConfirmBtnImg = require('../../assets/calculator/calc_confirm_btn.png');
const calcStarImg = require('../../assets/calculator/calc_star.png');
const calcHeartImg = require('../../assets/calculator/calc_heart.png');

const DURATION_OPTIONS = Array.from({ length: 60 }, (_, i) => i + 1);

export default function RoomCalculatorModal({
  visible,
  onClose,
  roomId,
  isOwner = false,
  activeSession = null,
  onStartSession,
  onEndSession,
  onShareSession,
}) {
  const [theme, setTheme] = useState('');
  const [durationMins, setDurationMins] = useState(10);
  const [showPicker, setShowPicker] = useState(false);
  const [tempDuration, setTempDuration] = useState(10);
  const [showRules, setShowRules] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Remaining seconds calculation
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (!activeSession || activeSession.status !== 'active') {
      setSecondsLeft(0);
      return;
    }
    const updateCountdown = () => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((activeSession.endsAt - now) / 1000));
      setSecondsLeft(diff);
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  const formattedCountdown = useMemo(() => {
    if (!activeSession || activeSession.status !== 'active') {
      return activeSession?.status === 'ended' ? 'End' : '10 mins';
    }
    const mins = Math.floor(secondsLeft / 60);
    const secs = secondsLeft % 60;
    if (mins >= 1) {
      return `${mins} mins`;
    }
    return `${secs}s`;
  }, [activeSession, secondsLeft]);

  const handleConfirmStart = async () => {
    const clean = theme.trim();
    if (!clean) return;
    setSubmitting(true);
    try {
      if (onStartSession) {
        await onStartSession(clean, durationMins);
      }
      setTheme('');
    } catch (e) {
      console.warn('[RoomCalculator] start error:', e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEnd = async () => {
    setSubmitting(true);
    try {
      if (onEndSession) {
        await onEndSession();
      }
    } catch (e) {
      console.warn('[RoomCalculator] end error:', e);
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid = theme.trim().length > 0 && theme.trim().length <= 30;

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        {showRules ? (
          // ==================== RULES SCREEN ====================
          <View style={styles.rulesContainer}>
            {/* Header */}
            <View style={styles.rulesHeader}>
              <TouchableOpacity
                onPress={() => setShowRules(false)}
                style={styles.backButton}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={24} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.rulesHeaderTitle}>Rules</Text>
              <View style={{ width: 40 }} />
            </View>

            <ScrollView
              contentContainerStyle={styles.rulesScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Glowing Banner */}
              <View style={styles.starryBanner}>
                <Image source={calcStarImg} style={[styles.floatingStar, { top: 0, left: 20 }]} />
                <Image source={calcStarImg} style={[styles.floatingStar, { top: -10, right: 30, transform: [{ scale: 1.2 }] }]} />
                <Image source={calcStarImg} style={[styles.floatingStar, { bottom: 5, left: '45%', transform: [{ scale: 0.8 }] }]} />
                <Text style={styles.brightestStarTitle}>Be the{'\n'}brightest star</Text>
              </View>

              {/* How to Improve Card */}
              <View style={styles.rulesCard}>
                <View style={styles.cardRibbonBadge}>
                  <Text style={styles.cardRibbonText}>How to improve</Text>
                </View>

                <Text style={styles.rulesCardSubtitle}>
                  Receive gifts to increase the value
                </Text>

                <View style={styles.rulesConversionRow}>
                  <View style={styles.starTag}>
                    <Text style={styles.starTagIcon}>⭐</Text>
                    <Text style={styles.starTagText}>1</Text>
                  </View>
                  <Text style={styles.equalSign}>=</Text>
                  <View style={styles.diamondTag}>
                    <Text style={styles.diamondTagIcon}>💎</Text>
                    <Text style={styles.diamondTagText}>1</Text>
                  </View>
                </View>

                <Text style={styles.rulesDescription}>
                  Send gifts to your friends to support her/him become the top charming person in the room.
                </Text>
              </View>
            </ScrollView>
          </View>
        ) : (
          // ==================== MAIN CALCULATOR POPUP ====================
          <View style={styles.popupCard}>
            {/* Top Stars & Bubbles Decor */}
            <Image source={calcStarImg} style={styles.decorStarLeft} />
            <Image source={calcStarImg} style={styles.decorStarRight} />
            <Image source={calcHeartImg} style={styles.decorHeartLeft} />
            <Image source={calcHeartImg} style={styles.decorHeartRight} />

            {/* Header Ribbon / Badge */}
            <View style={styles.headerRibbonContainer}>
              <LinearGradient
                colors={['#8B5CF6', '#3B82F6', '#9333EA']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.headerRibbon}
              >
                <Text style={styles.headerRibbonText} numberOfLines={1}>
                  {activeSession ? activeSession.theme : 'Calculator'}
                </Text>
              </LinearGradient>
            </View>

            {/* Top Left ? Help Button */}
            <TouchableOpacity
              style={styles.helpBtn}
              onPress={() => setShowRules(true)}
              activeOpacity={0.8}
            >
              <Image source={calcHelpBtnImg} style={styles.iconBtnImg} />
            </TouchableOpacity>

            {/* Top Right X Close Button */}
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Image source={calcCloseBtnImg} style={styles.iconBtnImg} />
            </TouchableOpacity>

            {/* Content body based on session state */}
            {!activeSession || activeSession.status !== 'active' && activeSession.status !== 'ended' ? (
              // ----------------- SETUP STATE -----------------
              <View style={styles.setupBody}>
                {/* Theme Text Input */}
                <View style={styles.themeInputContainer}>
                  <TextInput
                    style={styles.themeInput}
                    placeholder="Enter activity theme..."
                    placeholderTextColor="rgba(255, 255, 255, 0.45)"
                    maxLength={30}
                    value={theme}
                    onChangeText={setTheme}
                    multiline
                  />
                  <Text style={styles.charCounter}>{theme.length}/30</Text>
                </View>

                {/* Duration Section */}
                <Text style={styles.durationLabel}>Duration:</Text>
                <TouchableOpacity
                  style={styles.durationSelectorBox}
                  onPress={() => {
                    setTempDuration(durationMins);
                    setShowPicker(true);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.durationSubtext}>Select times</Text>
                  <Text style={styles.durationValueText}>{durationMins} mins</Text>
                </TouchableOpacity>

                {/* Confirm Button */}
                <TouchableOpacity
                  style={[
                    styles.confirmButton,
                    !isFormValid && styles.confirmButtonDisabled,
                  ]}
                  onPress={handleConfirmStart}
                  disabled={!isFormValid || submitting}
                  activeOpacity={0.85}
                >
                  {isFormValid ? (
                    <LinearGradient
                      colors={['#F59E0B', '#F97316', '#EAB308']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.confirmGradient}
                    >
                      {submitting ? (
                        <ActivityIndicator color="#FFF" size="small" />
                      ) : (
                        <Text style={styles.confirmTextActive}>Confirm</Text>
                      )}
                    </LinearGradient>
                  ) : (
                    <View style={styles.confirmDisabledInner}>
                      <Text style={styles.confirmTextDisabled}>Confirm</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            ) : activeSession.status === 'active' ? (
              // ----------------- ACTIVE SESSION STATE -----------------
              <View style={styles.activeBody}>
                {/* Ranking Section */}
                <View style={styles.rankingCardArea}>
                  {activeSession.topCharming ? (
                    <View style={styles.charmingBanner}>
                      <LinearGradient
                        colors={['#8B5CF6', '#6D28D9', '#4C1D95']}
                        style={styles.charmingBannerGrad}
                      >
                        <Image
                          source={
                            activeSession.topCharming.avatar
                              ? { uri: activeSession.topCharming.avatar }
                              : require('../../assets/avtar.webp')
                          }
                          style={styles.participantAvatar}
                        />
                        <Text style={styles.bannerRoleTitle}>Top charming</Text>
                        <Text style={styles.participantName} numberOfLines={1}>
                          {activeSession.topCharming.name}
                        </Text>
                        <View style={styles.scoreCapsule}>
                          <Text style={styles.scoreStarIcon}>⭐</Text>
                          <Text style={styles.scoreNumber}>
                            {activeSession.topCharming.score}
                          </Text>
                        </View>
                      </LinearGradient>
                    </View>
                  ) : (
                    <View style={styles.emptyRankingBox}>
                      <Text style={styles.emptyRankingText}>No current ranking</Text>
                      <ActivityIndicator
                        size="small"
                        color="rgba(255, 255, 255, 0.4)"
                        style={{ marginTop: 16 }}
                      />
                    </View>
                  )}
                </View>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                  <View style={styles.statCol}>
                    <Text style={styles.statValue}>{activeSession.totalScore || 0}</Text>
                    <Text style={styles.statLabel}>Total</Text>
                  </View>
                  <View style={styles.statCol}>
                    <Text style={styles.statValue}>{activeSession.totalPeople || 0}</Text>
                    <Text style={styles.statLabel}>People</Text>
                  </View>
                  <View style={styles.statCol}>
                    <Text style={styles.statValue}>{formattedCountdown}</Text>
                    <Text style={styles.statLabel}>Countdown</Text>
                  </View>
                </View>

                {/* Action Buttons Row (End / Share) */}
                <View style={styles.actionButtonsRow}>
                  {isOwner && (
                    <TouchableOpacity
                      style={styles.endActionBtn}
                      onPress={handleEnd}
                      disabled={submitting}
                      activeOpacity={0.85}
                    >
                      <LinearGradient
                        colors={['#3B82F6', '#2563EB', '#1D4ED8']}
                        style={styles.endBtnGradient}
                      >
                        <Text style={styles.endBtnText}>End</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[styles.shareActionBtn, !isOwner && { flex: 1 }]}
                    onPress={() => onShareSession && onShareSession(activeSession)}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={['#F59E0B', '#F97316', '#EAB308']}
                      style={styles.shareBtnGradient}
                    >
                      <Text style={styles.shareBtnText}>Share</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              // ----------------- ENDED RESULT STATE -----------------
              <View style={styles.endedBody}>
                {/* Result Banners */}
                <View style={styles.endedBannersRow}>
                  {/* Top Supporter (Red) */}
                  <View style={styles.endedBannerItem}>
                    <LinearGradient
                      colors={['#EF4444', '#DC2626', '#B91C1C']}
                      style={styles.endedBannerGrad}
                    >
                      <Image
                        source={
                          activeSession?.topSupporter?.avatar
                            ? { uri: activeSession.topSupporter.avatar }
                            : require('../../assets/avtar.webp')
                        }
                        style={styles.participantAvatar}
                      />
                      <Text style={styles.bannerRoleTitle}>Top supporter</Text>
                      <Text style={styles.participantName} numberOfLines={1}>
                        {activeSession?.topSupporter?.name || 'None'}
                      </Text>
                      <View style={styles.diamondScoreCapsule}>
                        <Text style={styles.scoreDiamondIcon}>💎</Text>
                        <Text style={styles.scoreNumber}>
                          {activeSession?.topSupporter?.score || 0}
                        </Text>
                      </View>
                    </LinearGradient>
                  </View>

                  {/* Top Charming (Purple) */}
                  <View style={styles.endedBannerItem}>
                    <LinearGradient
                      colors={['#8B5CF6', '#7C3AED', '#6D28D9']}
                      style={styles.endedBannerGrad}
                    >
                      <Image
                        source={
                          activeSession?.topCharming?.avatar
                            ? { uri: activeSession.topCharming.avatar }
                            : require('../../assets/avtar.webp')
                        }
                        style={styles.participantAvatar}
                      />
                      <Text style={styles.bannerRoleTitle}>Top charming</Text>
                      <Text style={styles.participantName} numberOfLines={1}>
                        {activeSession?.topCharming?.name || 'None'}
                      </Text>
                      <View style={styles.scoreCapsule}>
                        <Text style={styles.scoreStarIcon}>⭐</Text>
                        <Text style={styles.scoreNumber}>
                          {activeSession?.topCharming?.score || 0}
                        </Text>
                      </View>
                    </LinearGradient>
                  </View>
                </View>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                  <View style={styles.statCol}>
                    <Text style={styles.statValue}>{activeSession?.totalScore || 0}</Text>
                    <Text style={styles.statLabel}>Total</Text>
                  </View>
                  <View style={styles.statCol}>
                    <Text style={styles.statValue}>{activeSession?.totalPeople || 0}</Text>
                    <Text style={styles.statLabel}>People</Text>
                  </View>
                  <View style={styles.statCol}>
                    <Text style={styles.statValue}>End</Text>
                    <Text style={styles.statLabel}>Countdown</Text>
                  </View>
                </View>

                {/* Share Button */}
                <TouchableOpacity
                  style={styles.shareFullBtn}
                  onPress={() => onShareSession && onShareSession(activeSession)}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['#F59E0B', '#F97316', '#EAB308']}
                    style={styles.shareBtnGradient}
                  >
                    <Text style={styles.shareBtnText}>Share</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* ==================== DURATION SCROLL PICKER BOTTOM SHEET ==================== */}
        <Modal
          visible={showPicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowPicker(false)}
        >
          <View style={styles.pickerOverlay}>
            <TouchableOpacity
              style={styles.pickerBackdrop}
              activeOpacity={1}
              onPress={() => setShowPicker(false)}
            />
            <View style={styles.pickerContainer}>
              {/* Header */}
              <View style={styles.pickerHeader}>
                <TouchableOpacity
                  onPress={() => setShowPicker(false)}
                  style={styles.pickerHeaderBtn}
                >
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
                <Text style={styles.pickerHeaderTitle}>Select times</Text>
                <TouchableOpacity
                  onPress={() => {
                    setDurationMins(tempDuration);
                    setShowPicker(false);
                  }}
                  style={styles.pickerHeaderBtn}
                >
                  <Text style={styles.pickerDoneText}>Done</Text>
                </TouchableOpacity>
              </View>

              {/* 1 min to 60 mins Scroll List */}
              <ScrollView
                style={styles.pickerScrollView}
                contentContainerStyle={styles.pickerScrollContent}
                showsVerticalScrollIndicator={false}
              >
                {DURATION_OPTIONS.map((item) => {
                  const isSelected = item === tempDuration;
                  return (
                    <TouchableOpacity
                      key={item}
                      style={[
                        styles.pickerItem,
                        isSelected && styles.pickerItemSelected,
                      ]}
                      onPress={() => setTempDuration(item)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          isSelected && styles.pickerItemTextSelected,
                        ]}
                      >
                        {item} mins
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Popup card
  popupCard: {
    width: SCREEN_WIDTH * 0.88,
    maxWidth: 380,
    backgroundColor: '#3E3465',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#7C67B8',
    paddingTop: 36,
    paddingHorizontal: 20,
    paddingBottom: 24,
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 15,
  },
  // Top Header Ribbon
  headerRibbonContainer: {
    position: 'absolute',
    top: -18,
    alignSelf: 'center',
    zIndex: 10,
  },
  headerRibbon: {
    paddingHorizontal: 28,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#C084FC',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 140,
    shadowColor: '#C084FC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
  headerRibbonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  helpBtn: {
    position: 'absolute',
    top: 14,
    left: 16,
    zIndex: 5,
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 16,
    zIndex: 5,
  },
  iconBtnImg: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
  // Decorations
  decorStarLeft: {
    position: 'absolute',
    top: -24,
    left: 45,
    width: 34,
    height: 34,
    resizeMode: 'contain',
  },
  decorStarRight: {
    position: 'absolute',
    top: -22,
    right: 50,
    width: 30,
    height: 30,
    resizeMode: 'contain',
  },
  decorHeartLeft: {
    position: 'absolute',
    top: -16,
    left: 14,
    width: 26,
    height: 26,
    resizeMode: 'contain',
  },
  decorHeartRight: {
    position: 'absolute',
    top: -14,
    right: 18,
    width: 26,
    height: 26,
    resizeMode: 'contain',
  },
  // Setup State
  setupBody: {
    width: '100%',
    marginTop: 10,
  },
  themeInputContainer: {
    backgroundColor: '#2F2753',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#4E4280',
    padding: 14,
    minHeight: 120,
    position: 'relative',
    marginBottom: 16,
  },
  themeInput: {
    color: '#FFF',
    fontSize: 15,
    textAlignVertical: 'top',
    height: 80,
  },
  charCounter: {
    position: 'absolute',
    bottom: 8,
    right: 12,
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
  },
  durationLabel: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  durationSelectorBox: {
    backgroundColor: '#2F2753',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4E4280',
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  durationSubtext: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 11,
    marginBottom: 4,
  },
  durationValueText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  confirmButton: {
    width: '100%',
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
  },
  confirmGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmDisabledInner: {
    flex: 1,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmTextActive: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '800',
  },
  confirmTextDisabled: {
    color: '#94A3B8',
    fontSize: 17,
    fontWeight: '700',
  },
  // Active State
  activeBody: {
    width: '100%',
    marginTop: 10,
    alignItems: 'center',
  },
  rankingCardArea: {
    width: '100%',
    minHeight: 160,
    backgroundColor: '#2F2753',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyRankingBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyRankingText: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 15,
    fontWeight: '500',
  },
  charmingBanner: {
    width: 140,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
  },
  charmingBannerGrad: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  participantAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#F59E0B',
    marginBottom: 6,
  },
  bannerRoleTitle: {
    color: '#FCD34D',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
  },
  participantName: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  scoreCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  scoreStarIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  scoreNumber: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingVertical: 12,
    marginBottom: 16,
  },
  statCol: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 12,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  endActionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  endBtnGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  endBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  shareActionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  shareBtnGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  // Ended State
  endedBody: {
    width: '100%',
    marginTop: 10,
    alignItems: 'center',
  },
  endedBannersRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
    marginBottom: 16,
  },
  endedBannerItem: {
    flex: 1,
    maxWidth: 130,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
  },
  endedBannerGrad: {
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  diamondScoreCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  scoreDiamondIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  shareFullBtn: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  // Bottom Sheet Duration Picker
  pickerOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  pickerBackdrop: {
    flex: 1,
  },
  pickerContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: 380,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  pickerHeaderBtn: {
    padding: 6,
  },
  pickerHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  pickerDoneText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#06B6D4',
  },
  pickerScrollView: {
    maxHeight: 280,
  },
  pickerScrollContent: {
    paddingVertical: 10,
  },
  pickerItem: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  pickerItemSelected: {
    backgroundColor: '#F3F4F6',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
  },
  pickerItemText: {
    fontSize: 17,
    color: '#9CA3AF',
  },
  pickerItemTextSelected: {
    fontSize: 19,
    fontWeight: '800',
    color: '#111827',
  },
  // Rules Screen
  rulesContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1E143E',
  },
  rulesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 14,
  },
  backButton: {
    padding: 6,
  },
  rulesHeaderTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  rulesScrollContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  starryBanner: {
    width: '100%',
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  floatingStar: {
    position: 'absolute',
    width: 28,
    height: 28,
    resizeMode: 'contain',
  },
  brightestStarTitle: {
    color: '#E0E7FF',
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 1,
    textShadowColor: '#818CF8',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  rulesCard: {
    width: '100%',
    backgroundColor: '#2F2356',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#5B429A',
    padding: 24,
    alignItems: 'center',
    marginTop: 10,
    position: 'relative',
  },
  cardRibbonBadge: {
    position: 'absolute',
    top: -16,
    backgroundColor: '#4C1D95',
    borderColor: '#A78BFA',
    borderWidth: 1.5,
    paddingHorizontal: 22,
    paddingVertical: 6,
    borderRadius: 16,
  },
  cardRibbonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  rulesCardSubtitle: {
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  rulesConversionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  starTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 14,
  },
  starTagIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  starTagText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  equalSign: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },
  diamondTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#C084FC',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 14,
  },
  diamondTagIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  diamondTagText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  rulesDescription: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
});
