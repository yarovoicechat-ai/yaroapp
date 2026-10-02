import React, { useRef, useState } from 'react';
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
  StatusBar,
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

const { width } = Dimensions.get('window');

const HelpAndSupport = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomPadding = getStackScreenBottomPadding(insets.bottom, 36);
  const { t } = useTranslation();
  const chatScrollRef = useRef(null);

  // Toggle views
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [showHelpBot, setShowHelpBot] = useState(false);
  const [showTicketHistory, setShowTicketHistory] = useState(false);

  // Ticket detail modal
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showTicketDetail, setShowTicketDetail] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);

  // Ticket history
  const [ticketsList, setTicketsList] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  // Chatbot states
  const [chatbotMessages, setChatbotMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      text: 'Hello! Welcome to Yaro Assistant. Select a common issue below or submit a support ticket.',
    },
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

  const reasons = [
    'Add Diamonds / Beans Issue',
    'Call Issue',
    'OTP / Login Issue',
    'Face Verification Issue',
    'KYC Verification Issue',
    'User Report',
    'Host Report',
    'Withdraw Issue',
    'Bank Account Issue',
    'Notification Issue',
    'Other',
  ];

  const faqBotData = {
    'How to use Yaro Voice Chat?':
      'Open the Home screen, select an online host and tap Call. Calls use 100 diamonds per started minute. Keep a stable internet connection and allow microphone permission.',
    'How to earn coins and diamonds?':
      'Users purchase diamonds for calls and gifts. Hosts earn coins from eligible call time according to their host level and supported rewards.',
    'How to withdraw my earnings?':
      'Go to Profile > Withdrawal, enter coins and choose Bank or UPI. You will see 5% platform fee and final net payout.',
    'Account & Verification':
      'Face Verification requires a live selfie for hosts. KYC is for bank payouts using PAN, Voter ID, Driving Licence, or Passport.',
    'Calls & Connectivity Issues':
      'Ensure high speed 4G/5G or Wi-Fi with microphone permissions enabled.',
    'Gifts & Transactions':
      'Purchase diamonds via wallet. For missing transactions, provide transaction ID in a ticket.',
    'Report a User or Problem':
      'Submit a ticket with reason, detailed message, and screenshot.',
  };

  const botQuestions = [
    'How to use Yaro Voice Chat?',
    'How to earn coins and diamonds?',
    'How to withdraw my earnings?',
    'Account & Verification',
    'Calls & Connectivity Issues',
    'Gifts & Transactions',
    'Report a User or Problem',
  ];

  const handleEmailSupport = async () => {
    const emailUrl = 'mailto:support@yaroapp.in';
    try {
      const supported = await Linking.canOpenURL(emailUrl);
      if (supported) {
        await Linking.openURL(emailUrl);
      } else {
        AlertService.show('Email Support', 'Please email us at support@yaroapp.in', 'info');
      }
    } catch {
      AlertService.show('Email Support', 'Please email us at support@yaroapp.in', 'info');
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
      if (
        err.code !== 'CANCELED' &&
        err.code !== 'DOCUMENT_PICKER_CANCELED' &&
        err.code !== 'OPERATION_CANCELED'
      ) {
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
        AlertService.show(
          'Success',
          'Your support ticket has been submitted. Our team will get back to you shortly.',
          'success',
          [
            {
              text: 'OK',
              onPress: () => {
                setShowTicketForm(false);
                setQuery('');
                setReason('None');
                setSelectedFile(null);
              },
            },
          ]
        );
      } else {
        AlertService.show('Error', res.data.message || 'Failed to submit request', 'error');
      }
    } catch (err) {
      console.log('Submit Error', err);
      AlertService.show(
        'Error',
        getApiErrorMessage(err, 'Failed to submit ticket. Please try again.'),
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSendBotMessage = text => {
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
      const reply =
        faqBotData[text] ||
        'Thank you for reaching out! You can pick one of the topics below or submit a ticket to talk to our human support team.';
      const botMsg = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: reply,
      };
      setChatbotMessages(prev => [...prev, botMsg]);
    }, 600);
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
      AlertService.show('Error', getApiErrorMessage(err), 'error');
    } finally {
      setLoadingTickets(false);
    }
  };

  const handleOpenTicketDetail = ticket => {
    setSelectedTicket(ticket);
    setShowTicketDetail(true);
    setReplyText('');
  };

  const handleUserReply = async () => {
    if (!replyText.trim()) return;
    setReplyLoading(true);
    try {
      const res = await apiUtil.post(`/help/${selectedTicket._id}/reply`, {
        message: replyText.trim(),
      });
      if (res.data.success) {
        const updated = res.data.data;
        setSelectedTicket(updated);
        setTicketsList(prev => prev.map(t => (t._id === updated._id ? updated : t)));
        setReplyText('');
        AlertService.show('Sent', 'Your reply has been submitted.', 'success');
      } else {
        AlertService.show('Error', res.data.message || 'Failed to submit reply', 'error');
      }
    } catch (err) {
      console.log('Reply error:', err);
      AlertService.show('Error', getApiErrorMessage(err, 'Failed to send reply.'), 'error');
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

  const getStatusColor = status => {
    if (status === 'resolved') return '#10B981';
    if (status === 'rejected') return '#EF4444';
    if (status === 'reopened') return '#F59E0B';
    return '#6366F1';
  };

  const getStatusLabel = status => {
    if (status === 'resolved') return 'Resolved';
    if (status === 'rejected') return 'Rejected';
    if (status === 'reopened') return 'Reopened';
    return 'Pending';
  };

  // 1. Landing View
  const renderLandingView = () => {
    const faqs = [
      { q: 'How to use Yaro Voice Chat?', icon: 'mic-outline', color: '#8B5CF6' },
      { q: 'How to earn coins and diamonds?', icon: 'diamond-outline', color: '#06B6D4' },
      { q: 'How to withdraw my earnings?', icon: 'wallet-outline', color: '#10B981' },
      { q: 'Account & Verification', icon: 'shield-checkmark-outline', color: '#EC4899' },
      { q: 'Calls & Connectivity Issues', icon: 'wifi-outline', color: '#F59E0B' },
      { q: 'Gifts & Transactions', icon: 'gift-outline', color: '#3B82F6' },
      { q: 'Report a User or Problem', icon: 'alert-circle-outline', color: '#EF4444' },
    ];

    return (
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card */}
        <LinearGradient
          colors={['#7C3AED', '#4F46E5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroTopRow}>
            <View style={styles.heroBadge}>
              <Icon name="support-agent" size={14} color="#FFFFFF" />
              <Text style={styles.heroBadgeText}>24/7 SUPPORT</Text>
            </View>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>Live</Text>
            </View>
          </View>

          <Text style={styles.heroTitle}>How can we help you today?</Text>
          <Text style={styles.heroSub}>
            Get immediate answers or connect directly with our support specialists.
          </Text>

          {/* Quick Action Buttons */}
          <View style={styles.quickActionRow}>
            <TouchableOpacity
              style={styles.actionPill}
              activeOpacity={0.8}
              onPress={() => setShowHelpBot(true)}
            >
              <IonIcon name="sparkles" size={15} color="#7C3AED" />
              <Text style={styles.actionPillText}>AI Assistant</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionPill}
              activeOpacity={0.8}
              onPress={() => setShowTicketForm(true)}
            >
              <Icon name="add-task" size={15} color="#7C3AED" />
              <Text style={styles.actionPillText}>Submit Ticket</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionPill}
              activeOpacity={0.8}
              onPress={() => {
                setShowTicketHistory(true);
                fetchTickets();
              }}
            >
              <Icon name="history" size={15} color="#7C3AED" />
              <Text style={styles.actionPillText}>My Tickets</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Popular Topics Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Frequently Asked Questions</Text>
          <Text style={styles.sectionSub}>Instant answers to popular topics</Text>

          {faqs.map((faq, idx) => (
            <TouchableOpacity
              key={idx}
              style={[styles.faqRow, idx === faqs.length - 1 && { borderBottomWidth: 0 }]}
              activeOpacity={0.7}
              onPress={() => {
                setShowHelpBot(true);
                handleSendBotMessage(faq.q);
              }}
            >
              <View style={[styles.faqIconBox, { backgroundColor: `${faq.color}15` }]}>
                <IonIcon name={faq.icon} size={18} color={faq.color} />
              </View>
              <Text style={styles.faqTitle}>{faq.q}</Text>
              <IonIcon name="chevron-forward" size={16} color="#94A3B8" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Contact Channels Card */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Direct Support Channels</Text>
          <Text style={styles.sectionSub}>Alternative ways to reach our care team</Text>

          <TouchableOpacity
            style={styles.channelRow}
            activeOpacity={0.7}
            onPress={handleEmailSupport}
          >
            <View style={[styles.faqIconBox, { backgroundColor: '#EEF2FF' }]}>
              <Icon name="email" size={20} color="#4F46E5" />
            </View>
            <View style={styles.channelInfo}>
              <Text style={styles.channelTitle}>Email Care Team</Text>
              <Text style={styles.channelSub}>support@yaroapp.in • Avg response &lt; 24h</Text>
            </View>
            <IonIcon name="open-outline" size={16} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  // 2. Ticket Form View
  const renderTicketForm = () => {
    return (
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Create Support Ticket</Text>
          <Text style={styles.sectionSub}>Describe your query with full details</Text>

          {/* Reason Selector */}
          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>Issue Category</Text>
            <TouchableOpacity
              style={[styles.dropdownTrigger, showDropdown && styles.dropdownTriggerActive]}
              onPress={() => setShowDropdown(!showDropdown)}
              activeOpacity={0.8}
            >
              <Text style={[styles.dropdownValue, reason === 'None' && { color: '#94A3B8' }]}>
                {reason === 'None' ? 'Select an issue category...' : reason}
              </Text>
              <Icon
                name={showDropdown ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                size={22}
                color="#64748B"
              />
            </TouchableOpacity>

            {showDropdown && (
              <View style={styles.dropdownMenu}>
                {reasons.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dropdownOption,
                      reason === item && styles.dropdownOptionSelected,
                    ]}
                    onPress={() => {
                      setReason(item);
                      setShowDropdown(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownOptionText,
                        reason === item && { color: '#7C3AED', fontWeight: '800' },
                      ]}
                    >
                      {item}
                    </Text>
                    {reason === item && <Icon name="check" size={16} color="#7C3AED" />}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Custom Reason */}
          {reason === 'Other' && (
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Specify Reason</Text>
              <TextInput
                style={styles.textInputBox}
                placeholder="Enter specific problem..."
                placeholderTextColor="#94A3B8"
                value={otherReason}
                onChangeText={setOtherReason}
              />
            </View>
          )}

          {/* Message Area */}
          <View style={styles.formGroup}>
            <View style={styles.labelCountRow}>
              <Text style={styles.inputLabel}>Describe the issue</Text>
              <Text style={styles.countText}>{query.length}/300</Text>
            </View>
            <TextInput
              style={styles.textAreaBox}
              placeholder="Explain clearly what happened, including relevant user IDs or transaction times..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={5}
              value={query}
              onChangeText={setQuery}
              textAlignVertical="top"
              maxLength={300}
            />
          </View>

          {/* Attachment */}
          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>Screenshot / Attachment (Optional)</Text>
            <TouchableOpacity
              style={[styles.attachBox, selectedFile && styles.attachBoxActive]}
              onPress={handleFilePick}
              activeOpacity={0.8}
            >
              <Icon
                name={selectedFile ? 'check-circle' : 'cloud-upload'}
                size={28}
                color={selectedFile ? '#10B981' : '#7C3AED'}
              />
              <Text style={styles.attachTitle} numberOfLines={1}>
                {selectedFile ? selectedFile.name : 'Upload Screenshot'}
              </Text>
              <Text style={styles.attachSub}>Supports JPG, PNG, WEBP, MP4 (max 5MB)</Text>
            </TouchableOpacity>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#7C3AED', '#4F46E5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryButtonGradient}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Icon name="send" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.primaryButtonText}>Submit Ticket</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  // 3. Chatbot View
  const renderHelpBotView = () => {
    return (
      <View style={styles.chatContainer}>
        {/* Banner */}
        <View style={styles.chatNoticeBanner}>
          <IonIcon name="sparkles" size={18} color="#7C3AED" />
          <Text style={styles.chatNoticeText}>
            Yaro AI answers instantly. Tap suggested topics below.
          </Text>
        </View>

        {/* Message Stream */}
        <ScrollView
          style={styles.chatStream}
          contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
          ref={chatScrollRef}
          onContentSizeChange={() => chatScrollRef.current?.scrollToEnd({ animated: true })}
        >
          {chatbotMessages.map(msg => {
            const isBot = msg.sender === 'bot';
            return (
              <View
                key={msg.id}
                style={[styles.chatBubbleRow, isBot ? styles.chatRowLeft : styles.chatRowRight]}
              >
                {isBot && (
                  <View style={styles.botAvatarBadge}>
                    <Icon name="smart-toy" size={14} color="#FFFFFF" />
                  </View>
                )}
                <View
                  style={[
                    styles.chatBubble,
                    isBot ? styles.chatBubbleBot : styles.chatBubbleUser,
                  ]}
                >
                  <Text
                    style={[styles.chatMessageText, !isBot && { color: '#FFFFFF' }]}
                  >
                    {msg.text}
                  </Text>
                </View>
              </View>
            );
          })}
          {isBotTyping && (
            <View style={[styles.chatBubbleRow, styles.chatRowLeft]}>
              <View style={styles.botAvatarBadge}>
                <Icon name="smart-toy" size={14} color="#FFFFFF" />
              </View>
              <View style={[styles.chatBubble, styles.chatBubbleBot, { paddingVertical: 10 }]}>
                <ActivityIndicator size="small" color="#7C3AED" />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Topic Suggestion Chips */}
        <View style={styles.topicCarouselWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.topicChipsScroll}
          >
            {botQuestions.map((q, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.topicChip}
                onPress={() => handleSendBotMessage(q)}
                activeOpacity={0.75}
              >
                <Text style={styles.topicChipText}>{q}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Input Bar */}
        <View style={[styles.chatInputBar, { paddingBottom: Math.max(12, insets.bottom + 6) }]}>
          <TextInput
            style={styles.chatInputField}
            placeholder="Ask a question..."
            placeholderTextColor="#94A3B8"
            value={botInputValue}
            onChangeText={setBotInputValue}
            onSubmitEditing={() => handleSendBotMessage(botInputValue)}
          />
          <TouchableOpacity
            style={[styles.chatSendBtn, !botInputValue.trim() && { opacity: 0.5 }]}
            onPress={() => handleSendBotMessage(botInputValue)}
            disabled={!botInputValue.trim()}
          >
            <Icon name="send" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // 4. Ticket History View
  const renderTicketHistoryView = () => {
    return (
      <View style={{ flex: 1 }}>
        {loadingTickets ? (
          <View style={styles.centerLoadingBox}>
            <ActivityIndicator size="large" color="#7C3AED" />
            <Text style={styles.loadingText}>Loading support tickets...</Text>
          </View>
        ) : ticketsList.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Icon name="inbox" size={44} color="#A78BFA" />
            </View>
            <Text style={styles.emptyTitle}>No tickets yet</Text>
            <Text style={styles.emptySub}>
              You have not created any support requests. If you experience an issue, submit a ticket anytime.
            </Text>
            <TouchableOpacity
              style={styles.emptyActionBtn}
              onPress={() => setShowTicketForm(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyActionText}>Submit a Ticket</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={ticketsList}
            keyExtractor={item => item._id}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const statusColor = getStatusColor(item.status);
              const hasUnread =
                item.replies &&
                item.replies.length > 0 &&
                item.replies[item.replies.length - 1]?.sender === 'admin';

              return (
                <TouchableOpacity
                  style={styles.ticketCard}
                  activeOpacity={0.85}
                  onPress={() => handleOpenTicketDetail(item)}
                >
                  <View style={styles.ticketCardHeader}>
                    <View style={styles.ticketIdRow}>
                      <Text style={styles.ticketIdText}>{item.ticketNumber || '#TICKET'}</Text>
                      {hasUnread && <View style={styles.unreadBadge} />}
                    </View>
                    <View style={[styles.statusPill, { backgroundColor: `${statusColor}18` }]}>
                      <Text style={[styles.statusPillText, { color: statusColor }]}>
                        {getStatusLabel(item.status)}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.ticketReason}>{item.reason}</Text>
                  <Text style={styles.ticketMessage} numberOfLines={2}>
                    {item.message}
                  </Text>

                  <View style={styles.ticketCardFooter}>
                    <Text style={styles.ticketDateText}>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                    <View style={styles.viewThreadRow}>
                      <Text style={styles.viewThreadText}>View Thread</Text>
                      <IonIcon name="chevron-forward" size={13} color="#7C3AED" />
                    </View>
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
          <View style={styles.detailContainer}>
            <View style={[styles.detailHeader, { paddingTop: topSafeInset + 10 }]}>
              <TouchableOpacity
                onPress={() => setShowTicketDetail(false)}
                style={styles.detailBackButton}
              >
                <IonIcon name="chevron-back" size={24} color="#1E293B" />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={styles.detailTitle}>{selectedTicket?.ticketNumber || 'Ticket'}</Text>
                <Text style={styles.detailSubtitle} numberOfLines={1}>
                  {selectedTicket?.reason}
                </Text>
              </View>
              {selectedTicket && (
                <View
                  style={[
                    styles.statusPill,
                    { backgroundColor: `${getStatusColor(selectedTicket.status)}18` },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      { color: getStatusColor(selectedTicket.status) },
                    ]}
                  >
                    {getStatusLabel(selectedTicket.status)}
                  </Text>
                </View>
              )}
            </View>

            {/* Conversation Messages */}
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
            >
              {selectedTicket && (
                <View style={styles.threadOriginalBox}>
                  <View style={styles.threadMetaRow}>
                    <Text style={styles.threadSender}>You (Original)</Text>
                    <Text style={styles.threadTime}>
                      {new Date(selectedTicket.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={styles.threadContent}>{selectedTicket.message}</Text>
                  {selectedTicket.image ? (
                    <Image
                      source={{ uri: selectedTicket.image }}
                      style={styles.threadAttachment}
                      resizeMode="cover"
                    />
                  ) : null}
                </View>
              )}

              {selectedTicket?.replies?.map((rep, idx) => (
                <View
                  key={idx}
                  style={rep.sender === 'admin' ? styles.threadAdminBox : styles.threadUserBox}
                >
                  <View style={styles.threadMetaRow}>
                    <Text
                      style={[
                        styles.threadSender,
                        rep.sender === 'admin' && { color: '#059669', fontWeight: '800' },
                      ]}
                    >
                      {rep.sender === 'admin' ? '🛡️ Yaro Care Team' : 'You'}
                    </Text>
                    <Text style={styles.threadTime}>
                      {new Date(rep.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={styles.threadContent}>{rep.message}</Text>
                </View>
              ))}
            </ScrollView>

            {/* Reply Input */}
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
              <View
                style={[
                  styles.replyBar,
                  { paddingBottom: Math.max(12, insets.bottom + 8) },
                ]}
              >
                <TextInput
                  style={styles.replyInput}
                  placeholder="Write a reply..."
                  placeholderTextColor="#94A3B8"
                  value={replyText}
                  onChangeText={setReplyText}
                  multiline
                  maxLength={500}
                />
                <TouchableOpacity
                  style={[
                    styles.replySendButton,
                    (!replyText.trim() || replyLoading) && { opacity: 0.5 },
                  ]}
                  onPress={handleUserReply}
                  disabled={!replyText.trim() || replyLoading}
                >
                  {replyLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Icon name="send" size={18} color="#FFFFFF" />
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
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      {/* Top Header */}
      <View style={[styles.header, { paddingTop: topSafeInset + 10 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleHeaderBack}
          activeOpacity={0.7}
        >
          <IonIcon name="chevron-back" size={24} color="#1E293B" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          {showHelpBot
            ? 'Yaro Assistant'
            : showTicketHistory
            ? 'Ticket History'
            : showTicketForm
            ? 'New Ticket'
            : t('help.title') || 'Help & Support'}
        </Text>

        <TouchableOpacity
          style={styles.headerRightAction}
          onPress={() => setShowHelpBot(true)}
          activeOpacity={0.7}
        >
          <IonIcon name="sparkles" size={18} color="#7C3AED" />
        </TouchableOpacity>
      </View>
      <AnimatedTitleLine />

      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerRightAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  heroCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  heroBadgeText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#34D399',
  },
  liveText: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: '700',
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  heroSub: {
    fontSize: 12.5,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 18,
    marginBottom: 18,
  },
  quickActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderRadius: 14,
    gap: 5,
  },
  actionPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7C3AED',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#64748B',
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 3,
  },
  sectionSub: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 14,
  },
  faqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  faqIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  faqTitle: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '600',
    color: '#1E293B',
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  channelInfo: {
    flex: 1,
  },
  channelTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  channelSub: {
    fontSize: 11.5,
    color: '#64748B',
  },
  formGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
  },
  labelCountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  countText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dropdownTriggerActive: {
    borderColor: '#7C3AED',
  },
  dropdownValue: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#0F172A',
  },
  dropdownMenu: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    marginTop: 6,
    paddingVertical: 6,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  dropdownOptionSelected: {
    backgroundColor: '#F5F3FF',
  },
  dropdownOptionText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
  },
  textInputBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13.5,
    color: '#0F172A',
  },
  textAreaBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13.5,
    color: '#0F172A',
    minHeight: 110,
  },
  attachBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    borderRadius: 18,
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 14,
  },
  attachBoxActive: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  attachTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 6,
  },
  attachSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  primaryButton: {
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 8,
    elevation: 3,
    shadowColor: '#7C3AED',
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  chatNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 14,
    paddingVertical: 9,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E9D5FF',
  },
  chatNoticeText: {
    fontSize: 12,
    color: '#6D28D9',
    fontWeight: '600',
  },
  chatStream: {
    flex: 1,
  },
  chatBubbleRow: {
    flexDirection: 'row',
    marginBottom: 14,
    alignItems: 'flex-end',
  },
  chatRowLeft: {
    justifyContent: 'flex-start',
  },
  chatRowRight: {
    justifyContent: 'flex-end',
  },
  botAvatarBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  chatBubble: {
    maxWidth: '75%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chatBubbleBot: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderBottomLeftRadius: 4,
  },
  chatBubbleUser: {
    backgroundColor: '#7C3AED',
    borderBottomRightRadius: 4,
  },
  chatMessageText: {
    fontSize: 13.5,
    color: '#1E293B',
    lineHeight: 19,
  },
  topicCarouselWrap: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: 8,
  },
  topicChipsScroll: {
    paddingHorizontal: 12,
    gap: 8,
  },
  topicChip: {
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  topicChipText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },
  chatInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 8,
  },
  chatInputField: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 13.5,
    color: '#0F172A',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chatSendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLoadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 10,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  emptyActionBtn: {
    backgroundColor: '#7C3AED',
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 16,
  },
  emptyActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  ticketCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#64748B',
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  ticketCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  ticketIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ticketIdText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#4F46E5',
  },
  unreadBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  ticketReason: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  ticketMessage: {
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 17,
    marginBottom: 12,
  },
  ticketCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  ticketDateText: {
    fontSize: 11.5,
    color: '#94A3B8',
  },
  viewThreadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewThreadText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7C3AED',
  },
  detailContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 12,
  },
  detailBackButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  detailSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  threadOriginalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  threadAdminBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 12,
  },
  threadUserBox: {
    backgroundColor: '#EEF2FF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    marginBottom: 12,
  },
  threadMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  threadSender: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  threadTime: {
    fontSize: 11,
    color: '#94A3B8',
  },
  threadContent: {
    fontSize: 13,
    color: '#0F172A',
    lineHeight: 18,
  },
  threadAttachment: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    marginTop: 10,
  },
  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 8,
  },
  replyInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 13,
    color: '#0F172A',
    maxHeight: 80,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  replySendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default HelpAndSupport;
