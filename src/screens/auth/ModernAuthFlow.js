import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import DeviceInfo from 'react-native-device-info';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../../context/AuthProvider';
import { AlertService } from '../../utils/AlertService';
import { apiPublic, getApiErrorMessage } from '../../utils/apiUtil';
import { auth } from '../../configs/firebaseConfig';
import {
  clearFirebasePhoneSession,
  confirmFirebasePhoneOtp,
  getPhoneAuthError,
  getOtpResendCooldown,
  isFirebaseUserForPhone,
  sendFirebasePhoneOtp,
  signOutFirebasePhoneUser,
} from '../../utils/firebasePhoneAuth';
import { trackCompletedRegistration } from '../../utils/metaEventsUtil';
import { AuthField, AuthHeader, AuthScreen, AUTH_COLORS, BackButton, Divider, GradientButton } from '../../components/AuthUI';
import MithiChatLogo from '../../components/MithiChatLogo';
import { signInWithGoogleProvider } from '../../configs/googleSignIn';

const GoogleLogo = require('../../assets/Login/google-icon.webp');
const WelcomeAvatars = [
  require('../../assets/girl.webp'),
  require('../../assets/avatars/male_default.webp'),
  require('../../assets/avatars/female_default.webp'),
  require('../../assets/avtar.webp'),
  require('../../assets/girl.webp'),
];
const DEFAULT_COUNTRY = { name: 'India', code: '+91', flag: '🇮🇳' };

const Eye = ({ shown, onPress }) => <TouchableOpacity onPress={onPress} style={s.eye}><Icon name={shown ? 'eye-outline' : 'eye-off-outline'} size={20} color="#7880A5" /></TouchableOpacity>;
const FooterLink = ({ text, action, onPress }) => <View style={s.footer}><Text style={s.footerText}>{text} </Text><TouchableOpacity onPress={onPress}><Text style={s.link}>{action}</Text></TouchableOpacity></View>;

async function googleAuth(navigation, login, setLoading) {
  let idToken;
  try {
    setLoading(true);
    idToken = await signInWithGoogleProvider();
    const deviceId = await DeviceInfo.getUniqueId();
    const res = await apiPublic.post('/auth/user-google-auth', { googleIdToken: idToken, deviceId, userFrom: 'app' });
    const { accessToken, refreshToken, role, isAccount, gender } = res.data.data || {};
    if (!res.data.success) throw new Error(res.data.message || 'Please try again.');
    if (isAccount) await login({ accessToken, refreshToken, role, gender, isRegister: false });
    else navigation.navigate('ProfileDetails', { idToken });
  } catch (error) {
    if (error.response?.status === 428 || error.response?.data?.statusCode === 428) navigation.navigate('ProfileDetails', { idToken });
    else AlertService.show('Login Error', getApiErrorMessage(error, error.message || 'Google login failed'), 'error');
  } finally { setLoading(false); }
}

export function WelcomeScreen() {
  const navigation = useNavigation();
  const { login } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  return (
    <AuthScreen contentStyle={s.welcomeContent} keyboard={false}>
      <TouchableOpacity style={s.skip} onPress={() => navigation.navigate('SignIn')}><Text style={s.link}>Skip</Text></TouchableOpacity>
      <View style={s.brand}><MithiChatLogo size={126} /><Text style={s.brandLine}>Voice • Video • Live • Club</Text><Text style={s.hero}>Join a fun and safe community{`\n`}where real people connect.</Text></View>
      <View style={s.community}>
        <View style={s.avatarRow}>{WelcomeAvatars.map((source, i) => <Image key={i} source={source} style={[s.avatar, i > 0 && s.avatarOverlap]} />)}</View>
        <View style={s.userBadge}><Text style={s.userBadgeText}>1M+ Happy Users</Text></View>
      </View>
      <View style={s.full}>
        <GradientButton title="Sign Up" onPress={() => navigation.navigate('SignUp')} style={s.zeroTop} />
        <TouchableOpacity style={s.outlineButton} onPress={() => navigation.navigate('SignIn')}><Text style={s.outlineText}>Sign In</Text></TouchableOpacity>
        <Divider />
        <TouchableOpacity style={s.socialButton} disabled={loading} onPress={() => googleAuth(navigation, login, setLoading)}>{loading ? <ActivityIndicator color={AUTH_COLORS.purple} /> : <><Image source={GoogleLogo} style={s.googleIcon} /><Text style={s.socialText}>Continue with Google</Text></>}</TouchableOpacity>
        {Platform.OS === 'ios' && <TouchableOpacity style={s.socialButton}><Icon name="logo-apple" size={23} color="#050505" /><Text style={s.socialText}>Continue with Apple</Text></TouchableOpacity>}
      </View>
      <Text style={[s.terms, s.termsFooter]}>By continuing, you agree to our{`\n`}<Text style={s.link}>Terms of Service</Text> and <Text style={s.link}>Privacy Policy</Text>.</Text>
    </AuthScreen>
  );
}

