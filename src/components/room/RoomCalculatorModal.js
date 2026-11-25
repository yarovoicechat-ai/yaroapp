import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ImageBackground,
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

// User assets
const calcBadgeBlankImg = require('../../assets/calculator/calc_badge_blank.png');
const calcBadgeTextImg = require('../../assets/calculator/calc_badge_text.png');
const calcHelpBtnImg = require('../../assets/calculator/calc_help_btn.png');
const calcCloseBtnImg = require('../../assets/calculator/calc_close_btn.png');
const calcConfirmBtnImg = require('../../assets/calculator/calc_confirm_btn.png');
const calcStarImg = require('../../assets/calculator/calc_star.png');
const calcHeartImg = require('../../assets/calculator/calc_heart.png');
const calcFrameDecoratedImg = require('../../assets/calculator/calc_frame_decorated.png');
const calcFramePlainImg = require('../../assets/calculator/calc_frame_plain.png');

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
  const [postToast, setPostToast] = useState(false);
  const [forceSetup, setForceSetup] = useState(false);

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
      setForceSetup(false);
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
      // Show "Post successfully" brief toast matching video frame 55
      setPostToast(true);
      setTimeout(() => {
        setPostToast(false);
      }, 1500);
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
                <ImageBackground
                  source={calcBadgeBlankImg}
                  style={styles.rulesCardRibbonBadge}
                  resizeMode="stretch"
                >
                  <Text style={styles.rulesCardRibbonText}>How to improve</Text>
                </ImageBackground>

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
          <ImageBackground
            source={calcFrameDecoratedImg}
            style={styles.popupCard}
            imageStyle={styles.popupCardImg}
            resizeMode="stretch"
          >
            {/* Top Hexagonal Header Ribbon Asset */}
            <View style={styles.headerRibbonContainer}>
              <ImageBackground
                source={calcBadgeBlankImg}
                style={styles.headerRibbonBg}
                resizeMode="stretch"
              >
                <Text style={styles.headerRibbonText} numberOfLines={1}>
                  {activeSession ? (activeSession.theme || 'Calculator') : 'Calculator'}
                </Text>
              </ImageBackground>
            </View>

            {/* Top Left ? Help Button from user assets */}
            <TouchableOpacity
              style={styles.helpBtn}
              onPress={() => setShowRules(true)}
              hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
              activeOpacity={0.8}
            >
              <Image source={calcHelpBtnImg} style={styles.iconBtnImg} />
            </TouchableOpacity>

            {/* Top Right X Close Button from user assets */}
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => {
                setForceSetup(false);
                onClose && onClose();
              }}
              hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
              activeOpacity={0.8}
            >
              <Image source={calcCloseBtnImg} style={styles.iconBtnImg} />
            </TouchableOpacity>

            {/* Content body based on session state */}
            {forceSetup || !activeSession || (activeSession.status !== 'active' && activeSession.status !== 'ended') ? (
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
                    <ImageBackground
                      source={calcConfirmBtnImg}
                      style={styles.confirmBtnImgBg}
                      resizeMode="stretch"
                    >
                      {submitting ? (
                        <ActivityIndicator color="#FFF" size="small" />
                      ) : (
                        <Text style={styles.confirmTextActive}>Confirm</Text>
                      )}
                    </ImageBackground>
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
                {/* Post Toast (matching video frame 55) */}
                {postToast && (
                  <View style={styles.toastOverlay}>
                    <Text style={styles.toastText}>Post successfully</Text>
                  </View>
                )}

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
                      {submitting && (
                        <ActivityIndicator
                          size="small"
                          color="#FFF"
                          style={{ marginTop: 16 }}
                        />
                      )}
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
                        {submitting ? (
                          <ActivityIndicator color="#FFF" size="small" />
                        ) : (
                          <Text style={styles.endBtnText}>End</Text>
                        )}
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

                {/* Action Buttons Row */}
                <View style={styles.actionButtonsRow}>
                  {isOwner && (
                    <TouchableOpacity
                      style={styles.endActionBtn}
                      onPress={() => setForceSetup(true)}
                      activeOpacity={0.85}
                    >
                      <LinearGradient
                        colors={['#10B981', '#059669', '#047857']}
                        style={styles.endBtnGradient}
                      >
                        <Text style={styles.endBtnText}>New Session</Text>
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
            )}
          </ImageBackground>
        )}

        {/* ==================== DURATION SCROLL PICKER BOTTOM SHEET ==================== */}
        {showPicker && (
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
        )}
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
    width: SCREEN_WIDTH * 0.92,
    maxWidth: 395,
    minHeight: 440,
    backgroundColor: 'transparent',
    paddingTop: 54,
    paddingHorizontal: 28,
    paddingBottom: 28,
    alignItems: 'center',
    position: 'relative',
    justifyContent: 'center',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  popupCardImg: {
    resizeMode: 'stretch',
  },
  // Top Header Ribbon
  headerRibbonContainer: {
    position: 'absolute',
    top: -16,
    alignSelf: 'center',
    zIndex: 10,
  },
  headerRibbonBg: {
    width: 175,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  headerRibbonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  helpBtn: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 15,
  },
  closeBtn: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 15,
  },
  iconBtnImg: {
    width: 34,
    height: 34,
    resizeMode: 'contain',
  },
  // Setup State
  setupBody: {
    width: '100%',
    marginTop: 10,
  },
  themeInputContainer: {
    backgroundColor: 'rgba(10, 16, 46, 0.75)',
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: 'rgba(56, 189, 248, 0.45)',
    padding: 14,
    minHeight: 110,
    position: 'relative',
    marginBottom: 16,
  },
  themeInput: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '500',
    padding: 0,
    textAlignVertical: 'top',
    height: 70,
  },
  charCounter: {
    position: 'absolute',
    bottom: 10,
    right: 14,
    color: '#2DD4BF',
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
    backgroundColor: 'rgba(10, 16, 46, 0.75)',
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: 'rgba(56, 189, 248, 0.45)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  durationSubtext: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 13,
  },
  durationValueText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  confirmButton: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  confirmBtnImgBg: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#C4C4C4',
  },
  confirmDisabledInner: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#C4C4C4',
  },
  confirmTextActive: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  confirmTextDisabled: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '700',
  },
  // Active State
  activeBody: {
    width: '100%',
    marginTop: 10,
    alignItems: 'center',
  },
  toastOverlay: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    backgroundColor: '#FFF',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 8,
    zIndex: 99,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  toastText: {
    color: '#1F2937',
    fontSize: 13,
    fontWeight: '700',
  },
  rankingCardArea: {
    width: '100%',
    minHeight: 180,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 16, 46, 0.75)',
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    padding: 16,
    marginBottom: 16,
  },
  emptyRankingBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyRankingText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
    opacity: 0.9,
  },
  charmingBanner: {
    width: 130,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 6,
  },
  charmingBannerGrad: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  participantAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#FFF',
    marginBottom: 6,
  },
  bannerRoleTitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  participantName: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
    maxWidth: 100,
    textAlign: 'center',
  },
  scoreCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  scoreStarIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  scoreNumber: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  diamondScoreCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  scoreDiamondIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  // Stats Row
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  statCol: {
    alignItems: 'center',
  },
  statValue: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
  },
  // Action Buttons
  actionButtonsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  endActionBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  endBtnGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  endBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  shareActionBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  shareFullBtn: {
    width: '100%',
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
  },
  shareBtnGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
  },
  // Ended state
  endedBody: {
    width: '100%',
    marginTop: 10,
    alignItems: 'center',
  },
  endedBannersRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    marginBottom: 16,
    width: '100%',
  },
  endedBannerItem: {
    flex: 1,
    maxWidth: 135,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
  },
  endedBannerGrad: {
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  // Picker Bottom Sheet
  pickerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 999,
  },
  pickerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  pickerContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.45,
    paddingBottom: 24,
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
    padding: 4,
  },
  pickerHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  pickerDoneText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0284C7',
  },
  pickerScrollView: {
    maxHeight: 240,
  },
  pickerScrollContent: {
    paddingVertical: 8,
  },
  pickerItem: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  pickerItemSelected: {
    backgroundColor: '#F3F4F6',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  pickerItemTextSelected: {
    color: '#111827',
    fontWeight: '800',
    fontSize: 17,
  },
  // Rules Screen
  rulesContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#2A1F52',
  },
  rulesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 40 : 50,
    paddingBottom: 14,
    backgroundColor: '#2A1F52',
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
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  starryBanner: {
    width: '100%',
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 16,
  },
  floatingStar: {
    position: 'absolute',
    width: 36,
    height: 36,
    opacity: 0.7,
    resizeMode: 'contain',
  },
  brightestStarTitle: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 40,
    textShadowColor: '#C084FC',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  rulesCard: {
    width: '100%',
    backgroundColor: '#392C66',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#604F98',
    paddingTop: 32,
    paddingHorizontal: 18,
    paddingBottom: 24,
    alignItems: 'center',
    position: 'relative',
    marginTop: 10,
  },
  rulesCardRibbonBadge: {
    position: 'absolute',
    top: -16,
    width: 150,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rulesCardRibbonText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },
  rulesCardSubtitle: {
    color: '#E0E7FF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  rulesConversionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },
  starTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  starTagIcon: {
    fontSize: 13,
    marginRight: 4,
  },
  starTagText: {
    color: '#FFF',
    fontSize: 14,
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
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  diamondTagIcon: {
    fontSize: 13,
    marginRight: 4,
  },
  diamondTagText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  rulesDescription: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
});
