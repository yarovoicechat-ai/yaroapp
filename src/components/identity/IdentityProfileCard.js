import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AvatarWithFrame from '../AvatarWithFrame';
import IdentityDisplayName from './IdentityDisplayName';
import IdentityBadge from './IdentityBadge';
import IdentityDisplayId from './IdentityDisplayId';

/**
 * King of Kings & SVIP Identity Profile Card
 */
export default function IdentityProfileCard({
  user,
  identity,
  style,
}) {
  const effectiveUser = identity || user || {};
  const isOfficial = Boolean(effectiveUser.isOfficial);
  const isSvip = Boolean(effectiveUser.isSvip);
  const isVip = Boolean(effectiveUser.isVip);

  const cardGradient = isOfficial
    ? ['#2A1E05', '#171203', '#0A0802']
    : isSvip
      ? ['#200938', '#130424', '#080110']
      : ['#1E293B', '#0F172A', '#020617'];

  const borderColor = isOfficial
    ? 'rgba(245, 158, 11, 0.4)'
    : isSvip
      ? 'rgba(168, 85, 247, 0.4)'
      : 'rgba(255, 255, 255, 0.1)';

  return (
    <LinearGradient
      colors={cardGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={[styles.card, { borderColor }, style]}
    >
      <View style={styles.topRow}>
        <AvatarWithFrame
          user={user}
          avatarUri={effectiveUser.avatar || effectiveUser.image}
          frame={effectiveUser.frame || effectiveUser.profileFrame}
          size={72}
        />

        <View style={styles.infoCol}>
          <View style={styles.nameRow}>
            <IdentityDisplayName
              name={effectiveUser.name || effectiveUser.userName || 'Yaro User'}
              effect={effectiveUser.nameEffect}
              vipTier={effectiveUser.svipTier || effectiveUser.vipTier}
              fontSize={18}
              fontWeight="900"
            />
            {isOfficial ? (
              <IdentityBadge type="official" label="OFFICIAL" size="sm" />
            ) : isSvip ? (
              <IdentityBadge type="svip" vipLevel={effectiveUser.svipTier?.level} isSvip size="sm" />
            ) : isVip ? (
              <IdentityBadge type="vip" vipLevel={effectiveUser.vipTier?.level} size="sm" />
            ) : null}
          </View>

          <IdentityDisplayId
            userId={effectiveUser.userId || effectiveUser.permanentUserId}
            officialDisplayId={effectiveUser.officialDisplayId}
            isOfficial={isOfficial}
            customDisplayId={effectiveUser.customDisplayId}
            fontSize={12}
          />
        </View>
      </View>

      {/* Privileges Row */}
      {effectiveUser.privileges && effectiveUser.privileges.length > 0 && (
        <View style={styles.privilegesRow}>
          {effectiveUser.privileges.slice(0, 4).map((priv, idx) => (
            <View key={`priv_${idx}`} style={styles.privilegeItem}>
              <Text style={styles.privilegeIcon}>✨</Text>
              <Text style={styles.privilegeText} numberOfLines={1}>
                {typeof priv === 'string' ? priv : priv.title || priv.name}
              </Text>
            </View>
          ))}
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  infoCol: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  privilegesRow: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  privilegeItem: {
    alignItems: 'center',
    gap: 2,
    maxWidth: 70,
  },
  privilegeIcon: {
    fontSize: 16,
  },
  privilegeText: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
  },
});
