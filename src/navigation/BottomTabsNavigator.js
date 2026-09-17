import React, { useRef, useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Animated,
} from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import Svg, { Path } from "react-native-svg";
import { TabActions } from "@react-navigation/native";

import Home from "../screens/user/Home";
import OneToOne from "../screens/user/OneToOne";
import Party from "../screens/user/Party";
import ChatListScreen from "../screens/chats/chatList";
import Profile from "../screens/user/Profile";
import { AuthContext } from "../context/AuthProvider";
import { apiUtil } from "../utils/apiUtil";
import { getSocket } from "../sockets";

import {
  TAB_BAR_HORIZONTAL_MARGIN,
  getTabBarBottomMargin,
} from "../utils/safeAreaUtils";

const Tab = createBottomTabNavigator();

const BAR_HEIGHT = 64;
const CORNER_RADIUS = 26;
const CIRCLE_SIZE = 48;
const NOTCH_RADIUS = 32;
const NOTCH_DEPTH = 22;

const TAB_CONFIG = {
  Home: {
    label: "Home",
    activeIcon: "home",
    inactiveIcon: "home-outline",
  },
  OneToOne: {
    label: "1 to 1",
    activeIcon: "call",
    inactiveIcon: "call-outline",
  },
  Party: {
    label: "Party",
    activeIcon: "people",
    inactiveIcon: "people-outline",
  },
  ChatScreen: {
    label: "Message",
    activeIcon: "chatbubbles",
    inactiveIcon: "chatbubble-ellipses-outline",
  },
  Profile: {
    label: "Profile",
    activeIcon: "person",
    inactiveIcon: "person-outline",
  },
};

const getCurvedNotchPath = (barWidth, barHeight, cx) => {
  const r = CORNER_RADIUS;
  const nr = NOTCH_RADIUS;
  const nd = NOTCH_DEPTH;

  // Clamped notch points to prevent overlapping corner radius arcs
  const x1 = Math.max(r + 2, cx - nr);
  const x2 = Math.min(barWidth - r - 2, cx + nr);

  let p = `M 0 ${r} `;
  p += `A ${r} ${r} 0 0 1 ${r} 0 `;

  if (x1 > r) {
    p += `L ${x1} 0 `;
  }

  // Smooth scoop down and up using cubic beziers
  const cpOffset = (x2 - x1) * 0.28;
  p += `C ${x1 + cpOffset} 0, ${cx - cpOffset} ${nd}, ${cx} ${nd} `;
  p += `C ${cx + cpOffset} ${nd}, ${x2 - cpOffset} 0, ${x2} 0 `;

  if (x2 < barWidth - r) {
    p += `L ${barWidth - r} 0 `;
  }

  p += `A ${r} ${r} 0 0 1 ${barWidth} ${r} `;
  p += `L ${barWidth} ${barHeight - r} `;
  p += `A ${r} ${r} 0 0 1 ${barWidth - r} ${barHeight} `;
  p += `L ${r} ${barHeight} `;
  p += `A ${r} ${r} 0 0 1 0 ${barHeight - r} `;
  p += `Z`;

  return p;
};

