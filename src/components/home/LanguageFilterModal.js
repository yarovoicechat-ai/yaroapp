import React from 'react';
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { normalizeLanguages } from '../../utils/hostPresentation';

export default function LanguageFilterModal({ visible, onClose, bottomInset, hosts, selectedLanguage, onSelectLanguage, search, onSearchChange }) {
  return (
<Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <View style={{ flex: 1, backgroundColor: 'rgba(10, 6, 28, 0.7)', justifyContent: 'flex-end' }}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => onClose()} activeOpacity={1} />
          <View style={{
            backgroundColor: '#FAF8FC',
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            paddingTop: 12,
            paddingHorizontal: 18,
            paddingBottom: Math.max(20, bottomInset + 12),
            maxHeight: '82%',
            elevation: 25,
            shadowColor: '#000',
            shadowOpacity: 0.25,
            shadowRadius: 15,
          }}>
            {/* Pill Drag Handle */}
            <View style={{ width: 44, height: 5, borderRadius: 3, backgroundColor: '#D4CCE4', alignSelf: 'center', marginBottom: 14 }} />

            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <LinearGradient
                    colors={['#8B5CF6', '#6366F1']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 }}
                  >
                    <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '900', letterSpacing: 1.2 }}>LANGUAGE FILTER</Text>
                  </LinearGradient>
                  {selectedLanguage !== 'All' && (
                    <TouchableOpacity
                      onPress={() => { onSelectLanguage('All'); onClose(); }}
                      style={{ backgroundColor: '#EDE9FE', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 10 }}
                    >
                      <Text style={{ color: '#6D28D9', fontSize: 10, fontWeight: '800' }}>Reset to All ✕</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={{ color: '#1E1438', fontSize: 22, fontWeight: '900', marginTop: 4 }}>
                  Talk Your Language
                </Text>
                <Text style={{ color: '#7E7495', fontSize: 12, marginTop: 2 }}>
                  Find and connect with hosts who speak your mother tongue.
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => onClose()}
                style={{ width: 36, height: 36, borderRadius: 14, backgroundColor: '#EDE7F6', alignItems: 'center', justifyContent: 'center' }}
                activeOpacity={0.8}
              >
                <Icon name="close" size={20} color="#5C4D78" />
              </TouchableOpacity>
            </View>

            {/* Search Input Bar */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#FFFFFF',
              borderWidth: 1,
              borderColor: '#E8E1F2',
              borderRadius: 16,
              paddingHorizontal: 12,
              marginTop: 14,
              marginBottom: 10,
              elevation: 1,
            }}>
              <Icon name="search" size={18} color="#8E82A5" />
              <TextInput
                value={search}
                onChangeText={onSearchChange}
                placeholder="Search language or dialect..."
                placeholderTextColor="#A59BB8"
                style={{ flex: 1, color: '#1F1538', paddingVertical: 10, paddingHorizontal: 8, fontSize: 13, fontWeight: '600' }}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => onSearchChange('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Icon name="close-circle" size={17} color="#A59BB8" />
                </TouchableOpacity>
              )}
            </View>

            {/* Language Scroll Grid */}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 4, paddingBottom: 10 }}>
              {[
                { name: 'All', native: 'All Languages (सभी)', mark: '🌐', gradient: ['#6366F1', '#4F46E5'] },
                { name: 'Hindi', native: 'हिन्दी', mark: 'हि', gradient: ['#F59E0B', '#D97706'] },
                { name: 'English', native: 'English', mark: 'EN', gradient: ['#3B82F6', '#2563EB'] },
                { name: 'Bengali', native: 'বাংলা', mark: 'বা', gradient: ['#10B981', '#059669'] },
                { name: 'Telugu', native: 'తెలుగు', mark: 'తె', gradient: ['#8B5CF6', '#7C3AED'] },
                { name: 'Marathi', native: 'मराठी', mark: 'म', gradient: ['#EC4899', '#DB2777'] },
                { name: 'Tamil', native: 'தமிழ்', mark: 'த', gradient: ['#F97316', '#EA580C'] },
                { name: 'Urdu', native: 'اردو', mark: 'اردو', gradient: ['#14B8A6', '#0D9488'] },
                { name: 'Gujarati', native: 'ગુજરાતી', mark: 'ગુ', gradient: ['#06B6D4', '#0891B2'] },
                { name: 'Punjabi', native: 'ਪੰਜਾਬੀ', mark: 'ਪੰ', gradient: ['#EAB308', '#CA8A04'] },
                { name: 'Malayalam', native: 'മലയാളം', mark: 'മ', gradient: ['#6366F1', '#4338CA'] },
                { name: 'Kannada', native: 'ಕನ್ನಡ', mark: 'ಕ', gradient: ['#A855F7', '#9333EA'] },
                { name: 'Arabic', native: 'العربية', mark: 'ع', gradient: ['#F43F5E', '#E11D48'] },
              ].filter(item => `${item.name} ${item.native}`.toLowerCase().includes(search.trim().toLowerCase())).map((item) => {
                const active = selectedLanguage === item.name;
                const availableHosts = Array.isArray(hosts) ? hosts : [];
                const count = item.name === 'All'
                  ? availableHosts.length
                  : availableHosts.filter(h => normalizeLanguages(h?.languages, h?.language).some(v => v.toLowerCase() === item.name.toLowerCase())).length;

                return (
                  <TouchableOpacity
                    key={item.name}
                    onPress={() => {
                      onSelectLanguage(item.name);
                      onClose();
                      onSearchChange('');
                    }}
                    activeOpacity={0.85}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: active ? '#F5F0FF' : '#FFFFFF',
                      borderColor: active ? '#8B5CF6' : '#EFEBF5',
                      borderWidth: active ? 1.5 : 1,
                      borderRadius: 18,
                      padding: 12,
                      marginBottom: 8,
                      elevation: active ? 2 : 1,
                      shadowColor: active ? '#8B5CF6' : '#000',
                      shadowOpacity: active ? 0.12 : 0.03,
                      shadowRadius: 4,
                    }}
                  >
                    <LinearGradient
                      colors={item.gradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 14,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12,
                      }}
                    >
                      <Text style={{ color: '#FFFFFF', fontSize: item.mark.length > 2 ? 12 : 17, fontWeight: '900' }}>
                        {item.mark}
                      </Text>
                    </LinearGradient>

                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={{ color: '#1B1435', fontSize: 15, fontWeight: '800' }}>{item.name}</Text>
                        <Text style={{ color: '#887E9F', fontSize: 12, fontWeight: '600' }}>({item.native})</Text>
                      </View>
                      <Text style={{ color: '#9E94B3', fontSize: 11, marginTop: 2 }}>
                        {count > 0 ? `${count} active host${count > 1 ? 's' : ''}` : 'Discover new connections'}
                      </Text>
                    </View>

                    <View style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: active ? '#8B5CF6' : '#F1EDF8',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Icon
                        name={active ? 'checkmark' : 'chevron-forward'}
                        size={16}
                        color={active ? '#FFFFFF' : '#9E94B3'}
                      />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
  );
}
