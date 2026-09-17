import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Platform,
  Dimensions,
  Image,
  Modal,
  KeyboardAvoidingView,
  Linking,
  View as ScreenBackgroundView,
  StatusBar as ScreenBackgroundStatusBar,
  StyleSheet as ScreenBackgroundStyleSheet
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import IonIcon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';
import { pick, types } from '@react-native-documents/picker';
import { apiUtil, getApiErrorMessage } from '../../utils/apiUtil';
import { uploadToCloudinary } from '../../utils/cloudinaryUtil';
import { useTranslation } from 'react-i18next';
import AnimatedTitleLine from '../../components/AnimatedTitleLine';
import { AlertService } from '../../utils/AlertService';

const { width, height } = Dimensions.get('window');

const HelpAndSupport = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomPadding = getStackScreenBottomPadding(insets.bottom, 40);
  const { t } = useTranslation();
  
  // Toggle different views
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [showHelpBot, setShowHelpBot] = useState(false);
  const [showTicketHistory, setShowTicketHistory] = useState(false);

  // Ticket detail modal
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showTicketDetail, setShowTicketDetail] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);

  // Ticket history lists
  const [ticketsList, setTicketsList] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  // Chatbot states
  const [chatbotMessages, setChatbotMessages] = useState([
    { id: 'welcome', sender: 'bot', text: 'Hello! I am the Meethi Chat Assistant. Choose a topic below or submit a support ticket.' },
  ]);
  const [botInputValue, setBotInputValue] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);

  // Form states
  const [reason, setReason] = useState('None');
  const [otherReason, setOtherReason] = useState('');
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const reasons = ['Add Coin Issue', 'Call Issue', 'OTP / Login Issue', 'Face Verification Issue', 'KYC Verification Issue', 'User Report', 'Host Report', 'Withdraw Issue', 'Bank Account Issue', 'Notification Issue', 'Other'];

  const handleEmailSupport = async () => {
    const emailUrl = 'mailto:support@meethichat.live';
    try {
      const supported = await Linking.canOpenURL(emailUrl);
      if (supported) {
        await Linking.openURL(emailUrl);
      } else {
        AlertService.show('Email Support', 'Please send an email to support@meethichat.live', 'info');
      }
    } catch (err) {
      AlertService.show('Email Support', 'Please send an email to support@meethichat.live', 'info');
    }
  };

  const handleFilePick = async () => {
    try {
      const res = await pick({
        type: [types.allFiles],
        allowMultiSelection: false,
      });
      if (res && res.length > 0) {
        setSelectedFile(res[0]);
      }
    } catch (err) {
      if (err.code !== 'CANCELED' && err.code !== 'DOCUMENT_PICKER_CANCELED' && err.code !== 'OPERATION_CANCELED') {
        console.log('DocumentPicker Error', err);
        AlertService.show('Error', 'Failed to pick file', 'error');
      }
    }
  };

  const handleSubmit = async () => {
    if (reason === 'None') {
      AlertService.show('Required', 'Please select a reason.', 'error');
      return;
    }
    if (reason === 'Other' && !otherReason.trim()) {
      AlertService.show('Required', 'Please specify the reason.', 'error');
      return;
    }
    if (!query.trim()) {
      AlertService.show('Required', 'Please enter your query.', 'error');
      return;
    }

    setLoading(true);
    try {
      const finalReason = reason === 'Other' ? otherReason : reason;
      let imageUrl = '';

      if (selectedFile) {
        imageUrl = await uploadToCloudinary(selectedFile, 'auto');
      }

      const payload = {
        reason: finalReason,
        message: query,
        image: imageUrl,
      };

      const res = await apiUtil.post('/help', payload);
      if (res.data.success) {
        AlertService.show('Success', 'Your request has been submitted successfully!', 'success', [
          { text: 'OK', onPress: () => {
            setShowTicketForm(false);
            setQuery('');
            setReason('None');
            setSelectedFile(null);
          }}
        ]);
      } else {
        AlertService.show('Error', res.data.message || 'Failed to submit request', 'error');
      }
    } catch (err) {
      console.log('Submit Error', err);
      AlertService.show('Error', getApiErrorMessage(err, 'Ticket submit nahi ho paaya. Dobara try karein.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const faqBotData = {
    'How to use Meethi Voice Chat?': 'Open the Home screen, select an online host and tap Call. Calls use 100 diamonds per started minute. Keep a stable internet connection and allow microphone permission.',
    'How to earn coins and diamonds?': 'Users purchase diamonds for calls and gifts. Hosts earn coins from eligible call time according to their host level and from supported rewards.',
    'How to withdraw my earnings?': 'Go to Profile > Withdrawal, enter coins and choose Bank or UPI. Before confirmation you will see the withdrawal amount, 5% platform fee, coins deducted and final amount you will receive.',
    'Account & Verification': 'Go to Profile > Verification. Face Verification requires a fresh live selfie. KYC is a separate manual process using PAN, Voter ID, Driving Licence, Passport or another accepted government ID. Aadhaar Face Auth is not used.',
    'Calls & Connectivity Issues': 'Use a stable Wi-Fi or 4G/5G connection and allow microphone permission. If a call duration or balance looks wrong, submit a ticket with call time, other user ID and a screenshot.',
    'Gifts & Transactions': 'Buy diamonds using the plus button near your balance. During a call, tap the gift icon. For a missing transaction, submit a ticket with the date, amount and transaction reference.',
    'Report a User or Problem': 'Open Help & Support > Submit a Ticket, choose the correct reason, describe the issue and attach a screenshot if available. Replies appear in Ticket History.',
  };

  const botQuestions = [
    'How to use Meethi Voice Chat?',
    'How to earn coins and diamonds?',
    'How to withdraw my earnings?',
    'Account & Verification',
    'Calls & Connectivity Issues',
    'Gifts & Transactions',
    'Report a User or Problem'
  ];

  const handleSendBotMessage = (text) => {
    if (!text.trim()) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: text,
    };

    setChatbotMessages(prev => [...prev, userMsg]);
    setBotInputValue('');
    setIsBotTyping(true);

    setTimeout(() => {
      setIsBotTyping(false);
      const replyText = faqBotData[text] || "Please choose one of the listed topics or submit a ticket so our support team can help you.";
      const botMsg = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: replyText,
      };
      setChatbotMessages(prev => [...prev, botMsg]);
    }, 800);
  };

  const fetchTickets = async () => {
    setLoadingTickets(true);
    try {
      const res = await apiUtil.get('/help');
      if (res.data.success) {
        setTicketsList(res.data.data || []);
      }
    } catch (err) {
      console.log('Error fetching user tickets:', err);
      AlertService.show('Unable to load tickets', getApiErrorMessage(err), 'error');
    } finally {
      setLoadingTickets(false);
    }
  };

  const handleOpenTicketDetail = (ticket) => {
    setSelectedTicket(ticket);
    setShowTicketDetail(true);
    setReplyText('');
  };

  const handleUserReply = async () => {
    if (!replyText.trim()) return;
    setReplyLoading(true);
    try {
      const res = await apiUtil.post(`/help/${selectedTicket._id}/reply`, { message: replyText.trim() });
      if (res.data.success) {
        const updated = res.data.data;
        setSelectedTicket(updated);
        // Update in list too
        setTicketsList(prev => prev.map(t => t._id === updated._id ? updated : t));
        setReplyText('');
        AlertService.show('Sent', 'Your reply has been submitted.', 'success');
      } else {
        AlertService.show('Error', res.data.message || 'Failed to submit reply', 'error');
      }
    } catch (err) {
      console.log('Reply error:', err);
      AlertService.show('Error', getApiErrorMessage(err, 'Reply send nahi ho paaya.'), 'error');
    } finally {
      setReplyLoading(false);
    }
  };

  const handleHeaderBack = () => {
    if (showTicketForm) {
      setShowTicketForm(false);
    } else if (showHelpBot) {
      setShowHelpBot(false);
    } else if (showTicketHistory) {
      setShowTicketHistory(false);
    } else {
      navigation.goBack();
    }
  };

  // Rendering of default FAQ Landing View
  const renderLandingView = () => {
    const faqs = [
      { q: 'How to use Meethi Voice Chat?', icon: 'person-outline', color: '#a855f7' },
      { q: 'How to earn coins and diamonds?', icon: 'shield-checkmark-outline', color: '#3b82f6' },
      { q: 'How to withdraw my earnings?', icon: 'wallet-outline', color: '#f59e0b' },
      { q: 'Account & Verification', icon: 'shield-outline', color: '#10b981' },
      { q: 'Calls & Connectivity Issues', icon: 'call-outline', color: '#ec4899' },
      { q: 'Gifts & Transactions', icon: 'gift-outline', color: '#8b5cf6' },
      { q: 'Report a User or Problem', icon: 'alert-circle-outline', color: '#06b6d4' }
    ];

    return (
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]} showsVerticalScrollIndicator={false}>
        {/* Support Header Card Banner with Headphones 3D Graphic */}
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
              <View style={styles.bannerLeft}>
                <Text style={styles.bannerTitle}>We're Here to Help You!</Text>
                <Text style={styles.bannerSubtitle}>
                  Facing an issue? Get quick solutions or contact our support team.
                </Text>
                
                {/* Quick actions buttons row */}
                <View style={styles.bannerActions}>
                  <TouchableOpacity
                    style={styles.chatSupportBtn}
                    activeOpacity={0.8}
                    onPress={() => setShowHelpBot(true)}
                  >
                    <IonIcon name="chatbubble-ellipses" size={14} color="#fff" style={{ marginRight: 4 }} />
                    <Text style={styles.btnText}>Chat with Support</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.emailBtn} activeOpacity={0.8} onPress={handleEmailSupport}>
                    <IonIcon name="mail-outline" size={14} color="#fff" style={{ marginRight: 4 }} />
                    <Text style={styles.btnText}>Email Us</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Headset 3D/Glowing vector representation */}
              <View style={styles.bannerRight}>
                <View style={styles.headsetCircleGlow}>
                  <IonIcon name="headset" size={48} color="#a855f7" />
                  <View style={styles.bubbleDot1} />
                  <View style={styles.bubbleDot2} />
                  <View style={styles.bubbleDot3} />
                </View>
              </View>
            </LinearGradient>
          </LinearGradient>
        </View>

        {/* FAQ Header Row */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeader}>Frequently Asked Questions</Text>
        </View>

        {/* FAQs List Container Card */}
        <View style={styles.faqsCard}>
          {faqs.map((faq, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.faqRow}
              activeOpacity={0.7}
              onPress={() => {
                setShowHelpBot(true);
                handleSendBotMessage(faq.q);
              }}
            >
              <View style={styles.faqLeft}>
                <View style={[styles.faqIconCircle, { backgroundColor: `${faq.color}15`, borderColor: `${faq.color}30` }]}>
                  <IonIcon name={faq.icon} size={15} color={faq.color} />
                </View>
                <Text style={styles.faqQuestion}>{faq.q}</Text>
              </View>
              <IonIcon name="chevron-forward" size={14} color="rgba(255, 255, 255, 0.3)" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Support options section */}
        <Text style={styles.sectionHeader}>Other Support Options</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.supportOptionsScroll}
        >
          {/* Email Support Box */}
          <TouchableOpacity style={styles.supportOptionBox} activeOpacity={0.8} onPress={handleEmailSupport}>
            <View style={[styles.optionIconCircle, { backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.25)' }]}>
              <IonIcon name="mail-unread-outline" size={18} color="#3b82f6" />
            </View>
            <Text style={styles.optionTitle}>Email Support</Text>
            <Text style={styles.optionDesc} numberOfLines={1}>support@meethichat.live</Text>
            <Text style={styles.optionCaption}>We will reply within 24 hrs</Text>
            <IonIcon name="chevron-forward" size={10} color="#3b82f6" style={styles.optionArrow} />
          </TouchableOpacity>

          {/* Submit a Ticket Box */}
          <TouchableOpacity
            style={styles.supportOptionBox}
            activeOpacity={0.85}
            onPress={() => setShowTicketForm(true)}
          >
            <View style={[styles.optionIconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.25)' }]}>
              <IonIcon name="document-text-outline" size={18} color="#10b981" />
            </View>
            <Text style={styles.optionTitle}>Submit a Ticket</Text>
            <Text style={styles.optionDesc}>Raise a ticket and our team will get back to you</Text>
            <IonIcon name="chevron-forward" size={10} color="#10b981" style={styles.optionArrow} />
          </TouchableOpacity>

          {/* View Submitted Tickets Box */}
          <TouchableOpacity
            style={styles.supportOptionBox}
            activeOpacity={0.85}
            onPress={() => {
              setShowTicketHistory(true);
              fetchTickets();
            }}
          >
            <View style={[styles.optionIconCircle, { backgroundColor: 'rgba(124, 77, 255, 0.1)', borderColor: 'rgba(124, 77, 255, 0.25)' }]}>
              <IonIcon name="list-outline" size={18} color="#7c4dff" />
            </View>
            <Text style={styles.optionTitle}>Ticket History</Text>
            <Text style={styles.optionDesc}>View responses for your submitted tickets</Text>
            <IonIcon name="chevron-forward" size={10} color="#7c4dff" style={styles.optionArrow} />
          </TouchableOpacity>
        </ScrollView>

        {/* Support Hours Card */}
        <View style={styles.hoursCard}>
          <View style={styles.hoursLeft}>
            <View style={styles.clockCircle}>
              <IonIcon name="time-outline" size={18} color="#a855f7" />
            </View>
            <View style={styles.hoursDetails}>
              <Text style={styles.hoursTitle}>Support Hours</Text>
              <Text style={styles.hoursDesc}>We are available 24/7 to assist you.</Text>
            </View>
          </View>
          <View style={styles.hoursPill}>
            <Text style={styles.hoursPillText}>24/7</Text>
          </View>
        </View>
      </ScrollView>
    );
  };

  // Rendering of Raise Ticket Form View
  const renderTicketForm = () => {
    return (
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]} showsVerticalScrollIndicator={false}>
        {/* Ticket Form Heading */}
        <View style={styles.formHeaderRow}>
          <TouchableOpacity style={styles.formBackBtn} onPress={() => setShowTicketForm(false)}>
            <IonIcon name="arrow-back" size={16} color="#03dcfe" style={{ marginRight: 4 }} />
            <Text style={styles.formBackText}>Back to Support</Text>
          </TouchableOpacity>
          <Text style={styles.formTitle}>Submit a Ticket</Text>
        </View>

        {/* Reason Selector Dropdown */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Select Reason</Text>
          <TouchableOpacity
            style={[styles.dropdownContainer, showDropdown && styles.activeBorder]}
            onPress={() => setShowDropdown(!showDropdown)}
            activeOpacity={0.8}
          >
            <Text style={styles.dropdownText}>{reason}</Text>
            <Icon name={showDropdown ? "keyboard-arrow-up" : "keyboard-arrow-down"} size={22} color="#03dcfe" />
          </TouchableOpacity>

          {showDropdown && (
            <View style={styles.dropdownList}>
              {reasons.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setReason(item);
                    setShowDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Custom Reason Specify */}
        {reason === 'Other' && (
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Specify Reason</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter details of your reason..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={otherReason}
              onChangeText={setOtherReason}
            />
          </View>
        )}

        {/* Ticket Query Content */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Describe your issue</Text>
          <View style={styles.textAreaContainer}>
            <TextInput
              style={styles.textArea}
              placeholder="Please type details here..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              multiline
              numberOfLines={6}
              value={query}
              onChangeText={setQuery}
              textAlignVertical="top"
              maxLength={300}
            />
            <Text style={styles.charCounter}>{query.length}/300</Text>
          </View>
        </View>

        {/* Attachments Section */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Attachments (Optional)</Text>
          <TouchableOpacity
            style={[styles.uploadButton, selectedFile && styles.uploadButtonActive]}
            onPress={handleFilePick}
            activeOpacity={0.8}
          >
            <Icon
              name={selectedFile ? "check-circle" : "cloud-upload"}
              size={32}
              color={selectedFile ? "#10b981" : "#03dcfe"}
            />
            <Text style={styles.uploadText}>
              {selectedFile ? selectedFile.name : 'Upload Screenshot / Video'}
            </Text>
            <Text style={styles.uploadSubtext}>Supports JPG, PNG, MP4 up to 5MB</Text>
          </TouchableOpacity>
        </View>

        {/* Submit Ticket Capsule Button */}
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSubmit}
          activeOpacity={0.8}
          disabled={loading}
        >
          <LinearGradient
            colors={['#03dcfe', '#2911fe']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitGradient}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text style={styles.submitBtnText}>Submit to Support</Text>
                <IonIcon name="send-outline" size={14} color="#fff" style={{ marginLeft: 6 }} />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  // Rendering of FAQ Helper Chatbot Screen
  const renderHelpBotView = () => {
    return (
      <View style={styles.chatBotContainer}>
        {/* Chat log */}
        <ScrollView
          style={styles.chatMessagesScroll}
          contentContainerStyle={{ paddingBottom: 20 }}
          ref={(ref) => { this.scrollView = ref; }}
          onContentSizeChange={() => this.scrollView?.scrollToEnd({ animated: true })}
        >
          {chatbotMessages.map((msg) => {
            const isBot = msg.sender === 'bot';
            return (
              <View key={msg.id} style={[styles.chatRow, isBot ? styles.chatRowBot : styles.chatRowUser]}>
                {isBot && (
                  <View style={styles.botAvatarBadge}>
                    <IonIcon name="logo-android" size={14} color="#fff" />
                  </View>
                )}
                <View style={[styles.chatBubble, isBot ? styles.chatBubbleBot : styles.chatBubbleUser]}>
                  <Text style={styles.chatText}>{msg.text}</Text>
                </View>
              </View>
            );
          })}
          {isBotTyping && (
            <View style={[styles.chatRow, styles.chatRowBot]}>
              <View style={styles.botAvatarBadge}>
                <IonIcon name="logo-android" size={14} color="#fff" />
              </View>
              <View style={[styles.chatBubble, styles.chatBubbleBot, { paddingVertical: 10 }]}>
                <ActivityIndicator size="small" color="#a855f7" />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Quick FAQ Question list */}
        <View style={styles.quickQuestionsRow}>
          <Text style={styles.quickQuestionsTitle}>Frequently Asked Questions:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 10, paddingVertical: 6 }}>
            {botQuestions.map((q, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.quickQuestionChip}
                onPress={() => handleSendBotMessage(q)}
                activeOpacity={0.8}
              >
                <Text style={styles.quickQuestionText}>{q}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* TextInput Box */}
        <View style={[styles.botInputBar, { paddingBottom: Math.max(10, insets.bottom + 8) }]}>
          <TextInput
            style={styles.botTextInput}
            placeholder="Type your question..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={botInputValue}
            onChangeText={setBotInputValue}
            onSubmitEditing={() => handleSendBotMessage(botInputValue)}
          />
          <TouchableOpacity
            style={styles.botSendBtn}
            onPress={() => handleSendBotMessage(botInputValue)}
            activeOpacity={0.8}
          >
            <IonIcon name="send" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Rendering of Submitted Tickets History List
  const renderTicketHistoryView = () => {
    const getStatusColor = (status) => {
      if (status === 'resolved') return '#10b981';
      if (status === 'rejected') return '#ef4444';
      if (status === 'reopened') return '#f59e0b';
      return '#6366f1';
    };
    const getStatusLabel = (status) => {
      if (status === 'resolved') return 'Resolved';
      if (status === 'rejected') return 'Rejected';
      if (status === 'reopened') return 'Reopened';
      return 'Pending';
    };

    return (
      <View style={{ flex: 1 }}>
        {loadingTickets ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#03dcfe" />
            <Text style={{ color: 'rgba(255,255,255,0.6)', marginTop: 10, fontSize: 13 }}>Loading tickets...</Text>
          </View>
        ) : ticketsList.length === 0 ? (
          <View style={styles.modalEmptyState}>
            <IonIcon name="document-text-outline" size={48} color="rgba(255,255,255,0.2)" />
            <Text style={styles.modalEmptyStateText}>No tickets submitted yet</Text>
            <TouchableOpacity style={styles.historySupportBtn} onPress={() => setShowTicketForm(true)}>
              <Text style={styles.historySupportBtnText}>Submit a Ticket</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={ticketsList}
            keyExtractor={(item) => item._id}
            contentContainerStyle={{ padding: 16, paddingBottom: bottomPadding }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const statusColor = getStatusColor(item.status);
              const hasUnread = item.replies && item.replies.length > 0 && item.replies[item.replies.length - 1]?.sender === 'admin';
              return (
                <TouchableOpacity
                  style={styles.ticketCard}
                  activeOpacity={0.85}
                  onPress={() => handleOpenTicketDetail(item)}
                >
                  {/* Ticket number + status row */}
                  <View style={styles.ticketHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.ticketNumberText}>
                        {item.ticketNumber || '#—'}
                      </Text>
                      {hasUnread && (
                        <View style={styles.newReplyDot} />
                      )}
                    </View>
                    <View style={[styles.ticketStatusBadge, { backgroundColor: `${statusColor}20`, borderColor: `${statusColor}50` }]}>
                      <Text style={[styles.ticketStatusText, { color: statusColor }]}>
                        {getStatusLabel(item.status)}
                      </Text>
                    </View>
                  </View>

                  {/* Reason badge */}
                  <View style={styles.ticketReasonBadge}>
                    <Text style={styles.ticketReasonText}>{item.reason}</Text>
                  </View>

                  <Text style={styles.ticketDate}>
                    {new Date(item.createdAt).toLocaleDateString()} • {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>

                  <Text style={styles.ticketBody} numberOfLines={2}>{item.message}</Text>

                  {/* Admin reply preview */}
                  {item.adminReply ? (
                    <View style={styles.adminReplyPreview}>
                      <IonIcon name="chatbubble-outline" size={12} color="#10b981" />
                      <Text style={styles.adminReplyPreviewText} numberOfLines={1}>
                        Admin: {item.adminReply}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.adminReplyAwaiting}>Awaiting response...</Text>
                  )}

                  {/* Tap to view */}
                  <View style={styles.tapToViewRow}>
                    <Text style={styles.tapToViewText}>Tap to view full conversation</Text>
                    <IonIcon name="chevron-forward" size={12} color="rgba(255,255,255,0.3)" />
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}

        {/* Ticket Detail Modal */}
        <Modal
          visible={showTicketDetail}
          animationType="slide"
          onRequestClose={() => setShowTicketDetail(false)}
        >
          <View style={styles.detailModalContainer}>
            {/* Modal Header */}
            <View style={[styles.detailModalHeader, { paddingTop: topSafeInset + 10 }]}>
              <TouchableOpacity onPress={() => setShowTicketDetail(false)} style={styles.detailBackBtn}>
                <IonIcon name="arrow-back" size={20} color="#fff" />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={styles.detailModalTitle}>{selectedTicket?.ticketNumber || 'Ticket'}</Text>
                <Text style={styles.detailModalSubtitle}>{selectedTicket?.reason}</Text>
              </View>
              {selectedTicket && (
                <View style={[styles.ticketStatusBadge, {
                  backgroundColor: `${getStatusColor(selectedTicket.status)}20`,
                  borderColor: `${getStatusColor(selectedTicket.status)}50`,
                }]}>
                  <Text style={[styles.ticketStatusText, { color: getStatusColor(selectedTicket.status) }]}>
                    {getStatusLabel(selectedTicket.status)}
                  </Text>
                </View>
              )}
            </View>

            {/* Conversation Thread */}
            <ScrollView style={styles.threadScroll} contentContainerStyle={{ padding: 16, paddingBottom: 20 }}>
              {/* Original message */}
              {selectedTicket && (
                <View style={styles.threadBubbleUser}>
                  <View style={styles.threadBubbleHeader}>
                    <Text style={styles.threadBubbleSender}>You</Text>
                    <Text style={styles.threadBubbleTime}>
                      {new Date(selectedTicket.createdAt).toLocaleDateString()} {new Date(selectedTicket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  <Text style={styles.threadBubbleText}>{selectedTicket.message}</Text>
                  {selectedTicket.image ? (
                    <Image source={{ uri: selectedTicket.image }} style={{ width: '100%', height: 140, borderRadius: 8, marginTop: 8 }} resizeMode="cover" />
                  ) : null}
                </View>
              )}

              {/* All replies in thread */}
              {selectedTicket?.replies?.map((reply, idx) => (
                <View
                  key={idx}
                  style={reply.sender === 'admin' ? styles.threadBubbleAdmin : styles.threadBubbleUser}
                >
                  <View style={styles.threadBubbleHeader}>
                    <Text style={[styles.threadBubbleSender, reply.sender === 'admin' && { color: '#10b981' }]}>
                      {reply.sender === 'admin' ? '🛡️ Support Team' : 'You'}
                    </Text>
                    <Text style={styles.threadBubbleTime}>
                      {new Date(reply.createdAt).toLocaleDateString()} {new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  <Text style={styles.threadBubbleText}>{reply.message}</Text>
                </View>
              ))}

              {(!selectedTicket?.replies || selectedTicket.replies.length === 0) && !selectedTicket?.adminReply && (
                <View style={styles.awaitingBox}>
                  <IonIcon name="time-outline" size={20} color="rgba(255,255,255,0.3)" />
                  <Text style={styles.awaitingText}>Support team will reply soon...</Text>
                </View>
              )}
            </ScrollView>

            {/* Reply Input */}
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
              <View style={[styles.replyInputBar, { paddingBottom: Math.max(12, insets.bottom + 8) }]}>
                <TextInput
                  style={styles.replyTextInput}
                  placeholder="Write your reply or reopen request..."
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={replyText}
                  onChangeText={setReplyText}
                  multiline
                  maxLength={500}
                />
                <TouchableOpacity
                  style={[styles.replySendBtn, (!replyText.trim() || replyLoading) && { opacity: 0.5 }]}
                  onPress={handleUserReply}
                  disabled={!replyText.trim() || replyLoading}
                >
                  {replyLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <IonIcon name="send" size={16} color="#fff" />
                  )}
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>
      </View>
    );
  };

  const renderContent = () => {
    if (showTicketForm) return renderTicketForm();
    if (showHelpBot) return renderHelpBotView();
    if (showTicketHistory) return renderTicketHistoryView();
    return renderLandingView();
  };

  return (
    <ScreenBackgroundView style={[{ flex: 1, backgroundColor: '#08031a' }]}>
      <ScreenBackgroundStatusBar translucent backgroundColor="transparent" barStyle="light-content" animated />
      <LinearGradient colors={['#08031a', '#050212', '#020108']} style={ScreenBackgroundStyleSheet.absoluteFillObject} />
      {/* Background Star overlays */}
      <View style={styles.starOverlay1} />
      <View style={styles.starOverlay2} />

      {/* Header Bar */}
      <View style={[styles.header, { paddingTop: topSafeInset + 8 }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleHeaderBack}>
          <IonIcon name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {showHelpBot ? 'Meethi Support Bot' : showTicketHistory ? 'Ticket History' : t('help.title') || 'Help & Support'}
        </Text>
        <TouchableOpacity style={styles.headerHeadsetBtn} onPress={() => setShowHelpBot(true)}>
          <IonIcon name="headset-outline" size={20} color="#a855f7" />
        </TouchableOpacity>
      </View>
      <AnimatedTitleLine />

      {renderContent()}
    </ScreenBackgroundView>
  );
};

const styles = StyleSheet.create({
  starOverlay1: {
    position: 'absolute',
    top: height * 0.15,
    left: width * 0.12,
    width: 2,
    height: 2,
    backgroundColor: '#fff',
    opacity: 0.25,
  },
  starOverlay2: {
    position: 'absolute',
    top: height * 0.5,
    right: width * 0.18,
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
  headerHeadsetBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 60,
  },

  // Support Card Banner
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
    overflow: 'hidden',
  },
  bannerLeft: {
    flex: 1.3,
  },
  bannerTitle: {
    color: '#e242eb',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  bannerSubtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 16,
    marginBottom: 14,
  },
  bannerActions: {
    flexDirection: 'row',
  },
  chatSupportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
  },
  emailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  btnText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
  },

  bannerRight: {
    flex: 0.8,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  headsetCircleGlow: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(168, 85, 247, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(168, 85, 247, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  bubbleDot1: {
    position: 'absolute',
    top: 10,
    left: -4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#d946ef',
  },
  bubbleDot2: {
    position: 'absolute',
    top: 2,
    right: 6,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#03dcfe',
  },
  bubbleDot3: {
    position: 'absolute',
    bottom: 8,
    right: -2,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#a855f7',
  },

  // FAQ Section
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeader: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  viewAllText: {
    color: '#d946ef',
    fontSize: 11,
    fontWeight: '700',
  },
  faqsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 24,
    paddingVertical: 6,
    marginBottom: 20,
  },
  faqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.03)',
  },
  faqLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  faqIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  faqQuestion: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '600',
  },

  // Other Support Options Grid
  supportOptionsScroll: {
    paddingRight: 16,
    paddingBottom: 4,
    marginBottom: 16,
  },
  supportOptionBox: {
    width: 145,
    marginRight: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    padding: 12,
    position: 'relative',
    height: 120,
  },
  optionIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionTitle: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 4,
  },
  optionDesc: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 9,
    fontWeight: '500',
    lineHeight: 12,
  },
  optionCaption: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 7,
    fontWeight: '500',
    marginTop: 4,
  },
  optionArrow: {
    position: 'absolute',
    top: 12,
    right: 12,
  },

  // Support Hours
  hoursCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    padding: 12,
  },
  hoursLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  clockCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    borderColor: 'rgba(168, 85, 247, 0.25)',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  hoursDetails: {
    flex: 1,
  },
  hoursTitle: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 2,
  },
  hoursDesc: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 9,
    fontWeight: '500',
  },
  hoursPill: {
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.35)',
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  hoursPillText: {
    color: '#a855f7',
    fontSize: 8,
    fontWeight: '800',
  },

  // Raise Ticket Form Styling
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
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 8,
  },
  dropdownContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1.2,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 48,
  },
  activeBorder: {
    borderColor: '#03dcfe',
  },
  dropdownText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  dropdownList: {
    backgroundColor: 'rgba(11, 8, 44, 0.98)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    marginTop: 6,
    paddingVertical: 6,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  dropdownItemText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
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
  textAreaContainer: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1.2,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  textArea: {
    color: '#fff',
    fontSize: 12,
    height: 100,
  },
  charCounter: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 9,
    textAlign: 'right',
    marginTop: 4,
  },
  uploadButton: {
    height: 100,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  uploadButtonActive: {
    borderColor: '#10b981',
    borderStyle: 'solid',
  },
  uploadText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 6,
    marginBottom: 2,
    textAlign: 'center',
  },
  uploadSubtext: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 8,
    fontWeight: '500',
  },
  submitBtn: {
    marginTop: 10,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 40,
  },
  submitGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  chatBotContainer: {
    flex: 1,
    backgroundColor: '#070628',
  },
  chatMessagesScroll: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  chatRow: {
    flexDirection: 'row',
    marginVertical: 6,
    alignItems: 'flex-end',
    width: '100%',
  },
  chatRowBot: {
    justifyContent: 'flex-start',
  },
  chatRowUser: {
    justifyContent: 'flex-end',
  },
  botAvatarBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#a855f7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 4,
  },
  chatBubble: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxLength: '80%',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  chatBubbleBot: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    maxWidth: '80%',
  },
  chatBubbleUser: {
    backgroundColor: '#3b82f6',
    borderTopRightRadius: 4,
    maxWidth: '80%',
  },
  chatText: {
    color: '#fff',
    fontSize: 13,
    lineHeight: 18,
  },
  quickQuestionsRow: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 8,
    backgroundColor: 'rgba(7, 6, 40, 0.4)',
  },
  quickQuestionsTitle: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 16,
    marginBottom: 2,
  },
  quickQuestionChip: {
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 4,
  },
  quickQuestionText: {
    color: '#c084fc',
    fontSize: 11,
    fontWeight: '600',
  },
  botInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#070628',
  },
  botTextInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: '#fff',
    fontSize: 13,
    marginRight: 10,
    height: 40,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  botSendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalEmptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  modalEmptyStateText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 14,
    marginTop: 12,
    marginBottom: 20,
  },
  historySupportBtn: {
    backgroundColor: '#03dcfe',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  historySupportBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  ticketCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ticketReasonBadge: {
    backgroundColor: 'rgba(3, 220, 254, 0.1)',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  ticketReasonText: {
    color: '#03dcfe',
    fontSize: 11,
    fontWeight: 'bold',
  },
  ticketStatusBadge: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusPending: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  statusResolved: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  statusRejected: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  ticketStatusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  ticketDate: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 10,
    marginBottom: 12,
  },
  ticketLabel: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  ticketBody: {
    color: '#fff',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  ticketImageAttachment: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    backgroundColor: '#000',
    marginBottom: 12,
  },
  ticketDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginVertical: 10,
  },
  adminReplySection: {
    marginTop: 4,
  },
  adminReplyLabel: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  adminReplyBody: {
    color: '#c084fc',
    fontSize: 12,
    lineHeight: 18,
    backgroundColor: 'rgba(168, 85, 247, 0.08)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.15)',
  },
  adminReplyAwaiting: {
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 4,
  },
  // New: Ticket Number
  ticketNumberText: {
    color: '#03dcfe',
    fontSize: 12,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  newReplyDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10b981',
  },
  adminReplyPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  },
  adminReplyPreviewText: {
    color: '#10b981',
    fontSize: 11,
    flex: 1,
  },
  tapToViewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 4,
  },
  tapToViewText: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 10,
  },
  // Detail Modal
  detailModalContainer: {
    flex: 1,
    backgroundColor: '#07042e',
  },
  detailModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    gap: 10,
  },
  detailBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailModalTitle: {
    color: '#03dcfe',
    fontSize: 14,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  detailModalSubtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    marginTop: 2,
  },
  threadScroll: {
    flex: 1,
  },
  threadBubbleUser: {
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
    borderRadius: 12,
    borderBottomRightRadius: 4,
    padding: 12,
    marginBottom: 12,
    alignSelf: 'flex-end',
    maxWidth: '90%',
    width: '90%',
  },
  threadBubbleAdmin: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 12,
    borderBottomLeftRadius: 4,
    padding: 12,
    marginBottom: 12,
    alignSelf: 'flex-start',
    maxWidth: '90%',
    width: '90%',
  },
  threadBubbleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  threadBubbleSender: {
    color: '#a78bfa',
    fontSize: 11,
    fontWeight: '700',
  },
  threadBubbleTime: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
  },
  threadBubbleText: {
    color: '#fff',
    fontSize: 13,
    lineHeight: 19,
  },
  awaitingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    gap: 8,
  },
  awaitingText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 13,
    fontStyle: 'italic',
  },
  // Reply input bar
  replyInputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    gap: 10,
  },
  replyTextInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    color: '#fff',
    fontSize: 13,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxHeight: 100,
  },
  replySendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default HelpAndSupport;
