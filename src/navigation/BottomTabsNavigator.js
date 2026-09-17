import React, { useRef, useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import Svg, { Path } from "react-native-svg";
import { TabActions } from "@react-navigation/native";

import Home from "../screens/user/Home";
import Party from "../screens/user/Party";
import ChatListScreen from "../screens/chats/chatList";
import Profile from "../screens/user/Profile";
import Setting from "../screens/user/Setting";
import { AuthContext } from "../context/AuthProvider";
import { apiUtil } from "../utils/apiUtil";
import { getSocket } from "../sockets";

import {
  TAB_BAR_HEIGHT,
  TAB_BAR_HORIZONTAL_MARGIN,
  getTabBarBottomMargin,
} from "../utils/safeAreaUtils";

const Tab = createBottomTabNavigator();

const BAR_HEIGHT = 64;
const CORNER_RADIUS = 28;
const NOTCH_RADIUS = 40; // half-width of the notch opening
const NOTCH_DEPTH = 24;  // depth of the center scoop

const CustomTabBar = ({ state, descriptors, navigation, totalUnread }) => {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();

  // Width of the floating bar
  const barWidth = Math.max(280, windowWidth - (TAB_BAR_HORIZONTAL_MARGIN * 2));
  const cx = barWidth / 2;

  // Generate smooth SVG path for the scooped notched floating bar
  const svgPath = `
    M ${CORNER_RADIUS} 0
    L ${cx - NOTCH_RADIUS} 0
    C ${cx - NOTCH_RADIUS + 14} 0, ${cx - 18} ${NOTCH_DEPTH}, ${cx} ${NOTCH_DEPTH}
    C ${cx + 18} ${NOTCH_DEPTH}, ${cx + NOTCH_RADIUS - 14} 0, ${cx + NOTCH_RADIUS} 0
    L ${barWidth - CORNER_RADIUS} 0
    A ${CORNER_RADIUS} ${CORNER_RADIUS} 0 0 1 ${barWidth} ${CORNER_RADIUS}
    L ${barWidth} ${BAR_HEIGHT - CORNER_RADIUS}
    A ${CORNER_RADIUS} ${CORNER_RADIUS} 0 0 1 ${barWidth - CORNER_RADIUS} ${BAR_HEIGHT}
    L ${CORNER_RADIUS} ${BAR_HEIGHT}
    A ${CORNER_RADIUS} ${CORNER_RADIUS} 0 0 1 0 ${BAR_HEIGHT - CORNER_RADIUS}
    L 0 ${CORNER_RADIUS}
    A ${CORNER_RADIUS} ${CORNER_RADIUS} 0 0 1 ${CORNER_RADIUS} 0
    Z
  `;

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

  const bottomInset = getTabBarBottomMargin(insets.bottom);

  // Group routes: Left 2 routes (Home, ChatScreen), Center (Party), Right 2 routes (Profile, Setting)
  const leftRoutes = state.routes.slice(0, 2);
  const centerRoute = state.routes[2];
  const rightRoutes = state.routes.slice(3, 5);

  const isCenterFocused = state.index === 2;

  const renderTabItem = (route, routeIndex) => {
    const isFocused = state.index === routeIndex;
    const options = descriptors[route.key].options;

    let iconName = "ellipse-outline";
    if (route.name === "Home") {
      iconName = isFocused ? "call" : "call-outline";
    } else if (route.name === "ChatScreen") {
      iconName = isFocused ? "chatbubbles" : "chatbubble-ellipses-outline";
    } else if (route.name === "Profile") {
      iconName = isFocused ? "person" : "person-outline";
    } else if (route.name === "Setting") {
      iconName = isFocused ? "settings" : "settings-outline";
    }

    const activeColor = "#7C3AED";
    const inactiveColor = "#374151";

    return (
      <TouchableOpacity
        key={route.key}
        accessibilityRole="button"
        accessibilityState={isFocused ? { selected: true } : {}}
        accessibilityLabel={options.tabBarAccessibilityLabel || route.name}
        testID={options.tabBarTestID}
        style={styles.tabItem}
        onPress={() => handleTabPress(route, isFocused)}
        activeOpacity={0.7}
      >
        <View style={styles.iconWrapper}>
          <Icon
            name={iconName}
            size={23}
            color={isFocused ? activeColor : inactiveColor}
          />
          {route.name === "ChatScreen" && totalUnread > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {totalUnread > 99 ? "99+" : totalUnread}
              </Text>
            </View>
          )}
        </View>

        {/* Active tab horizontal dash indicator */}
        <View
          style={[
            styles.activeIndicator,
            { opacity: isFocused ? 1 : 0 }
          ]}
        />
      </TouchableOpacity>
    );
  };

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
      {/* Background SVG shape with curved cutout notch and shadow */}
      <View style={styles.svgBackgroundWrapper}>
        <Svg width={barWidth} height={BAR_HEIGHT}>
          <Path
            d={svgPath}
            fill="#FFFFFF"
            stroke="#F1F5F9"
            strokeWidth={1.2}
          />
        </Svg>
      </View>

      {/* Floating Center Purple Circle Action Button (+) */}
      {centerRoute && (
        <TouchableOpacity
          style={styles.centerButtonContainer}
          onPress={() => handleTabPress(centerRoute, isCenterFocused)}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Party Room Action"
        >
          <LinearGradient
            colors={["#8B5CF6", "#7C3AED"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.centerButton,
              isCenterFocused && styles.centerButtonActive,
            ]}
          >
            <Icon name="add" size={28} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Content Row: Left 2 Tabs | Center Gap | Right 2 Tabs */}
      <View style={styles.tabsRow}>
        {/* Left Tabs (Call, Chat) */}
        <View style={styles.tabGroup}>
          {leftRoutes.map((route, idx) => renderTabItem(route, idx))}
        </View>

        {/* Center Gap for Notch and Floating Button */}
        <View style={styles.centerGap} pointerEvents="none" />

        {/* Right Tabs (Profile, Settings) */}
        <View style={styles.tabGroup}>
          {rightRoutes.map((route, idx) => renderTabItem(route, idx + 3))}
        </View>
      </View>
    </View>
  );
};

export default function BottomTabsNavigator() {
  const { user } = useContext(AuthContext);
  const [totalUnread, setTotalUnread] = useState(0);

  // Helper to fetch total unread messages from API
  const fetchUnread = async () => {
    try {
      const res = await apiUtil.get("/chat/conversations");
      const convs = res.data?.data?.conversations || [];
      const total = convs.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
      setTotalUnread(total);
    } catch (err) {
      // silently ignore network errors
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
      <Tab.Screen name="ChatScreen" component={ChatListScreen} />
      <Tab.Screen name="Party" component={Party} />
      <Tab.Screen name="Profile" component={Profile} />
      <Tab.Screen name="Setting" component={Setting} />
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
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 10,
  },
  tabsRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    height: BAR_HEIGHT,
    zIndex: 2,
  },
  tabGroup: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    height: BAR_HEIGHT,
  },
  centerGap: {
    width: 76,
    height: BAR_HEIGHT,
  },
  tabItem: {
    flex: 1,
    height: BAR_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 4,
  },
  iconWrapper: {
    alignItems: "center",
    justifyContent: "center",
    width: 32,
    height: 32,
  },
  activeIndicator: {
    width: 14,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#7C3AED",
    marginTop: 4,
  },
  centerButtonContainer: {
    position: "absolute",
    top: -15,
    zIndex: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  centerButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },
  centerButtonActive: {
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  badge: {
    position: "absolute",
    top: -3,
    right: -7,
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
    fontSize: 9,
    fontWeight: "700",
  },
});
