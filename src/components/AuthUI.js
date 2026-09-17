import React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getTopSafeInset } from '../utils/safeAreaUtils';

export const AUTH_COLORS = {
  ink: '#10132B',
  muted: '#66709A',
  purple: '#6338FF',
  pink: '#D51BDE',
  border: '#E2E5F0',
  soft: '#F7F6FC',
  success: '#18B767',
};

export function AuthScreen({ children, scroll = true, keyboard = true, contentStyle }) {
  const insets = useSafeAreaInsets();
  const topSafeInset = getTopSafeInset(insets.top);
  const bottomInset = Math.max(insets.bottom || 0, 24);

  const content = scroll ? (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        { paddingTop: topSafeInset + 8, paddingBottom: bottomInset + 16 },
        contentStyle,
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, { paddingTop: topSafeInset + 8, paddingBottom: bottomInset + 16 }, contentStyle]}>
      {children}
    </View>
  );

  return (
    <View style={styles.screen}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" animated />
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />
      {keyboard ? (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {content}
        </KeyboardAvoidingView>
      ) : content}
    </View>
  );
}

export function BackButton({ onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.back} hitSlop={12} activeOpacity={0.65}>
      <Icon name="chevron-back" size={26} color={AUTH_COLORS.ink} />
    </TouchableOpacity>
  );
}

export function AuthHeader({ title, subtitle }) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

export function AuthField({ icon, label, right, style, inputStyle, ...inputProps }) {
  return (
    <View style={[styles.field, style]}>
      <View style={styles.fieldIcon}><Icon name={icon} size={20} color={AUTH_COLORS.purple} /></View>
      <View style={styles.fieldBody}>
        {!!label && <Text style={styles.fieldLabel}>{label}</Text>}
        <TextInput
          {...inputProps}
          style={[styles.input, inputStyle]}
          placeholderTextColor="#9AA2C2"
          selectionColor={AUTH_COLORS.purple}
        />
      </View>
      {right}
    </View>
  );
}

export function GradientButton({ title, onPress, loading, disabled, style }) {
  return (
    <TouchableOpacity disabled={disabled || loading} onPress={onPress} activeOpacity={0.86} style={[styles.buttonWrap, style, disabled && styles.disabled]}>
      <LinearGradient colors={['#5736FF', '#B523F3']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.button}>
        {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>{title}</Text>}
      </LinearGradient>
    </TouchableOpacity>
  );
}

export function Divider({ text = 'or continue with' }) {
  return (
    <View style={styles.dividerRow}>
      <View style={styles.line} />
      <Text style={styles.dividerText}>{text}</Text>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: '#FFFFFF', overflow: 'hidden' },
  glowTop: { position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: '#F7EDFF', top: -170, right: -100, opacity: 0.65 },
  glowBottom: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: '#FFF0FA', bottom: -220, left: -150, opacity: 0.5 },
  content: { flexGrow: 1, paddingHorizontal: 20 },
  back: { width: 42, height: 42, marginLeft: -10, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  header: { alignItems: 'center', marginTop: 12, marginBottom: 30 },
  title: { color: AUTH_COLORS.ink, fontSize: 25, lineHeight: 32, fontWeight: '800', textAlign: 'center', letterSpacing: -0.5 },
  subtitle: { color: AUTH_COLORS.muted, fontSize: 14, lineHeight: 20, marginTop: 7, textAlign: 'center', maxWidth: 300 },
  field: { minHeight: 64, width: '100%', borderRadius: 16, borderWidth: 1, borderColor: AUTH_COLORS.border, backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, marginBottom: 12 },
  fieldIcon: { width: 34, height: 34, borderRadius: 12, backgroundColor: '#F4F0FF', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  fieldBody: { flex: 1, justifyContent: 'center' },
  fieldLabel: { color: '#69729B', fontSize: 11, lineHeight: 15, fontWeight: '500' },
  input: { color: AUTH_COLORS.ink, fontSize: 14, lineHeight: 19, paddingVertical: 2, paddingHorizontal: 0, minHeight: 25 },
  buttonWrap: { width: '100%', borderRadius: 13, overflow: 'hidden', marginTop: 16, elevation: 4, shadowColor: '#7A31EE', shadowOpacity: 0.22, shadowOffset: { width: 0, height: 5 }, shadowRadius: 10 },
  button: { height: 52, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  disabled: { opacity: 0.55 },
  dividerRow: { width: '100%', flexDirection: 'row', alignItems: 'center', marginVertical: 22 },
  line: { flex: 1, height: 1, backgroundColor: AUTH_COLORS.border },
  dividerText: { color: '#757EA5', fontSize: 12, marginHorizontal: 12 },
});
