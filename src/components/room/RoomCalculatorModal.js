import React, { useState, useEffect, useMemo } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Sliced graphic assets from user-provided design
const calcFullFrameImg = require('../../assets/calculator/calc_full_frame.png');
const calcHelpBtnImg = require('../../assets/calculator/calc_help_btn.png');
const calcCloseBtnImg = require('../../assets/calculator/calc_close_btn.png');
const calcConfirmBtnImg = require('../../assets/calculator/calc_confirm_btn.png');
const calcRibbonBannerImg = require('../../assets/calculator/calc_ribbon_banner.png');
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
          <View style={styles.popupWrapper}>
            <ImageBackground
              source={calcFullFrameImg}
              style={styles.popupCard}
              imageStyle={styles.popupCardImg}
              resizeMode="stretch"
            >
              {/* Top Header Ribbon / Badge */}
              <View style={styles.headerRibbonContainer} pointerEvents="none">
                <ImageBackground
                  source={calcRibbonBannerImg}
                  style={styles.headerRibbonBg}
                  imageStyle={styles.headerRibbonBgImg}
                  resizeMode="contain"
                >
                  <Text style={styles.headerRibbonText} numberOfLines={1}>
                    {activeSession ? (activeSession.theme || 'Calculator') : 'Calculator'}
                  </Text>
                </ImageBackground>
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
              {!activeSession || (activeSession.status !== 'active' && activeSession.status !== 'ended') ? (
                // ----------------- SETUP STATE -----------------
                <View style={styles.setupBody}>
                  {/* Theme Text Input */}
                  <View style={styles.themeInputContainer}>
                    <TextInput
                      style={styles.themeInput}
                      placeholder="Enter activity theme..."
                      placeholderTextColor="rgba(191, 219, 254, 0.5)"
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
                        imageStyle={styles.confirmBtnImgStyle}
                        resizeMode="contain"
                      >
                        {submitting && (
                          <ActivityIndicator color="#FFF" size="small" />
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
                          color="rgba(56, 189, 248, 0.6)"
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
                          colors={['#0284C7', '#0369A1', '#075985']}
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
                        <View style={styles.scoreCapsule}>
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
            </ImageBackground>
          </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popupWrapper: {
    width: Math.min(SCREEN_WIDTH * 0.94, 380),
    alignItems: 'center',
    justifyContent: 'center',
  },
  popupCard: {
    width: '100%',
    minHeight: 460,
    paddingTop: 54,
    paddingHorizontal: 22,
    paddingBottom: 30,
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.55,
    shadowRadius: 20,
    elevation: 20,
  },
  popupCardImg: {
    borderRadius: 28,
  },
  // Top Header Ribbon
  headerRibbonContainer: {
    position: 'absolute',
    top: -14,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  headerRibbonBg: {
    width: 175,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  headerRibbonBgImg: {
    resizeMode: 'contain',
  },
  headerRibbonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  helpBtn: {
    position: 'absolute',
    top: 18,
    left: 20,
    zIndex: 15,
  },
  closeBtn: {
    position: 'absolute',
    top: 18,
    right: 20,
    zIndex: 15,
  },
  iconBtnImg: {
    width: 36,
    height: 36,
    resizeMode: 'contain',
  },
  // Setup State
  setupBody: {
    width: '100%',
    marginTop: 8,
  },
  themeInputContainer: {
    backgroundColor: 'rgba(6, 20, 60, 0.88)',
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: '#1D4ED8',
    padding: 14,
    minHeight: 110,
    position: 'relative',
    marginBottom: 16,
  },
  themeInput: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
    minHeight: 65,
    textAlignVertical: 'top',
    padding: 0,
  },
  charCounter: {
    position: 'absolute',
    bottom: 8,
    right: 12,
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
  },
  durationLabel: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  durationSelectorBox: {
    backgroundColor: 'rgba(6, 20, 60, 0.88)',
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: '#1D4ED8',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 22,
    justifyContent: 'center',
  },
  durationSubtext: {
    color: '#93C5FD',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  durationValueText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  confirmButton: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.25)',
  },
  confirmBtnImgBg: {
    width: '100%',
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnImgStyle: {
    resizeMode: 'contain',
  },
  confirmDisabledInner: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmTextDisabled: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 15,
    fontWeight: '700',
  },

  // Active Session State
  activeBody: {
    width: '100%',
    marginTop: 8,
  },
  rankingCardArea: {
    width: '100%',
    height: 180,
    backgroundColor: 'rgba(6, 20, 60, 0.85)',
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: '#1D4ED8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  emptyRankingBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyRankingText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 14,
    fontWeight: '600',
  },
  charmingBanner: {
    width: 140,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  charmingBannerGrad: {
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  participantAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#F59E0B',
    marginBottom: 6,
  },
  bannerRoleTitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 2,
  },
  participantName: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 6,
    maxWidth: 120,
    textAlign: 'center',
  },
  scoreCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  scoreStarIcon: {
    fontSize: 11,
    marginRight: 4,
  },
  scoreDiamondIcon: {
    fontSize: 11,
    marginRight: 4,
  },
  scoreNumber: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
    marginBottom: 16,
  },
  statCol: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  statLabel: {
    color: '#93C5FD',
    fontSize: 11,
    fontWeight: '600',
  },

  // Action Buttons
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  endActionBtn: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
  },
  endBtnGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  shareActionBtn: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
  },
  shareBtnGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },

  // Ended Body
  endedBody: {
    width: '100%',
    marginTop: 8,
  },
  endedBannersRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    width: '100%',
    marginBottom: 16,
  },
  endedBannerItem: {
    flex: 1,
    maxWidth: 140,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
  },
  endedBannerGrad: {
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  shareFullBtn: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },

  // Rules Screen
  rulesContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0F172A',
  },
  rulesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'android' ? 44 : 54,
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
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
    padding: 20,
    alignItems: 'center',
  },
  starryBanner: {
    width: '100%',
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 10,
  },
  floatingStar: {
    position: 'absolute',
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  brightestStarTitle: {
    color: '#E0E7FF',
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 34,
    textShadowColor: '#38BDF8',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  rulesCard: {
    width: '100%',
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    paddingTop: 28,
    paddingHorizontal: 18,
    paddingBottom: 24,
    alignItems: 'center',
    position: 'relative',
    marginTop: 18,
  },
  cardRibbonBadge: {
    position: 'absolute',
    top: -14,
    backgroundColor: '#0284C7',
    paddingHorizontal: 20,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  cardRibbonText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },
  rulesCardSubtitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  rulesConversionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    gap: 12,
  },
  starTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  starTagIcon: {
    fontSize: 14,
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
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  diamondTagIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  diamondTagText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  rulesDescription: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 10,
  },

  // Duration Scroll Picker Overlay
  pickerOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99999,
    justifyContent: 'flex-end',
  },
  pickerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.45,
    paddingBottom: Platform.OS === 'android' ? 20 : 34,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
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
    fontSize: 15,
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
    justifyContent: 'center',
  },
  pickerItemSelected: {
    backgroundColor: 'rgba(2, 132, 199, 0.08)',
  },
  pickerItemText: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
  pickerItemTextSelected: {
    color: '#0284C7',
    fontWeight: '800',
    fontSize: 17,
  },
});
