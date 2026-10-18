import React from 'react';
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

export default function CountryPickerModal({
  visible,
  onClose,
  bottomPadding,
  countries = [],
  search,
  onSearchChange,
  selectedCountry,
  onSelectCountry,
  onSelectAll,
}) {
  const normalizedSearch = search.trim().toLowerCase();
  const filteredCountries = countries.filter((country) =>
    country.name.toLowerCase().includes(normalizedSearch),
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.65)', justifyContent: 'flex-end' }}>
        <TouchableOpacity style={{ flex: 1 }} onPress={onClose} activeOpacity={1} />
        <View style={{
          backgroundColor: '#FFFFFF',
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
          padding: 20,
          paddingBottom: Math.max(20, bottomPadding + 14),
          maxHeight: '80%',
        }}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#CBD5E1', alignSelf: 'center', marginBottom: 14 }} />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ color: '#0F172A', fontSize: 20, fontWeight: '900' }}>Select Country</Text>
              <Text style={{ color: '#64748B', fontSize: 12, marginTop: 2 }}>Explore voice rooms from around the world</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={{ width: 34, height: 34, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}
            >
              <Icon name="close" size={18} color="#475569" />
            </TouchableOpacity>
          </View>

          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#F8FAFC',
            borderRadius: 14,
            borderWidth: 1,
            borderColor: '#E2E8F0',
            paddingHorizontal: 12,
            marginTop: 14,
            marginBottom: 10,
          }}>
            <Icon name="search" size={18} color="#94A3B8" />
            <TextInput
              value={search}
              onChangeText={onSearchChange}
              placeholder="Search country name..."
              placeholderTextColor="#94A3B8"
              style={{ flex: 1, color: '#0F172A', paddingVertical: 10, paddingHorizontal: 8, fontSize: 13, fontWeight: '600' }}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => onSearchChange('')}>
                <Icon name="close-circle" size={16} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            onPress={onSelectAll}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: !selectedCountry ? '#EEF2FF' : '#F8FAFC',
              borderWidth: 1,
              borderColor: !selectedCountry ? '#6366F1' : '#E2E8F0',
              borderRadius: 14,
              padding: 12,
              marginBottom: 8,
            }}
          >
            <Text style={{ fontSize: 18, marginRight: 10 }}>🔥</Text>
            <Text style={{ color: !selectedCountry ? '#4F46E5' : '#0F172A', fontSize: 14, fontWeight: '800', flex: 1 }}>All Countries (Popular)</Text>
            {!selectedCountry && <Icon name="checkmark-circle" size={20} color="#6366F1" />}
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false}>
            {filteredCountries.map((country) => {
              const isSelected = selectedCountry.toLowerCase() === country.name.toLowerCase();
              return (
                <TouchableOpacity
                  key={country.id || country.name}
                  onPress={() => onSelectCountry(country.name)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: isSelected ? '#EEF2FF' : '#FFFFFF',
                    borderBottomWidth: 1,
                    borderBottomColor: '#F8FAFC',
                    paddingVertical: 12,
                    paddingHorizontal: 8,
                    borderRadius: 10,
                  }}
                >
                  <Text style={{ fontSize: 20, marginRight: 12 }}>{country.flag}</Text>
                  <Text style={{ color: isSelected ? '#4F46E5' : '#1E293B', fontSize: 15, fontWeight: isSelected ? '800' : '600', flex: 1 }}>{country.name}</Text>
                  <Text style={{ color: '#94A3B8', fontSize: 12, marginRight: 10 }}>{country.code}</Text>
                  <Icon name={isSelected ? 'checkmark-circle' : 'chevron-forward'} size={18} color={isSelected ? '#6366F1' : '#CBD5E1'} />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
