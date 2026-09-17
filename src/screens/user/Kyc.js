import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Dimensions,
  Image,
  View as ScreenBackgroundView,
  StatusBar as ScreenBackgroundStatusBar,
  StyleSheet as ScreenBackgroundStyleSheet
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import IonIcon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { pick, types } from '@react-native-documents/picker';
import { apiUtil } from '../../utils/apiUtil';
import { uploadToCloudinary } from '../../utils/cloudinaryUtil';
import { useTranslation } from 'react-i18next';
import { AlertService } from '../../utils/AlertService';
import AnimatedTitleLine from '../../components/AnimatedTitleLine';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';

const { width, height } = Dimensions.get('window');

const Kyc = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomPadding = getStackScreenBottomPadding(insets.bottom, 40);
  const { t } = useTranslation();
  
  // Toggle landing page vs upload form
  const [showUploadForm, setShowUploadForm] = useState(false);

  // Form states
  const [panNumber, setPanNumber] = useState('');
  const [aadharNumber, setAadharNumber] = useState('');
  const [panFile, setPanFile] = useState(null);
  const [aadharFrontFile, setAadharFrontFile] = useState(null);
  const [aadharBackFile, setAadharBackFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [kycStatus, setKycStatus] = useState(null); // 'pending', 'approved', 'rejected'

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const res = await apiUtil.get('/kyc/my-status');
      if (res.data.success) {
        setKycStatus(res.data.data.status);
        const data = res.data.data;
        setPanNumber(data.panNumber || '');
        setAadharNumber(data.aadharNumber || '');
      }
    } catch (err) {
      // No KYC found is fine
    } finally {
      setFetching(false);
    }
  };

  const handleFilePick = async (setFile) => {
    try {
      const res = await pick({
        type: [types.allFiles],
        allowMultiSelection: false,
      });
      if (res && res.length > 0) {
        setFile(res[0]);
      }
    } catch (err) {
      if (err.code !== 'CANCELED' && err.code !== 'DOCUMENT_PICKER_CANCELED' && err.code !== 'OPERATION_CANCELED') {
        console.log('DocumentPicker Error', err);
        AlertService.show(t('kyc.error') || 'Error', t('kyc.failed_pick') || 'Failed to pick file', 'error');
      }
    }
  };

  const handleSubmit = async () => {
    if (!panNumber || !aadharNumber) {
      AlertService.show('Missing Fields', 'Please enter both Pan & Aadhar numbers', 'error');
      return;
    }
    if (!panFile || !aadharFrontFile || !aadharBackFile) {
      AlertService.show('Missing Documents', 'Please select all 3 required images:\n1. Pan Card\n2. Aadhar Front\n3. Aadhar Back', 'error');
      return;
    }

    setLoading(true);
    try {
      const [panUrl, aadharFrontUrl, aadharBackUrl] = await Promise.all([
        uploadToCloudinary(panFile, 'auto'),
        uploadToCloudinary(aadharFrontFile, 'auto'),
        uploadToCloudinary(aadharBackFile, 'auto')
      ]);

      const payload = {
        panNumber,
        aadharNumber,
        panImage: panUrl,
        aadharFrontImage: aadharFrontUrl,
        aadharBackImage: aadharBackUrl
      };

      const res = await apiUtil.post('/kyc/submit', payload);
      if (res.data.success) {
        AlertService.show('Success', 'KYC Submitted Successfully!', 'success', [
          {
            text: 'OK', onPress: () => {
              setKycStatus('pending');
              setShowUploadForm(false);
              checkStatus();
            }
          }
        ]);
      } else {
        AlertService.show('Submission Failed', res.data.message || 'Please try again.', 'error');
      }
    } catch (err) {
      console.log('KYC Submit Error', err);
      AlertService.show('Error', err.message || 'Failed to upload documents or submit data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Status Screen Pending View (matches screenshots styles)
  const renderPendingView = () => (
    <View style={styles.centerMsg}>
      <View style={styles.statusIconCircle}>
        <IonIcon name="time" size={60} color="#f59e0b" />
      </View>
      <Text style={styles.msgTitle}>Verification Pending</Text>
      <Text style={styles.msgBody}>
        Your KYC documents are under review. Please wait for admin approval.
      </Text>
      <TouchableOpacity style={styles.backButtonHome} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonHomeText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );

  // Status Screen Approved View
  const renderApprovedView = () => (
    <View style={styles.centerMsg}>
      <View style={[styles.statusIconCircle, { borderColor: '#10b981' }]}>
        <IonIcon name="checkmark-circle" size={60} color="#10b981" />
      </View>
      <Text style={styles.msgTitle}>KYC Verified</Text>
      <Text style={styles.msgBody}>
        Your account is fully verified. You can now withdraw funds.
      </Text>
      <TouchableOpacity style={styles.backButtonHome} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonHomeText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );

  // Main Aadhaar landing page
  const renderLandingView = () => (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Aadhaar Live Verification Card */}
      <View style={styles.bannerWrapper}>
        <LinearGradient
          colors={['#03dcfe', '#d946ef']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.bannerBorder}
        >
          <LinearGradient
            colors={['rgba(23, 11, 78, 0.9)', 'rgba(7, 6, 40, 0.9)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.bannerBody}
          >
            {/* Left side Aadhaar Card graphic */}
            <View style={styles.bannerLeft}>
              <View style={styles.cardGraphicWrap}>
                {/* Aadhaar template outline card */}
                <View style={styles.aadharOutlineCard}>
                  <View style={styles.aadharHeaderLine} />
                  <View style={styles.aadharBodyRow}>
                    <View style={styles.aadharPhotoBox} />
                    <View style={styles.aadharTextLines}>
                      <View style={[styles.lineText, { width: '80%' }]} />
                      <View style={[styles.lineText, { width: '60%' }]} />
                      <View style={[styles.lineText, { width: '90%' }]} />
                    </View>
                  </View>
                  <View style={styles.aadharFooterLine} />
                </View>
                {/* Green verified rosette check badge overlay */}
                <View style={styles.verifiedRosette}>
                  <IonIcon name="checkmark-sharp" size={10} color="#fff" />
                </View>
              </View>
            </View>

            {/* Right details */}
            <View style={styles.bannerRight}>
              <Text style={styles.bannerCardTitle}>Aadhaar Card</Text>
              <Text style={styles.bannerCardSubTitle}>Live Verification</Text>
              <Text style={styles.bannerCardDesc}>
                Complete your identity verification to unlock all features.
              </Text>
              <View style={styles.secureIndicatorsRow}>
                <View style={styles.indicatorItem}>
                  <IonIcon name="shield-checkmark" size={12} color="#8b5cf6" style={{ marginRight: 4 }} />
                  <Text style={styles.indicatorText}>100% Secure</Text>
                </View>
                <View style={styles.indicatorItem}>
                  <IonIcon name="lock-closed" size={12} color="#0ea5e9" style={{ marginRight: 4 }} />
                  <Text style={styles.indicatorText}>Your data is safe with us</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </LinearGradient>
      </View>

      {/* Section 1: Verification Steps */}
      <Text style={styles.sectionTitle}>Verification Steps</Text>
      <View style={styles.stepsCard}>
        <View style={styles.stepsInnerRow}>
          
          {/* Step 1 */}
          <View style={styles.stepItem}>
            <View style={styles.stepIconWrap}>
              <IonIcon name="document-text-outline" size={16} color="#8b5cf6" />
            </View>
            <View style={[styles.stepNumberBadge, { backgroundColor: '#8b5cf6' }]}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.stepLabel}>Aadhaar Details</Text>
            <Text style={styles.stepSubText}>Enter your details</Text>
          </View>

          <View style={styles.stepConnectorLine} />

          {/* Step 2 */}
          <View style={styles.stepItem}>
            <View style={styles.stepIconWrap}>
              <IonIcon name="camera-outline" size={16} color="#3b82f6" />
            </View>
            <View style={[styles.stepNumberBadge, { backgroundColor: '#3b82f6' }]}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.stepLabel}>Scan Aadhaar</Text>
            <Text style={styles.stepSubText}>Scan front side</Text>
          </View>

          <View style={styles.stepConnectorLine} />

          {/* Step 3 */}
          <View style={styles.stepItem}>
            <View style={styles.stepIconWrap}>
              <IonIcon name="scan-outline" size={16} color="#0ea5e9" />
            </View>
            <View style={[styles.stepNumberBadge, { backgroundColor: '#0ea5e9' }]}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={styles.stepLabel}>Liveness Check</Text>
            <Text style={styles.stepSubText}>Live face detection</Text>
          </View>

          <View style={styles.stepConnectorLine} />

          {/* Step 4 */}
          <View style={styles.stepItem}>
            <View style={styles.stepIconWrap}>
              <IonIcon name="checkmark-circle-outline" size={16} color="#10b981" />
            </View>
            <View style={[styles.stepNumberBadge, { backgroundColor: '#10b981' }]}>
              <Text style={styles.stepNumberText}>4</Text>
            </View>
            <Text style={styles.stepLabel}>Verification</Text>
            <Text style={styles.stepSubText}>Get verified</Text>
          </View>
        </View>
      </View>

      {/* Section 2: What you need */}
      <Text style={styles.sectionTitle}>What you need</Text>
      <View style={styles.requirementsGrid}>
        
        {/* Requirement 1 */}
        <View style={styles.requirementItem}>
          <View style={styles.reqIconWrap}>
            <IonIcon name="card-outline" size={18} color="#8b5cf6" />
          </View>
          <Text style={styles.reqTitle}>Original Aadhaar Card</Text>
          <Text style={styles.reqSub}>Physical Aadhaar card is required</Text>
        </View>

        {/* Requirement 2 */}
        <View style={styles.requirementItem}>
          <View style={styles.reqIconWrap}>
            <IonIcon name="sunny-outline" size={18} color="#facc15" />
          </View>
          <Text style={styles.reqTitle}>Good Lighting</Text>
          <Text style={styles.reqSub}>Ensure your face is clearly visible</Text>
        </View>

        {/* Requirement 3 */}
        <View style={styles.requirementItem}>
          <View style={styles.reqIconWrap}>
            <IonIcon name="wifi-outline" size={18} color="#0ea5e9" />
          </View>
          <Text style={styles.reqTitle}>Stable Connection</Text>
          <Text style={styles.reqSub}>Make sure you have a stable internet</Text>
        </View>
      </View>

      {/* Encryption security banner */}
      <View style={styles.encryptionCard}>
        <IonIcon name="shield-checkmark-outline" size={20} color="#10b981" style={{ marginRight: 10 }} />
        <View style={{ flex: 1 }}>
          <Text style={styles.encryptionText}>
            We use advanced encryption to protect your data.
          </Text>
          <Text style={styles.encryptionSubtext}>
            Your information is safe and will never be shared.
          </Text>
        </View>
        <IonIcon name="chevron-forward" size={14} color="rgba(255,255,255,0.3)" />
      </View>

      {/* Submit Action Button */}
      <TouchableOpacity
        style={styles.startBtn}
        onPress={() => setShowUploadForm(true)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#03dcfe', '#2911fe']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.startGradient}
        >
          <Text style={styles.startBtnText}>Start Aadhaar Verification</Text>
          <IonIcon name="arrow-forward" size={16} color="#fff" style={{ marginLeft: 6 }} />
        </LinearGradient>
      </TouchableOpacity>

      {/* Privacy lock caption */}
      <View style={styles.privacyCaption}>
        <IonIcon name="lock-closed-outline" size={12} color="rgba(255, 255, 255, 0.4)" style={{ marginRight: 4 }} />
        <Text style={styles.privacyCaptionText}>Your privacy is our priority</Text>
      </View>
    </ScrollView>
  );

  // Document upload form view
  const renderUploadForm = () => (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Return button row */}
      <View style={styles.formHeaderRow}>
        <TouchableOpacity style={styles.formBackBtn} onPress={() => setShowUploadForm(false)}>
          <IonIcon name="arrow-back" size={16} color="#03dcfe" style={{ marginRight: 4 }} />
          <Text style={styles.formBackText}>Back to Verification</Text>
        </TouchableOpacity>
        <Text style={styles.formTitle}>Submit Documents</Text>
      </View>

      {/* Pan Card Details Card */}
      <View style={styles.glassCard}>
        <Text style={styles.cardHeaderTitle}>Pan Card Details</Text>
        
        <View style={styles.inputWrap}>
          <Text style={styles.inputLabel}>Pan Number</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter Pan Number"
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={panNumber}
            onChangeText={setPanNumber}
            maxLength={10}
            autoCapitalize="characters"
          />
        </View>

        <View style={styles.inputWrap}>
          <Text style={styles.inputLabel}>Upload Pan Image</Text>
          <TouchableOpacity
            style={[styles.uploadBox, panFile && styles.uploadBoxActive]}
            onPress={() => handleFilePick(setPanFile)}
            activeOpacity={0.8}
          >
            <IonIcon
              name={panFile ? "checkmark-circle" : "cloud-upload-outline"}
              size={24}
              color={panFile ? "#10b981" : "#03dcfe"}
            />
            <Text style={styles.uploadBoxText} numberOfLines={1}>
              {panFile ? panFile.name : 'Choose PAN card image'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Aadhaar Details Card */}
      <View style={styles.glassCard}>
        <Text style={styles.cardHeaderTitle}>Aadhaar Card Details</Text>

        <View style={styles.inputWrap}>
          <Text style={styles.inputLabel}>Aadhaar Number</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter Aadhaar Number"
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={aadharNumber}
            onChangeText={setAadharNumber}
            keyboardType="numeric"
            maxLength={12}
          />
        </View>

        {/* Aadhaar Front Side */}
        <View style={styles.inputWrap}>
          <Text style={styles.inputLabel}>Aadhaar Front Side</Text>
          <TouchableOpacity
            style={[styles.uploadBox, aadharFrontFile && styles.uploadBoxActive]}
            onPress={() => handleFilePick(setAadharFrontFile)}
            activeOpacity={0.8}
          >
            <IonIcon
              name={aadharFrontFile ? "checkmark-circle" : "cloud-upload-outline"}
              size={24}
              color={aadharFrontFile ? "#10b981" : "#03dcfe"}
            />
            <Text style={styles.uploadBoxText} numberOfLines={1}>
              {aadharFrontFile ? aadharFrontFile.name : 'Choose Aadhaar Front image'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Aadhaar Back Side */}
        <View style={styles.inputWrap}>
          <Text style={styles.inputLabel}>Aadhaar Back Side</Text>
          <TouchableOpacity
            style={[styles.uploadBox, aadharBackFile && styles.uploadBoxActive]}
            onPress={() => handleFilePick(setAadharBackFile)}
            activeOpacity={0.8}
          >
            <IonIcon
              name={aadharBackFile ? "checkmark-circle" : "cloud-upload-outline"}
              size={24}
              color={aadharBackFile ? "#10b981" : "#03dcfe"}
            />
            <Text style={styles.uploadBoxText} numberOfLines={1}>
              {aadharBackFile ? aadharBackFile.name : 'Choose Aadhaar Back image'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={styles.startBtn}
        onPress={handleSubmit}
        activeOpacity={0.8}
        disabled={loading}
      >
        <LinearGradient
          colors={['#03dcfe', '#2911fe']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.startGradient}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Text style={styles.startBtnText}>Submit verification</Text>
              <IonIcon name="send-outline" size={14} color="#fff" style={{ marginLeft: 6 }} />
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
  );

  if (fetching) {
    return (
      <ScreenBackgroundView style={[{ flex: 1, backgroundColor: '#F8FAFC' }, { justifyContent: 'center', alignItems: 'center' }]}>
        <ScreenBackgroundStatusBar translucent backgroundColor="transparent" barStyle="light-content" animated />
        <LinearGradient colors={['#08031a', '#050212', '#020108']} style={ScreenBackgroundStyleSheet.absoluteFillObject} />
        <ActivityIndicator size="large" color="#03dcfe" />
      </ScreenBackgroundView>
    );
  }

  return (
    <ScreenBackgroundView style={[{ flex: 1, backgroundColor: '#08031a' }]}>
      <ScreenBackgroundStatusBar backgroundColor="#FFFFFF" barStyle="dark-content" animated />
      <LinearGradient colors={['#08031a', '#050212', '#020108']} style={ScreenBackgroundStyleSheet.absoluteFillObject} />
      {/* Background overlay stars */}
      <View style={styles.starOverlay1} />
      <View style={styles.starOverlay2} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topSafeInset + 8 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <IonIcon name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('kyc.title') || 'Verification'}</Text>
        <TouchableOpacity style={styles.headerRosetteBtn}>
          <IonIcon name="ribbon-outline" size={20} color="#a855f7" />
        </TouchableOpacity>
      </View>
      <AnimatedTitleLine />

      {kycStatus === 'pending' ? renderPendingView() : kycStatus === 'approved' ? renderApprovedView() : showUploadForm ? renderUploadForm() : renderLandingView()}
    </ScreenBackgroundView>
  );
};

const styles = StyleSheet.create({
  starOverlay1: {
    position: 'absolute',
    top: height * 0.2,
    left: width * 0.15,
    width: 2,
    height: 2,
    backgroundColor: '#fff',
    opacity: 0.25,
  },
  starOverlay2: {
    position: 'absolute',
    top: height * 0.6,
    right: width * 0.2,
    width: 2.5,
    height: 2.5,
    backgroundColor: '#fff',
    opacity: 0.35,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 15 : 20,
    paddingBottom: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  headerRosetteBtn: {
    width: 44,
    height: 44,
    // removed invalid justify('center', 'center')
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 60,
  },

  // Banner Verification Card
  bannerWrapper: {
    width: '100%',
    marginBottom: 20,
  },
  bannerBorder: {
    borderRadius: 24,
    padding: 1.5,
  },
  bannerBody: {
    flexDirection: 'row',
    borderRadius: 22.5,
    padding: 16,
    alignItems: 'center',
  },
  bannerLeft: {
    flex: 0.85,
    justifyContent: 'center',
  },
  cardGraphicWrap: {
    width: 90,
    height: 60,
    position: 'relative',
  },
  aadharOutlineCard: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    backgroundColor: '#fff',
    padding: 4,
    justifyContent: 'space-between',
  },
  aadharHeaderLine: {
    height: 4,
    backgroundColor: '#f97316',
    borderRadius: 1,
  },
  aadharBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginVertical: 4,
  },
  aadharPhotoBox: {
    width: 22,
    height: 28,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    marginRight: 4,
  },
  aadharTextLines: {
    flex: 1,
    justifyContent: 'space-between',
    height: 20,
  },
  lineText: {
    height: 3,
    backgroundColor: '#94a3b8',
    borderRadius: 1,
  },
  aadharFooterLine: {
    height: 4,
    backgroundColor: '#10b981',
    borderRadius: 1,
  },
  verifiedRosette: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#0c0628',
  },

  bannerRight: {
    flex: 1.15,
    paddingLeft: 12,
  },
  bannerCardTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  bannerCardSubTitle: {
    color: '#03dcfe',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  bannerCardDesc: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 10,
    fontWeight: '500',
    lineHeight: 14,
    marginBottom: 8,
  },
  secureIndicatorsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  indicatorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 4,
  },
  indicatorText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 8,
    fontWeight: '700',
  },

  // Section Steps
  sectionTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  stepsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 24,
    padding: 16,
    marginBottom: 20,
  },
  stepsInnerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  stepNumberBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '900',
  },
  stepLabel: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 2,
  },
  stepSubText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 7,
    fontWeight: '600',
    textAlign: 'center',
  },
  stepConnectorLine: {
    width: '5%',
    height: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 24,
  },

  // Requirements Grid
  requirementsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  requirementItem: {
    width: '31.5%',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1.2,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 18,
    padding: 10,
    alignItems: 'center',
    height: 110,
    justifyContent: 'center',
  },
  reqIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.04)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  reqTitle: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  reqSub: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 7,
    fontWeight: '500',
    textAlign: 'center',
  },

  // Encryption Card
  encryptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    borderRadius: 20,
    padding: 12,
    marginBottom: 20,
  },
  encryptionText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 2,
  },
  encryptionSubtext: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 8,
    fontWeight: '600',
  },

  // Start Verification Button
  startBtn: {
    borderRadius: 24,
    overflow: 'hidden',
    marginTop: 10,
  },
  startGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
  },
  startBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  privacyCaption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  privacyCaptionText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 9,
    fontWeight: '500',
  },

  // Form View Styles
  formHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  formBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(3, 220, 254, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(3, 220, 254, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
  },
  formBackText: {
    color: '#03dcfe',
    fontSize: 9,
    fontWeight: '800',
  },
  formTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  glassCard: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1.2,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 24,
    padding: 16,
    marginBottom: 20,
  },
  cardHeaderTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  inputWrap: {
    marginBottom: 14,
  },
  inputLabel: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1.2,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 48,
    color: '#fff',
    fontSize: 12,
  },
  uploadBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1.2,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 48,
  },
  uploadBoxActive: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.03)',
  },
  uploadBoxText: {
    flex: 1,
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 10,
  },

  // Center Message Pending/Approved Views
  centerMsg: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    height: height * 0.7,
  },
  statusIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1.5,
    borderColor: '#f59e0b',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  msgTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  msgBody: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 30,
  },
  backButtonHome: {
    backgroundColor: 'rgba(3, 220, 254, 0.05)',
    borderWidth: 1.2,
    borderColor: 'rgba(3, 220, 254, 0.35)',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  backButtonHomeText: {
    color: '#03dcfe',
    fontSize: 12,
    fontWeight: '800',
  },
});

export default Kyc;