export function SignInScreen() {
  const navigation = useNavigation();
  const { login } = useContext(AuthContext);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const submit = async () => {
    if (phone.length < 10 || !password) return AlertService.show('Check details', 'Enter a valid mobile number and password.', 'error');
    try {
      setLoading(true);
      const deviceId = await DeviceInfo.getUniqueId();
      const res = await apiPublic.post('/auth/user-login', { phoneNumber: `+91${phone}`, password, deviceId, userFrom: 'app' });
      if (!res.data.success) throw new Error(res.data.message || 'Login failed.');
      const { accessToken, refreshToken, role, gender } = res.data.data;
      await login({ accessToken, refreshToken, role, gender, isRegister: false });
    } catch (error) { AlertService.show('Login Failed', getApiErrorMessage(error, error.message || 'Please try again.'), 'error'); }
    finally { setLoading(false); }
  };
  return (
    <AuthScreen contentStyle={s.formContent}>
      <BackButton onPress={() => navigation.goBack()} /><AuthHeader title="Sign In" subtitle="Welcome back! Glad to see you again." />
      <AuthField icon="phone-portrait-outline" label="Mobile Number" placeholder="98765 43210" value={phone} onChangeText={v => setPhone(v.replace(/\D/g, ''))} keyboardType="phone-pad" maxLength={10} />
      <AuthField icon="lock-closed-outline" label="Password" placeholder="Enter your password" value={password} onChangeText={setPassword} secureTextEntry={!show} right={<Eye shown={show} onPress={() => setShow(!show)} />} />
      <View style={s.optionRow}><TouchableOpacity style={s.checkRow} onPress={() => setRemember(!remember)}><View style={[s.checkbox, remember && s.checkboxOn]}>{remember && <Icon name="checkmark" size={13} color="#FFF" />}</View><Text style={s.smallText}>Remember me</Text></TouchableOpacity><TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}><Text style={s.link}>Forgot Password?</Text></TouchableOpacity></View>
      <GradientButton title="Sign In" onPress={submit} loading={loading} />
      <Divider />
      <TouchableOpacity style={s.roundSocial} disabled={googleLoading} onPress={() => googleAuth(navigation, login, setGoogleLoading)}>{googleLoading ? <ActivityIndicator color={AUTH_COLORS.purple} /> : <Image source={GoogleLogo} style={s.googleIcon} />}</TouchableOpacity>
      <FooterLink text="Don't have an account?" action="Sign Up" onPress={() => navigation.navigate('SignUp')} />
    </AuthScreen>
  );
}

