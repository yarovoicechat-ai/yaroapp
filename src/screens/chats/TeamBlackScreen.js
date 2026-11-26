import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { getAppTopSafeInset, getStackScreenBottomPadding } from '../../utils/safeAreaUtils';

export default function TeamBlackScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const topSafeInset = getAppTopSafeInset(insets.top);
  const bottomPadding = getStackScreenBottomPadding(insets.bottom, 12);

  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState([
    {
      id: '1',
      sender: 'Family Assistant',
      level: 'Lv.0',
      diamonds: 0,
      coins: 15,
      text: 'You have rewards waiting to be claimed! Complete the family tasks to receive generous gifts!',
      time: '11/15/2026 3:49 PM',
    },
    {
      id: '2',
      sender: 'Family Assistant',
      level: 'Lv.0',
      diamonds: 0,
      coins: 15,
      text: 'You have rewards waiting to be claimed! Complete the family tasks to receive generous gifts!',
      time: '11/15/2026 9:49 PM',
    },
    {
      id: '3',
      sender: 'Family Assistant',
      level: 'Lv.0',
      diamonds: 0,
      coins: 15,
      text: 'You have rewards waiting to be claimed! Complete the family tasks to receive generous gifts!',
      time: '11/16/2026 3:48 PM',
    },
  ]);

  const handleSend = () => {
    if (!messageInput.trim()) return;
    const newMsg = {
      id: Date.now().toString(),
      sender: 'You',
      text: messageInput.trim(),
      time: 'Just now',
      isMe: true,
    };
    setMessages((prev) => [...prev, newMsg]);
    setMessageInput('');
  };

  const handleCheckDetails = () => {
    navigation.navigate('FamilyScreen');
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: topSafeInset }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Icon name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>Team Black 🏠</Text>
        </View>
        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={() => navigation.navigate('FamilyScreen')}
          activeOpacity={0.7}
        >
          <Icon name="settings-outline" size={22} color="#1E293B" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.bannerSubtitle}>Welcome to Team Black group chat!</Text>

        {messages.map((msg) => (
          <View key={msg.id} style={styles.msgBlock}>
            <Text style={styles.timestampCenter}>{msg.time}</Text>

            {msg.isMe ? (
              <View style={styles.myBubbleRow}>
                <View style={styles.myBubble}>
                  <Text style={styles.myBubbleText}>{msg.text}</Text>
                </View>
              </View>
            ) : (
              <View style={styles.assistantMsgRow}>
                <View style={styles.assistantAvatar}>
                  <Text style={styles.avatarEmoji}>👥</Text>
                </View>
                <View style={styles.assistantBubbleContent}>
                  <View style={styles.assistantHeaderRow}>
                    <Text style={styles.assistantName}>{msg.sender}</Text>
                    <View style={styles.levelBadge}>
                      <Text style={styles.levelBadgeText}>{msg.level}</Text>
                    </View>
                    <View style={styles.tagBadge}>
                      <Text style={styles.tagBadgeText}>💎 {msg.diamonds}</Text>
                    </View>
                    <View style={styles.tagBadgeGold}>
                      <Text style={styles.tagBadgeGoldText}>🪙 {msg.coins}</Text>
                    </View>
                  </View>
                  <View style={styles.assistantBubble}>
                    <Text style={styles.bubbleBodyText}>{msg.text}</Text>
                    <TouchableOpacity onPress={handleCheckDetails} activeOpacity={0.7}>
                      <Text style={styles.checkDetailsLink}>Check in details &gt;</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Bottom Chat Bar */}
      <View style={[styles.bottomInputBar, { paddingBottom: bottomPadding }]}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message"
            placeholderTextColor="#94A3B8"
            value={messageInput}
            onChangeText={setMessageInput}
          />
          <TouchableOpacity style={styles.iconInsideInput} activeOpacity={0.7}>
            <Text style={{ fontSize: 20 }}>😊</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sendCircle}
            onPress={handleSend}
            activeOpacity={0.8}
          >
            <Icon name="arrow-forward" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Action icons row */}
        <View style={styles.actionIconsRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.7}
            onPress={() => Alert.alert('Voice Note', 'Hold mic to record voice note.')}
          >
            <Icon name="mic-outline" size={24} color="#64748B" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.7}
            onPress={() => Alert.alert('Gallery', 'Select photo to share in group.')}
          >
            <Icon name="image-outline" size={24} color="#64748B" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.7}
            onPress={() => Alert.alert('Lucky Bag', 'Send lucky coins pouch to family!')}
          >
            <Text style={{ fontSize: 22 }}>💰</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.7}
            onPress={() => Alert.alert('Family Gift', 'Send gifts to family members!')}
          >
            <Text style={{ fontSize: 22 }}>🎁</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  settingsBtn: {
    width: 40,
    height: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  bannerSubtitle: {
    textAlign: 'center',
    fontSize: 13,
    color: '#64748B',
    marginBottom: 8,
  },
  msgBlock: {
    marginBottom: 16,
  },
  timestampCenter: {
    textAlign: 'center',
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 10,
  },
  assistantMsgRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  assistantAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FED7AA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarEmoji: {
    fontSize: 22,
  },
  assistantBubbleContent: {
    flex: 1,
  },
  assistantHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  assistantName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginRight: 6,
  },
  levelBadge: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginRight: 4,
  },
  levelBadgeText: {
    fontSize: 10,
    color: '#64748B',
  },
  tagBadge: {
    backgroundColor: '#F3E8FF',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginRight: 4,
  },
  tagBadgeText: {
    fontSize: 10,
    color: '#7C3AED',
  },
  tagBadgeGold: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  tagBadgeGoldText: {
    fontSize: 10,
    color: '#D97706',
  },
  assistantBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderTopLeftRadius: 4,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  bubbleBodyText: {
    fontSize: 14,
    color: '#1E293B',
    lineHeight: 20,
    marginBottom: 8,
  },
  checkDetailsLink: {
    fontSize: 13,
    color: '#3B82F6',
    fontWeight: '600',
  },
  myBubbleRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  myBubble: {
    backgroundColor: '#7C3AED',
    borderRadius: 16,
    borderTopRightRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxWidth: '80%',
  },
  myBubbleText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  bottomInputBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
    paddingTop: 8,
    paddingHorizontal: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 24,
    paddingHorizontal: 14,
    height: 44,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    paddingVertical: 0,
  },
  iconInsideInput: {
    paddingHorizontal: 6,
  },
  sendCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#C084FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
  },
  actionBtn: {
    padding: 8,
  },
});
