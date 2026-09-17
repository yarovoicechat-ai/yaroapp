import React, { useContext, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
  Easing,
} from "react-native";
import { AuthContext } from "../context/AuthProvider";
import AuthStack from "./AuthNavigation";
import AppStack from "./AppStack";
import LinearGradient from "react-native-linear-gradient";

const AppLogo = require("../assets/app_icon.png");
const AuthWelcomeBackground = require("../assets/auth-welcome-collage.png");
const { width, height } = Dimensions.get("window");

const AnimatedSplash = ({ onFinish }) => {
  const scaleAnim = useRef(new Animated.Value(0.4)).current;
  const pulseGlow = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeOutAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Unique Spring Bounce Entrance for Logo (0.4 -> 1.05 -> 1.0)
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 35,
      useNativeDriver: true,
    }).start();

    // 2. Continuous Glowing Pulsing Breathing Loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseGlow, {
          toValue: 1.18,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseGlow, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 3. Floating Motion Loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -12,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 4. Continuous Rotation for Background Aura Ring
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 5000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // 5. 5-Second Progress Bar Fill Animation (0% to 100%)
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 1800,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();

    // 6. Smooth Fade Out after 4.7s -> calls onFinish at exactly 5.0 seconds
    const timer = setTimeout(() => {
      Animated.timing(fadeOutAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        if (onFinish) onFinish();
      });
    }, 1800);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <Animated.View style={[styles.splashContainer, { opacity: fadeOutAnim }]}>
      <StatusBar barStyle="light-content" transparent backgroundColor="transparent" translucent />

      {/* Deep Rich Gradient Background */}
      <Image source={AuthWelcomeBackground} style={StyleSheet.absoluteFillObject} resizeMode="cover" />

      {/* Animated Glowing Background Aura Ring */}
      <Animated.View
        style={[
          styles.glowAura,
          {
            transform: [
              { scale: pulseGlow },
              { rotate: spin },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={["rgba(192, 38, 211, 0.55)", "rgba(255, 45, 135, 0.30)", "rgba(124, 58, 237, 0.15)", "transparent"]}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      {/* Animated Floating Logo Section */}
      <Animated.View
        style={[
          styles.logoWrapper,
          {
            transform: [
              { scale: scaleAnim },
              { translateY: floatAnim },
            ],
          },
        ]}
      >
        {/* Neon Glow Box Shadow behind Logo */}
        <Animated.View
          style={[
            styles.logoGlowBackdrop,
            { transform: [{ scale: pulseGlow }] },
          ]}
        />

        {/* Official App Logo app_icon.png */}
        <Image source={AppLogo} style={styles.logoImage} resizeMode="contain" />
      </Animated.View>

      {/* Unique Progress Bar & Tagline Section at Bottom */}
      <View style={styles.loaderSection}>
        <Text style={styles.brandTitle}>Yaro</Text>
        <Text style={styles.taglineText}>Voice • Video • Live • Club</Text>

        {/* 5-Second Animated Progress Bar */}
      </View>
    </Animated.View>
  );
};

import { AppState } from "react-native";
import InAppUpdateService from "../services/InAppUpdateService";
import MandatoryUpdateScreen from "../components/MandatoryUpdateScreen";

export default function AppNavigator() {
  const { user, loading, isAuthenticated } = useContext(AuthContext);
  const [splashFinished, setSplashFinished] = useState(false);
  const [updateStatus, setUpdateStatus] = useState({
    checking: true,
    needsUpdate: false,
    updateInfo: null,
  });

  const checkAppUpdate = async () => {
    try {
      const result = await InAppUpdateService.checkUpdateStatus();
      setUpdateStatus({
        checking: false,
        needsUpdate: result.needsUpdate,
        updateInfo: result,
      });
    } catch (err) {
      console.log('[APP_NAVIGATOR] Update check error:', err);
      setUpdateStatus((prev) => ({ ...prev, checking: false }));
    }
  };

  useEffect(() => {
    checkAppUpdate();

    // Re-check update status when application returns to active foreground
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        checkAppUpdate();
      }
    });

    return () => {
      subscription.remove();
      InAppUpdateService.removeListeners();
    };
  }, []);

  // Splash screen will show while checking update or while splash animation completes
  if (loading || !splashFinished || updateStatus.checking) {
    return <AnimatedSplash onFinish={() => setSplashFinished(true)} />;
  }

  // MANDATORY UPDATE GATE: Block application completely if update is required
  if (updateStatus.needsUpdate) {
    return (
      <MandatoryUpdateScreen
        updateInfo={updateStatus.updateInfo}
        onUpdateCompleted={() => checkAppUpdate()}
      />
    );
  }

  return isAuthenticated ? <AppStack /> : <AuthStack />;
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#050212",
  },
  glowAura: {
    position: "absolute",
    width: width * 0.90,
    height: width * 0.90,
    borderRadius: (width * 0.90) / 2,
    overflow: "hidden",
    opacity: 0,
  },
  logoWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: height * 0.08,
  },
  logoGlowBackdrop: {
    position: "absolute",
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: "rgba(255, 255, 255, 0.72)",
    shadowColor: "#FF2D87",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.95,
    shadowRadius: 30,
    elevation: 25,
  },
  logoImage: {
    width: 180,
    height: 180,
    borderRadius: 40,
  },
  loaderSection: {
    alignItems: "center",
    position: "absolute",
    bottom: height * 0.08,
    width: "80%",
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#6D28D9",
    letterSpacing: 1.5,
    marginBottom: 6,
    textShadowColor: "rgba(192, 38, 211, 0.6)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  taglineText: {
    fontSize: 12.5,
    color: "#4C3A78",
    letterSpacing: 0.8,
    marginBottom: 20,
    textAlign: "center",
  },
  progressTrack: {
    width: "100%",
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 3,
  },
});