export function SignUpScreen() {
  const navigation = useNavigation();
  const { login } = useContext(AuthContext);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const submit = async () => {
    if (!fullName.trim()) return AlertService.show('Name Required', 'Please enter your full name.', 'error');
    if (phone.length < 10) return AlertService.show('Invalid Number', 'Please enter a valid 10-digit mobile number.', 'error');
    if (password.length < 8) return AlertService.show('Password Required', 'Password must be at least 8 characters.', 'error');
    const phoneNumber = `+91${phone}`;
    try {
      setLoading(true);
      const deviceId = await DeviceInfo.getUniqueId();
      const res = await apiPublic.post('/auth/check-user-device', { phoneNumber, deviceId });
      if (res.data?.canRegister === false || res.data?.userExists) {
        AlertService.show('Already Registered', res.data.message || 'Please sign in instead.', 'error'); return;
      }
      const verificationId = await sendFirebasePhoneOtp(phoneNumber);
      navigation.navigate('VerifyOTP', { phoneNumber, fullName: fullName.trim(), password, isResetPassword: false, verificationId });
    } catch (error) {
      if (error.response?.status === 409) AlertService.show('Already Registered', error.response?.data?.message || 'Please sign in instead.', 'error');
      else {
        try { const verificationId = await sendFirebasePhoneOtp(phoneNumber); navigation.navigate('VerifyOTP', { phoneNumber, fullName: fullName.trim(), password, isResetPassword: false, verificationId }); }
        catch (otpError) { const info = getPhoneAuthError(otpError); AlertService.show(info.title, info.message, 'error'); }
      }
    } finally { setLoading(false); }
  };
  return (
    <AuthScreen contentStyle={s.formContent}>
      <BackButton onPress={() => navigation.goBack()} /><AuthHeader title="Sign Up" subtitle="Create your account and start your Yaro journey." />
      <AuthField icon="person-outline" label="Full Name" placeholder="Enter your name" value={fullName} onChangeText={setFullName} autoCapitalize="words" />
      <AuthField icon="phone-portrait-outline" label="Mobile Number" placeholder="98765 43210" value={phone} onChangeText={v => setPhone(v.replace(/\D/g, ''))} keyboardType="phone-pad" maxLength={10} />
      <AuthField icon="lock-closed-outline" label="Password" placeholder="Create a password" value={password} onChangeText={setPassword} secureTextEntry={!show} right={<Eye shown={show} onPress={() => setShow(!show)} />} />
      <GradientButton title="Next" onPress={submit} loading={loading} />
      <Divider />
      <View style={s.socialRow}>
        <TouchableOpacity style={s.roundSocial} disabled={googleLoading} onPress={() => googleAuth(navigation, login, setGoogleLoading)}>{googleLoading ? <ActivityIndicator color={AUTH_COLORS.purple} /> : <Image source={GoogleLogo} style={s.googleIcon} />}</TouchableOpacity>
        {Platform.OS === 'ios' && <TouchableOpacity style={s.roundSocial}><Icon name="logo-apple" size={23} color="#050505" /></TouchableOpacity>}
      </View>
      <FooterLink text="Already have an account?" action="Sign In" onPress={() => navigation.navigate('SignIn')} />
    </AuthScreen>
  );
}

