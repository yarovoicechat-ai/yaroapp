import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// Floating heart particle component
function FloatingHeart({ id, color, onComplete }) {
  const animY = useRef(new Animated.Value(0)).current;
  const animX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const randomX = (Math.random() - 0.5) * 60;
    Animated.parallel([
      Animated.timing(animY, {
        toValue: -280,
        duration: 1800,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(animX, {
        toValue: randomX,
        duration: 1800,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.2,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.9,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.delay(1000),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      onComplete && onComplete(id);
    });
  }, []);

  return (
    <Animated.View
      style={[
        styles.heartParticle,
        {
          transform: [
            { translateY: animY },
            { translateX: animX },
            { scale },
          ],
          opacity,
        },
      ]}
      pointerEvents="none"
    >
      <MaterialCommunityIcons name="heart" size={24} color={color || '#EC4899'} />
    </Animated.View>
  );
}

export default function LiveFloatingSideBadges({
  hearts = [],
  onHeartComplete,
  comboCount = 0,
  comboEmoji = '❤️',
  onPressTask,
  onPressEvent,
}) {
  const comboScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (comboCount > 1) {
      Animated.sequence([
        Animated.timing(comboScale, {
          toValue: 1.4,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.spring(comboScale, {
          toValue: 1,
          friction: 4,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [comboCount]);

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* 1. Task Progress Pill (e.g. 0/1) */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPressTask}
        style={styles.taskBadge}
      >
        <LinearGradient
          colors={['rgba(15, 23, 42, 0.85)', 'rgba(30, 41, 59, 0.85)']}
          style={styles.taskGradient}
        >
          <MaterialCommunityIcons name="trophy-award" size={14} color="#FBBF24" />
          <Text style={styles.taskText}>0/1</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* 2. Event Banner Card (Food Mania / Constellation) */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPressEvent}
        style={styles.eventCard}
      >
        <LinearGradient
          colors={['#8B5CF6', '#EC4899']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.eventGradient}
        >
          <MaterialCommunityIcons name="gamepad-variant" size={18} color="#FFF" />
          <Text style={styles.eventTitle}>Food</Text>
          <Text style={styles.eventSubtitle}>Mania</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* 3. Gift Combo Multiplier Bubble */}
      {comboCount > 1 && (
        <Animated.View
          style={[
            styles.comboBubble,
            { transform: [{ scale: comboScale }] },
          ]}
          pointerEvents="none"
        >
          <LinearGradient
            colors={['#EC4899', '#F43F5E', '#FB7185']}
            style={styles.comboGradient}
          >
            <Text style={styles.comboEmoji}>{comboEmoji}</Text>
            <Text style={styles.comboText}>x{comboCount}</Text>
          </LinearGradient>
        </Animated.View>
      )}

      {/* 4. Rising Hearts Animation Container */}
      <View style={styles.heartsContainer} pointerEvents="none">
        {hearts.map(h => (
          <FloatingHeart
            key={h.id}
            id={h.id}
            color={h.color}
            onComplete={onHeartComplete}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 10,
    bottom: 60,
    alignItems: 'center',
    gap: 10,
    zIndex: 15,
  },
  taskBadge: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  taskGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  taskText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },
  eventCard: {
    width: 48,
    height: 48,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    elevation: 4,
  },
  eventGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  eventTitle: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: '900',
    lineHeight: 9,
  },
  eventSubtitle: {
    color: '#FEF08A',
    fontSize: 7,
    fontWeight: '800',
    lineHeight: 8,
  },
  comboBubble: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 6,
  },
  comboGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
  },
  comboEmoji: {
    fontSize: 14,
  },
  comboText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  heartsContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 60,
    height: 280,
  },
  heartParticle: {
    position: 'absolute',
    bottom: 0,
    right: 15,
  },
});
