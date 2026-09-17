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

const AppWrapper = () => {
  const ui = useUI();

  useEffect(() => {
    setAlertRef(ui);
  }, [ui]);

  useEffect(() => {
    requestUserPermission();
    const unsubscribe = NotificationListen();
    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  return (
    <View style={styles.appRoot}>
      <NavigationContainer ref={navigationRef} theme={AppTheme}>
        <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
        <AppNavigator />
      </NavigationContainer>
    </View>
  );
};

import { CallProvider } from "./src/context/CallContext";
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <UIProvider>
          <CallProvider>
            <AppWrapper />
          </CallProvider>
        </UIProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  appRoot: { flex: 1, backgroundColor: '#FFFFFF' },
});
