import React from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';

export default function UpgradeGuideModal({ visible, onClose, isWealth, currentLevel, styles }) {
  return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={onClose}
          />

          <View
            style={[
              styles.upgradeGuideCard,
              {
                backgroundColor: isWealth ? '#F7E7CE' : '#EFE4FD',
                borderColor: isWealth ? '#E2B887' : '#D4B8F6',
              },
            ]}
          >
            {/* Floating Top Badge (Crown for Wealth, Star for Charm) */}
            <View style={styles.guideFloatingBadgeWrap}>
              <LinearGradient
                colors={isWealth ? ['#F59E0B', '#D97706', '#92400E'] : ['#E2E8F0', '#94A3B8', '#475569']}
                style={styles.guideFloatingBadgeGrad}
              >
                <Text style={{ fontSize: 24 }}>{isWealth ? '👑' : '⭐'}</Text>
                <View style={[styles.guideFloatingBadgeRibbon, { backgroundColor: isWealth ? '#F59E0B' : '#64748B' }]}>
                  <Text style={styles.guideFloatingBadgeRibbonText}>
                    {isWealth ? `Lv.${currentLevel}` : `${currentLevel}`}
                  </Text>
                </View>
              </LinearGradient>
            </View>

            {/* Top Close Button (top-right X) */}
            <TouchableOpacity
              onPress={onClose}
              style={styles.guideTopCloseBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Icon name="close" size={22} color={isWealth ? '#78350F' : '#4C1D95'} />
            </TouchableOpacity>

            {/* Title */}
            <Text
              style={[
                styles.guideMainTitle,
                { color: isWealth ? '#78350F' : '#3B0764' },
              ]}
            >
              How to upgrade?
            </Text>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 440 }}>
              {isWealth ? (
                /* WEALTH UPGRADE RULES (Matching 1st Image) */
                <View style={styles.guideContentList}>
                  {/* 1. Give a diamond gift */}
                  <View style={styles.guideRuleItem}>
                    <View style={styles.guideRuleHeader}>
                      <View style={[styles.guideBulletDot, { backgroundColor: '#78350F' }]} />
                      <Text style={[styles.guideRuleTitle, { color: '#78350F' }]}>
                        Give a diamond gift
                      </Text>
                    </View>
                    <Text style={[styles.guideRuleSub, { color: '#92400E' }]}>
                      1 Diamond = 1 EXP
                    </Text>

                    {/* SVIP Privilege Boxes */}
                    <View style={styles.svipListCol}>
                      {[
                        { svip: 'SVIP 6', exp: '1.1' },
                        { svip: 'SVIP 7', exp: '1.2' },
                        { svip: 'SVIP 8', exp: '1.3' },
                        { svip: 'SVIP 9', exp: '1.4' },
                        { svip: 'SVIP 10', exp: '1.5' },
                      ].map((item) => (
                        <View key={item.svip} style={styles.svipPrivilegePill}>
                          <Text style={styles.svipPrivilegeText}>
                            {item.svip} privilege: 1 Diamond = {item.exp} EXP
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <View style={styles.guideDivider} />

                  {/* 2. Shop for diamond items */}
                  <View style={styles.guideRuleItem}>
                    <View style={styles.guideRuleHeader}>
                      <View style={[styles.guideBulletDot, { backgroundColor: '#78350F' }]} />
                      <Text style={[styles.guideRuleTitle, { color: '#78350F' }]}>
                        Shop for diamond items
                      </Text>
                    </View>
                    <Text style={[styles.guideRuleSub, { color: '#92400E' }]}>
                      1 Diamond = 1 EXP
                    </Text>
                  </View>

                  <View style={styles.guideDivider} />

                  {/* 3. Enter the room */}
                  <View style={styles.guideRuleItem}>
                    <View style={styles.guideRuleHeader}>
                      <View style={[styles.guideBulletDot, { backgroundColor: '#78350F' }]} />
                      <Text style={[styles.guideRuleTitle, { color: '#78350F' }]}>
                        Enter the room
                      </Text>
                    </View>
                    <Text style={[styles.guideRuleSub, { color: '#92400E' }]}>
                      200 EXP/day
                    </Text>
                  </View>

                  <View style={styles.guideDivider} />

                  {/* 4. Share the room */}
                  <View style={styles.guideRuleItem}>
                    <View style={styles.guideRuleHeader}>
                      <View style={[styles.guideBulletDot, { backgroundColor: '#78350F' }]} />
                      <Text style={[styles.guideRuleTitle, { color: '#78350F' }]}>
                        Share the room
                      </Text>
                    </View>
                    <Text style={[styles.guideRuleSub, { color: '#92400E' }]}>
                      200 EXP/day
                    </Text>
                  </View>

                  <View style={styles.guideDivider} />

                  {/* 5. Stay in your own room */}
                  <View style={styles.guideRuleItem}>
                    <View style={styles.guideRuleHeader}>
                      <View style={[styles.guideBulletDot, { backgroundColor: '#78350F' }]} />
                      <Text style={[styles.guideRuleTitle, { color: '#78350F' }]}>
                        Stay in your own room (Limited Time)
                      </Text>
                    </View>
                    <Text style={[styles.guideRuleSub, { color: '#92400E' }]}>
                      10 min = 100 EXP,  500 EXP/day
                    </Text>
                  </View>

                  <View style={styles.guideDivider} />

                  {/* 6. Stay on other rooms */}
                  <View style={styles.guideRuleItem}>
                    <View style={styles.guideRuleHeader}>
                      <View style={[styles.guideBulletDot, { backgroundColor: '#78350F' }]} />
                      <Text style={[styles.guideRuleTitle, { color: '#78350F' }]}>
                        Stay on other rooms (Limited Time)
                      </Text>
                    </View>
                    <Text style={[styles.guideRuleSub, { color: '#92400E' }]}>
                      10 min = 100 EXP,  1000 EXP/day
                    </Text>
                  </View>

                  <View style={styles.guideDivider} />

                  {/* 7. Participate in activities */}
                  <View style={styles.guideRuleItem}>
                    <View style={styles.guideRuleHeader}>
                      <View style={[styles.guideBulletDot, { backgroundColor: '#78350F' }]} />
                      <Text style={[styles.guideRuleTitle, { color: '#78350F' }]}>
                        Participate in activities
                      </Text>
                    </View>
                    <Text style={[styles.guideRuleSub, { color: '#92400E' }]}>
                      Speed up upgrade
                    </Text>
                  </View>
                </View>
              ) : (
                /* CHARM UPGRADE RULES (Matching 2nd Image) */
                <View style={styles.guideContentList}>
                  {/* 1. Receive Diamond Gifts */}
                  <View style={styles.guideRuleItem}>
                    <View style={styles.guideRuleHeader}>
                      <View style={[styles.guideBulletDot, { backgroundColor: '#6B21A8' }]} />
                      <Text style={[styles.guideRuleTitle, { color: '#3B0764' }]}>
                        Receive Diamond Gifts
                      </Text>
                    </View>
                    <Text style={[styles.guideRuleSub, { color: '#6B21A8' }]}>
                      1 Diamond = 1 EXP
                    </Text>
                  </View>

                  <View style={[styles.guideDivider, { backgroundColor: 'rgba(107, 33, 168, 0.12)' }]} />

                  {/* 2. Receive Lucky Gifts */}
                  <View style={styles.guideRuleItem}>
                    <View style={styles.guideRuleHeader}>
                      <View style={[styles.guideBulletDot, { backgroundColor: '#6B21A8' }]} />
                      <Text style={[styles.guideRuleTitle, { color: '#3B0764' }]}>
                        Receive Lucky Gifts
                      </Text>
                    </View>
                    <Text style={[styles.guideRuleSub, { color: '#6B21A8' }]}>
                      10 Diamond = 2 EXP
                    </Text>
                  </View>

                  <View style={[styles.guideDivider, { backgroundColor: 'rgba(107, 33, 168, 0.12)' }]} />

                  {/* 3. On-Mic Experience(Limited Time) */}
                  <View style={styles.guideRuleItem}>
                    <View style={styles.guideRuleHeader}>
                      <View style={[styles.guideBulletDot, { backgroundColor: '#6B21A8' }]} />
                      <Text style={[styles.guideRuleTitle, { color: '#3B0764' }]}>
                        On-Mic Experience(Limited Time)
                      </Text>
                    </View>
                    <Text style={[styles.guideRuleSub, { color: '#6B21A8' }]}>
                      1 minute = 50 EXP, 6000 EXP/day
                    </Text>
                    <Text style={[styles.guideRuleNote, { color: '#7E22CE' }]}>
                      Note: The EXP is counted only when you are on mic for at least 1 minute in an unlocked room with active mic status
                    </Text>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
  );
}
