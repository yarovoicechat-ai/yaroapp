import React, { useEffect } from "react";
import { DefaultTheme, NavigationContainer } from "@react-navigation/native";
import AppNavigator from "./src/navigation/AppNavigator";
import { AuthProvider } from "./src/context/AuthProvider";
import { UIProvider, useUI } from "./src/context/UIProvider";
import { setAlertRef } from "./src/utils/AlertService";
import { NotificationListen, requestUserPermission } from "./src/utils/NotificationManager";

import { navigationRef } from "./src/utils/navigationRef";

import { StatusBar, StyleSheet, View } from "react-native";

const AppTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "#FFFFFF",
  },
};

import { setupDeepLinkListener, executePendingDeepLink } from "./src/utils/deepLinkHandler";

const linking = {
  prefixes: [
    'yaro://',
    'voiceclub://',
    'https://yaroapp.in',
    'http://yaroapp.in',
    'https://www.yaroapp.in',
    'http://www.yaroapp.in',
    'https://api.yaroapp.in',
    'http://api.yaroapp.in',
  ],
  config: {
    screens: {
      VoiceRoom: {
        path: 'room/:roomId',
      },
      UserProfile: {
        path: 'user/:userId',
      },
      HostProfile: {
        path: 'host/:hostId',
      },
      InviteEarn: {
        path: 'refer/:code',
      },
      MainTabs: '*',
    },
  },
};

const AppWrapper = () => {
  const ui = useUI();

  useEffect(() => {
    setAlertRef(ui);
  }, [ui]);

  useEffect(() => {
    requestUserPermission();
    const unsubscribeNotifications = NotificationListen();
    const unsubscribeDeepLink = setupDeepLinkListener();

    return () => {
      if (unsubscribeNotifications && typeof unsubscribeNotifications === 'function') {
        unsubscribeNotifications();
      }
      if (unsubscribeDeepLink && typeof unsubscribeDeepLink === 'function') {
        unsubscribeDeepLink();
      }
    };
  }, []);

  return (
    <View style={styles.appRoot}>
      <NavigationContainer
        ref={navigationRef}
        theme={AppTheme}
        linking={linking}
        onReady={() => {
          executePendingDeepLink();
        }}
      >
        <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
        <AppNavigator />
      </NavigationContainer>
    </View>
  );
};

import { CallProvider } from "./src/context/CallContext";
import { VoiceRoomProvider } from "./src/context/VoiceRoomContext";
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <UIProvider>
          <CallProvider>
            <VoiceRoomProvider>
              <AppWrapper />
            </VoiceRoomProvider>
          </CallProvider>
        </UIProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  appRoot: { flex: 1, backgroundColor: '#FFFFFF' },
});