export function OtpScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { phoneNumber, fullName, password, isResetPassword } = route.params || {};
  const [otp, setOtp] = useState(['','','','','','']);
  const [verificationId, setVerificationId] = useState(route.params?.verificationId || null);
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useState(60);
  const refs = useRef([]);
  const completed = useRef(false);
  const finish = useCallback(async user => {
    if (!user || completed.current) return;
    completed.current = true;
    try {
      const firebaseIdToken = await user.getIdToken(true);
      await signOutFirebasePhoneUser();
      if (isResetPassword) navigation.replace('SetPassword', { phoneNumber, isResetPassword, firebaseIdToken });
      else navigation.replace('ProfileDetails', { phoneNumber, fullName, password, firebaseIdToken });
    }
    catch (error) { completed.current = false; const info = getPhoneAuthError(error); AlertService.show(info.title, info.message, 'error'); }
  }, [fullName, isResetPassword, navigation, password, phoneNumber]);
  useEffect(() => { let mounted = true; getOtpResendCooldown(phoneNumber, 60).then(v => mounted && setSeconds(v > 0 ? v : 60)); return () => { mounted = false; }; }, [phoneNumber]);
  useEffect(() => auth.onAuthStateChanged(user => { if (isFirebaseUserForPhone(user, phoneNumber)) finish(user); }), [finish, phoneNumber]);
  useEffect(() => { if (seconds <= 0) return; const timer = setTimeout(() => setSeconds(v => v - 1), 1000); return () => clearTimeout(timer); }, [seconds]);
  const change = (value, index) => { const next = [...otp]; next[index] = value.replace(/\D/g, '').slice(-1); setOtp(next); if (next[index] && index < 5) refs.current[index + 1]?.focus(); };
  const verify = async () => {
    const code = otp.join(''); if (code.length !== 6) return AlertService.show('Invalid OTP', 'Enter the complete 6-digit code.', 'error');
    try { setLoading(true); const credential = await confirmFirebasePhoneOtp(verificationId, code); await finish(credential?.user || auth.currentUser); }
    catch (error) { const info = getPhoneAuthError(error); AlertService.show(info.title, info.message, 'error'); }
    finally { setLoading(false); }
  };
  const resend = async () => {
    if (seconds > 0 || loading) return;
    try { setLoading(true); clearFirebasePhoneSession(); const id = await sendFirebasePhoneOtp(phoneNumber, true); setVerificationId(id); setOtp(['','','','','','']); setSeconds(60); refs.current[0]?.focus(); }
    catch (error) { const info = getPhoneAuthError(error); AlertService.show(info.title, info.message, 'error'); }
    finally { setLoading(false); }
  };
  return (
    <AuthScreen contentStyle={s.formContent}>
      <BackButton onPress={() => navigation.goBack()} /><AuthHeader title="Verify OTP" subtitle={<>We have sent a 6-digit code to{`\n`}<Text style={s.phoneStrong}>{phoneNumber}</Text></>} />
      <View style={s.otpRow}>{otp.map((v, i) => <TextInput key={i} ref={r => refs.current[i] = r} style={[s.otpBox, v && s.otpBoxOn]} value={v} onChangeText={x => change(x, i)} onKeyPress={e => { if (e.nativeEvent.key === 'Backspace' && !v && i) refs.current[i - 1]?.focus(); }} keyboardType="number-pad" maxLength={1} textAlign="center" />)}</View>
      <View style={s.resendRow}><Text style={s.smallText}>Didn't receive code? </Text><TouchableOpacity onPress={resend} disabled={seconds > 0}><Text style={[s.link, seconds > 0 && s.muted]}>Resend {seconds > 0 ? `(00:${String(seconds).padStart(2,'0')})` : ''}</Text></TouchableOpacity></View>
      <GradientButton title="Verify" onPress={verify} loading={loading} style={s.otpButton} />
    </AuthScreen>
  );
}

export function ForgotPasswordScreen() {
  const navigation = useNavigation(); const [phone, setPhone] = useState(''); const [loading, setLoading] = useState(false);
  const submit = async () => {
    if (phone.length < 10) return AlertService.show('Invalid Phone Number', 'Please enter a valid 10-digit mobile number.', 'error');
    const phoneNumber = `+91${phone}`;
    try { setLoading(true); const res = await apiPublic.post('/auth/forgot-password', { phoneNumber }); if (!res.data?.success) throw new Error(res.data?.message); const verificationId = await sendFirebasePhoneOtp(phoneNumber); navigation.navigate('VerifyOTP', { phoneNumber, isResetPassword: true, verificationId }); }
    catch (error) { const info = error.response ? { title: 'Unable to continue', message: error.response?.data?.message || error.message } : getPhoneAuthError(error); AlertService.show(info.title, info.message, 'error'); }
    finally { setLoading(false); }
  };
  return <AuthScreen contentStyle={s.formContent}><BackButton onPress={() => navigation.goBack()} /><AuthHeader title="Forgot Password" subtitle="Enter your mobile number to receive an OTP to reset your password." /><AuthField icon="phone-portrait-outline" label="Mobile Number" placeholder="98765 43210" value={phone} onChangeText={v => setPhone(v.replace(/\D/g, ''))} keyboardType="phone-pad" maxLength={10} /><GradientButton title="Send OTP" onPress={submit} loading={loading} /><FooterLink text="Remember your password?" action="Sign In" onPress={() => navigation.navigate('SignIn')} /></AuthScreen>;
}

