import React, { useEffect, useState, useContext, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  View as ScreenBackgroundView,
  StatusBar as ScreenBackgroundStatusBar,
  StyleSheet as ScreenBackgroundStyleSheet
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import IonIcon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { apiUtil } from '../../utils/apiUtil';
import { AuthContext } from '../../context/AuthProvider';
import { useTranslation } from 'react-i18next';
import AnimatedTitleLine from '../../components/AnimatedTitleLine';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';

import AvatarWithFrame from '../../components/AvatarWithFrame';

const Frame = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomPadding = getStackScreenBottomPadding(insets.bottom, 42);
  const { user, equippedFrame, setEquippedFrame } = useContext(AuthContext);
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [frameInventory, setFrameInventory] = useState([]);
  const [inventoryError, setInventoryError] = useState(false);
  const [equipping, setEquipping] = useState(false);
  const selectedFrame = user?.equippedFrame || equippedFrame || 'Default Frame';
  const frameList = useMemo(() => [
    { id: 'default', name: 'Default Frame', isDefault: true },
    ...frameInventory,
  ], [frameInventory]);

  useEffect(() => {
    let isMounted = true;
    apiUtil.get('/store/inventory')
      .then((response) => {
        const items = response?.data?.data?.items;
        if (!isMounted) return;
        setFrameInventory(Array.isArray(items)
          ? items.filter((item) => ['frame', 'frames'].includes(
              String(item.catalogItem?.category || item.category || '').trim().toLowerCase(),
            ))
          : []);
      })
      .catch((error) => {
        if (isMounted) {
          setFrameInventory([]);
          setInventoryError(true);
        }
        console.log('Could not load owned frames:', error?.message || error);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, []);

  const renderFrameBadge = (item) => (
    <AvatarWithFrame
      user={user}
      frame={item.isDefault ? null : item}
      size={42}
      showOnlineDot={false}
    />
  );

  const handleEquipFrame = async (item) => {
    if (equipping) return;
    setEquipping(true);
    try {
      await setEquippedFrame?.(item.isDefault ? null : item);
    } catch (error) {
      Alert.alert('Frame', error?.message || 'Frame update nahi ho saka.');
    } finally {
      setEquipping(false);
    }
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
                    frame={user?.equippedFrameAsset || user?.equippedFrame || equippedFrame}
                    size={64}
                    showOnlineDot={false}
                  />
                </View>
              </View>

              {/* Current account and equipped frame */}
              <View style={styles.middleCol}>
                <Text style={styles.voiceChatTitle}>{user?.name || 'Your profile'}</Text>
                <Text style={styles.progressLabel}>Your equipped frame</Text>
                <Text style={styles.currentFrameName} numberOfLines={2}>{selectedFrame}</Text>
              </View>

              {/* Preview of the frame currently in use */}
              <View style={styles.rightCol}>
                <View style={styles.currentFrameBox}>
                  <AvatarWithFrame
                    user={user}
                    frame={user?.equippedFrameAsset || user?.equippedFrame || equippedFrame}
                    size={38}
                    showOnlineDot={false}
                  />
                </View>
                <Text style={styles.currentFrameLabel}>Current Frame</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Levels & Frames Table */}
        <View style={styles.tableCard}>
          <View style={styles.tableInner}>
            {/* Table Header Row */}
            <View style={styles.tableHeaderRow}>
              <Text style={styles.headerCellLeft}>Your Frames</Text>
              <Text style={styles.headerCellRight}>Status</Text>
            </View>

            {frameList.map((item) => {
              const isActive = item.isDefault
                ? selectedFrame === 'Default Frame' || (!user?.equippedFrame && !user?.equippedFrameAsset && !equippedFrame)
                : selectedFrame === item.name;
              return (
                <TouchableOpacity
                  key={String(item.itemId || item._id || item.id || item.name)}
                  activeOpacity={0.85}
                  onPress={() => handleEquipFrame(item)}
                  disabled={equipping}
                  style={[
                    styles.tableRow,
                    isActive && styles.tableRowActive,
                  ]}
                >
                  {/* Inventory item */}
                  <View style={styles.rowLeftCol}>
                    <IonIcon name={item.isDefault ? 'person-outline' : 'checkmark-circle-outline'} size={18} color={isActive ? '#4F46E5' : '#94A3B8'} />
                  </View>

                  {/* Actual frame asset from inventory */}
                  <View style={styles.rowMiddleCol}>
                    {renderFrameBadge(item)}
                    <View style={styles.rowMiddleDetails}>
                      <Text style={styles.rowFrameName}>{item.name}</Text>
                      {!item.isDefault && item.expiresAt ? (
                        <Text style={styles.progressLabel}>
                          Expires {new Date(item.expiresAt).toLocaleDateString()}
                        </Text>
                      ) : null}
                      {isActive && (
                        <View style={styles.inUseTag}>
                          <Text style={styles.inUseTagText}>In Use</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Right Column (Checkbox circle/lock status) */}
                  <View style={styles.rowRightCol}>
                    {isActive ? (
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
            {!loading && frameInventory.length === 0 ? (
              <View style={{ alignItems: 'center', padding: 22 }}>
                <Text style={styles.progressLabel}>
                  {inventoryError ? 'Could not load your frame inventory.' : 'No frames in your inventory yet.'}
                </Text>
                <TouchableOpacity style={styles.footerBtn} onPress={() => navigation.navigate('Store')}>
                  <Text style={styles.footerBtnText}>Open Store</Text>
                  <IonIcon name="chevron-forward" size={10} color="#fff" style={{ marginLeft: 3 }} />
                </TouchableOpacity>
              </View>
            ) : null}
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
