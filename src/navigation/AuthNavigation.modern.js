import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  ForgotPasswordScreen,
  OtpScreen,
  PasswordSuccessScreen,
  ProfileDetailsScreen,
  SetPasswordScreen,
  SignInScreen,
  SignUpScreen,
  WelcomeScreen,
} from '../screens/auth/ModernAuthFlow';

const Stack = createNativeStackNavigator();

export default function AuthStack() {
  return (
    <Stack.Navigator initialRouteName="Welcome" screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="SignIn" component={SignInScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="VerifyOTP" component={OtpScreen} />
      <Stack.Screen name="SetPassword" component={SetPasswordScreen} />
      <Stack.Screen name="PasswordSuccess" component={PasswordSuccessScreen} />
      <Stack.Screen name="ProfileDetails" component={ProfileDetailsScreen} />

      {/* Backward-compatible aliases for links from older app areas. */}
      <Stack.Screen name="AuthBubbleWelcome" component={WelcomeScreen} />
      <Stack.Screen name="UmangLoginScreen" component={SignInScreen} />
      <Stack.Screen name="MobileVerification" component={SignUpScreen} />
      <Stack.Screen name="OTPVerificationPhone" component={OtpScreen} />
      <Stack.Screen name="PasswordSetup" component={SetPasswordScreen} />
      <Stack.Screen name="AgeSelection" component={ProfileDetailsScreen} />
    </Stack.Navigator>
  );
}
