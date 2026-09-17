import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
  Share,
  Clipboard,
  Linking,
  Dimensions,
  RefreshControl,
  StatusBar,
  Modal,
  View as ScreenBackgroundView,
  StatusBar as ScreenBackgroundStatusBar,
  StyleSheet as ScreenBackgroundStyleSheet
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../../context/AuthProvider';
import { apiUtil } from '../../utils/apiUtil';
import { AlertService } from '../../utils/AlertService';
import { getUserAvatar } from '../../utils/avatarUtil';
import avatar from '../../assets/avtar.webp';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';

const coinIcon = require('../../assets/coin.webp');
const diamondIcon = require('../../assets/icons/diamond.png');

const { width } = Dimensions.get('window');

const InviteEarn = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomPadding = getStackScreenBottomPadding(insets.bottom, 24);
  const { user, fetchUserProfile } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);

  const [referralData, setReferralData] = useState({
    referralCode: user?.referralCode || `MC${user?.userId || ''}`,
    referralLink: `https://mithichat.live/refer/${user?.referralCode || ''}`,
    totalReferrals: 0,
    totalEarnedCoins: 0,
    hasRedeemedReferral: false,
    referredUsers: [],
  });

  const [inputCode, setInputCode] = useState('');
  const [claiming, setClaiming] = useState(false);

  const loadReferralDetails = useCallback(async () => {
    try {
      const res = await apiUtil.get('/referral/details');
      if (res.data?.success) {
        setReferralData(res.data.data || {});
      }
    } catch (err) {
      console.log('Failed to fetch referral details:', err.response?.data || err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadReferralDetails();
  }, [loadReferralDetails]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUserProfile();
    loadReferralDetails();
  };

  const handleCopyCode = () => {
    const code = referralData.referralCode || `MC${user?.userId || ''}`;
    if (code) {
      Clipboard.setString(code);
      setCopiedCode(true);
      AlertService.show('Copied', 'Referral code copied to clipboard!', 'success');
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleCopyLink = () => {
    const link = referralData.referralLink || `https://mithichat.live/refer/${referralData.referralCode || ''}`;
    if (link) {
      Clipboard.setString(link);
      setCopiedLink(true);
      AlertService.show('Copied', 'Referral link copied to clipboard!', 'success');
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const getShareMessage = () => {
    const code = referralData.referralCode || `MC${user?.userId || ''}`;
    const link = referralData.referralLink || `https://mithichat.live/refer/${code}`;
    return `✨ *MEETHI CHAT — SPECIAL INVITATION* ✨\n\n🎉 Join me on Meethi Chat, the #1 Live Video & Voice Social App!\n\n🎁 *Exclusive Bonus:* Use my Referral Code *${code}* during profile setup to claim *100 FREE Welcome Diamonds*!\n\n👇 *Download App & Claim Bonus:* \n${link}\n\n🔥 Install now & let's connect!`;
  };

  const handleNativeShare = async () => {
    try {
      await Share.share({
        message: getShareMessage(),
        title: 'Invite Friends & Earn Coins on Meethi Chat',
      });
    } catch (err) {
      console.log('Share error:', err.message);
    }
  };

  const handleWhatsAppShare = async () => {
    const message = encodeURIComponent(getShareMessage());
    const whatsappUrl = `whatsapp://send?text=${message}`;
    try {
      const supported = await Linking.canOpenURL(whatsappUrl);
      if (supported) {
        await Linking.openURL(whatsappUrl);
      } else {
        handleNativeShare();
      }
    } catch (err) {
      handleNativeShare();
    }
  };

  const handleClaimReferral = async () => {
    const code = inputCode.trim().toUpperCase();
    if (!code) {
      AlertService.show('Required', 'Please enter a referral code', 'error');
      return;
    }

    setClaiming(true);
    try {
      const res = await apiUtil.post('/referral/claim', { referralCode: code });
      if (res.data?.success) {
        AlertService.show('Success! 🎉', 'Referral code redeemed successfully!', 'success');
        setInputCode('');
        await fetchUserProfile();
        loadReferralDetails();
      } else {
        AlertService.show('Error', res.data?.message || 'Failed to redeem referral code', 'error');
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to redeem code';
      AlertService.show('Notice', errMsg, 'error');
    } finally {
      setClaiming(false);
    }
  };

  return (
    <ScreenBackgroundView style={[{ flex: 1, backgroundColor: '#F8FAFC' }]}>
      <ScreenBackgroundStatusBar backgroundColor="#FFFFFF" barStyle="dark-content" animated />
      <LinearGradient colors={['#020817', '#0a1128', '#000000']} style={ScreenBackgroundStyleSheet.absoluteFillObject} />
      <ScreenBackgroundStatusBar backgroundColor="#020817" barStyle="light-content" />

      {/* Professional Top Header Bar */}
      <View style={[styles.topHeader, { paddingTop: topSafeInset + 8 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.topHeaderTitle}>Invite & Earn</Text>

        <View style={styles.headerRightGroup}>
          <TouchableOpacity
            style={styles.rulesBtnHeader}
            onPress={() => setShowRulesModal(true)}
            activeOpacity={0.8}
          >
            <Icon name="help-outline" size={16} color="#fbbf24" style={{ marginRight: 3 }} />
            <Text style={styles.rulesBtnHeaderText}>Rules</Text>
          </TouchableOpacity>

          <View style={styles.coinPillHeader}>
            <Image source={diamondIcon} style={styles.headerAssetIcon} resizeMode="contain" />
            <Text style={styles.coinPillText}>{user?.diamonds || 0}</Text>
          </View>

          <View style={[styles.coinPillHeader, { borderColor: '#fbbf24', backgroundColor: 'rgba(251, 191, 36, 0.15)' }]}>
            <Image source={coinIcon} style={styles.headerAssetIcon} resizeMode="contain" />
            <Text style={styles.coinPillText}>{user?.coins || 0}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: bottomPadding }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#03dcfe" />
        }
      >
        {/* Executive Hero Banner Card */}
        <View style={styles.heroWrapper}>
          <LinearGradient
            colors={['#fbbf24', '#03dcfe', '#d946ef']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroBorder}
          >
            <LinearGradient
              colors={['rgba(15, 10, 50, 0.96)', 'rgba(5, 3, 25, 0.96)']}
              style={styles.heroCard}
            >
              <View style={styles.heroBadgeRow}>
                <View style={styles.heroBadge}>
                  <Image source={coinIcon} style={styles.headerAssetIcon} resizeMode="contain" />
                  <Text style={styles.heroBadgeText}>REFERRAL REWARDS</Text>
                </View>
              </View>

              <Text style={styles.heroTitle}>Invite Friends & Earn Rewards</Text>
              <Text style={styles.heroSub}>
                New friends get <Text style={styles.highlightCyan}>100 Diamonds</Text>. You get <Text style={styles.highlightGold}>25 Coins</Text> on sign-up + <Text style={styles.highlightGold}>25 Coins</Text> after 5 mins call time!
              </Text>

              {/* Dynamic Reward Exchange Display */}
              <View style={styles.rewardExchangeRow}>
                <View style={styles.rewardExchangeBox}>
                  <Text style={styles.exchangeBoxLabel}>NEW FRIEND GETS</Text>
                  <View style={styles.exchangeBoxValRow}>
                    <Image source={diamondIcon} style={styles.assetIconMd} resizeMode="contain" />
                    <Text style={[styles.exchangeBoxVal, { color: '#03dcfe' }]}>+100 DIAMONDS</Text>
                  </View>
                </View>

                <View style={styles.exchangeArrowCircle}>
                  <Icon name="swap-horiz" size={20} color="#03dcfe" />
                </View>

                <View style={styles.rewardExchangeBox}>
                  <Text style={styles.exchangeBoxLabel}>YOU RECEIVE</Text>
                  <View style={styles.exchangeBoxValRow}>
                    <Image source={coinIcon} style={styles.assetIconMd} resizeMode="contain" />
                    <Text style={styles.exchangeBoxVal}>+50 COINS</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </LinearGradient>
        </View>

        {/* Professional VIP Referral Code & Link Pass Card */}
        <View style={styles.passCardWrapper}>
          <LinearGradient
            colors={['#fbbf24', '#d946ef']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.passCardBorder}
          >
            <View style={styles.passCardInner}>
              <View style={styles.passCardHeader}>
                <Icon name="vpn-key" size={18} color="#fbbf24" />
                <Text style={styles.passCardTitle}>YOUR EXCLUSIVE REFERRAL CODE</Text>
              </View>

              {/* Code Box */}
              <TouchableOpacity
                style={styles.codeContainer}
                activeOpacity={0.8}
                onPress={handleCopyCode}
              >
                <Text style={styles.codeText}>
                  {referralData.referralCode || `MC${user?.userId || ''}`}
                </Text>
                <View style={styles.copyBadgeBtn}>
                  <Icon name={copiedCode ? 'check' : 'content-copy'} size={14} color="#03dcfe" />
                  <Text style={styles.copyBadgeBtnText}>{copiedCode ? 'COPIED' : 'COPY'}</Text>
                </View>
              </TouchableOpacity>

              {/* Link Box */}
              <View style={styles.linkContainer}>
                <Icon name="link" size={16} color="rgba(255,255,255,0.4)" style={{ marginRight: 6 }} />
                <Text style={styles.linkText} numberOfLines={1}>
                  {referralData.referralLink || `https://mithichat.live/refer/${user?.referralCode || ''}`}
                </Text>
                <TouchableOpacity style={styles.linkCopyBtn} activeOpacity={0.8} onPress={handleCopyLink}>
                  <Text style={styles.linkCopyBtnText}>{copiedLink ? 'COPIED' : 'COPY LINK'}</Text>
                </TouchableOpacity>
              </View>

              {/* Multi-Channel Share Buttons */}
              <View style={styles.shareHubRow}>
                <TouchableOpacity
                  style={[styles.shareHubBtn, styles.waBg]}
                  activeOpacity={0.85}
                  onPress={handleWhatsAppShare}
                >
                  <Icon name="chat" size={18} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={styles.shareHubBtnText}>WhatsApp</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.shareHubBtn, styles.shareBg]}
                  activeOpacity={0.85}
                  onPress={handleNativeShare}
                >
                  <Icon name="share" size={18} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={styles.shareHubBtnText}>Share Link</Text>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Live Performance Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <LinearGradient
              colors={['rgba(3, 220, 254, 0.12)', 'rgba(3, 220, 254, 0.02)']}
              style={styles.statCardGradient}
            >
              <View style={styles.statIconRing}>
                <Icon name="group-add" size={22} color="#03dcfe" />
              </View>
              <Text style={styles.statNumber}>{referralData.totalReferrals || 0}</Text>
              <Text style={styles.statLabel}>Invited Friends</Text>
            </LinearGradient>
          </View>

          <View style={styles.statCard}>
            <LinearGradient
              colors={['rgba(251, 191, 36, 0.12)', 'rgba(251, 191, 36, 0.02)']}
              style={styles.statCardGradient}
            >
              <View style={[styles.statIconRing, { backgroundColor: 'rgba(251, 191, 36, 0.2)' }]}>
                <Image source={coinIcon} style={styles.statAssetIcon} resizeMode="contain" />
              </View>
              <Text style={styles.statNumber}>{referralData.totalEarnedCoins || 0}</Text>
              <Text style={styles.statLabel}>Earned Coins</Text>
            </LinearGradient>
          </View>
        </View>

        {/* Redeem Code Section */}
        <View style={styles.sectionGlassCard}>
          <View style={styles.sectionCardHeader}>
            <Icon name="confirmation-number" size={18} color="#fbbf24" style={{ marginRight: 6 }} />
            <Text style={styles.sectionCardTitle}>REDEEM INVITE CODE</Text>
          </View>

          {referralData.hasRedeemedReferral ? (
            <View style={styles.claimedBanner}>
              <Icon name="check-circle" size={18} color="#10b981" style={{ marginRight: 8 }} />
              <Text style={styles.claimedBannerText}>Referral Code Already Claimed</Text>
            </View>
          ) : (
            <View style={styles.redeemRow}>
              <TextInput
                style={styles.redeemInput}
                placeholder="Enter friend's referral code (e.g. MC1000000120)"
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={inputCode}
                onChangeText={text => setInputCode(text.toUpperCase())}
                autoCapitalize="characters"
              />
              <TouchableOpacity
                style={styles.redeemBtn}
                activeOpacity={0.8}
                onPress={handleClaimReferral}
                disabled={claiming}
              >
                {claiming ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <LinearGradient
                    colors={['#03dcfe', '#2563eb']}
                    style={styles.redeemGradient}
                  >
                    <Text style={styles.redeemBtnText}>Redeem</Text>
                  </LinearGradient>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Professional Step-by-Step Flow */}
        <View style={styles.sectionGlassCard}>
          <View style={styles.sectionCardHeader}>
            <Icon name="alt-route" size={18} color="#03dcfe" style={{ marginRight: 6 }} />
            <Text style={styles.sectionCardTitle}>HOW REWARDS WORK (2-STEP SYSTEM)</Text>
          </View>

          <View style={styles.flowContainer}>
            <View style={styles.flowStepItem}>
              <View style={styles.flowStepBadge}><Text style={styles.flowStepNum}>1</Text></View>
              <View style={styles.flowStepTextWrap}>
                <Text style={styles.flowStepTitle}>Share Your Code or Link</Text>
                <Text style={styles.flowStepDesc}>Send your referral code or link to your friends via WhatsApp or Social Media.</Text>
              </View>
            </View>

            <View style={styles.flowStepItem}>
              <View style={styles.flowStepBadge}><Text style={styles.flowStepNum}>2</Text></View>
              <View style={styles.flowStepTextWrap}>
                <Text style={styles.flowStepTitle}>New User Bonus (+100 Diamonds)</Text>
                <Text style={styles.flowStepDesc}>Friend installs Meethi Chat & enters your code. Friend receives +100 Diamonds instantly, and you get +25 Coins!</Text>
              </View>
            </View>

            <View style={styles.flowStepItem}>
              <View style={styles.flowStepBadge}><Text style={styles.flowStepNum}>3</Text></View>
              <View style={styles.flowStepTextWrap}>
                <Text style={styles.flowStepTitle}>Step 2 Reward: 5 Min Call (+25 Coins)</Text>
                <Text style={styles.flowStepDesc}>When your friend completes 5 minutes (300s) of voice/video calls, you get another +25 Coins!</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Invited Friends History */}
        <View style={styles.sectionGlassCard}>
          <View style={styles.sectionCardHeader}>
            <Icon name="people" size={18} color="#d946ef" style={{ marginRight: 6 }} />
            <Text style={styles.sectionCardTitle}>INVITED FRIENDS & REWARD PROGRESS</Text>
          </View>

          {loading ? (
            <ActivityIndicator size="small" color="#03dcfe" style={{ marginVertical: 20 }} />
          ) : referralData.referredUsers && referralData.referredUsers.length > 0 ? (
            referralData.referredUsers.map((item, idx) => {
              const callSec = item.totalCallSeconds || 0;
              const callMin = Math.floor(callSec / 60);
              const callSecRem = callSec % 60;
              const callTimeFormatted = `${callMin}:${callSecRem < 10 ? '0' : ''}${callSecRem}`;
              const isStep2Done = item.step2Claimed || item.step2RewardStatus === 'COMPLETED';

              return (
                <View key={idx} style={styles.friendCard}>
                  <View style={styles.friendCardTop}>
                    <Image
                      source={getUserAvatar(item)}
                      style={styles.friendAvatar}
                    />
                    <View style={styles.friendDetails}>
                      <Text style={styles.friendName}>{item.name}</Text>
                      <Text style={styles.friendDate}>
                        Joined: {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recently'}
                      </Text>
                    </View>
                    <View style={styles.totalCoinsPill}>
                      <Icon name="monetization-on" size={14} color="#fbbf24" style={{ marginRight: 3 }} />
                      <Text style={styles.totalCoinsText}>+{item.totalCoinsEarned || (isStep2Done ? 50 : 25)} Coins</Text>
                    </View>
                  </View>

                  {/* 2-Step Progress Status Row */}
                  <View style={styles.stepProgressBox}>
                    <View style={styles.stepProgressRow}>
                      <View style={styles.stepBadgeDone}>
                        <Icon name="check-circle" size={14} color="#10b981" style={{ marginRight: 4 }} />
                        <Text style={styles.stepBadgeDoneText}>Step 1: Registered (+25 Coins)</Text>
                      </View>
                    </View>

                    <View style={styles.stepProgressRow}>
                      {isStep2Done ? (
                        <View style={styles.stepBadgeDone}>
                          <Icon name="check-circle" size={14} color="#10b981" style={{ marginRight: 4 }} />
                          <Text style={styles.stepBadgeDoneText}>Step 2: 5 Min Call (+25 Coins)</Text>
                        </View>
                      ) : (
                        <View style={styles.stepBadgePending}>
                          <Icon name="lock" size={12} color="#fbbf24" style={{ marginRight: 4 }} />
                          <Text style={styles.stepBadgePendingText}>
                            Call Progress: {callTimeFormatted} / 5:00 (+25 Coins)
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Icon name="person-add-disabled" size={40} color="rgba(255,255,255,0.25)" />
              <Text style={styles.emptyTitle}>No Friends Invited Yet</Text>
              <Text style={styles.emptySub}>
                Share your referral link above to start earning 25 Coins on signup + 25 Coins after 5 mins call time!
              </Text>
            </View>
          )}
        </View>

      </ScrollView>

      {/* Rules & Terms Popup Modal */}
      <Modal
        visible={showRulesModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowRulesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: Math.max(18, (insets.bottom || 0) + 12) }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Icon name="gavel" size={20} color="#fbbf24" style={{ marginRight: 6 }} />
                <Text style={styles.modalTitle}>Referral System Rules (नियम)</Text>
              </View>
              <TouchableOpacity onPress={() => setShowRulesModal(false)} style={styles.modalCloseBtn}>
                <Icon name="close" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.ruleItem}>
                <View style={styles.ruleNumBadge}><Text style={styles.ruleNumText}>1</Text></View>
                <View style={styles.ruleTextWrap}>
                  <Text style={styles.ruleItemTitle}>New User Welcome Reward (+100 Diamonds)</Text>
                  <Text style={styles.ruleItemDesc}>
                    When a new user registers using your valid referral link/code, they receive +100 FREE Welcome Diamonds instantly!
                  </Text>
                </View>
              </View>

              <View style={styles.ruleItem}>
                <View style={styles.ruleNumBadge}><Text style={styles.ruleNumText}>2</Text></View>
                <View style={styles.ruleTextWrap}>
                  <Text style={styles.ruleItemTitle}>Referrer Bonus (+50 Total Coins)</Text>
                  <Text style={styles.ruleItemDesc}>
                    The referrer receives +25 Coins on friend's signup + +25 Coins when friend completes 5 minutes (300s) of calls.
                  </Text>
                </View>
              </View>

              <View style={styles.ruleItem}>
                <View style={styles.ruleNumBadge}><Text style={styles.ruleNumText}>3</Text></View>
                <View style={styles.ruleTextWrap}>
                  <Text style={styles.ruleItemTitle}>Maximum Reward Limit (50 Coins)</Text>
                  <Text style={styles.ruleItemDesc}>
                    The maximum reward per referred friend is exactly 50 Coins (25 Coins on signup + 25 Coins on call milestone). No Diamonds are awarded.
                  </Text>
                </View>
              </View>

              <View style={styles.ruleItem}>
                <View style={styles.ruleNumBadge}><Text style={styles.ruleNumText}>4</Text></View>
                <View style={styles.ruleTextWrap}>
                  <Text style={styles.ruleItemTitle}>Anti-Fraud & Self-Referral Policy</Text>
                  <Text style={styles.ruleItemDesc}>
                    Self-referrals, fake accounts, or multiple registrations on the same device are automatically detected and blocked by security audits.
                  </Text>
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.modalDoneBtn}
              onPress={() => setShowRulesModal(false)}
              activeOpacity={0.85}
            >
              <LinearGradient colors={['#fbbf24', '#d946ef']} style={styles.modalDoneGradient}>
                <Text style={styles.modalDoneText}>I Understand (समझ गया)</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScreenBackgroundView>
  );
};

const styles = StyleSheet.create({
  topHeader: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#020817',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  backBtn: {
    padding: 6,
  },
  topHeaderTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rulesBtnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderWidth: 1,
    borderColor: '#fbbf24',
    borderRadius: 14,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  rulesBtnHeaderText: {
    color: '#fbbf24',
    fontWeight: 'bold',
    fontSize: 12,
  },
  coinPillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(3, 220, 254, 0.15)',
    borderWidth: 1,
    borderColor: '#03dcfe',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  coinPillText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  headerAssetIcon: {
    width: 18,
    height: 18,
    marginRight: 4,
  },
  assetIconMd: {
    width: 20,
    height: 20,
    marginRight: 6,
  },
  statAssetIcon: {
    width: 24,
    height: 24,
  },

  container: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },

  /* Hero Section */
  heroWrapper: {
    marginBottom: 16,
  },
  heroBorder: {
    borderRadius: 22,
    padding: 1.5,
  },
  heroCard: {
    borderRadius: 20.5,
    padding: 20,
    alignItems: 'center',
  },
  heroBadgeRow: {
    marginBottom: 12,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderWidth: 1,
    borderColor: '#fbbf24',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  heroBadgeText: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 16,
  },
  highlightGold: {
    color: '#fbbf24',
    fontWeight: 'bold',
  },
  highlightCyan: {
    color: '#03dcfe',
    fontWeight: 'bold',
  },
  rewardExchangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
  },
  rewardExchangeBox: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  exchangeBoxLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  exchangeBoxValRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  exchangeBoxVal: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  exchangeArrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Pass Card */
  passCardWrapper: {
    marginBottom: 16,
  },
  passCardBorder: {
    borderRadius: 20,
    padding: 1.5,
  },
  passCardInner: {
    backgroundColor: 'rgba(15, 10, 45, 0.96)',
    borderRadius: 18.5,
    padding: 16,
  },
  passCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  passCardTitle: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginLeft: 8,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#fbbf24',
    borderStyle: 'dashed',
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginBottom: 10,
  },
  codeText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 3,
  },
  copyBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(3, 220, 254, 0.15)',
    borderWidth: 1,
    borderColor: '#03dcfe',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
  },
  copyBadgeBtnText: {
    color: '#03dcfe',
    fontSize: 11,
    fontWeight: 'bold',
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  linkText: {
    flex: 1,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginRight: 8,
  },
  linkCopyBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  linkCopyBtnText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  shareHubRow: {
    flexDirection: 'row',
    gap: 10,
  },
  shareHubBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  waBg: {
    backgroundColor: '#25D366',
  },
  shareBg: {
    backgroundColor: '#2563eb',
  },
  shareHubBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },

  /* Performance Grid */
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statCardGradient: {
    padding: 16,
    alignItems: 'center',
  },
  statIconRing: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(3, 220, 254, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginTop: 2,
  },

  /* Shared Glass Cards */
  sectionGlassCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    padding: 16,
    marginBottom: 16,
  },
  sectionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionCardTitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },

  /* Redeem */
  claimedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  claimedBannerText: {
    color: '#10b981',
    fontWeight: 'bold',
    fontSize: 14,
  },
  redeemRow: {
    flexDirection: 'row',
    gap: 10,
  },
  redeemInput: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 14,
    color: '#fff',
    fontSize: 14,
    height: 46,
  },
  redeemBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    height: 46,
  },
  redeemGradient: {
    height: '100%',
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  redeemBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },

  /* Flow */
  flowContainer: {
    gap: 14,
  },
  flowStepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  flowStepBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#fbbf24',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  flowStepNum: {
    color: '#020817',
    fontSize: 12,
    fontWeight: 'bold',
  },
  flowStepTextWrap: {
    flex: 1,
  },
  flowStepTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  flowStepDesc: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12,
    marginTop: 2,
    lineHeight: 17,
  },

  /* Friends List */
  friendCard: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 12,
    marginBottom: 10,
  },
  friendCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#03dcfe',
    marginRight: 10,
  },
  friendDetails: {
    flex: 1,
  },
  friendName: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  friendDate: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    marginTop: 2,
  },
  totalCoinsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderWidth: 1,
    borderColor: '#fbbf24',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  totalCoinsText: {
    color: '#fbbf24',
    fontWeight: 'bold',
    fontSize: 11,
  },
  stepProgressBox: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    gap: 6,
  },
  stepProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepBadgeDone: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  stepBadgeDoneText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: 'bold',
  },
  stepBadgePending: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  stepBadgePendingText: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 10,
  },
  emptySub: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },

  /* Modal Rules Styling */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: '#0a1128',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#fbbf24',
    padding: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalBody: {
    paddingVertical: 14,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  ruleNumBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fbbf24',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  ruleNumText: {
    color: '#020817',
    fontWeight: 'bold',
    fontSize: 12,
  },
  ruleTextWrap: {
    flex: 1,
  },
  ruleItemTitle: {
    color: '#fbbf24',
    fontSize: 13,
    fontWeight: 'bold',
  },
  ruleItemDesc: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    marginTop: 2,
    lineHeight: 17,
  },
  modalDoneBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 10,
  },
  modalDoneGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalDoneText: {
    color: '#020817',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default InviteEarn;