export function SetPasswordScreen() {
  const navigation = useNavigation(); const route = useRoute(); const { phoneNumber, firebaseIdToken, isResetPassword } = route.params || {};
  const [password, setPassword] = useState(''); const [confirm, setConfirm] = useState(''); const [show, setShow] = useState(false); const [showConfirm, setShowConfirm] = useState(false); const [loading, setLoading] = useState(false);
  const requirements = [[password.length >= 8,'At least 8 characters'],[/\d/.test(password),'Include a number'],[/[^A-Za-z0-9]/.test(password),'Include a special character'],[/[a-z]/.test(password) && /[A-Z]/.test(password),'Use uppercase and lowercase letters']];
  const submit = async () => {
    if (!requirements.every(([met]) => met) || password !== confirm) return AlertService.show('Check Password', password !== confirm ? 'Passwords do not match.' : 'Please meet all password requirements.', 'error');
    if (!isResetPassword) return navigation.navigate('ProfileDetails', { phoneNumber, firebaseIdToken, password });
    try { setLoading(true); const res = await apiPublic.post('/auth/reset-password', { phoneNumber, newPassword: password, firebaseIdToken }); if (!res.data.success) throw new Error(res.data.message); navigation.replace('PasswordSuccess'); }
    catch (error) { AlertService.show('Reset Failed', getApiErrorMessage(error, error.message || 'Please try again.'), 'error'); }
    finally { setLoading(false); }
  };
  return (
    <AuthScreen contentStyle={s.formContent}>
      <BackButton onPress={() => navigation.goBack()} /><AuthHeader title={isResetPassword ? 'Set New Password' : 'Create Password'} subtitle="Create a secure password for your account." />
      <AuthField icon="lock-closed-outline" label="New Password" placeholder="Enter new password" value={password} onChangeText={setPassword} secureTextEntry={!show} right={<Eye shown={show} onPress={() => setShow(!show)} />} />
      <AuthField icon="lock-closed-outline" label="Confirm Password" placeholder="Re-enter new password" value={confirm} onChangeText={setConfirm} secureTextEntry={!showConfirm} right={<Eye shown={showConfirm} onPress={() => setShowConfirm(!showConfirm)} />} />
      <View style={s.requirements}>{requirements.map(([met,label]) => <View key={label} style={s.requirement}><Icon name="checkmark-circle" size={17} color={met ? '#18B767' : '#BEC4D5'} /><Text style={[s.requirementText, met && s.requirementMet]}>{label}</Text></View>)}</View>
      <GradientButton title={isResetPassword ? 'Update Password' : 'Next'} onPress={submit} loading={loading} />
    </AuthScreen>
  );
}

export function PasswordSuccessScreen() {
  const navigation = useNavigation();
  return <AuthScreen contentStyle={s.successContent} keyboard={false}><View style={s.successRing}><View style={s.successCircle}><Icon name="checkmark" size={52} color="#FFF" /></View></View><AuthHeader title="Password Updated" subtitle="Your password has been reset successfully. You can now sign in with your new password." /><GradientButton title="Go to Sign In" onPress={() => navigation.reset({ index: 0, routes: [{ name: 'SignIn' }] })} /></AuthScreen>;
}

