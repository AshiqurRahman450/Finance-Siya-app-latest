import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch } from 'react-native';
import tw from 'twrnc';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SettingsScreen({ navigation }) {
  const { isDark, theme, setMode, currency, setCurrency, currencies } = useTheme();
  const insets = useSafeAreaInsets();

  // Theme colors
  const bg = isDark ? '#0B0F19' : '#F1F5F9';
  const cardBg = isDark ? '#06080F' : '#FFFFFF';
  const cardBorder = isDark ? 'border-gray-700' : 'border-gray-200';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-500';
  const inputBg = isDark ? '#0F172A' : '#F8FAFC';
  const inputBorder = isDark ? '#1E293B' : '#E2E8F0';

  return (
    <View style={[tw`flex-1 items-center`, { backgroundColor: bg, paddingTop: insets.top }]}>
      <View style={tw`flex-1 w-full max-w-lg px-6 pt-4 pb-2`}>
        <Text style={tw`text-2xl font-bold mb-6 ${textPrimary} tracking-wide`}>Settings</Text>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`pb-8`}>

          {/* Back Button */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={tw`flex-row items-center mb-6`}
          >
            <View style={[tw`w-9 h-9 rounded-xl items-center justify-center mr-3 border`, { backgroundColor: inputBg, borderColor: inputBorder }]}>
              <Feather name="arrow-left" size={18} color="#10B981" />
            </View>
            <Text style={tw`${textSecondary} font-semibold text-sm`}>Back to Profile</Text>
          </TouchableOpacity>

          {/* ── Appearance Section ── */}
          <Text style={tw`${textSecondary} text-xs font-bold tracking-widest uppercase mb-3`}>Appearance</Text>
          <View style={tw`${isDark ? 'bg-[#06080F]' : 'bg-white'} border ${cardBorder} rounded-3xl p-5 mb-6`}>

            {/* Dark / Light Mode Selector */}
            <View style={tw`flex-row items-center mb-4`}>
              <View style={[tw`p-2 rounded-xl mr-3`, { backgroundColor: isDark ? '#172554' : '#EFF6FF' }]}>
                <Ionicons name={isDark ? 'moon-outline' : 'sunny-outline'} size={20} color={isDark ? '#3B82F6' : '#F59E0B'} />
              </View>
              <Text style={tw`${textPrimary} font-bold text-base flex-1`}>Theme Mode</Text>
            </View>

            {/* Mode Options */}
            <View style={tw`flex-row gap-3`}>
              {/* Dark Mode */}
              <TouchableOpacity
                onPress={() => setMode('dark')}
                style={[
                  tw`flex-1 p-4 rounded-2xl border items-center`,
                  {
                    backgroundColor: theme === 'dark' ? '#172554' : (isDark ? '#0F172A' : '#F8FAFC'),
                    borderColor: theme === 'dark' ? '#3B82F660' : (isDark ? '#1E293B' : '#E2E8F0'),
                  }
                ]}
              >
                <View style={[tw`w-12 h-12 rounded-xl items-center justify-center mb-3`, { backgroundColor: theme === 'dark' ? '#1E3A8A' : (isDark ? '#1E293B' : '#E2E8F0') }]}>
                  <Ionicons name="moon" size={24} color={theme === 'dark' ? '#60A5FA' : '#9CA3AF'} />
                </View>
                <Text style={[tw`font-bold text-sm`, { color: theme === 'dark' ? '#60A5FA' : (isDark ? '#9CA3AF' : '#6B7280') }]}>Dark</Text>
                {theme === 'dark' && (
                  <View style={tw`absolute top-2 right-2 w-5 h-5 bg-[#3B82F6] rounded-full items-center justify-center`}>
                    <Feather name="check" size={12} color="#FFF" />
                  </View>
                )}
              </TouchableOpacity>

              {/* Light Mode */}
              <TouchableOpacity
                onPress={() => setMode('light')}
                style={[
                  tw`flex-1 p-4 rounded-2xl border items-center`,
                  {
                    backgroundColor: theme === 'light' ? '#FEF9C3' : (isDark ? '#0F172A' : '#F8FAFC'),
                    borderColor: theme === 'light' ? '#F59E0B60' : (isDark ? '#1E293B' : '#E2E8F0'),
                  }
                ]}
              >
                <View style={[tw`w-12 h-12 rounded-xl items-center justify-center mb-3`, { backgroundColor: theme === 'light' ? '#FDE68A' : (isDark ? '#1E293B' : '#E2E8F0') }]}>
                  <Ionicons name="sunny" size={24} color={theme === 'light' ? '#D97706' : '#9CA3AF'} />
                </View>
                <Text style={[tw`font-bold text-sm`, { color: theme === 'light' ? '#D97706' : (isDark ? '#9CA3AF' : '#6B7280') }]}>Light</Text>
                {theme === 'light' && (
                  <View style={tw`absolute top-2 right-2 w-5 h-5 bg-[#F59E0B] rounded-full items-center justify-center`}>
                    <Feather name="check" size={12} color="#FFF" />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Currency Section ── */}
          <Text style={tw`${textSecondary} text-xs font-bold tracking-widest uppercase mb-3`}>Currency</Text>
          <View style={tw`${isDark ? 'bg-[#06080F]' : 'bg-white'} border ${cardBorder} rounded-3xl p-5 mb-6`}>

            <View style={tw`flex-row items-center mb-4`}>
              <View style={[tw`p-2 rounded-xl mr-3`, { backgroundColor: isDark ? '#064E3B' : '#ECFDF5' }]}>
                <Ionicons name="cash-outline" size={20} color="#10B981" />
              </View>
              <Text style={tw`${textPrimary} font-bold text-base flex-1`}>Currency Format</Text>
              <View style={[tw`px-3 py-1 rounded-full border`, { backgroundColor: inputBg, borderColor: inputBorder }]}>
                <Text style={tw`${textSecondary} text-xs font-bold`}>
                  {currencies.find(c => c.key === currency)?.flag} {currency}
                </Text>
              </View>
            </View>

            {/* Currency Grid */}
            {currencies.map((cur, index) => (
              <TouchableOpacity
                key={cur.key}
                onPress={() => setCurrency(cur.key)}
                style={[
                  tw`flex-row items-center p-3.5 rounded-xl mb-2 border`,
                  {
                    backgroundColor: currency === cur.key
                      ? (isDark ? '#064E3B' : '#ECFDF5')
                      : (isDark ? '#0F172A' : '#F8FAFC'),
                    borderColor: currency === cur.key
                      ? '#10B98160'
                      : (isDark ? '#1E293B' : '#E2E8F0'),
                  }
                ]}
              >
                {/* Flag */}
                <Text style={tw`text-2xl mr-3`}>{cur.flag}</Text>

                {/* Currency info */}
                <View style={tw`flex-1`}>
                  <Text style={[
                    tw`font-bold text-sm`,
                    { color: currency === cur.key ? '#10B981' : (isDark ? '#FFF' : '#111827') }
                  ]}>
                    {cur.key}
                  </Text>
                  <Text style={tw`${textSecondary} text-xs mt-0.5`}>{cur.label}</Text>
                </View>

                {/* Symbol */}
                <Text style={[
                  tw`font-bold text-base mr-3`,
                  { color: currency === cur.key ? '#10B981' : (isDark ? '#64748B' : '#9CA3AF') }
                ]}>
                  {cur.symbol}
                </Text>

                {/* Checkmark */}
                {currency === cur.key && (
                  <View style={tw`w-6 h-6 bg-[#10B981] rounded-full items-center justify-center`}>
                    <Feather name="check" size={14} color="#FFF" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Preview */}
          <Text style={tw`${textSecondary} text-xs font-bold tracking-widest uppercase mb-3`}>Preview</Text>
          <View style={tw`${isDark ? 'bg-[#06080F]' : 'bg-white'} border ${cardBorder} rounded-3xl p-5 mb-6`}>
            <View style={tw`flex-row items-center mb-3`}>
              <View style={[tw`p-2 rounded-xl mr-3`, { backgroundColor: isDark ? '#0F172A' : '#F1F5F9' }]}>
                <Ionicons name="eye-outline" size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
              </View>
              <Text style={tw`${textPrimary} font-bold text-base`}>Format Preview</Text>
            </View>
            <View style={[tw`p-4 rounded-xl border`, { backgroundColor: inputBg, borderColor: inputBorder }]}>
              <View style={tw`flex-row justify-between items-center mb-2`}>
                <Text style={tw`${textSecondary} text-sm`}>Balance</Text>
                <Text style={tw`${textPrimary} font-bold text-lg`}>
                  {currencies.find(c => c.key === currency)?.symbol}30,471
                </Text>
              </View>
              <View style={tw`flex-row justify-between items-center mb-2`}>
                <Text style={tw`${textSecondary} text-sm`}>Income</Text>
                <Text style={tw`text-[#10B981] font-bold`}>
                  +{currencies.find(c => c.key === currency)?.symbol}32,250
                </Text>
              </View>
              <View style={tw`flex-row justify-between items-center`}>
                <Text style={tw`${textSecondary} text-sm`}>Expense</Text>
                <Text style={tw`text-[#EF4444] font-bold`}>
                  -{currencies.find(c => c.key === currency)?.symbol}1,779
                </Text>
              </View>
            </View>
          </View>

        </ScrollView>
      </View>
    </View>
  );
}
