import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  StyleProp,
  ViewStyle,
  LayoutChangeEvent,
  Dimensions,
} from 'react-native';
import Svg, {
  Path,
  Circle,
  Ellipse,
  Rect,
  Polygon,
  Line,
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
} from 'react-native-svg';

export interface ARFaceMaskOverlayProps {
  effectId: string | null;
  intensity?: number;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ARFaceMaskOverlay({
  effectId,
  intensity = 0.8,
  style,
  compact = false,
}: ARFaceMaskOverlayProps) {
  const [layout, setLayout] = useState({ width: 0, height: 0 });

  // Animation values for lively, reactive Snapchat-like animations
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const tongueAnim = useRef(new Animated.Value(0)).current;
  const tearAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Avoid running infinite timer loops in Jest test environments
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') {
      return;
    }

    // 1. Ear bounce / wing flap oscillation
    const bounceLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: -1,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );

    // 2. Dog tongue panting / wiggling
    const tongueLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(tongueAnim, {
          toValue: 1,
          duration: 550,
          useNativeDriver: true,
        }),
        Animated.timing(tongueAnim, {
          toValue: 0,
          duration: 550,
          useNativeDriver: true,
        }),
      ]),
    );

    // 3. Cry baby continuous waterfall tears
    const tearLoop = Animated.loop(
      Animated.timing(tearAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
    );

    // 4. Sparkle, diamond, flame pulsing
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.25,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.85,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );

    // 5. Floating confetti / hearts
    const floatLoop = Animated.loop(
      Animated.timing(floatAnim, {
        toValue: 1,
        duration: 2200,
        useNativeDriver: true,
      }),
    );

    bounceLoop.start();
    tongueLoop.start();
    tearLoop.start();
    pulseLoop.start();
    floatLoop.start();

    return () => {
      bounceLoop.stop();
      tongueLoop.stop();
      tearLoop.stop();
      pulseLoop.stop();
      floatLoop.stop();
    };
  }, [bounceAnim, tongueAnim, tearAnim, pulseAnim, floatAnim]);

  if (!effectId || effectId === 'none' || effectId === 'original') {
    return null;
  }

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setLayout({ width, height });
    }
  };

  const W = layout.width || SCREEN_WIDTH;
  const H = layout.height || SCREEN_HEIGHT;

  // Responsive scaling to fit phone screens, split screens, or thumbnails
  const scale = compact
    ? Math.min(W / 360, H / 360) * 0.82
    : Math.min(W / 390, H / 780);

  const cx = W * 0.5;
  const headY = compact ? H * 0.22 : H * 0.28;
  const eyeY = compact ? H * 0.38 : H * 0.44;
  const noseY = compact ? H * 0.48 : H * 0.54;
  const mouthY = compact ? H * 0.58 : H * 0.64;

  // Clamped intensity factor
  const effAlpha = Math.max(0.15, Math.min(1.0, intensity));

  // Interpolated transforms
  const leftEarRot = bounceAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-24deg', '-12deg'],
  });
  const rightEarRot = bounceAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['12deg', '24deg'],
  });
  const tongueTransY = tongueAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 7 * scale],
  });
  const tongueScaleY = tongueAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1.18],
  });
  const tearTransY = tearAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 50 * scale],
  });
  const tearFade = tearAnim.interpolate({
    inputRange: [0, 0.2, 0.8, 1],
    outputRange: [0.2, 0.95, 0.85, 0.15],
  });
  const flameScale = pulseAnim.interpolate({
    inputRange: [0.85, 1.25],
    outputRange: [0.92, 1.08],
  });
  const wingScaleX = bounceAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: [0.35, 1.0],
  });
  const floatTransY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -60 * scale],
  });
  const floatFade = floatAnim.interpolate({
    inputRange: [0, 0.2, 0.8, 1],
    outputRange: [0.2, 0.9, 0.8, 0.1],
  });

  return (
    <View
      style={[styles.container, style]}
      pointerEvents="none"
      onLayout={onLayout}
    >
      {/* =========================================================================
          1. 🐶 PUPPY / DOG (SNAPCHAT ICONIC DOG FILTER)
          ========================================================================= */}
      {(effectId === 'puppy' || effectId === 'dog') && (
        <View style={[StyleSheet.absoluteFill, { opacity: effAlpha }]}>
          {/* Snapchat Soft Skin Smoothing & Glow */}
          <View style={[StyleSheet.absoluteFill, { opacity: 0.18 }]}>
            <Svg width="100%" height="100%">
              <Defs>
                <RadialGradient id="dogFaceGlow" cx="50%" cy="48%" rx="48%" ry="48%">
                  <Stop offset="0%" stopColor="#FFF9E6" stopOpacity={0.6} />
                  <Stop offset="65%" stopColor="#FED7AA" stopOpacity={0.25} />
                  <Stop offset="100%" stopColor="#FED7AA" stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Rect x="0" y="0" width="100%" height="100%" fill="url(#dogFaceGlow)" />
            </Svg>
          </View>

          {/* Left Large Floppy Ear */}
          <Animated.View
            style={[
              styles.part,
              {
                left: cx - 145 * scale,
                top: headY - 32 * scale,
                transform: [{ rotate: leftEarRot }],
              },
            ]}
          >
            <Svg width={115 * scale} height={145 * scale} viewBox="0 0 115 145">
              <Defs>
                <LinearGradient id="earFurLeft" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#D97706" />
                  <Stop offset="50%" stopColor="#B45309" />
                  <Stop offset="100%" stopColor="#78350F" />
                </LinearGradient>
                <LinearGradient id="innerEarLeft" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#FFAAA6" />
                  <Stop offset="100%" stopColor="#F87171" />
                </LinearGradient>
              </Defs>
              {/* Outer Fluffy Ear */}
              <Path
                d="M80 8 C40 18 10 55 12 95 C14 125 45 140 68 120 C85 102 96 65 102 28 Z"
                fill="url(#earFurLeft)"
                stroke="#5B21B6"
                strokeWidth={0}
              />
              {/* Soft Pink Inner Ear Flap */}
              <Path
                d="M68 28 C45 45 30 72 32 98 C35 116 52 118 64 104 C72 90 76 60 82 38 Z"
                fill="url(#innerEarLeft)"
                opacity={0.88}
              />
              {/* Ear Fold Depth Line */}
              <Path
                d="M78 12 C72 35 68 70 65 110"
                stroke="#5C2B09"
                strokeWidth={3}
                strokeLinecap="round"
                opacity={0.65}
              />
            </Svg>
          </Animated.View>

          {/* Right Large Floppy Ear */}
          <Animated.View
            style={[
              styles.part,
              {
                left: cx + 32 * scale,
                top: headY - 32 * scale,
                transform: [{ rotate: rightEarRot }],
              },
            ]}
          >
            <Svg width={115 * scale} height={145 * scale} viewBox="0 0 115 145">
              <Defs>
                <LinearGradient id="earFurRight" x1="100%" y1="0%" x2="0%" y2="100%">
                  <Stop offset="0%" stopColor="#D97706" />
                  <Stop offset="50%" stopColor="#B45309" />
                  <Stop offset="100%" stopColor="#78350F" />
                </LinearGradient>
                <LinearGradient id="innerEarRight" x1="100%" y1="0%" x2="0%" y2="100%">
                  <Stop offset="0%" stopColor="#FFAAA6" />
                  <Stop offset="100%" stopColor="#F87171" />
                </LinearGradient>
              </Defs>
              {/* Outer Fluffy Ear */}
              <Path
                d="M35 8 C75 18 105 55 103 95 C101 125 70 140 47 120 C30 102 19 65 13 28 Z"
                fill="url(#earFurRight)"
              />
              {/* Soft Pink Inner Ear Flap */}
              <Path
                d="M47 28 C70 45 85 72 83 98 C80 116 63 118 51 104 C43 90 39 60 33 38 Z"
                fill="url(#innerEarRight)"
                opacity={0.88}
              />
              {/* Ear Fold Depth Line */}
              <Path
                d="M37 12 C43 35 47 70 50 110"
                stroke="#5C2B09"
                strokeWidth={3}
                strokeLinecap="round"
                opacity={0.65}
              />
            </Svg>
          </Animated.View>

          {/* Soft Peach/Rosy Cheek Blushes */}
          <View
            style={[
              styles.part,
              { left: cx - 120 * scale, top: eyeY + 20 * scale },
            ]}
          >
            <Svg width={240 * scale} height={50 * scale} viewBox="0 0 240 50">
              <Defs>
                <RadialGradient id="dogBlushL" cx="50%" cy="50%" rx="50%" ry="50%">
                  <Stop offset="0%" stopColor="#FF4B72" stopOpacity={0.55} />
                  <Stop offset="70%" stopColor="#FF4B72" stopOpacity={0.2} />
                  <Stop offset="100%" stopColor="#FF4B72" stopOpacity={0} />
                </RadialGradient>
                <RadialGradient id="dogBlushR" cx="50%" cy="50%" rx="50%" ry="50%">
                  <Stop offset="0%" stopColor="#FF4B72" stopOpacity={0.55} />
                  <Stop offset="70%" stopColor="#FF4B72" stopOpacity={0.2} />
                  <Stop offset="100%" stopColor="#FF4B72" stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Ellipse cx="35" cy="25" rx="32" ry="20" fill="url(#dogBlushL)" />
              <Ellipse cx="205" cy="25" rx="32" ry="20" fill="url(#dogBlushR)" />
            </Svg>
          </View>

          {/* Large Sticking Out Panting Dog Tongue (Snapchat Signature) */}
          <Animated.View
            style={[
              styles.part,
              {
                left: cx - 26 * scale,
                top: noseY + 16 * scale,
                transform: [
                  { translateY: tongueTransY },
                  { scaleY: tongueScaleY },
                ],
              },
            ]}
          >
            <Svg width={52 * scale} height={72 * scale} viewBox="0 0 52 72">
              <Defs>
                <LinearGradient id="tongueGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <Stop offset="0%" stopColor="#FF3366" />
                  <Stop offset="60%" stopColor="#FF4F79" />
                  <Stop offset="100%" stopColor="#FF6B8B" />
                </LinearGradient>
              </Defs>
              {/* Tongue Body */}
              <Path
                d="M6 6 Q26 12 46 6 C52 38 48 66 26 70 C4 66 0 38 6 6 Z"
                fill="url(#tongueGrad)"
                stroke="#C2185B"
                strokeWidth={2.5}
              />
              {/* Center Groove Line */}
              <Line
                x1="26"
                y1="8"
                x2="26"
                y2="58"
                stroke="#A80744"
                strokeWidth={3}
                strokeLinecap="round"
                opacity={0.8}
              />
              {/* Glossy Saliva Shine */}
              <Path
                d="M14 18 C12 28 14 42 18 48"
                stroke="#FFFFFF"
                strokeWidth={3}
                strokeLinecap="round"
                opacity={0.65}
              />
            </Svg>
          </Animated.View>

          {/* Cream Muzzle Oval, 3D Button Nose & Whisker Freckles */}
          <View
            style={[
              styles.part,
              { left: cx - 60 * scale, top: noseY - 26 * scale },
            ]}
          >
            <Svg width={120 * scale} height={68 * scale} viewBox="0 0 120 68">
              <Defs>
                <RadialGradient id="snoutShine" cx="50%" cy="30%" rx="50%" ry="50%">
                  <Stop offset="0%" stopColor="#2D2B30" />
                  <Stop offset="80%" stopColor="#121114" />
                  <Stop offset="100%" stopColor="#080709" />
                </RadialGradient>
              </Defs>
              {/* Warm Soft Cream Muzzle */}
              <Ellipse cx="60" cy="38" rx="55" ry="28" fill="#FFF6E5" opacity={0.96} />
              {/* Left Whisker Freckles */}
              <Circle cx="28" cy="34" r="3" fill="#6B4423" />
              <Circle cx="20" cy="42" r="3" fill="#6B4423" />
              <Circle cx="30" cy="48" r="2.8" fill="#6B4423" />
              {/* Right Whisker Freckles */}
              <Circle cx="92" cy="34" r="3" fill="#6B4423" />
              <Circle cx="100" cy="42" r="3" fill="#6B4423" />
              <Circle cx="90" cy="48" r="2.8" fill="#6B4423" />
              {/* 3D Black Bulbous Nose */}
              <Path
                d="M42 14 Q60 6 78 14 Q84 32 60 35 Q36 32 42 14 Z"
                fill="url(#snoutShine)"
                stroke="#000000"
                strokeWidth={1}
              />
              {/* Nostril indentations */}
              <Ellipse cx="50" cy="25" rx="4" ry="2.5" fill="#050505" />
              <Ellipse cx="70" cy="25" rx="4" ry="2.5" fill="#050505" />
              {/* Specular White Nose Glint */}
              <Ellipse cx="54" cy="14" rx="7" ry="3" fill="#FFFFFF" opacity={0.85} transform="rotate(-15 54 14)" />
              {/* Center Muzzle Seam Line */}
              <Line x1="60" y1="35" x2="60" y2="52" stroke="#1C1917" strokeWidth={2.5} strokeLinecap="round" />
            </Svg>
          </View>
        </View>
      )}

      {/* =========================================================================
          2. 🐱 KITTY / CAT (SNAPCHAT CAT FILTER WITH WHISKERS)
          ========================================================================= */}
      {(effectId === 'kitty' || effectId === 'anime-cat' || effectId === 'cat') && (
        <View style={[StyleSheet.absoluteFill, { opacity: effAlpha }]}>
          {/* Subtle Porcelain Skin Glow */}
          <View style={[StyleSheet.absoluteFill, { opacity: 0.16 }]}>
            <Svg width="100%" height="100%">
              <Defs>
                <RadialGradient id="catSkinGlow" cx="50%" cy="48%" rx="48%" ry="48%">
                  <Stop offset="0%" stopColor="#FFF0F5" stopOpacity={0.6} />
                  <Stop offset="70%" stopColor="#FED7AA" stopOpacity={0.2} />
                  <Stop offset="100%" stopColor="#FED7AA" stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Rect x="0" y="0" width="100%" height="100%" fill="url(#catSkinGlow)" />
            </Svg>
          </View>

          {/* Left Pointed Cat Ear with Fur Tuft & Twitch Animation */}
          <Animated.View
            style={[
              styles.part,
              {
                left: cx - 105 * scale,
                top: headY - 58 * scale,
                transform: [{ rotate: leftEarRot }],
              },
            ]}
          >
            <Svg width={75 * scale} height={80 * scale} viewBox="0 0 75 80">
              <Defs>
                <LinearGradient id="catInnerEarL" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#FFAAA6" />
                  <Stop offset="100%" stopColor="#FF6584" />
                </LinearGradient>
              </Defs>
              {/* Outer White Ear */}
              <Path
                d="M10 75 C8 45 28 10 40 4 C50 25 65 55 68 75 Z"
                fill="#FFFFFF"
                stroke="#E2E8F0"
                strokeWidth={2}
              />
              {/* Soft Pink Inner Ear */}
              <Path
                d="M20 70 C18 48 32 20 40 14 C46 30 56 52 58 70 Z"
                fill="url(#catInnerEarL)"
              />
              {/* Fluffy White Inner Fur Tufts */}
              <Path
                d="M18 68 C28 55 35 60 42 68"
                stroke="#FFFFFF"
                strokeWidth={3}
                strokeLinecap="round"
              />
              <Path
                d="M24 60 C32 50 38 54 44 60"
                stroke="#FFFFFF"
                strokeWidth={2.5}
                strokeLinecap="round"
              />
            </Svg>
          </Animated.View>

          {/* Right Pointed Cat Ear with Fur Tuft & Twitch Animation */}
          <Animated.View
            style={[
              styles.part,
              {
                left: cx + 30 * scale,
                top: headY - 58 * scale,
                transform: [{ rotate: rightEarRot }],
              },
            ]}
          >
            <Svg width={75 * scale} height={80 * scale} viewBox="0 0 75 80">
              <Defs>
                <LinearGradient id="catInnerEarR" x1="100%" y1="0%" x2="0%" y2="100%">
                  <Stop offset="0%" stopColor="#FFAAA6" />
                  <Stop offset="100%" stopColor="#FF6584" />
                </LinearGradient>
              </Defs>
              {/* Outer White Ear */}
              <Path
                d="M65 75 C67 45 47 10 35 4 C25 25 10 55 7 75 Z"
                fill="#FFFFFF"
                stroke="#E2E8F0"
                strokeWidth={2}
              />
              {/* Soft Pink Inner Ear */}
              <Path
                d="M55 70 C57 48 43 20 35 14 C29 30 19 52 17 70 Z"
                fill="url(#catInnerEarR)"
              />
              {/* Fluffy White Inner Fur Tufts */}
              <Path
                d="M57 68 C47 55 40 60 33 68"
                stroke="#FFFFFF"
                strokeWidth={3}
                strokeLinecap="round"
              />
              <Path
                d="M51 60 C43 50 37 54 31 60"
                stroke="#FFFFFF"
                strokeWidth={2.5}
                strokeLinecap="round"
              />
            </Svg>
          </Animated.View>

          {/* Dramatic Winged Cat Eyeliner & Star Accents */}
          <View
            style={[
              styles.part,
              { left: cx - 110 * scale, top: eyeY - 10 * scale },
            ]}
          >
            <Svg width={220 * scale} height={35 * scale} viewBox="0 0 220 35">
              {/* Left Eyeliner Wing */}
              <Path d="M48 24 Q24 16 12 6" fill="none" stroke="#0F172A" strokeWidth={3.5} strokeLinecap="round" />
              <Circle cx="8" cy="4" r="2" fill="#FF80AB" />
              {/* Right Eyeliner Wing */}
              <Path d="M172 24 Q196 16 208 6" fill="none" stroke="#0F172A" strokeWidth={3.5} strokeLinecap="round" />
              <Circle cx="212" cy="4" r="2" fill="#FF80AB" />
            </Svg>
          </View>

          {/* 6 Elegant Sweeping Cat Whiskers Across Both Cheeks */}
          <View
            style={[
              styles.part,
              { left: cx - 150 * scale, top: noseY - 18 * scale },
            ]}
          >
            <Svg width={300 * scale} height={70 * scale} viewBox="0 0 300 70">
              {/* Left 3 Whiskers */}
              <Path d="M100 28 Q50 14 8 10" fill="none" stroke="#1E293B" strokeWidth={2.8} strokeLinecap="round" />
              <Path d="M96 35 Q45 32 4 33" fill="none" stroke="#1E293B" strokeWidth={2.8} strokeLinecap="round" />
              <Path d="M100 42 Q50 50 12 58" fill="none" stroke="#1E293B" strokeWidth={2.8} strokeLinecap="round" />
              {/* Right 3 Whiskers */}
              <Path d="M200 28 Q250 14 292 10" fill="none" stroke="#1E293B" strokeWidth={2.8} strokeLinecap="round" />
              <Path d="M204 35 Q255 32 296 33" fill="none" stroke="#1E293B" strokeWidth={2.8} strokeLinecap="round" />
              <Path d="M200 42 Q250 50 288 58" fill="none" stroke="#1E293B" strokeWidth={2.8} strokeLinecap="round" />
            </Svg>
          </View>

          {/* Cute Pink Heart Cat Nose & "ω" Smile Line */}
          <View
            style={[
              styles.part,
              { left: cx - 30 * scale, top: noseY - 12 * scale },
            ]}
          >
            <Svg width={60 * scale} height={48 * scale} viewBox="0 0 60 48">
              {/* Pink Heart Nose */}
              <Path
                d="M30 18 C26 10 18 10 18 16 C18 22 28 28 30 30 C32 28 42 22 42 16 C42 10 34 10 30 18 Z"
                fill="#FF4B72"
              />
              <Ellipse cx="27" cy="14" rx="3" ry="1.5" fill="#FFFFFF" opacity={0.7} />
              {/* Adorable Cat "ω" Smile */}
              <Path
                d="M18 35 Q24 41 30 35 Q36 41 42 35"
                fill="none"
                stroke="#FF4B72"
                strokeWidth={3}
                strokeLinecap="round"
              />
            </Svg>
          </View>

          {/* Sweet Rosy Heart Cheek Blushes */}
          <View
            style={[
              styles.part,
              { left: cx - 100 * scale, top: eyeY + 24 * scale },
            ]}
          >
            <Svg width={200 * scale} height={40 * scale} viewBox="0 0 200 40">
              <Path d="M30 12 C22 4 10 16 22 28 L30 36 L38 28 C50 16 38 4 30 12 Z" fill="#FF6584" opacity={0.55} />
              <Path d="M170 12 C162 4 150 16 162 28 L170 36 L178 28 C190 16 178 4 170 12 Z" fill="#FF6584" opacity={0.55} />
            </Svg>
          </View>
        </View>
      )}

      {/* =========================================================================
          3. 🐰 BUNNY / RABBIT FILTER (SNAPCHAT ICONIC TALL BUNNY EARS)
          ========================================================================= */}
      {(effectId === 'bunny' || effectId === 'rabbit') && (
        <View style={[StyleSheet.absoluteFill, { opacity: effAlpha }]}>
          {/* Left Tall Rabbit Ear (Standing Proud) */}
          <Animated.View
            style={[
              styles.part,
              {
                left: cx - 85 * scale,
                top: headY - 145 * scale,
                transform: [{ rotate: leftEarRot }],
              },
            ]}
          >
            <Svg width={65 * scale} height={150 * scale} viewBox="0 0 65 150">
              <Defs>
                <LinearGradient id="bunnyInnerL" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#FFAAA6" />
                  <Stop offset="100%" stopColor="#FF80AB" />
                </LinearGradient>
              </Defs>
              <Path
                d="M32 140 C8 85 12 18 32 12 C52 18 56 85 32 140 Z"
                fill="#FFFFFF"
                stroke="#E2E8F0"
                strokeWidth={2.5}
              />
              <Path
                d="M32 125 C18 78 22 28 32 24 C42 28 46 78 32 125 Z"
                fill="url(#bunnyInnerL)"
                opacity={0.88}
              />
            </Svg>
          </Animated.View>

          {/* Right Rabbit Ear with Playfully Folded Tip (Snapchat Signature) */}
          <Animated.View
            style={[
              styles.part,
              {
                left: cx + 20 * scale,
                top: headY - 120 * scale,
                transform: [{ rotate: rightEarRot }],
              },
            ]}
          >
            <Svg width={75 * scale} height={125 * scale} viewBox="0 0 75 125">
              <Defs>
                <LinearGradient id="bunnyInnerR" x1="100%" y1="0%" x2="0%" y2="100%">
                  <Stop offset="0%" stopColor="#FFAAA6" />
                  <Stop offset="100%" stopColor="#FF80AB" />
                </LinearGradient>
              </Defs>
              <Path
                d="M20 118 C38 72 48 42 30 24 C20 16 10 28 14 42 C18 58 28 85 20 118 Z"
                fill="#FFFFFF"
                stroke="#E2E8F0"
                strokeWidth={2.5}
              />
              <Path
                d="M22 102 C34 65 40 44 28 32 C22 26 16 34 18 44 C20 56 26 78 22 102 Z"
                fill="url(#bunnyInnerR)"
                opacity={0.88}
              />
            </Svg>
          </Animated.View>

          {/* Cute Pink Bunny Nose & Two Adorable White Buck Teeth */}
          <View
            style={[
              styles.part,
              { left: cx - 35 * scale, top: noseY - 8 * scale },
            ]}
          >
            <Svg width={70 * scale} height={60 * scale} viewBox="0 0 70 60">
              {/* Pink Heart Nose */}
              <Path
                d="M35 18 C31 10 21 12 26 22 L35 30 L44 22 C49 12 39 10 35 18 Z"
                fill="#FF6584"
              />
              {/* Muzzle whiskers line */}
              <Path d="M22 28 Q28 34 35 30 Q42 34 48 28" fill="none" stroke="#FF6584" strokeWidth={2} />
              {/* Two White Buck Teeth */}
              <Rect x="28" y="32" width="6.5" height="12" rx="2" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth={1.2} />
              <Rect x="35.5" y="32" width="6.5" height="12" rx="2" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth={1.2} />
            </Svg>
          </View>

          {/* Strawberry Pink Cheeks with Whisker Freckles */}
          <View
            style={[
              styles.part,
              { left: cx - 110 * scale, top: eyeY + 22 * scale },
            ]}
          >
            <Svg width={220 * scale} height={45 * scale} viewBox="0 0 220 45">
              <Circle cx="35" cy="22" r="22" fill="#FF80AB" opacity={0.5} />
              <Circle cx="28" cy="20" r="2" fill="#FFFFFF" />
              <Circle cx="35" cy="16" r="2" fill="#FFFFFF" />
              <Circle cx="42" cy="22" r="2" fill="#FFFFFF" />
              <Circle cx="185" cy="22" r="22" fill="#FF80AB" opacity={0.5} />
              <Circle cx="178" cy="22" r="2" fill="#FFFFFF" />
              <Circle cx="185" cy="16" r="2" fill="#FFFFFF" />
              <Circle cx="192" cy="20" r="2" fill="#FFFFFF" />
            </Svg>
          </View>
        </View>
      )}

      {/* =========================================================================
          4. 👑 ROYAL CROWN / KING / QUEEN
          ========================================================================= */}
      {(effectId === 'royal-crown' || effectId === 'yaro-royal' || effectId === 'crown') && (
        <View style={[StyleSheet.absoluteFill, { opacity: effAlpha }]}>
          {/* Majestic 5-Peak Golden Crown */}
          <View
            style={[
              styles.part,
              { left: cx - 95 * scale, top: headY - 65 * scale },
            ]}
          >
            <Svg width={190 * scale} height={85 * scale} viewBox="0 0 190 85">
              <Defs>
                <LinearGradient id="crownGold" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#FFF275" />
                  <Stop offset="45%" stopColor="#F59E0B" />
                  <Stop offset="100%" stopColor="#B45309" />
                </LinearGradient>
              </Defs>
              {/* 5 Peaks */}
              <Path
                d="M15 65 L25 18 L58 45 L95 8 L132 45 L165 18 L175 65 Z"
                fill="url(#crownGold)"
                stroke="#D97706"
                strokeWidth={2.5}
              />
              {/* Base Rim */}
              <Rect x="12" y="62" width="166" height="18" rx="4" fill="url(#crownGold)" stroke="#92400E" strokeWidth={2} />
              {/* Inlaid Gems */}
              <Circle cx="95" cy="25" r="8" fill="#DC2626" stroke="#FEF08A" strokeWidth={1.5} />
              <Circle cx="95" cy="25" r="3.5" fill="#F87171" />
              <Circle cx="58" cy="50" r="6" fill="#16A34A" stroke="#FEF08A" strokeWidth={1.5} />
              <Circle cx="132" cy="50" r="6" fill="#2563EB" stroke="#FEF08A" strokeWidth={1.5} />
              {/* Base Pearls */}
              <Circle cx="30" cy="71" r="3.5" fill="#FFFFFF" />
              <Circle cx="62" cy="71" r="3.5" fill="#FFFFFF" />
              <Circle cx="95" cy="71" r="3.5" fill="#FFFFFF" />
              <Circle cx="128" cy="71" r="3.5" fill="#FFFFFF" />
              <Circle cx="160" cy="71" r="3.5" fill="#FFFFFF" />
            </Svg>
          </View>

          {/* Twinkling Animated Golden Stars */}
          <Animated.View
            style={[
              styles.part,
              {
                left: cx - 110 * scale,
                top: headY - 80 * scale,
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <Svg width={220 * scale} height={40 * scale} viewBox="0 0 220 40">
              <Path d="M20 10 L23 18 L31 20 L23 22 L20 30 L17 22 L9 20 L17 18 Z" fill="#FDE047" />
              <Path d="M200 12 L202 18 L208 20 L202 22 L200 28 L198 22 L192 20 L198 18 Z" fill="#FDE047" />
              <Path d="M110 5 L112 10 L117 12 L112 14 L110 19 L108 14 L103 12 L108 10 Z" fill="#FFFFFF" />
            </Svg>
          </Animated.View>
        </View>
      )}

      {/* =========================================================================
          5. 🕶️ HEART SUNGLASSES
          ========================================================================= */}
      {(effectId === 'heart-glasses' || effectId === 'glasses') && (
        <View style={[StyleSheet.absoluteFill, { opacity: effAlpha }]}>
          <View
            style={[
              styles.part,
              { left: cx - 105 * scale, top: eyeY - 30 * scale },
            ]}
          >
            <Svg width={210 * scale} height={80 * scale} viewBox="0 0 210 80">
              {/* Bridge */}
              <Path d="M90 32 Q105 26 120 32" fill="none" stroke="#F59E0B" strokeWidth={5} />
              {/* Left Heart Lens */}
              <Path
                d="M55 12 C32 -4 8 20 28 50 L55 74 L82 50 C102 20 78 -4 55 12 Z"
                fill="rgba(244, 63, 94, 0.75)"
                stroke="#F59E0B"
                strokeWidth={4.5}
              />
              <Line x1="36" y1="22" x2="48" y2="40" stroke="#FFFFFF" strokeWidth={3.5} strokeLinecap="round" opacity={0.75} />
              {/* Right Heart Lens */}
              <Path
                d="M155 12 C132 -4 108 20 128 50 L155 74 L182 50 C202 20 178 -4 155 12 Z"
                fill="rgba(244, 63, 94, 0.75)"
                stroke="#F59E0B"
                strokeWidth={4.5}
              />
              <Line x1="136" y1="22" x2="148" y2="40" stroke="#FFFFFF" strokeWidth={3.5} strokeLinecap="round" opacity={0.75} />
            </Svg>
          </View>
        </View>
      )}

      {/* =========================================================================
          6. 😭 CRY BABY (CARTOON WATERFALL TEARS)
          ========================================================================= */}
      {(effectId === 'cry-baby' || effectId === 'tears') && (
        <View style={[StyleSheet.absoluteFill, { opacity: effAlpha }]}>
          {/* Continuous Streaming Tears Down Both Cheeks */}
          <Animated.View
            style={[
              styles.part,
              {
                left: cx - 95 * scale,
                top: eyeY + 8 * scale,
                opacity: tearFade,
                transform: [{ translateY: tearTransY }],
              },
            ]}
          >
            <Svg width={190 * scale} height={120 * scale} viewBox="0 0 190 120">
              {/* Left Tear Waterfall */}
              <Path
                d="M45 4 C32 25 30 65 45 95 C60 65 58 25 45 4 Z"
                fill="#38BDF8"
                opacity={0.88}
              />
              <Circle cx="44" cy="105" r="6" fill="#0284C7" />
              <Circle cx="36" cy="112" r="3.5" fill="#38BDF8" />
              {/* Right Tear Waterfall */}
              <Path
                d="M145 4 C132 25 130 65 145 95 C160 65 158 25 145 4 Z"
                fill="#38BDF8"
                opacity={0.88}
              />
              <Circle cx="146" cy="105" r="6" fill="#0284C7" />
              <Circle cx="154" cy="112" r="3.5" fill="#38BDF8" />
            </Svg>
          </Animated.View>

          {/* Crying Red Nose & Pout */}
          <View
            style={[
              styles.part,
              { left: cx - 25 * scale, top: noseY - 6 * scale },
            ]}
          >
            <Svg width={50 * scale} height={40 * scale} viewBox="0 0 50 40">
              <Ellipse cx="25" cy="16" rx="14" ry="10" fill="#EF4444" opacity={0.45} />
              <Path d="M16 32 Q25 26 34 32" stroke="#B91C1C" strokeWidth={2.5} fill="none" strokeLinecap="round" />
            </Svg>
          </View>
        </View>
      )}

      {/* =========================================================================
          7. 🔥 FLAME FACE / FIRE KING
          ========================================================================= */}
      {(effectId === 'flame-face' || effectId === 'fire-king' || effectId === 'fire') && (
        <View style={[StyleSheet.absoluteFill, { opacity: effAlpha }]}>
          <Animated.View
            style={[
              styles.part,
              {
                left: cx - 110 * scale,
                top: headY - 80 * scale,
                transform: [{ scaleY: flameScale }],
              },
            ]}
          >
            <Svg width={220 * scale} height={140 * scale} viewBox="0 0 220 140">
              <Defs>
                <LinearGradient id="flameGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                  <Stop offset="0%" stopColor="#DC2626" />
                  <Stop offset="55%" stopColor="#F97316" />
                  <Stop offset="100%" stopColor="#FDE047" />
                </LinearGradient>
              </Defs>
              {/* Outer Roaring Flames */}
              <Path
                d="M20 120 C10 80 35 45 45 10 C55 45 70 65 85 40 C100 80 110 30 115 5 C125 35 140 70 155 35 C165 65 185 45 195 10 C205 55 210 90 200 120 Z"
                fill="url(#flameGrad)"
                opacity={0.85}
              />
              {/* Inner Bright Yellow Fire */}
              <Path
                d="M45 120 C40 90 60 70 70 45 C80 70 95 85 105 60 C115 90 125 55 130 35 C140 60 150 85 160 60 C170 85 180 95 175 120 Z"
                fill="#FEF08A"
                opacity={0.9}
              />
            </Svg>
          </Animated.View>
        </View>
      )}

      {/* =========================================================================
          8. 🎧 CYBER HEADSET
          ========================================================================= */}
      {(effectId === 'cyber-headset' || effectId === 'cyber') && (
        <View style={[StyleSheet.absoluteFill, { opacity: effAlpha }]}>
          {/* Headband & Ear Cups */}
          <View
            style={[
              styles.part,
              { left: cx - 120 * scale, top: headY - 45 * scale },
            ]}
          >
            <Svg width={240 * scale} height={110 * scale} viewBox="0 0 240 110">
              {/* Headband */}
              <Path d="M40 70 C40 10 200 10 200 70" fill="none" stroke="#1E293B" strokeWidth={12} strokeLinecap="round" />
              <Path d="M48 65 C48 18 192 18 192 65" fill="none" stroke="#00F0FF" strokeWidth={3} strokeLinecap="round" />
              {/* Left Neon Cyan Ear Cup */}
              <Rect x="16" y="50" width="28" height="48" rx="14" fill="#0F172A" stroke="#00F0FF" strokeWidth={4} />
              <Circle cx="30" cy="74" r="8" fill="#00F0FF" />
              {/* Right Neon Pink Ear Cup */}
              <Rect x="196" y="50" width="28" height="48" rx="14" fill="#0F172A" stroke="#FF007F" strokeWidth={4} />
              <Circle cx="210" cy="74" r="8" fill="#FF007F" />
              {/* Boom Microphone */}
              <Path d="M36 85 Q50 115 85 110" fill="none" stroke="#64748B" strokeWidth={3.5} strokeLinecap="round" />
              <Circle cx="88" cy="110" r="5" fill="#FF007F" />
            </Svg>
          </View>
        </View>
      )}

      {/* =========================================================================
          9. 🌸 FLOWER CROWN
          ========================================================================= */}
      {(effectId === 'flower-crown' || effectId === 'flowers') && (
        <View style={[StyleSheet.absoluteFill, { opacity: effAlpha }]}>
          <View
            style={[
              styles.part,
              { left: cx - 110 * scale, top: headY - 45 * scale },
            ]}
          >
            <Svg width={220 * scale} height={70 * scale} viewBox="0 0 220 70">
              {/* Green Leaf Vine */}
              <Path d="M20 50 Q110 25 200 50" fill="none" stroke="#22C55E" strokeWidth={4.5} strokeLinecap="round" />
              {/* Roses & Blossoms */}
              <Circle cx="110" cy="30" r="16" fill="#F43F5E" />
              <Circle cx="110" cy="30" r="9" fill="#FDA4AF" />
              <Circle cx="70" cy="38" r="13" fill="#FB7185" />
              <Circle cx="70" cy="38" r="7" fill="#FECDD3" />
              <Circle cx="150" cy="38" r="13" fill="#FBBF24" />
              <Circle cx="150" cy="38" r="7" fill="#FEF3C7" />
              <Circle cx="35" cy="48" r="10" fill="#C084FC" />
              <Circle cx="185" cy="48" r="10" fill="#C084FC" />
            </Svg>
          </View>
        </View>
      )}

      {/* =========================================================================
          10. 🦋 BUTTERFLIES
          ========================================================================= */}
      {(effectId === 'butterflies' || effectId === 'butterfly-hair' || effectId === 'crystal-butterfly') && (
        <View style={[StyleSheet.absoluteFill, { opacity: effAlpha }]}>
          {/* Main Butterfly Top Right with Flapping Wings */}
          <Animated.View
            style={[
              styles.part,
              {
                left: cx + 45 * scale,
                top: headY - 60 * scale,
                transform: [{ scaleX: wingScaleX }],
              },
            ]}
          >
            <Svg width={60 * scale} height={50 * scale} viewBox="0 0 60 50">
              <Path d="M30 25 C24 8 8 10 12 24 C14 30 24 30 30 27 Z" fill="#00D2FF" />
              <Path d="M30 25 C36 8 52 10 48 24 C46 30 36 30 30 27 Z" fill="#00D2FF" />
              <Path d="M30 27 C22 28 15 38 20 44 C26 48 30 38 30 32 Z" fill="#0080FF" />
              <Path d="M30 27 C38 28 45 38 40 44 C34 48 30 38 30 32 Z" fill="#0080FF" />
              <Ellipse cx="30" cy="28" rx="2" ry="8" fill="#0F172A" />
            </Svg>
          </Animated.View>

          {/* Second Butterfly Left Cheek */}
          <Animated.View
            style={[
              styles.part,
              {
                left: cx - 90 * scale,
                top: eyeY + 15 * scale,
                transform: [{ scaleX: wingScaleX }],
              },
            ]}
          >
            <Svg width={45 * scale} height={40 * scale} viewBox="0 0 60 50">
              <Path d="M30 25 C24 8 8 10 12 24 C14 30 24 30 30 27 Z" fill="#C084FC" />
              <Path d="M30 25 C36 8 52 10 48 24 C46 30 36 30 30 27 Z" fill="#C084FC" />
              <Path d="M30 27 C22 28 15 38 20 44 C26 48 30 38 30 32 Z" fill="#9333EA" />
              <Path d="M30 27 C38 28 45 38 40 44 C34 48 30 38 30 32 Z" fill="#9333EA" />
            </Svg>
          </Animated.View>
        </View>
      )}

      {/* =========================================================================
          11. 👹 DEVIL HORNS
          ========================================================================= */}
      {(effectId === 'devil' || effectId === 'horns') && (
        <View style={[StyleSheet.absoluteFill, { opacity: effAlpha }]}>
          <View
            style={[
              styles.part,
              { left: cx - 75 * scale, top: headY - 60 * scale },
            ]}
          >
            <Svg width={150 * scale} height={70 * scale} viewBox="0 0 150 70">
              {/* Left Horn */}
              <Path d="M25 65 C22 35 38 18 52 12 C48 28 38 48 42 66 Z" fill="#E11D48" stroke="#9F1239" strokeWidth={2.5} />
              <Path d="M30 58 C32 44 40 30 48 20" stroke="#FDA4AF" strokeWidth={2} fill="none" />
              {/* Right Horn */}
              <Path d="M125 65 C128 35 112 18 98 12 C102 28 112 48 108 66 Z" fill="#E11D48" stroke="#9F1239" strokeWidth={2.5} />
              <Path d="M120 58 C118 44 110 30 102 20" stroke="#FDA4AF" strokeWidth={2} fill="none" />
            </Svg>
          </View>
        </View>
      )}

      {/* =========================================================================
          12. 👼 ANGEL (GOLDEN HALO)
          ========================================================================= */}
      {(effectId === 'angel' || effectId === 'halo') && (
        <View style={[StyleSheet.absoluteFill, { opacity: effAlpha }]}>
          <Animated.View
            style={[
              styles.part,
              {
                left: cx - 70 * scale,
                top: headY - 80 * scale,
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <Svg width={140 * scale} height={50 * scale} viewBox="0 0 140 50">
              <Ellipse cx="70" cy="25" rx="55" ry="16" fill="none" stroke="#FDE047" strokeWidth={7} />
              <Ellipse cx="70" cy="25" rx="55" ry="16" fill="none" stroke="#FFFFFF" strokeWidth={2.5} />
            </Svg>
          </Animated.View>
        </View>
      )}

      {/* =========================================================================
          13. 💕 LOVE HEARTS
          ========================================================================= */}
      {(effectId === 'love-hearts' || effectId === 'hearts') && (
        <View style={[StyleSheet.absoluteFill, { opacity: effAlpha }]}>
          <Animated.View
            style={[
              styles.part,
              {
                left: cx - 95 * scale,
                top: headY - 40 * scale,
                opacity: floatFade,
                transform: [{ translateY: floatTransY }],
              },
            ]}
          >
            <Svg width={190 * scale} height={80 * scale} viewBox="0 0 190 80">
              <Path d="M40 30 C30 15 15 28 25 40 L40 55 L55 40 C65 28 50 15 40 30 Z" fill="#F43F5E" />
              <Path d="M150 20 C142 8 130 18 138 28 L150 40 L162 28 C170 18 158 8 150 20 Z" fill="#FB7185" />
              <Path d="M95 10 C88 0 78 8 85 16 L95 26 L105 16 C112 8 102 0 95 10 Z" fill="#FDA4AF" />
            </Svg>
          </Animated.View>
          {/* Heart Cheek Blushes */}
          <View
            style={[
              styles.part,
              { left: cx - 85 * scale, top: eyeY + 28 * scale },
            ]}
          >
            <Svg width={170 * scale} height={35 * scale} viewBox="0 0 170 35">
              <Path d="M25 8 C18 0 8 12 18 22 L25 30 L32 22 C42 12 32 0 25 8 Z" fill="#F43F5E" opacity={0.65} />
              <Path d="M145 8 C138 0 128 12 138 22 L145 30 L152 22 C162 12 152 0 145 8 Z" fill="#F43F5E" opacity={0.65} />
            </Svg>
          </View>
        </View>
      )}

      {/* =========================================================================
          14. 🦊 FOX
          ========================================================================= */}
      {effectId === 'fox' && (
        <View style={[StyleSheet.absoluteFill, { opacity: effAlpha }]}>
          {/* Left Bushy Fox Ear */}
          <Animated.View
            style={[
              styles.part,
              {
                left: cx - 100 * scale,
                top: headY - 60 * scale,
                transform: [{ rotate: leftEarRot }],
              },
            ]}
          >
            <Svg width={75 * scale} height={75 * scale} viewBox="0 0 75 75">
              <Defs>
                <LinearGradient id="foxEarL" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#FB923C" />
                  <Stop offset="100%" stopColor="#EA580C" />
                </LinearGradient>
              </Defs>
              {/* Outer Orange Ear */}
              <Path d="M12 70 C10 40 32 10 42 6 C52 24 66 50 68 70 Z" fill="url(#foxEarL)" />
              {/* Black Ear Tip */}
              <Path d="M34 18 C38 10 42 6 42 6 C42 6 48 12 52 22 Z" fill="#1C1917" />
              {/* Fluffy White Inner Ear Fur */}
              <Path d="M22 68 C24 48 34 24 40 20 C44 32 54 50 56 68 Z" fill="#FFF7ED" />
              <Path d="M22 64 C30 52 38 56 46 64" stroke="#FED7AA" strokeWidth={2} strokeLinecap="round" />
            </Svg>
          </Animated.View>

          {/* Right Bushy Fox Ear */}
          <Animated.View
            style={[
              styles.part,
              {
                left: cx + 25 * scale,
                top: headY - 60 * scale,
                transform: [{ rotate: rightEarRot }],
              },
            ]}
          >
            <Svg width={75 * scale} height={75 * scale} viewBox="0 0 75 75">
              <Defs>
                <LinearGradient id="foxEarR" x1="100%" y1="0%" x2="0%" y2="100%">
                  <Stop offset="0%" stopColor="#FB923C" />
                  <Stop offset="100%" stopColor="#EA580C" />
                </LinearGradient>
              </Defs>
              {/* Outer Orange Ear */}
              <Path d="M63 70 C65 40 43 10 33 6 C23 24 9 50 7 70 Z" fill="url(#foxEarR)" />
              {/* Black Ear Tip */}
              <Path d="M41 18 C37 10 33 6 33 6 C33 6 27 12 23 22 Z" fill="#1C1917" />
              {/* Fluffy White Inner Ear Fur */}
              <Path d="M53 68 C51 48 41 24 35 20 C31 32 21 50 19 68 Z" fill="#FFF7ED" />
              <Path d="M53 64 C45 52 37 56 29 64" stroke="#FED7AA" strokeWidth={2} strokeLinecap="round" />
            </Svg>
          </Animated.View>

          {/* Fox Whiskers & Sleek Button Nose */}
          <View
            style={[
              styles.part,
              { left: cx - 40 * scale, top: noseY - 14 * scale },
            ]}
          >
            <Svg width={80 * scale} height={45 * scale} viewBox="0 0 80 45">
              {/* Soft Amber Muzzle Highlight */}
              <Ellipse cx="40" cy="24" rx="35" ry="16" fill="#FFEDD5" opacity={0.88} />
              {/* Whisker Dots */}
              <Circle cx="20" cy="24" r="2" fill="#7C2D12" />
              <Circle cx="25" cy="29" r="2" fill="#7C2D12" />
              <Circle cx="60" cy="24" r="2" fill="#7C2D12" />
              <Circle cx="55" cy="29" r="2" fill="#7C2D12" />
              {/* Sleek Black Nose */}
              <Path d="M30 14 Q40 8 50 14 Q54 26 40 28 Q26 26 30 14 Z" fill="#1C1917" />
              <Ellipse cx="36" cy="14" rx="4" ry="2" fill="#FFFFFF" opacity={0.7} />
            </Svg>
          </View>
        </View>
      )}

      {/* =========================================================================
          15. 🐼 PANDA
          ========================================================================= */}
      {effectId === 'panda' && (
        <View style={[StyleSheet.absoluteFill, { opacity: effAlpha }]}>
          {/* Big Round Fluffy Black Ears */}
          <View
            style={[
              styles.part,
              { left: cx - 110 * scale, top: headY - 55 * scale },
            ]}
          >
            <Svg width={220 * scale} height={70 * scale} viewBox="0 0 220 70">
              <Defs>
                <RadialGradient id="pandaEarL" cx="50%" cy="50%" rx="50%" ry="50%">
                  <Stop offset="0%" stopColor="#374151" />
                  <Stop offset="100%" stopColor="#111827" />
                </RadialGradient>
                <RadialGradient id="pandaEarR" cx="50%" cy="50%" rx="50%" ry="50%">
                  <Stop offset="0%" stopColor="#374151" />
                  <Stop offset="100%" stopColor="#111827" />
                </RadialGradient>
              </Defs>
              <Circle cx="35" cy="35" r="30" fill="url(#pandaEarL)" />
              <Circle cx="185" cy="35" r="30" fill="url(#pandaEarR)" />
            </Svg>
          </View>

          {/* Cute Black Panda Eye Patches with Eye Glints */}
          <View
            style={[
              styles.part,
              { left: cx - 95 * scale, top: eyeY - 22 * scale },
            ]}
          >
            <Svg width={190 * scale} height={55 * scale} viewBox="0 0 190 55">
              <Ellipse cx="40" cy="28" rx="26" ry="20" fill="#1F2937" opacity={0.88} transform="rotate(-12 40 28)" />
              <Circle cx="44" cy="24" r="5.5" fill="#FFFFFF" />
              <Circle cx="48" cy="20" r="2.5" fill="#FFFFFF" />
              <Ellipse cx="150" cy="28" rx="26" ry="20" fill="#1F2937" opacity={0.88} transform="rotate(12 150 28)" />
              <Circle cx="146" cy="24" r="5.5" fill="#FFFFFF" />
              <Circle cx="142" cy="20" r="2.5" fill="#FFFFFF" />
            </Svg>
          </View>

          {/* Soft White Muzzle & Rounded Black Panda Nose */}
          <View
            style={[
              styles.part,
              { left: cx - 40 * scale, top: noseY - 14 * scale },
            ]}
          >
            <Svg width={80 * scale} height={45 * scale} viewBox="0 0 80 45">
              <Ellipse cx="40" cy="24" rx="36" ry="18" fill="#F8FAFC" opacity={0.92} />
              <Ellipse cx="40" cy="18" rx="14" ry="10" fill="#1F2937" />
              <Ellipse cx="37" cy="15" rx="4" ry="2" fill="#FFFFFF" opacity={0.7} />
              <Line x1="40" y1="28" x2="40" y2="38" stroke="#1F2937" strokeWidth={2.5} strokeLinecap="round" />
            </Svg>
          </View>

          {/* Green Bamboo Stalk with Leaves Peeking From Mouth */}
          <View
            style={[
              styles.part,
              { left: cx + 18 * scale, top: mouthY - 10 * scale },
            ]}
          >
            <Svg width={60 * scale} height={45 * scale} viewBox="0 0 60 45">
              {/* Bamboo Stem */}
              <Path d="M8 35 L48 10" stroke="#16A34A" strokeWidth={5} strokeLinecap="round" />
              <Circle cx="28" cy="22" r="3" fill="#15803D" />
              {/* Bamboo Leaf 1 */}
              <Path d="M45 12 Q58 6 52 18 Q45 16 45 12 Z" fill="#22C55E" />
              {/* Bamboo Leaf 2 */}
              <Path d="M48 10 Q54 -2 40 4 Q44 8 48 10 Z" fill="#16A34A" />
            </Svg>
          </View>
        </View>
      )}

      {/* =========================================================================
          16. 🥳 BIRTHDAY PARTY
          ========================================================================= */}
      {(effectId === 'birthday' || effectId === 'party' || effectId === 'confetti') && (
        <View style={[StyleSheet.absoluteFill, { opacity: effAlpha }]}>
          <View
            style={[
              styles.part,
              { left: cx - 45 * scale, top: headY - 110 * scale },
            ]}
          >
            <Svg width={90 * scale} height={110 * scale} viewBox="0 0 90 110">
              {/* Party Hat Cone */}
              <Polygon points="45,18 10,95 80,95" fill="#EC4899" />
              <Polygon points="45,18 30,55 60,55" fill="#FBBF24" />
              <Polygon points="22,75 68,75 60,88 30,88" fill="#00D2FF" />
              <Circle cx="45" cy="16" r="8" fill="#FDE047" />
            </Svg>
          </View>
          {/* Confetti Falling */}
          <Animated.View
            style={[
              styles.part,
              {
                left: cx - 100 * scale,
                top: headY - 40 * scale,
                opacity: floatFade,
                transform: [{ translateY: floatTransY }],
              },
            ]}
          >
            <Svg width={200 * scale} height={90 * scale} viewBox="0 0 200 90">
              <Rect x="20" y="30" width="8" height="16" fill="#22C55E" transform="rotate(30 20 30)" />
              <Rect x="170" y="25" width="8" height="16" fill="#F59E0B" transform="rotate(-40 170 25)" />
              <Circle cx="45" cy="70" r="5" fill="#EC4899" />
              <Circle cx="155" cy="65" r="5" fill="#00D2FF" />
            </Svg>
          </Animated.View>
        </View>
      )}

      {/* =========================================================================
          17. 🤖 ROBOT FACE / CYBORG
          ========================================================================= */}
      {effectId === 'robot-face' && (
        <View style={[StyleSheet.absoluteFill, { opacity: effAlpha }]}>
          <View
            style={[
              styles.part,
              { left: cx + 5 * scale, top: eyeY - 35 * scale },
            ]}
          >
            <Svg width={100 * scale} height={90 * scale} viewBox="0 0 100 90">
              {/* Metallic Plate */}
              <Polygon points="10,15 80,10 75,80 15,70" fill="#334155" opacity={0.75} stroke="#00F0FF" strokeWidth={2} />
              {/* Glowing Red Cyborg Eye */}
              <Circle cx="45" cy="40" r="14" fill="#1E293B" stroke="#EF4444" strokeWidth={3} />
              <Circle cx="45" cy="40" r="6" fill="#EF4444" />
              <Line x1="20" y1="60" x2="65" y2="60" stroke="#00F0FF" strokeWidth={2} />
            </Svg>
          </View>
        </View>
      )}

      {/* =========================================================================
          18. 🌌 GALAXY FACE
          ========================================================================= */}
      {effectId === 'galaxy-face' && (
        <View style={[StyleSheet.absoluteFill, { opacity: effAlpha }]}>
          <View
            style={[
              styles.part,
              { left: cx - 100 * scale, top: headY - 45 * scale },
            ]}
          >
            <Svg width={200 * scale} height={80 * scale} viewBox="0 0 200 80">
              {/* Cosmic Stardust Wash */}
              <Ellipse cx="100" cy="40" rx="90" ry="32" fill="#7C3AED" opacity={0.35} />
              {/* Golden Crescent Moon Forehead Ornament */}
              <Path
                d="M100 15 C108 15 114 21 114 29 C114 37 108 43 100 43 C98 43 96 42 94 41 C100 37 102 29 98 23 C96 19 100 15 100 15 Z"
                fill="#FDE047"
              />
              <Circle cx="45" cy="30" r="3" fill="#FFFFFF" />
              <Circle cx="155" cy="28" r="3" fill="#FFFFFF" />
              <Circle cx="70" cy="55" r="2" fill="#FFFFFF" />
              <Circle cx="130" cy="55" r="2" fill="#FFFFFF" />
            </Svg>
          </View>
        </View>
      )}

      {/* =========================================================================
          19. ✨ BEAUTY PRESETS (NOTICEABLE, DISTINCT BEAUTY TRANSFORMATION)
          ========================================================================= */}
      {/* A. Rosy Cheeks */}
      {(effectId === 'rosy-cheeks' || effectId === 'soft-makeup' || effectId === 'yaro-beauty') && (
        <View
          style={[
            styles.part,
            { left: cx - 95 * scale, top: eyeY + 22 * scale, opacity: effAlpha },
          ]}
        >
          <Svg width={190 * scale} height={45 * scale} viewBox="0 0 190 45">
            <Defs>
              <RadialGradient id="blushL" cx="50%" cy="50%" rx="50%" ry="50%">
                <Stop offset="0%" stopColor="#FF4B72" stopOpacity={0.7} />
                <Stop offset="70%" stopColor="#FF4B72" stopOpacity={0.25} />
                <Stop offset="100%" stopColor="#FF4B72" stopOpacity={0} />
              </RadialGradient>
              <RadialGradient id="blushR" cx="50%" cy="50%" rx="50%" ry="50%">
                <Stop offset="0%" stopColor="#FF4B72" stopOpacity={0.7} />
                <Stop offset="70%" stopColor="#FF4B72" stopOpacity={0.25} />
                <Stop offset="100%" stopColor="#FF4B72" stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Ellipse cx="30" cy="22" rx="28" ry="18" fill="url(#blushL)" />
            <Ellipse cx="160" cy="22" rx="28" ry="18" fill="url(#blushR)" />
          </Svg>
        </View>
      )}

      {/* B. Lip Tint */}
      {(effectId === 'lip-tint' || effectId === 'soft-makeup' || effectId === 'yaro-beauty') && (
        <View
          style={[
            styles.part,
            { left: cx - 35 * scale, top: mouthY - 14 * scale, opacity: effAlpha * 0.85 },
          ]}
        >
          <Svg width={70 * scale} height={35 * scale} viewBox="0 0 70 35">
            {/* Soft tinted lips */}
            <Path
              d="M10 16 Q25 8 35 12 Q45 8 60 16 Q45 28 35 28 Q25 28 10 16 Z"
              fill="rgba(225, 29, 72, 0.45)"
            />
            {/* Lip Gloss Highlight */}
            <Ellipse cx="33" cy="14" rx="6" ry="2" fill="#FFFFFF" opacity={0.6} />
            <Ellipse cx="35" cy="23" rx="10" ry="2.5" fill="#FFFFFF" opacity={0.4} />
          </Svg>
        </View>
      )}

      {/* C. Soft Makeup: Eyeliner Flicks */}
      {(effectId === 'soft-makeup' || effectId === 'yaro-beauty') && (
        <View
          style={[
            styles.part,
            { left: cx - 95 * scale, top: eyeY - 8 * scale, opacity: effAlpha },
          ]}
        >
          <Svg width={190 * scale} height={25 * scale} viewBox="0 0 190 25">
            <Path d="M42 16 Q22 10 12 4" fill="none" stroke="#111827" strokeWidth={2.8} strokeLinecap="round" />
            <Path d="M148 16 Q168 10 178 4" fill="none" stroke="#111827" strokeWidth={2.8} strokeLinecap="round" />
          </Svg>
        </View>
      )}

      {/* D. Bright Eyes: Star Accents in Eye Corners */}
      {(effectId === 'bright-eyes' || effectId === 'yaro-beauty') && (
        <Animated.View
          style={[
            styles.part,
            {
              left: cx - 75 * scale,
              top: eyeY - 12 * scale,
              opacity: effAlpha,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <Svg width={150 * scale} height={30 * scale} viewBox="0 0 150 30">
            {/* Sparkles on eye corners */}
            <Path d="M20 15 L22 10 L27 15 L22 20 Z" fill="#FDE047" />
            <Circle cx="22" cy="15" r="1.5" fill="#FFFFFF" />
            <Path d="M130 15 L128 10 L123 15 L128 20 Z" fill="#FDE047" />
            <Circle cx="128" cy="15" r="1.5" fill="#FFFFFF" />
          </Svg>
        </Animated.View>
      )}

      {/* E. Pink Glow: Luminescent Aura */}
      {effectId === 'pink-glow' && (
        <View style={[StyleSheet.absoluteFill, { opacity: effAlpha * 0.45 }]}>
          <Svg width="100%" height="100%">
            <Defs>
              <RadialGradient id="pinkGlowGrad" cx="50%" cy="50%" rx="50%" ry="50%">
                <Stop offset="0%" stopColor="#FF6584" stopOpacity={0.35} />
                <Stop offset="60%" stopColor="#FDA4AF" stopOpacity={0.15} />
                <Stop offset="100%" stopColor="#FDA4AF" stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#pinkGlowGrad)" />
          </Svg>
        </View>
      )}

      {/* F. Golden Shine: Warm Golden Radiance */}
      {effectId === 'golden-shine' && (
        <View style={[StyleSheet.absoluteFill, { opacity: effAlpha * 0.4 }]}>
          <Svg width="100%" height="100%">
            <Defs>
              <RadialGradient id="goldGlowGrad" cx="50%" cy="45%" rx="55%" ry="55%">
                <Stop offset="0%" stopColor="#F59E0B" stopOpacity={0.35} />
                <Stop offset="65%" stopColor="#FEF08A" stopOpacity={0.15} />
                <Stop offset="100%" stopColor="#FEF08A" stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#goldGlowGrad)" />
          </Svg>
        </View>
      )}

      {/* G. Smooth Skin / Natural Skin Soft-Focus Veil */}
      {(effectId === 'smooth-skin' || effectId === 'natural-skin') && (
        <View style={[StyleSheet.absoluteFill, { opacity: effAlpha * 0.22 }]}>
          <Svg width="100%" height="100%">
            <Defs>
              <RadialGradient id="smoothGrad" cx="50%" cy="50%" rx="45%" ry="45%">
                <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.35} />
                <Stop offset="60%" stopColor="#FED7AA" stopOpacity={0.15} />
                <Stop offset="100%" stopColor="#FED7AA" stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#smoothGrad)" />
          </Svg>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: 10,
  },
  part: {
    position: 'absolute',
  },
});
