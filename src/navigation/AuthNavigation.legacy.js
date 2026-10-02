import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import AuthBubbleWelcome from "../screens/auth/AuthBubbleWelcome";
import { SignInScreen as UmangLoginScreen } from "../screens/auth/ModernAuthFlow";
import CountrySelectionScreen from "../screens/auth/CountrySelection";
import MobileVerificationScreen from "../screens/auth/phoneAuth";
import PasswordSetupScreen from "../screens/auth/PasswordSetup";
import AgeSelection from "../screens/auth/AgeSelection";
import SelectLanguage from "../screens/auth/SelectLanguage";
import GenderSelection from "../screens/auth/GenderSelection";
import OTPVerificationPhoneAuth from "../screens/auth/MobileVerification";
import ForgotPasswordScreen from "../screens/auth/ForgotPassword";

const Stack = createNativeStackNavigator();

export default function AuthStack() {
  return (
    <Stack.Navigator initialRouteName="AuthBubbleWelcome" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AuthBubbleWelcome" component={AuthBubbleWelcome} />
      <Stack.Screen name="UmangLoginScreen" component={UmangLoginScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="CountrySelection" component={CountrySelectionScreen} />
      <Stack.Screen name="MobileVerification" component={MobileVerificationScreen} />
      <Stack.Screen name="OTPVerificationPhone" component={OTPVerificationPhoneAuth} />
      <Stack.Screen name="PasswordSetup" component={PasswordSetupScreen} />
      <Stack.Screen name="AgeSelection" component={AgeSelection} />
      <Stack.Screen name="SelectLanguage" component={SelectLanguage} />
      <Stack.Screen name="GenderSelection" component={GenderSelection} />
    </Stack.Navigator>
  );
}
