import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Alert,
    ActivityIndicator,
    PermissionsAndroid,
    Platform,
    Image,
    Dimensions,
    Animated,
  View as ScreenBackgroundView,
  StatusBar as ScreenBackgroundStatusBar,
  StyleSheet as ScreenBackgroundStyleSheet
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { apiUtil } from '../../utils/apiUtil';
import { uploadToCloudinary } from '../../utils/cloudinaryUtil';
import { AlertService } from '../../utils/AlertService';
import LinearGradient from 'react-native-linear-gradient';
import AudioRecord from 'react-native-audio-record';
import Sound from 'react-native-sound';
import { pick, types } from '@react-native-documents/picker';

const { width, height } = Dimensions.get('window');

// ─── Animated Field Wrapper ───────────────────────────────────────────────────
const FieldCard = ({ children, style }) => {
    const anim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.spring(anim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }).start();
    }, []);
    return (
        <Animated.View style={[{ opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }, style]}>
            {children}
        </Animated.View>
    );
};

// ─── Upload Box Component ─────────────────────────────────────────────────────
const UploadBox = ({ label, icon, file, onPress, accent }) => (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
        <View
            style={[styles.uploadBox, file && { borderColor: accent || '#6366F1', borderStyle: 'solid', backgroundColor: '#F0FDF4' }]}
        >
            {file?.uri ? (
                <Image source={{ uri: file.uri }} style={styles.uploadPreview} resizeMode="cover" />
            ) : (
                <View style={styles.uploadPlaceholder}>
                    <LinearGradient colors={['#6366F1', '#4F46E5']} style={styles.uploadIconCircle}>
                        <Icon name={icon} size={22} color="#fff" />
                    </LinearGradient>
                    <Text style={styles.uploadLabel}>{label}</Text>
                    <Text style={styles.uploadHint}>Tap to Upload</Text>
                </View>
            )}
            {file && (
                <View style={styles.uploadedBadge}>
                    <Icon name="check-circle" size={16} color="#10B981" />
                    <Text style={styles.uploadedText}>Uploaded</Text>
                </View>
            )}
        </View>
    </TouchableOpacity>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
const HostApply = () => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const topSafeInset = getAppTopSafeInset(insets.top);
    const bottomPadding = getStackScreenBottomPadding(insets.bottom, 40);

    // Application Status State
    const [statusLoading, setStatusLoading] = useState(true);
    const [hostStatus, setHostStatus] = useState(null);

    // Text fields
    const [name, setName] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState('female');
    const [userName, setUserName] = useState('');
    const [userId, setUserId] = useState('');
    const [mobile, setMobile] = useState('');
    const [email, setEmail] = useState('');
    const [country, setCountry] = useState('');
    const [stateName, setStateName] = useState('');
    const [district, setDistrict] = useState('');

    // File uploads
    const [aadharFront, setAadharFront] = useState(null);
    const [aadharBack, setAadharBack] = useState(null);
    const [selfieWithIdCard, setSelfieWithIdCard] = useState(null);

    // Audio recording
    const [audioPath, setAudioPath] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [soundInstance, setSoundInstance] = useState(null);
    const [recordSeconds, setRecordSeconds] = useState(0);
    const timerRef = useRef(null);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    const [loading, setLoading] = useState(false);

    const fetchHostStatus = async () => {
        try {
            setStatusLoading(true);
            const res = await apiUtil.get('/host/my-status');
            if (res.data?.success && res.data?.data) {
                setHostStatus(res.data.data);
            }
        } catch (err) {
            console.log('Error fetching host status:', err.message);
        } finally {
            setStatusLoading(false);
        }
    };

    useEffect(() => {
        fetchHostStatus();
        return () => {
            if (soundInstance) soundInstance.release();
            if (isRecording) {
                try { AudioRecord.stop(); } catch {}
            }
            clearInterval(timerRef.current);
        };
    }, []);

    // Pulse animation while recording
    useEffect(() => {
        if (isRecording) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.3, duration: 500, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
                ])
            ).start();
            timerRef.current = setInterval(() => setRecordSeconds(s => s + 1), 1000);
        } else {
            pulseAnim.stopAnimation();
            pulseAnim.setValue(1);
            clearInterval(timerRef.current);
        }
    }, [isRecording]);

    const formatTime = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

    // ── Permissions ──────────────────────────────────────────────────────────
    const requestPermissions = async () => {
        if (Platform.OS !== 'android') return true;
        try {
            const grants = await PermissionsAndroid.requestMultiple([
                PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
            ]);
            return grants['android.permission.RECORD_AUDIO'] === PermissionsAndroid.RESULTS.GRANTED;
        } catch {
            return false;
        }
    };

    // ── File Picker ──────────────────────────────────────────────────────────
    const pickFile = async (setter) => {
        try {
            const [result] = await pick({ type: [types.allFiles] });
            if (result) {
                setter({ uri: result.uri, name: result.name || result.fileName || 'document', type: result.type || result.mimeType || 'application/octet-stream' });
            }
        } catch (e) {
            if (e?.code !== 'DOCUMENT_PICKER_CANCELED' && e?.code !== 'OPERATION_CANCELED' && e?.code !== 'CANCELED') {
                AlertService.show('Error', 'Could not open file picker.', 'error');
            }
        }
    };

    // ── Audio Recording ──────────────────────────────────────────────────────
    const onStartRecord = async () => {
        const ok = await requestPermissions();
        if (!ok) return AlertService.show('Permission', 'Microphone permission required.', 'error');
        try {
            setAudioPath(null);
            setRecordSeconds(0);
            AudioRecord.init({
                sampleRate: 16000,
                channels: 1,
                bitsPerSample: 16,
                audioSource: 1, // 1 = MIC (standard & supported on all Android devices)
                wavFile: 'host_intro.wav',
            });
            AudioRecord.start();
            setIsRecording(true);
        } catch (err) {
            console.error('AudioRecord start error:', err);
            AlertService.show('Error', 'Could not start audio recording. Please try again.', 'error');
        }
    };

    const onStopRecord = async () => {
        if (!isRecording) return;
        try {
            const path = await AudioRecord.stop();
            setIsRecording(false);
            setAudioPath(path);
        } catch {
            setIsRecording(false);
        }
    };

    const togglePlay = () => {
        if (!audioPath) return;
        if (isPlaying) {
            soundInstance?.stop(() => setIsPlaying(false));
        } else {
            const s = new Sound(audioPath, null, err => {
                if (err) return;
                setIsPlaying(true);
                s.play((success) => {
                    setIsPlaying(false);
                    try { s.release(); } catch (_) {}
                    setSoundInstance(null);
                });
            });
            setSoundInstance(s);
        }
    };

    // ── Submit Form ──────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!name.trim()) return AlertService.show('Required', 'Please enter your Name.', 'error');
        if (!age.trim()) return AlertService.show('Required', 'Please enter your Age.', 'error');
        const parsedAge = parseInt(age.trim(), 10);
        if (isNaN(parsedAge) || parsedAge < 18 || parsedAge > 120) {
            return AlertService.show('Age Restriction', 'You must be at least 18 years old to apply as a host.', 'error');
        }
        if (!userName.trim()) return AlertService.show('Required', 'Please enter your User Name.', 'error');
        if (!userId.trim()) return AlertService.show('Required', 'Please enter your User ID.', 'error');
        if (!mobile.trim() || mobile.length < 10) return AlertService.show('Required', 'Please enter a valid Mobile Number.', 'error');
        if (!email.trim() || !email.includes('@')) return AlertService.show('Required', 'Please enter a valid Email ID.', 'error');
        if (!country.trim()) return AlertService.show('Required', 'Please enter your Country.', 'error');
        if (!stateName.trim()) return AlertService.show('Required', 'Please enter your State.', 'error');
        if (!district.trim()) return AlertService.show('Required', 'Please enter your District.', 'error');
        if (!aadharFront) return AlertService.show('Required', 'Please upload Aadhar Card Front Side.', 'error');
        if (!aadharBack) return AlertService.show('Required', 'Please upload Aadhar Card Back Side.', 'error');
        if (!selfieWithIdCard) return AlertService.show('Required', 'Please upload a selfie with your ID card.', 'error');
        if (!audioPath) return AlertService.show('Required', 'Please record your Voice Introduction.', 'error');

        setLoading(true);
        try {
            let uploadedAudioUrl = '';
            let uploadedAadharFront = '';
            let uploadedAadharBack = '';
            let uploadedSelfieWithIdCard = '';

            if (audioPath) {
                uploadedAudioUrl = await uploadToCloudinary(
                    { uri: Platform.OS === 'android' ? `file://${audioPath}` : audioPath, type: 'audio/wav', name: 'intro.wav' },
                    'raw'
                );
            }

            if (aadharFront) {
                uploadedAadharFront = await uploadToCloudinary(aadharFront, 'host');
            }

            if (aadharBack) {
                uploadedAadharBack = await uploadToCloudinary(aadharBack, 'host');
            }

            if (selfieWithIdCard) {
                uploadedSelfieWithIdCard = await uploadToCloudinary(selfieWithIdCard, 'host');
            }

            const res = await apiUtil.post('/host/apply', {
                userId,
                name,
                age: parsedAge,
                gender,
                userName,
                mobile,
                email,
                country,
                state: stateName,
                district,
                audio: uploadedAudioUrl,
                voiceAudioUrl: uploadedAudioUrl,
                adharFront: uploadedAadharFront,
                aadhaarFront: uploadedAadharFront,
                adharBack: uploadedAadharBack,
                aadhaarBack: uploadedAadharBack,
                selfieWithIdCard: uploadedSelfieWithIdCard,
                // Legacy aliases keep older server deployments compatible.
                pan: uploadedSelfieWithIdCard,
                panCard: uploadedSelfieWithIdCard,
                documents: [
                    { name: 'Aadhaar Front', documentType: 'GovtID', url: uploadedAadharFront },
                    { name: 'Aadhaar Back', documentType: 'GovtID', url: uploadedAadharBack },
                    { name: 'Host Voice Audition', documentType: 'Voice', url: uploadedAudioUrl },
                ].filter(d => Boolean(d.url)),
            });

            if (res.data?.success) {
                AlertService.show(
                    'Application Submitted!',
                    'Aapki Host application Under Review stage 1 me submit ho gayi hai. Agency, Operator aur Admin team review karke approve karegi.',
                    'success'
                );
                fetchHostStatus();
            } else {
                AlertService.show('Submission Failed', res.data?.message || 'Failed to submit application', 'error');
            }
        } catch (error) {
            console.error('Error submitting application:', error);
            AlertService.show('Error', error.response?.data?.message || 'Failed to submit application. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // ── 1. LOADING SCREEN ──────────────────────────────────────────────────────
    if (statusLoading) {
        return (
            <ScreenBackgroundView style={[{ flex: 1, backgroundColor: '#F8FAFC' }]}>
              <ScreenBackgroundStatusBar translucent backgroundColor="transparent" barStyle="dark-content" animated />
              <LinearGradient colors={['#F8FAFC', '#F1F5F9', '#E2E8F0']} style={ScreenBackgroundStyleSheet.absoluteFillObject} />
                <View style={styles.centerLoading}>
                    <ActivityIndicator size="large" color="#6366F1" />
                    <Text style={styles.loadingText}>Loading Host Status...</Text>
                </View>
            </ScreenBackgroundView>
        );
    }

    // ── 2. APPROVED HOST SCREEN (AGENCY DETAILS) ──────────────────────────────
    if (hostStatus?.status === 'APPROVED') {
        const agency = hostStatus.agencyDetails || {};
        return (
            <ScreenBackgroundView style={[{ flex: 1, backgroundColor: '#F8FAFC' }]}>
              <ScreenBackgroundStatusBar translucent backgroundColor="transparent" barStyle="dark-content" animated />
              <LinearGradient colors={['#F8FAFC', '#F1F5F9', '#E2E8F0']} style={ScreenBackgroundStyleSheet.absoluteFillObject} />
                <ScrollView contentContainerStyle={[styles.statusContainer, { paddingTop: topSafeInset + 8, paddingBottom: bottomPadding }]} showsVerticalScrollIndicator={false}>
                    {/* Header */}
                    <View style={styles.headerRow}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                            <Icon name="arrow-back" size={22} color="#1E293B" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Agency & Hosting Details</Text>
                    </View>

                    {/* Main Agency Card */}
                    <View style={styles.agencyCard}>
                        <View style={styles.agencyLogoWrapper}>
                            <Image
                                source={agency.agencyLogo ? { uri: agency.agencyLogo } : require('../../assets/avtar.webp')}
                                style={styles.agencyLogo}
                            />
                            <View style={styles.activeBadge}>
                                <Icon name="check" size={12} color="#fff" />
                            </View>
                        </View>
                        <Text style={styles.agencyName}>{agency.agencyName || 'Official Agency'}</Text>
                        <Text style={styles.agencyCode}>Agency Code: {agency.agencyCode || 'AGENCY-101'}</Text>

                        <View style={styles.agencyDivider} />

                        {/* Agency Contact Number */}
                        <View style={styles.infoRow}>
                            <View style={styles.infoIconBg}>
                                <Icon name="phone" size={18} color="#4F46E5" />
                            </View>
                            <View style={styles.infoTextCol}>
                                <Text style={styles.infoLabel}>Agency Number</Text>
                                <Text style={styles.infoValue}>{agency.agencyNumber || '+91 9876543210'}</Text>
                            </View>
                        </View>

                        {/* Hosting Create Time */}
                        <View style={styles.infoRow}>
                            <View style={styles.infoIconBg}>
                                <Icon name="event" size={18} color="#6366F1" />
                            </View>
                            <View style={styles.infoTextCol}>
                                <Text style={styles.infoLabel}>Hosting Created Time</Text>
                                <Text style={styles.infoValue}>
                                    {hostStatus.hostingCreatedAt ? new Date(hostStatus.hostingCreatedAt).toLocaleString() : 'Active'}
                                </Text>
                            </View>
                        </View>

                        {/* Host / User ID */}
                        <View style={styles.infoRow}>
                            <View style={styles.infoIconBg}>
                                <Icon name="badge" size={18} color="#F59E0B" />
                            </View>
                            <View style={styles.infoTextCol}>
                                <Text style={styles.infoLabel}>Host / User ID</Text>
                                <Text style={styles.infoValue}>{hostStatus.userId || hostStatus.hostId || '—'}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Official Active Host Status Box */}
                    <View style={styles.approvedStatusBox}>
                        <Icon name="verified" size={26} color="#10B981" />
                        <View style={{ marginLeft: 12, flex: 1 }}>
                            <Text style={styles.approvedTitle}>Official Host Active</Text>
                            <Text style={styles.approvedSub}>
                                Aapka Host Account Agency under successfully active hai. Live streaming aur 1-on-1 audio/video calls se earnings receive kar sakte hain.
                            </Text>
                        </View>
                    </View>

                    {/* Contact Agency Support Button */}
                    <TouchableOpacity style={styles.supportBtn} activeOpacity={0.85} onPress={() => navigation.navigate('HelpAndSupport')}>
                        <LinearGradient colors={['#6366F1', '#4F46E5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.supportGradient}>
                            <Icon name="headset-mic" size={20} color="#fff" style={{ marginRight: 8 }} />
                            <Text style={styles.supportBtnText}>Contact Agency Support</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </ScrollView>
            </ScreenBackgroundView>
        );
    }

    // ── 3. PENDING REVIEW MULTI-STAGE TRACKING SCREEN ───────────────────────
    if (hostStatus?.status === 'PENDING' || hostStatus?.status === 'UNDER_REVIEW' || hostStatus?.status === 'under_review') {
        const stages = hostStatus.stages || [
            { title: 'Agency Review', description: 'Agency is reviewing your application details.', status: 'in_progress', icon: 'business' },
            { title: 'Operator Review', description: 'Operator team is inspecting audio intro and credentials.', status: 'pending', icon: 'support-agent' },
            { title: 'Admin Review', description: 'Administrative staff verification and approval.', status: 'pending', icon: 'admin-panel-settings' },
            { title: 'Super Admin Final Audit', description: 'Super Admin security seal & role activation.', status: 'pending', icon: 'verified-user' }
        ];

        return (
            <ScreenBackgroundView style={[{ flex: 1, backgroundColor: '#F8FAFC' }]}>
              <ScreenBackgroundStatusBar translucent backgroundColor="transparent" barStyle="dark-content" animated />
              <LinearGradient colors={['#F8FAFC', '#F1F5F9', '#E2E8F0']} style={ScreenBackgroundStyleSheet.absoluteFillObject} />
                <ScrollView contentContainerStyle={[styles.statusContainer, { paddingTop: topSafeInset + 8, paddingBottom: bottomPadding }]} showsVerticalScrollIndicator={false}>
                    {/* Header */}
                    <View style={styles.headerRow}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                            <Icon name="arrow-back" size={22} color="#1E293B" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Hosting Application Review</Text>
                    </View>

                    {/* Under Review Card */}
                    <View style={styles.pendingBadgeCard}>
                        <View style={styles.pendingIconGlow}>
                            <Icon name="hourglass-top" size={32} color="#D97706" />
                        </View>
                        <Text style={styles.pendingTitle}>Application Under Review</Text>
                        <Text style={styles.pendingSub}>
                            Submitted on: {hostStatus.appliedAt ? new Date(hostStatus.appliedAt).toLocaleString() : 'Recently'}
                        </Text>
                    </View>

                    {/* Multi-Stage Progression Timeline */}
                    <View style={styles.timelineCard}>
                        <Text style={styles.timelineHeading}>Multi-Stage Review Progression</Text>
                        {stages.map((stg, index) => {
                            const isCurrent = stg.status === 'in_progress';
                            const isCompleted = stg.status === 'completed';
                            return (
                                <View key={index} style={styles.stageItem}>
                                    <View style={styles.stageLeft}>
                                        <View style={[
                                            styles.stageDot,
                                            isCurrent && styles.stageDotCurrent,
                                            isCompleted && styles.stageDotCompleted
                                        ]}>
                                            <Icon
                                                name={isCompleted ? 'check' : isCurrent ? 'hourglass-full' : 'schedule'}
                                                size={14}
                                                color="#fff"
                                            />
                                        </View>
                                        {index < stages.length - 1 && (
                                            <View style={[styles.stageLine, (isCompleted || isCurrent) && styles.stageLineActive]} />
                                        )}
                                    </View>
                                    <View style={styles.stageRight}>
                                        <Text style={[styles.stageTitle, isCurrent && { color: '#D97706' }, isCompleted && { color: '#16A34A' }]}>
                                            Stage {index + 1}: {stg.title}
                                        </Text>
                                        <Text style={styles.stageDesc}>{stg.description}</Text>
                                        <Text style={[
                                            styles.stageStatusBadge,
                                            isCompleted ? styles.badgeCompleted : isCurrent ? styles.badgeCurrent : styles.badgePending
                                        ]}>
                                            {isCompleted ? 'Approved' : isCurrent ? 'Under Review' : 'Pending'}
                                        </Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>

                    {/* Refresh Status Button */}
                    <TouchableOpacity style={styles.refreshBtn} onPress={fetchHostStatus} activeOpacity={0.85}>
                        <Icon name="refresh" size={18} color="#4F46E5" style={{ marginRight: 8 }} />
                        <Text style={styles.refreshBtnText}>Check Update Status</Text>
                    </TouchableOpacity>
                </ScrollView>
            </ScreenBackgroundView>
        );
    }

    // ── 4. NOT APPLIED HOST FORM SCREEN ──────────────────────────────────────
    return (
        <ScreenBackgroundView style={[{ flex: 1, backgroundColor: '#F8FAFC' }]}>
          <ScreenBackgroundStatusBar translucent backgroundColor="transparent" barStyle="dark-content" animated />
          <LinearGradient colors={['#F8FAFC', '#F1F5F9', '#E2E8F0']} style={ScreenBackgroundStyleSheet.absoluteFillObject} />
            <ScrollView contentContainerStyle={[styles.container, { paddingTop: topSafeInset + 8, paddingBottom: bottomPadding }]} showsVerticalScrollIndicator={false}>

                {/* Top Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Icon name="arrow-back" size={22} color="#1E293B" />
                    </TouchableOpacity>
                    <View style={styles.headerTextCol}>
                        <Text style={styles.title}>Apply for Hosting</Text>
                        <Text style={styles.subtitle}>Fill details & record voice intro to join as host</Text>
                    </View>
                </View>

                {/* Form Fields */}
                <View style={styles.formSection}>
                    <Text style={styles.sectionHeading}>Personal & Contact Info</Text>

                    <FieldCard style={styles.fieldWrapper}>
                        <Text style={styles.fieldLabel}>Full Name *</Text>
                        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Enter your full name" placeholderTextColor="#94A3B8" />
                    </FieldCard>

                    <FieldCard style={styles.fieldWrapper}>
                        <Text style={styles.fieldLabel}>Age *</Text>
                        <TextInput style={styles.input} value={age} onChangeText={setAge} keyboardType="number-pad" maxLength={3} placeholder="Enter your age (e.g. 21)" placeholderTextColor="#94A3B8" />
                    </FieldCard>

                    <FieldCard style={styles.fieldWrapper}>
                        <Text style={styles.fieldLabel}>Gender *</Text>
                        <View style={styles.genderRow}>
                            {['female', 'male', 'other'].map((g) => (
                                <TouchableOpacity key={g} style={[styles.genderChip, gender === g && styles.genderChipActive]} onPress={() => setGender(g)}>
                                    <Text style={[styles.genderChipText, gender === g && styles.genderChipTextActive]}>{g.toUpperCase()}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </FieldCard>

                    <FieldCard style={styles.fieldWrapper}>
                        <Text style={styles.fieldLabel}>User Name *</Text>
                        <TextInput style={styles.input} value={userName} onChangeText={setUserName} placeholder="Enter username" placeholderTextColor="#94A3B8" />
                    </FieldCard>

                    <FieldCard style={styles.fieldWrapper}>
                        <Text style={styles.fieldLabel}>User ID *</Text>
                        <TextInput style={styles.input} value={userId} onChangeText={setUserId} placeholder="Enter User ID" placeholderTextColor="#94A3B8" />
                    </FieldCard>

                    <FieldCard style={styles.fieldWrapper}>
                        <Text style={styles.fieldLabel}>Mobile Number *</Text>
                        <TextInput style={styles.input} value={mobile} onChangeText={setMobile} keyboardType="phone-pad" placeholder="10-digit mobile number" placeholderTextColor="#94A3B8" />
                    </FieldCard>

                    <FieldCard style={styles.fieldWrapper}>
                        <Text style={styles.fieldLabel}>Email ID *</Text>
                        <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="Enter valid email ID" placeholderTextColor="#94A3B8" />
                    </FieldCard>

                    <FieldCard style={styles.fieldWrapper}>
                        <Text style={styles.fieldLabel}>Country *</Text>
                        <TextInput style={styles.input} value={country} onChangeText={setCountry} placeholder="Enter country (e.g. India)" placeholderTextColor="#94A3B8" />
                    </FieldCard>

                    <FieldCard style={styles.fieldWrapper}>
                        <Text style={styles.fieldLabel}>State *</Text>
                        <TextInput style={styles.input} value={stateName} onChangeText={setStateName} placeholder="Enter state" placeholderTextColor="#94A3B8" />
                    </FieldCard>

                    <FieldCard style={styles.fieldWrapper}>
                        <Text style={styles.fieldLabel}>District *</Text>
                        <TextInput style={styles.input} value={district} onChangeText={setDistrict} placeholder="Enter district" placeholderTextColor="#94A3B8" />
                    </FieldCard>
                </View>

                {/* ID Proof Section */}
                <View style={styles.formSection}>
                    <Text style={styles.sectionHeading}>Identity Verification Proofs</Text>
                    <View style={styles.uploadGrid}>
                        <UploadBox label="Aadhar Card Front *" icon="badge" file={aadharFront} onPress={() => pickFile(setAadharFront)} accent="#6366F1" />
                        <UploadBox label="Aadhar Card Back *" icon="contact-mail" file={aadharBack} onPress={() => pickFile(setAadharBack)} accent="#8B5CF6" />
                        <UploadBox label="Selfie with ID Card *" icon="person" file={selfieWithIdCard} onPress={() => pickFile(setSelfieWithIdCard)} accent="#EC4899" />
                    </View>
                </View>

                {/* Voice Intro Recording */}
                <View style={styles.formSection}>
                    <Text style={styles.sectionHeading}>Voice Introduction *</Text>
                    <View style={styles.voiceCard}>
                        <Text style={styles.voiceHint}>Record a short 10-30 sec audio intro introducing yourself and your languages.</Text>

                        {isRecording && (
                            <View style={styles.timerRow}>
                                <Animated.View style={[styles.recDot, { transform: [{ scale: pulseAnim }] }]} />
                                <Text style={styles.timerText}>{formatTime(recordSeconds)}</Text>
                            </View>
                        )}

                        <View style={styles.voiceControls}>
                            {!isRecording ? (
                                <TouchableOpacity style={[styles.controlBtn, styles.recordBtnStyle]} onPress={onStartRecord}>
                                    <Icon name="mic" size={28} color="#fff" />
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity style={[styles.controlBtn, styles.stopBtnStyle]} onPress={onStopRecord}>
                                    <Icon name="stop" size={28} color="#fff" />
                                </TouchableOpacity>
                            )}

                            {audioPath && !isRecording && (
                                <>
                                    <TouchableOpacity style={[styles.controlBtn, styles.playBtnStyle]} onPress={togglePlay}>
                                        <Icon name={isPlaying ? 'pause' : 'play-arrow'} size={28} color="#fff" />
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.controlBtn, styles.reBtnStyle]} onPress={onStartRecord}>
                                        <Icon name="refresh" size={24} color="#4F46E5" />
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>

                        <Text style={styles.voiceStatus}>
                            {isRecording ? 'Recording... Tap Stop when done' : audioPath ? 'Voice Intro Recorded! Tap Play to preview.' : 'Tap Microphone to start recording'}
                        </Text>
                    </View>
                </View>

                {/* Submit Button */}
                <TouchableOpacity onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
                    <LinearGradient colors={['#6366F1', '#4F46E5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitBtn}>
                        {loading ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <View style={styles.submitContent}>
                                <Text style={styles.submitText}>Submit Host Application</Text>
                                <Icon name="arrow-forward" size={22} color="#fff" style={{ marginLeft: 8 }} />
                            </View>
                        )}
                    </LinearGradient>
                </TouchableOpacity>

                <Text style={styles.submitNote}>By submitting, you agree to Host Rules & Terms.</Text>
            </ScrollView>
        </ScreenBackgroundView>
    );
};

const styles = StyleSheet.create({
    centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { color: '#64748B', fontSize: 13, marginTop: 12 },

    container: { padding: 20 },
    statusContainer: { padding: 20 },

    headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    headerTitle: { color: '#0F172A', fontSize: 20, fontWeight: '800', marginLeft: 12 },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 1,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 4,
    },

    // Status Cards
    agencyCard: {
        borderRadius: 22,
        padding: 24,
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 8,
    },
    agencyLogoWrapper: { position: 'relative', marginBottom: 14 },
    agencyLogo: { width: 84, height: 84, borderRadius: 42, borderWidth: 2, borderColor: '#6366F1' },
    activeBadge: { position: 'absolute', bottom: 2, right: 2, width: 22, height: 22, borderRadius: 11, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFFFFF' },
    agencyName: { color: '#0F172A', fontSize: 22, fontWeight: '800', marginBottom: 2, textAlign: 'center' },
    agencyCode: { color: '#4F46E5', fontSize: 13, fontWeight: '700', marginBottom: 16 },
    agencyDivider: { width: '100%', height: 1, backgroundColor: '#F1F5F9', marginBottom: 16 },

    infoRow: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 14 },
    infoIconBg: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    infoTextCol: { flex: 1 },
    infoLabel: { color: '#64748B', fontSize: 11, fontWeight: '600' },
    infoValue: { color: '#0F172A', fontSize: 14, fontWeight: '700', marginTop: 1 },

    approvedStatusBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0FDF4',
        borderWidth: 1,
        borderColor: '#BBF7D0',
        borderRadius: 18,
        padding: 16,
        marginBottom: 20,
    },
    approvedTitle: { color: '#15803D', fontSize: 15, fontWeight: '800', marginBottom: 2 },
    approvedSub: { color: '#166534', fontSize: 12, lineHeight: 18 },

    supportBtn: { borderRadius: 16, overflow: 'hidden', marginTop: 10, elevation: 3, shadowColor: '#6366F1', shadowOpacity: 0.25, shadowRadius: 8 },
    supportGradient: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    supportBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },

    // Pending Timeline
    pendingBadgeCard: {
        backgroundColor: '#FFFBEB',
        borderWidth: 1,
        borderColor: '#FDE68A',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        marginBottom: 20,
    },
    pendingIconGlow: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FEF3C7', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    pendingTitle: { color: '#B45309', fontSize: 18, fontWeight: '800', marginBottom: 4 },
    pendingSub: { color: '#92400E', fontSize: 12 },

    timelineCard: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 8,
    },
    timelineHeading: { color: '#0F172A', fontSize: 16, fontWeight: '800', marginBottom: 18 },
    stageItem: { flexDirection: 'row', marginBottom: 16 },
    stageLeft: { alignItems: 'center', marginRight: 14, width: 24 },
    stageDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#CBD5E1', justifyContent: 'center', alignItems: 'center' },
    stageDotCurrent: { backgroundColor: '#F59E0B' },
    stageDotCompleted: { backgroundColor: '#10B981' },
    stageLine: { width: 2, flex: 1, backgroundColor: '#E2E8F0', marginTop: 4 },
    stageLineActive: { backgroundColor: '#10B981' },
    stageRight: { flex: 1, paddingTop: 2 },
    stageTitle: { color: '#0F172A', fontSize: 14, fontWeight: '700', marginBottom: 2 },
    stageDesc: { color: '#64748B', fontSize: 12, lineHeight: 16, marginBottom: 6 },
    stageStatusBadge: { alignSelf: 'flex-start', fontSize: 10, fontWeight: '800', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, overflow: 'hidden' },
    badgeCurrent: { backgroundColor: '#FEF3C7', color: '#B45309' },
    badgeCompleted: { backgroundColor: '#DCFCE7', color: '#15803D' },
    badgePending: { backgroundColor: '#F1F5F9', color: '#64748B' },

    refreshBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 48,
        borderRadius: 14,
        backgroundColor: '#EEF2FF',
        borderWidth: 1,
        borderColor: '#C7D2FE',
    },
    refreshBtnText: { color: '#4F46E5', fontSize: 14, fontWeight: '700' },

    // Form Styles
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
    backButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
        elevation: 1,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 4,
    },
    headerTextCol: { flex: 1 },
    title: { color: '#0F172A', fontSize: 22, fontWeight: '800' },
    subtitle: { color: '#64748B', fontSize: 12, marginTop: 2 },

    formSection: { marginBottom: 22 },
    sectionHeading: { color: '#4F46E5', fontSize: 14, fontWeight: '800', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 0.5 },

    fieldWrapper: { marginBottom: 14 },
    fieldLabel: { color: '#475569', fontSize: 13, fontWeight: '700', marginBottom: 6 },
    input: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 14,
        paddingHorizontal: 16,
        height: 50,
        color: '#0F172A',
        fontSize: 14,
        elevation: 1,
        shadowColor: '#000',
        shadowOpacity: 0.02,
        shadowRadius: 2,
    },

    genderRow: { flexDirection: 'row', gap: 10 },
    genderChip: {
        flex: 1,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        alignItems: 'center',
        justifyContent: 'center',
    },
    genderChipActive: { backgroundColor: '#6366F1', borderColor: '#6366F1' },
    genderChipText: { color: '#64748B', fontSize: 12, fontWeight: '700' },
    genderChipTextActive: { color: '#FFFFFF' },

    uploadGrid: { gap: 14 },
    uploadBox: {
        height: 120,
        borderRadius: 18,
        borderWidth: 1.5,
        borderColor: '#CBD5E1',
        borderStyle: 'dashed',
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 1,
    },
    uploadPlaceholder: { alignItems: 'center' },
    uploadIconCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    uploadLabel: { color: '#0F172A', fontSize: 14, fontWeight: '600', marginBottom: 2 },
    uploadHint: { color: '#94A3B8', fontSize: 11 },
    uploadPreview: { width: '100%', height: 120 },
    uploadedBadge: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 4,
        gap: 4,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    uploadedText: { color: '#10B981', fontSize: 11, fontWeight: '700' },

    voiceCard: {
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#FFFFFF',
        padding: 20,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 8,
    },
    voiceHint: { color: '#64748B', fontSize: 12, textAlign: 'center', marginBottom: 16, lineHeight: 18 },
    timerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    recDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444' },
    timerText: { color: '#0F172A', fontSize: 22, fontWeight: '800' },
    voiceControls: { flexDirection: 'row', alignItems: 'center', gap: 18, marginBottom: 14 },
    controlBtn: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', elevation: 4 },
    recordBtnStyle: { backgroundColor: '#EF4444' },
    stopBtnStyle: { backgroundColor: '#EF4444', borderWidth: 3, borderColor: '#FCA5A5' },
    playBtnStyle: { backgroundColor: '#10B981' },
    reBtnStyle: { backgroundColor: '#EEF2FF', borderWidth: 1, borderColor: '#C7D2FE' },
    voiceStatus: { color: '#64748B', fontSize: 13, textAlign: 'center' },

    submitBtn: { borderRadius: 18, height: 58, alignItems: 'center', justifyContent: 'center', elevation: 3, shadowColor: '#6366F1', shadowOpacity: 0.25, shadowRadius: 8, marginTop: 10 },
    submitContent: { flexDirection: 'row', alignItems: 'center' },
    submitText: { color: '#fff', fontSize: 17, fontWeight: '800' },
    submitNote: { color: '#94A3B8', fontSize: 11, textAlign: 'center', marginTop: 12 },
});

export default HostApply;