const CustomTabBar = ({ state, descriptors, navigation, totalUnread }) => {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();

  const tabCount = state.routes.length || 5;
  const barWidth = Math.max(280, windowWidth - (TAB_BAR_HORIZONTAL_MARGIN * 2));
  const tabWidth = barWidth / tabCount;
  const bottomInset = getTabBarBottomMargin(insets.bottom);

  // Animated sliding value for the floating elevated circle
  const slideAnim = useRef(new Animated.Value(state.index * tabWidth)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: state.index * tabWidth,
      useNativeDriver: true,
      tension: 68,
      friction: 10,
    }).start();
  }, [slideAnim, state.index, tabWidth]);

  const handleTabPress = (route, isFocused) => {
    const event = navigation.emit({
      type: "tabPress",
      target: route.key,
      canPreventDefault: true,
    });

    if (!event.defaultPrevented) {
      navigation.dispatch(TabActions.jumpTo(route.name, route.params));
    }
  };

  // Center of active tab for the scoop notch
  const activeCx = (state.index + 0.5) * tabWidth;
  const svgPath = getCurvedNotchPath(barWidth, BAR_HEIGHT, activeCx);

  const activeRoute = state.routes[state.index];
  const activeConfig = activeRoute ? TAB_CONFIG[activeRoute.name] : null;

  return (
    <View
      style={[
        styles.outerContainer,
        {
          bottom: bottomInset,
          width: barWidth,
          left: (windowWidth - barWidth) / 2,
        },
      ]}
      pointerEvents="box-none"
    >
      {/* Background SVG shape with dynamic scooped notch following the active tab */}
      <View style={styles.svgBackgroundWrapper}>
        <Svg width={barWidth} height={BAR_HEIGHT}>
          <Path
            d={svgPath}
            fill="#FFFFFF"
            stroke="#E2E8F0"
            strokeWidth={1.2}
          />
        </Svg>
      </View>

      {/* Floating Elevated Circle that rises UP for the clicked/active tab */}
      <Animated.View
        style={[
          styles.floatingCircleWrapper,
          {
            left: (tabWidth - CIRCLE_SIZE) / 2,
            transform: [{ translateX: slideAnim }],
          },
        ]}
        pointerEvents="none"
      >
        <LinearGradient
          colors={["#8B5CF6", "#7C3AED"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.floatingCircle}
        >
          {activeConfig && (
            <Icon
              name={activeConfig.activeIcon}
              size={24}
              color="#FFFFFF"
            />
          )}
          {activeRoute?.name === "ChatScreen" && totalUnread > 0 && (
            <View style={styles.floatingBadge}>
              <Text style={styles.badgeText}>
                {totalUnread > 99 ? "99+" : totalUnread}
              </Text>
            </View>
          )}
        </LinearGradient>
      </Animated.View>

      {/* 5 Tab Items */}
      <View style={styles.tabsRow}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const options = descriptors[route.key].options;
          const config = TAB_CONFIG[route.name] || {
            label: route.name,
            activeIcon: "ellipse",
            inactiveIcon: "ellipse-outline",
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel || config.label}
              testID={options.tabBarTestID}
              style={[styles.tabItem, { width: tabWidth }]}
              onPress={() => handleTabPress(route, isFocused)}
              activeOpacity={0.7}
            >
              {isFocused ? (
                // Focused tab: icon is in floating circle above, label sits right below the notch
                <View style={styles.focusedTabContent}>
                  <Text style={styles.tabLabelActive} numberOfLines={1}>
                    {config.label}
                  </Text>
                </View>
              ) : (
                // Inactive tab: only icon is visible (no text), vertically centered
                <View style={styles.inactiveTabContent}>
                  <Icon
                    name={config.inactiveIcon}
                    size={24}
                    color="#64748B"
                  />
                  {route.name === "ChatScreen" && totalUnread > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {totalUnread > 99 ? "99+" : totalUnread}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default function BottomTabsNavigator() {
  const { user } = useContext(AuthContext);
  const [totalUnread, setTotalUnread] = useState(0);

  const fetchUnread = async () => {
    try {
      const res = await apiUtil.get("/chat/conversations");
      const convs = res.data?.data?.conversations || [];
      const total = convs.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
      setTotalUnread(total);
    } catch (err) {
      // silently fail
    }
  };

  useEffect(() => {
    if (user) fetchUnread();
  }, [user]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !user) return;

    const handleNewMessage = ({ message }) => {
      const msg = message._doc || message;
      if (msg.sender !== user._id) {
        setTotalUnread((prev) => prev + 1);
      }
    };

    socket.on("newMessageNotification", handleNewMessage);
    return () => {
      socket.off("newMessageNotification", handleNewMessage);
    };
  }, [user]);

  const onTabStateChange = () => {
    if (user) fetchUnread();
  };

  return (
    <Tab.Navigator
      detachInactiveScreens={false}
      screenOptions={{
        freezeOnBlur: false,
        animation: "none",
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "transparent",
          borderTopWidth: 0,
          elevation: 0,
        },
      }}
      tabBar={(props) => <CustomTabBar {...props} totalUnread={totalUnread} />}
      screenListeners={{
        focus: () => onTabStateChange(),
      }}
    >
      <Tab.Screen name="Home" component={Home} />
      <Tab.Screen name="OneToOne" component={OneToOne} />
      <Tab.Screen name="Party" component={Party} />
      <Tab.Screen name="ChatScreen" component={ChatListScreen} />
      <Tab.Screen name="Profile" component={Profile} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    position: "absolute",
    height: BAR_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
  svgBackgroundWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 10,
  },
  floatingCircleWrapper: {
    position: "absolute",
    top: -15,
    zIndex: 10,
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
  },
  floatingCircle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },
  tabsRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    height: BAR_HEIGHT,
    zIndex: 2,
  },
  tabItem: {
    height: BAR_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  focusedTabContent: {
    height: BAR_HEIGHT,
    width: "100%",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 7,
  },
  inactiveTabContent: {
    height: BAR_HEIGHT,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  tabLabelActive: {
    fontSize: 10.5,
    color: "#7C3AED",
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.1,
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  floatingBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 8.5,
    fontWeight: "800",
  },
});