export function ProfileDetailsScreen() {
  const navigation = useNavigation(); const route = useRoute(); const params = route.params || {}; const { login } = useContext(AuthContext);
  const [dob, setDob] = useState('15 Aug 1995'); const [gender] = useState('female'); const [country] = useState(DEFAULT_COUNTRY); const [language, setLanguage] = useState('English'); const [step, setStep] = useState(1); const [loading, setLoading] = useState(false);
  const age = 30;
  const submit = async () => {
    try {
      setLoading(true); const deviceId = await DeviceInfo.getUniqueId(); const payload = { deviceId, userFrom: 'app', gender, language: [language, 'Hindi'], country, age };
      let url; if (params.idToken) { url = '/auth/user-google-auth'; payload.googleIdToken = params.idToken; } else { url = '/auth/user-signup'; payload.name = params.fullName; payload.phoneNumber = params.phoneNumber; payload.password = params.password; payload.firebaseIdToken = params.firebaseIdToken; }
      const res = await apiPublic.post(url, payload); if (!res.data.success) throw new Error(res.data.message || 'Registration failed.');
      const { accessToken, refreshToken, role, gender: savedGender, userId } = res.data.data; trackCompletedRegistration(params.idToken ? 'google' : 'phone', userId || params.phoneNumber || params.idToken);
      await AsyncStorage.multiSet([['accessToken', accessToken], ['refreshToken', refreshToken], ['role', role]]);
      if (params.idToken) await login({ accessToken, refreshToken, role, gender: savedGender, isRegister: true }); else navigation.reset({ index: 0, routes: [{ name: 'SignIn' }] });
    } catch (error) { AlertService.show('Registration Failed', error.response?.data?.message || error.message || 'Please try again.', 'error'); }
    finally { setLoading(false); }
  };
  const Detail = ({ icon, label, value, onPress, chevron }) => <TouchableOpacity style={s.detail} onPress={onPress} disabled={!onPress}><View style={s.detailIcon}><Icon name={icon} size={20} color={AUTH_COLORS.purple} /></View><View style={s.detailBody}><Text style={s.detailLabel}>{label}</Text><Text style={s.detailValue}>{value}</Text></View>{chevron && <Icon name="chevron-down" size={19} color={AUTH_COLORS.ink} />}</TouchableOpacity>;
  return (
    <AuthScreen contentStyle={s.formContent}>
      <BackButton onPress={() => step === 2 ? setStep(1) : navigation.goBack()} />
      <AuthHeader title={step === 1 ? 'Profile Details' : 'Almost Done!'} subtitle={step === 1 ? 'Let others know you better.' : 'Add a few more details to complete your profile.'} />
      {step === 2 && <View style={s.photo}><Icon name="person" size={50} color="#B894EB" /><View style={s.camera}><Icon name="camera" size={16} color="#FFF" /></View></View>}
      <Detail icon="calendar-outline" label="Date of Birth" value={dob} chevron onPress={() => setDob(dob)} />
      <Detail icon="bed-outline" label="Age" value={`${age} years`} />
      <Detail icon="globe-outline" label="Country" value={country.name} chevron onPress={() => {}} />
      <Detail icon="language-outline" label="Language" value={language} chevron onPress={() => setLanguage(language === 'English' ? 'Hindi' : 'English')} />
      <GradientButton title={step === 1 ? 'Next' : 'Complete'} onPress={() => step === 1 ? setStep(2) : submit()} loading={loading} />
    </AuthScreen>
  );
}

