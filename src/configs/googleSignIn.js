import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { WEB_CLIENT_ID } from '@env';

export const YARO_FIREBASE_PROJECT_ID = 'yaro-voice-chat';
export const YARO_FIREBASE_PROJECT_NUMBER = '775252509237';

const configurationError = message => {
  const error = new Error(message);
  error.code = 'google-signin/configuration';
  return error;
};

export const getGoogleWebClientId = () => String(WEB_CLIENT_ID || '').trim();

export const configureGoogleSignIn = () => {
  const webClientId = getGoogleWebClientId();

  if (!webClientId) {
    throw configurationError(
      'Google Sign-In is not configured. Set WEB_CLIENT_ID to the Web OAuth client from Firebase project yaro-voice-chat (775252509237).',
    );
  }

  if (!webClientId.startsWith(`${YARO_FIREBASE_PROJECT_NUMBER}-`) || !webClientId.endsWith('.apps.googleusercontent.com')) {
    throw configurationError(
      'Google Sign-In project mismatch. WEB_CLIENT_ID must belong to Firebase project yaro-voice-chat (775252509237).',
    );
  }

  GoogleSignin.configure({ webClientId });
  return webClientId;
};

export const signInWithGoogleProvider = async () => {
  configureGoogleSignIn();
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const response = await GoogleSignin.signIn();
  const idToken = response?.idToken || response?.data?.idToken;

  if (!idToken) {
    throw new Error('Google Sign-In did not return a token.');
  }

  return idToken;
};
