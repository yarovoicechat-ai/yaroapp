// Centralized Gift Rarity Configuration & Receiver Position Registry
import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const GIFT_RARITY_CONFIG = {
  common: {
    label: 'COMMON',
    borderColor: '#38BDF8',
    glowColor: 'rgba(56, 189, 248, 0.4)',
    gradient: ['#0284C7', '#38BDF8'],
    particleCount: 8,
    animationTier: 'NORMAL',
    duration: 1800,
    sound: 'normal',
  },
  uncommon: {
    label: 'UNCOMMON',
    borderColor: '#34D399',
    glowColor: 'rgba(52, 211, 153, 0.4)',
    gradient: ['#059669', '#34D399'],
    particleCount: 12,
    animationTier: 'NORMAL',
    duration: 2000,
    sound: 'normal',
  },
  rare: {
    label: 'RARE',
    borderColor: '#A855F7',
    glowColor: 'rgba(168, 85, 247, 0.5)',
    gradient: ['#7E22CE', '#A855F7'],
    particleCount: 16,
    animationTier: 'SPECIAL',
    duration: 2500,
    sound: 'special',
  },
  epic: {
    label: 'EPIC',
    borderColor: '#EC4899',
    glowColor: 'rgba(236, 72, 153, 0.6)',
    gradient: ['#BE185D', '#EC4899'],
    particleCount: 22,
    animationTier: 'CENTER_STAGE',
    duration: 3200,
    sound: 'special',
  },
  legendary: {
    label: 'LEGENDARY',
    borderColor: '#F59E0B',
    glowColor: 'rgba(245, 158, 11, 0.7)',
    gradient: ['#D97706', '#F59E0B'],
    particleCount: 30,
    animationTier: 'FULL_SCREEN',
    duration: 4500,
    sound: 'luxury',
  },
  vip: {
    label: 'VIP',
    borderColor: '#EAB308',
    glowColor: 'rgba(234, 179, 8, 0.8)',
    gradient: ['#CA8A04', '#FDE047'],
    particleCount: 26,
    animationTier: 'VIP',
    duration: 4000,
    sound: 'vip',
  },
  luxury: {
    label: 'LUXURY',
    borderColor: '#F43F5E',
    glowColor: 'rgba(244, 63, 94, 0.85)',
    gradient: ['#E11D48', '#FDA4AF'],
    particleCount: 36,
    animationTier: 'LUXURY',
    duration: 5500,
    sound: 'luxury',
  },
};

/**
 * Receiver Screen Position Registry
 * Allows seats/avatars in VoiceRoom to register their on-screen {x, y, width, height}
 * coordinates so the Flight Animation accurately targets them.
 */
class ReceiverPositionRegistry {
  constructor() {
    this.positions = new Map();
    this.listeners = new Set();
  }

  register(receiverId, layout) {
    if (!receiverId || !layout) return;
    this.positions.set(String(receiverId), layout);
    this.listeners.forEach((fn) => {
      try {
        fn(String(receiverId), layout);
      } catch (_) {}
    });
  }

  unregister(receiverId) {
    if (!receiverId) return;
    this.positions.delete(String(receiverId));
  }

  get(receiverId) {
    if (!receiverId) return null;
    return this.positions.get(String(receiverId)) || null;
  }

  /**
   * Returns target center coordinate or fallback to Host seat avatar
   */
  getTargetCenter(receiverId) {
    if (receiverId) {
      const layout = this.get(receiverId);
      if (layout && layout.x !== undefined && layout.y !== undefined) {
        return {
          x: layout.x + (layout.width || 56) / 2,
          y: layout.y + (layout.height || 56) / 2,
          isCustom: true,
        };
      }
    }
    // Fallback to Host seat avatar
    const hostLayout = this.get('host');
    if (hostLayout && hostLayout.x !== undefined && hostLayout.y !== undefined) {
      return {
        x: hostLayout.x + (hostLayout.width || 56) / 2,
        y: hostLayout.y + (hostLayout.height || 56) / 2,
        isCustom: true,
      };
    }
    return {
      x: width * 0.5 - 61,
      y: 220,
      isCustom: false,
    };
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
}

export const receiverPositionRegistry = new ReceiverPositionRegistry();

/**
 * Optional Audio Player Utility
 */
export const playGiftAudio = (tier) => {
  // Silent-safe helper - respects device mute & background state
  try {
    // If react-native-sound or Agora audio effect is enabled, trigger here
  } catch (_) {}
};
