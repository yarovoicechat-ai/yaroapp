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
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
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
  const route = useRoute();
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
    referralCode: user?.referralCode || `YR${user?.userId || ''}`,
    referralLink: `https://yaroapp.in/refer/${user?.referralCode || ''}`,
    totalReferrals: 0,
    totalEarnedCoins: 0,
    hasRedeemedReferral: false,
    referredUsers: [],
  });

  const [inputCode, setInputCode] = useState('');
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    const incomingCode = route.params?.referralCode || route.params?.code;
    if (incomingCode) {
      setInputCode(String(incomingCode).toUpperCase());
    }
  }, [route.params?.referralCode, route.params?.code]);

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
    const code = referralData.referralCode || user?.referralCode || `YR${user?.userId || ''}`;
    if (code) {
      Clipboard.setString(code);
      setCopiedCode(true);
      AlertService.show('Copied', 'Referral code copied to clipboard!', 'success');
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleCopyLink = () => {
    const link = referralData.referralLink || `https://yaroapp.in/refer/${referralData.referralCode || ''}`;
    if (link) {
      Clipboard.setString(link);
      setCopiedLink(true);
      AlertService.show('Copied', 'Referral link copied to clipboard!', 'success');
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const getShareMessage = () => {
    const code = referralData.referralCode || user?.referralCode || `YR${user?.userId || ''}`;
    const link = referralData.referralLink || `https://yaroapp.in/refer/${code}`;
    return `✨ *YAROAPP — SPECIAL INVITATION* ✨\n\n🎉 Join me on YaroApp, the #1 Live Video & Voice Social App!\n\n🎁 *Exclusive Bonus:* Use my Referral Code *${code}* during profile setup to claim *100 FREE Welcome Diamonds*!\n\n👇 *Download App & Claim Bonus:* \n${link}\n\n🔥 Install now & let's connect!`;
  };

  const handleNativeShare = async () => {
    try {
      await Share.share({
        message: getShareMessage(),
        title: 'Invite Friends & Earn Beans on YaroApp',
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
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" translucent={false} />

      {/* Professional Top Header Bar */}
      <View style={[styles.topHeader, { paddingTop: topSafeInset + 8 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Icon name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.topHeaderTitle}>Invite & Earn</Text>

        <View style={styles.headerRightGroup}>
          <TouchableOpacity
            style={styles.rulesBtnHeader}
            onPress={() => setShowRulesModal(true)}
            activeOpacity={0.8}
          >
            <Icon name="help-outline" size={16} color="#D97706" style={{ marginRight: 3 }} />
            <Text style={styles.rulesBtnHeaderText}>Rules</Text>
          </TouchableOpacity>

          <View style={styles.coinPillHeader}>
            <Image source={diamondIcon} style={styles.headerAssetIcon} resizeMode="contain" />
            <Text style={styles.coinPillText}>{user?.diamonds || 0}</Text>
          </View>

          <View style={[styles.coinPillHeader, { borderColor: '#FDE68A', backgroundColor: '#FEF3C7' }]}>
            <Image source={coinIcon} style={styles.headerAssetIcon} resizeMode="contain" />
            <Text style={[styles.coinPillText, { color: '#B45309' }]}>{user?.coins || 0}</Text>
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
              colors={['#4F46E5', '#6366F1', '#7C3AED']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
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
                New friends get <Text style={styles.highlightCyan}>100 Diamonds</Text>. You get <Text style={styles.highlightGold}>25 Beans</Text> on sign-up + <Text style={styles.highlightGold}>25 Beans</Text> after 5 mins call time!
              </Text>

              {/* Dynamic Reward Exchange Display */}
              <View style={styles.rewardExchangeRow}>
                <View style={styles.rewardExchangeBox}>
                  <Text style={styles.exchangeBoxLabel}>NEW FRIEND GETS</Text>
                  <View style={styles.exchangeBoxValRow}>
                    <Image source={diamondIcon} style={styles.assetIconMd} resizeMode="contain" />
                    <Text style={[styles.exchangeBoxVal, { color: '#38BDF8' }]}>+100 DIAMONDS</Text>
                  </View>
                </View>

                <View style={styles.exchangeArrowCircle}>
                  <Icon name="swap-horiz" size={20} color="#FFFFFF" />
                </View>

                <View style={styles.rewardExchangeBox}>
                  <Text style={styles.exchangeBoxLabel}>YOU RECEIVE</Text>
                  <View style={styles.exchangeBoxValRow}>
                    <Image source={coinIcon} style={styles.assetIconMd} resizeMode="contain" />
                    <Text style={[styles.exchangeBoxVal, { color: '#FDE68A' }]}>+50 BEANS</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </LinearGradient>
        </View>

        {/* Professional VIP Referral Code & Link Pass Card */}
        <View style={styles.passCardWrapper}>
          <LinearGradient
            colors={['#F59E0B', '#EC4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.passCardBorder}
          >
            <View style={styles.passCardInner}>
              <View style={styles.passCardHeader}>
                <Icon name="vpn-key" size={18} color="#F59E0B" />
                <Text style={styles.passCardTitle}>YOUR EXCLUSIVE REFERRAL CODE</Text>
              </View>

              {/* Code Box */}
              <TouchableOpacity
                style={styles.codeContainer}
                activeOpacity={0.8}
                onPress={handleCopyCode}
              >
                <Text style={styles.codeText}>
                  {referralData.referralCode || `YR${user?.userId || ''}`}
                </Text>
                <View style={styles.copyBadgeBtn}>
                  <Icon name={copiedCode ? 'check' : 'content-copy'} size={14} color="#D97706" />
                  <Text style={styles.copyBadgeBtnText}>{copiedCode ? 'COPIED' : 'COPY'}</Text>
                </View>
              </TouchableOpacity>

              {/* Link Box */}
              <View style={styles.linkContainer}>
                <Icon name="link" size={16} color="#64748B" style={{ marginRight: 6 }} />
                <Text style={styles.linkText} numberOfLines={1}>
                  {referralData.referralLink || `https://yaroapp.in/refer/${user?.referralCode || ''}`}
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
              colors={['rgba(99, 102, 241, 0.08)', 'rgba(99, 102, 241, 0.02)']}
              style={styles.statCardGradient}
            >
              <View style={styles.statIconRing}>
                <Icon name="group-add" size={22} color="#6366F1" />
              </View>
              <Text style={styles.statNumber}>{referralData.totalReferrals || 0}</Text>
              <Text style={styles.statLabel}>Invited Friends</Text>
            </LinearGradient>
          </View>

          <View style={styles.statCard}>
            <LinearGradient
              colors={['rgba(245, 158, 11, 0.08)', 'rgba(245, 158, 11, 0.02)']}
              style={styles.statCardGradient}
            >
              <View style={[styles.statIconRing, { backgroundColor: '#FEF3C7' }]}>
                <Image source={coinIcon} style={styles.statAssetIcon} resizeMode="contain" />
              </View>
              <Text style={styles.statNumber}>{referralData.totalEarnedCoins || 0}</Text>
              <Text style={styles.statLabel}>Earned Beans</Text>
            </LinearGradient>
          </View>
        </View>

        {/* Redeem Code Section */}
        <View style={styles.sectionGlassCard}>
          <View style={styles.sectionCardHeader}>
            <Icon name="confirmation-number" size={18} color="#F59E0B" style={{ marginRight: 6 }} />
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
                placeholder="Enter friend's referral code (e.g. YR1000000120)"
                placeholderTextColor="#94A3B8"
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
                <Text style={styles.flowStepDesc}>Friend installs YaroApp & enters your code. Friend receives +100 Diamonds instantly, and you get +25 Beans!</Text>
              </View>
            </View>

            <View style={styles.flowStepItem}>
              <View style={styles.flowStepBadge}><Text style={styles.flowStepNum}>3</Text></View>
              <View style={styles.flowStepTextWrap}>
                <Text style={styles.flowStepTitle}>Step 2 Reward: 5 Min Call (+25 Beans)</Text>
                <Text style={styles.flowStepDesc}>When your friend completes 5 minutes (300s) of voice/video calls, you get another +25 Beans!</Text>
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
                      <Text style={styles.totalCoinsText}>+{item.totalCoinsEarned || (isStep2Done ? 50 : 25)} Beans</Text>
                    </View>
                  </View>

                  {/* 2-Step Progress Status Row */}
                  <View style={styles.stepProgressBox}>
                    <View style={styles.stepProgressRow}>
                      <View style={styles.stepBadgeDone}>
                        <Icon name="check-circle" size={14} color="#10b981" style={{ marginRight: 4 }} />
                        <Text style={styles.stepBadgeDoneText}>Step 1: Registered (+25 Beans)</Text>
                      </View>
                    </View>

                    <View style={styles.stepProgressRow}>
                      {isStep2Done ? (
                        <View style={styles.stepBadgeDone}>
                          <Icon name="check-circle" size={14} color="#10b981" style={{ marginRight: 4 }} />
                          <Text style={styles.stepBadgeDoneText}>Step 2: 5 Min Call (+25 Beans)</Text>
                        </View>
                      ) : (
                        <View style={styles.stepBadgePending}>
                          <Icon name="lock" size={12} color="#fbbf24" style={{ marginRight: 4 }} />
                          <Text style={styles.stepBadgePendingText}>
                            Call Progress: {callTimeFormatted} / 5:00 (+25 Beans)
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
                Share your referral link above to start earning 25 Beans on signup + 25 Beans after 5 mins call time!
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
                <Icon name="gavel" size={20} color="#D97706" style={{ marginRight: 6 }} />
                <Text style={styles.modalTitle}>Referral System Rules (नियम)</Text>
              </View>
              <TouchableOpacity onPress={() => setShowRulesModal(false)} style={styles.modalCloseBtn}>
                <Icon name="close" size={20} color="#64748B" />
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
                  <Text style={styles.ruleItemTitle}>Referrer Bonus (+50 Total Beans)</Text>
                  <Text style={styles.ruleItemDesc}>
                    The referrer receives +25 Beans on friend's signup + +25 Beans when friend completes 5 minutes (300s) of calls.
                  </Text>
                </View>
              </View>

              <View style={styles.ruleItem}>
                <View style={styles.ruleNumBadge}><Text style={styles.ruleNumText}>3</Text></View>
                <View style={styles.ruleTextWrap}>
                  <Text style={styles.ruleItemTitle}>Maximum Reward Limit (50 Beans)</Text>
                  <Text style={styles.ruleItemDesc}>
                    The maximum reward per referred friend is exactly 50 Beans (25 Beans on signup + 25 Beans on call milestone). No Diamonds are awarded.
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
              <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.modalDoneGradient}>
                <Text style={styles.modalDoneText}>I Understand (समझ गया)</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  topHeader: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    padding: 6,
  },
  topHeaderTitle: {
    color: '#0F172A',
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
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 14,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  rulesBtnHeaderText: {
    color: '#B45309',
    fontWeight: 'bold',
    fontSize: 12,
  },
  coinPillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  coinPillText: {
    color: '#1E40AF',
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
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  heroBadgeRow: {
    marginBottom: 12,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  heroBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSub: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 16,
  },
  highlightGold: {
    color: '#FDE68A',
    fontWeight: 'bold',
  },
  highlightCyan: {
    color: '#BAE6FD',
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
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  exchangeBoxLabel: {
    color: 'rgba(255,255,255,0.85)',
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
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  exchangeArrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.22)',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 18.5,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  passCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  passCardTitle: {
    color: '#D97706',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginLeft: 8,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    borderStyle: 'dashed',
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginBottom: 10,
  },
  codeText: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 3,
  },
  copyBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
  },
  copyBadgeBtnText: {
    color: '#B45309',
    fontSize: 11,
    fontWeight: 'bold',
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  linkText: {
    flex: 1,
    color: '#475569',
    fontSize: 12,
    marginRight: 8,
  },
  linkCopyBtn: {
    backgroundColor: '#EDE9FE',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  linkCopyBtnText: {
    color: '#7C3AED',
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
    backgroundColor: '#4F46E5',
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
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  statCardGradient: {
    padding: 16,
    alignItems: 'center',
  },
  statIconRing: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    color: '#0F172A',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },

  /* Shared Glass Cards */
  sectionGlassCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionCardTitle: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },

  /* Redeem */
  claimedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  claimedBannerText: {
    color: '#16A34A',
    fontWeight: 'bold',
    fontSize: 14,
  },
  redeemRow: {
    flexDirection: 'row',
    gap: 10,
  },
  redeemInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 14,
    color: '#0F172A',
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
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  flowStepNum: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  flowStepTextWrap: {
    flex: 1,
  },
  flowStepTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: 'bold',
  },
  flowStepDesc: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
    lineHeight: 17,
  },

  /* Friends List */
  friendCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    borderColor: '#6366F1',
    marginRight: 10,
  },
  friendDetails: {
    flex: 1,
  },
  friendName: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: 'bold',
  },
  friendDate: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 2,
  },
  totalCoinsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  totalCoinsText: {
    color: '#B45309',
    fontWeight: 'bold',
    fontSize: 11,
  },
  stepProgressBox: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 6,
  },
  stepProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepBadgeDone: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  stepBadgeDoneText: {
    color: '#16A34A',
    fontSize: 11,
    fontWeight: 'bold',
  },
  stepBadgePending: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  stepBadgePendingText: {
    color: '#B45309',
    fontSize: 11,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 10,
  },
  emptySub: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },

  /* Modal Rules Styling */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    color: '#0F172A',
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
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  ruleNumText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  ruleTextWrap: {
    flex: 1,
  },
  ruleItemTitle: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: 'bold',
  },
  ruleItemDesc: {
    color: '#64748B',
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
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default InviteEarn;
