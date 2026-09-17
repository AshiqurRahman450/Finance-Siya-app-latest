import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Image, Alert, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import tw from 'twrnc';
import { Ionicons, Feather } from '@expo/vector-icons';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';

const AVATAR_PRESETS = [
  'https://i.pravatar.cc/150?u=a042581f4e29026704d',
  'https://i.pravatar.cc/150?u=a042581f4e29026704e',
  'https://i.pravatar.cc/150?u=a042581f4e29026704f',
  'https://i.pravatar.cc/150?u=a042581f4e29026704g',
];

export default function EditProfileScreen({ navigation }: any) {
  const { isDark } = useTheme() as any;
  const { user, updateUserProfile } = useAuth() as any;

  const cardBg = isDark ? 'bg-[#06080F]' : 'bg-white';
  const cardBorder = isDark ? 'border-gray-700' : 'border-gray-200';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const inputBg = isDark ? 'bg-[#0F172A]' : 'bg-gray-100';
  const inputBorder = isDark ? 'border-[#1E293B]' : 'border-gray-200';
  const fieldBg = isDark ? 'bg-[#1E293B]' : 'bg-gray-50';
  const fieldBorder = isDark ? 'border-[#334155]' : 'border-gray-200';

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatar, setAvatar] = useState(user?.avatar || AVATAR_PRESETS[0]);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (user) {
      if (user.name) setName(user.name);
      if (user.phone !== undefined) setPhone(user.phone);
      if (user.avatar) setAvatar(user.avatar);
    }
  }, [user]);

  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Gallery permission is required to choose a profile photo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAvatar(result.assets[0].uri);
      }
    } catch (err) {
      console.log('Error picking image:', err);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter your full name.');
      return;
    }

    setSaving(true);
    try {
      const updatedData = {
        name: name.trim(),
        phone: phone.trim(),
        avatar: avatar,
      };

      if (updateUserProfile) {
        await updateUserProfile(updatedData);
      }

      Alert.alert(
        'Profile Updated 🎉',
        'Your name, phone number, and profile picture have been updated in frontend & backend!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err: any) {
      Alert.alert('Update Failed', err?.message || 'Could not update profile on backend server.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenWrapper title="Edit Profile">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={tw`flex-1`}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`pb-12 px-1`}>

          {/* Back Button Header */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={tw`flex-row items-center mb-4`}
          >
            <View style={tw`w-8 h-8 ${inputBg} rounded-xl items-center justify-center border ${inputBorder} mr-2.5`}>
              <Feather name="arrow-left" size={16} color="#10B981" />
            </View>
            <Text style={tw`text-gray-400 font-semibold text-xs`}>Back to Profile</Text>
          </TouchableOpacity>

          {/* Profile Card Form */}
          <View style={tw`${cardBg} border ${cardBorder} rounded-3xl p-5 mb-5 shadow-lg`}>
            
            {/* Avatar Picker Section */}
            <View style={tw`items-center my-3`}>
              <View style={tw`relative`}>
                <View style={tw`w-24 h-24 rounded-full overflow-hidden border-4 border-[#10B981]`}>
                  <Image source={{ uri: avatar }} style={tw`w-full h-full`} />
                </View>
                <TouchableOpacity
                  onPress={handlePickImage}
                  style={tw`absolute bottom-0 right-0 bg-[#10B981] p-2 rounded-full border-2 border-white shadow-md`}
                >
                  <Feather name="camera" size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={handlePickImage} style={tw`mt-2`}>
                <Text style={tw`text-[#10B981] font-bold text-xs`}>Change Profile Picture</Text>
              </TouchableOpacity>

              {/* Avatar Presets Selection */}
              <View style={tw`flex-row gap-2.5 mt-3`}>
                {AVATAR_PRESETS.map((preset, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => setAvatar(preset)}
                    style={tw`w-9 h-9 rounded-full overflow-hidden border-2 ${avatar === preset ? 'border-[#10B981]' : 'border-transparent'}`}
                  >
                    <Image source={{ uri: preset }} style={tw`w-full h-full`} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Input Form Fields */}
            <View style={tw`mt-4`}>

              {/* Email (Read Only) */}
              <Text style={tw`text-gray-400 mb-1 text-xs font-semibold`}>Email Address (Account ID)</Text>
              <View style={tw`${fieldBg} p-3 rounded-xl mb-4 border ${fieldBorder} flex-row items-center opacity-70`}>
                <Ionicons name="mail-outline" size={16} color="#64748B" style={tw`mr-2`} />
                <Text style={tw`text-gray-400 text-xs font-medium`}>{user?.email || 'alex.chen@example.com'}</Text>
              </View>

              {/* Full Name Input */}
              <Text style={tw`text-gray-400 mb-1 text-xs font-semibold`}>Full Name</Text>
              <View style={tw`${fieldBg} p-1 rounded-xl mb-4 border ${fieldBorder} flex-row items-center`}>
                <Ionicons name="person-outline" size={16} color="#10B981" style={tw`ml-2.5 mr-1`} />
                <TextInput
                  style={tw`flex-1 ${textPrimary} p-2 text-xs font-semibold`}
                  placeholder="Enter your name"
                  placeholderTextColor="#64748B"
                  value={name}
                  onChangeText={setName}
                />
              </View>

              {/* Phone Number Input */}
              <Text style={tw`text-gray-400 mb-1 text-xs font-semibold`}>Phone Number</Text>
              <View style={tw`${fieldBg} p-1 rounded-xl mb-6 border ${fieldBorder} flex-row items-center`}>
                <Ionicons name="call-outline" size={16} color="#10B981" style={tw`ml-2.5 mr-1`} />
                <TextInput
                  style={tw`flex-1 ${textPrimary} p-2 text-xs font-semibold`}
                  placeholder="e.g. +91 98765 43210"
                  placeholderTextColor="#64748B"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>

              {/* Save Button */}
              <TouchableOpacity
                onPress={handleSave}
                disabled={saving}
                style={tw`bg-[#10B981] py-3.5 rounded-xl items-center flex-row justify-center shadow-lg`}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Feather name="check" size={16} color="#FFFFFF" style={tw`mr-2`} />
                    <Text style={tw`text-white font-extrabold text-sm`}>Save Profile Changes</Text>
                  </>
                )}
              </TouchableOpacity>

            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}