const s = StyleSheet.create({
  socialRow: { flexDirection: 'row', justifyContent: 'center', gap: 16 },
  termsFooter: { marginBottom: 40 },
  full: { width: '100%' }, zeroTop: { marginTop: 0 }, formContent: { paddingHorizontal: 18 }, welcomeContent: { justifyContent: 'space-between', alignItems: 'center' }, skip: { position: 'absolute', top: 6, right: 8, padding: 14, zIndex: 3 }, brand: { alignItems: 'center', marginTop: 30 }, brandLine: { marginTop: -12, color: '#7430EA', fontSize: 12, fontWeight: '700' }, hero: { color: '#34406C', fontSize: 16, lineHeight: 23, textAlign: 'center', marginTop: 20 }, community: { alignItems: 'center', marginVertical: 8 }, avatarRow: { flexDirection: 'row' }, avatar: { width: 47, height: 47, borderRadius: 24, borderWidth: 3, borderColor: '#FFF', backgroundColor: '#F7E9F8', justifyContent: 'center', alignItems: 'center' }, avatarOverlap: { marginLeft: -9 }, userBadge: { backgroundColor: '#FFF', borderRadius: 16, marginTop: -4, paddingHorizontal: 14, paddingVertical: 7, elevation: 4 }, userBadgeText: { color: '#8A2AF0', fontSize: 12, fontWeight: '700' }, outlineButton: { height: 52, borderRadius: 13, borderWidth: 1.4, borderColor: '#7540F3', justifyContent: 'center', alignItems: 'center', marginTop: 10 }, outlineText: { color: '#5833EB', fontSize: 15, fontWeight: '700' }, socialButton: { height: 50, borderRadius: 13, borderWidth: 1, borderColor: '#DEE2ED', backgroundColor: '#FFF', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 10 }, socialText: { color: AUTH_COLORS.ink, fontSize: 14, fontWeight: '600', marginLeft: 11 }, googleIcon: { width: 22, height: 22 }, terms: { color: '#68719A', fontSize: 11, lineHeight: 17, textAlign: 'center' }, link: { color: AUTH_COLORS.purple, fontSize: 12, fontWeight: '700' }, footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 26 }, footerText: { color: '#70789A', fontSize: 12 }, eye: { padding: 8 }, optionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 1 }, checkRow: { flexDirection: 'row', alignItems: 'center' }, checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 1, borderColor: '#AEB4CA', justifyContent: 'center', alignItems: 'center', marginRight: 7 }, checkboxOn: { backgroundColor: AUTH_COLORS.purple, borderColor: AUTH_COLORS.purple }, smallText: { color: '#6B7397', fontSize: 12 }, roundSocial: { width: 54, height: 54, borderRadius: 27, borderWidth: 1, borderColor: '#E1E4EF', alignSelf: 'center', justifyContent: 'center', alignItems: 'center' }, note: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F6F3FF', padding: 12, borderRadius: 12, marginBottom: 14 }, noteText: { color: '#66709A', fontSize: 12, marginLeft: 8 }, phoneStrong: { color: AUTH_COLORS.ink, fontWeight: '800' }, otpRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }, otpBox: { width: 48, height: 56, borderWidth: 1, borderColor: '#E0E4EF', borderRadius: 12, color: AUTH_COLORS.ink, backgroundColor: '#FFF', fontSize: 18, fontWeight: '700' }, otpBoxOn: { borderColor: AUTH_COLORS.purple, backgroundColor: '#FAF8FF' }, resendRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 }, muted: { color: '#9AA1B9' }, otpButton: { marginTop: 58 }, requirements: { backgroundColor: '#F6F5FA', borderRadius: 13, padding: 14, marginTop: 4 }, requirement: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 }, requirementText: { color: '#7B829F', fontSize: 12, marginLeft: 8 }, requirementMet: { color: '#38664F' }, successContent: { justifyContent: 'center', alignItems: 'center' }, successRing: { width: 134, height: 134, borderRadius: 67, backgroundColor: '#F0E5FF', borderWidth: 12, borderColor: '#F8F1FF', alignItems: 'center', justifyContent: 'center', marginBottom: 22 }, successCircle: { width: 82, height: 82, borderRadius: 41, backgroundColor: '#6B35EC', alignItems: 'center', justifyContent: 'center', elevation: 8 }, detail: { minHeight: 64, borderRadius: 15, borderWidth: 1, borderColor: '#E2E5F0', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, marginBottom: 11, backgroundColor: '#FFF' }, detailIcon: { width: 35, height: 35, borderRadius: 11, backgroundColor: '#F4F0FF', alignItems: 'center', justifyContent: 'center', marginRight: 10 }, detailBody: { flex: 1 }, detailLabel: { color: '#7780A1', fontSize: 11 }, detailValue: { color: '#232846', fontSize: 14, marginTop: 2, fontWeight: '500' }, photo: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#F2E8FA', borderWidth: 4, borderColor: '#E8D3FA', alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginTop: -12, marginBottom: 18 }, camera: { position: 'absolute', right: -3, bottom: 4, width: 30, height: 30, borderRadius: 15, backgroundColor: AUTH_COLORS.purple, borderWidth: 3, borderColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
});
