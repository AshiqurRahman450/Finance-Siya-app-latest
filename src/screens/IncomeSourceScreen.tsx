import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Modal, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import tw from 'twrnc';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';

const INCOME_TYPES = [
  {
    type: 'Capital Gains',
    description: 'Profit made when you sell an asset (like stocks or property) for more than you paid.',
    icon: 'trending-up-outline',
    color: '#3B82F6',
    bg: '#172554'
  },
  {
    type: 'Royalties',
    description: 'Earnings from allowing others to use your intellectual property (books, music, patents).',
    icon: 'bulb-outline',
    color: '#8B5CF6',
    bg: '#2E1065'
  },
  {
    type: 'Dividends',
    description: 'Payments to shareholders from a company\'s profits.',
    icon: 'cash-outline',
    color: '#10B981',
    bg: '#064E3B'
  },
  {
    type: 'Rental Income',
    description: 'Money received from renting out property.',
    icon: 'home-outline',
    color: '#EF4444',
    bg: '#4C1D2E'
  },
  {
    type: 'Earned Income',
    description: 'Active income from employment salary, or wages.',
    icon: 'people-outline',
    color: '#EC4899',
    bg: '#500724'
  },
  {
    type: 'Interest Income',
    description: 'Money earned from lending or depositing money (e.g., bank savings, bonds).',
    icon: 'briefcase-outline',
    color: '#06B6D4',
    bg: '#083344'
  },
  {
    type: 'Profit Income',
    description: 'Earnings from running a business after covering all expenses.',
    icon: 'analytics-outline',
    color: '#F59E0B',
    bg: '#451A03'
  }
];

export default function IncomeSourceScreen() {
  const navigation = useNavigation();
  const { isDark, formatCurrency } = useTheme() as any;
  const insets = useSafeAreaInsets();
  const { incomeSources, saveIncomeSourceState, deleteIncomeSourceState } = useAuth();

  const bg = isDark ? 'bg-[#0B0E14]' : 'bg-gray-50';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const cardBg = isDark ? 'bg-[#151B2B]' : 'bg-white';
  const cardBorder = isDark ? 'border-gray-800' : 'border-gray-200';
  const inputBg = isDark ? 'bg-[#0B0E14]' : 'bg-gray-100';

  const [selectedType, setSelectedType] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [amount, setAmount] = useState('');
  
  // Spend limit popup states
  const [limitModalVisible, setLimitModalVisible] = useState(false);
  const [calculatedLimit, setCalculatedLimit] = useState(0);

  const getSourceForType = (type: string) => {
    return (incomeSources || []).find(s => s.type === type);
  };

  const handleSelectType = (item: any) => {
    setSelectedType(item);
    const existing = getSourceForType(item.type);
    setAmount(existing ? existing.amount.toString() : '');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid monthly income amount.');
      return;
    }

    const numericAmount = parseFloat(amount);
    const dailyLimit = numericAmount / 30;

    try {
      await saveIncomeSourceState({
        type: selectedType.type,
        amount: numericAmount
      });
      setModalVisible(false);
      setCalculatedLimit(dailyLimit);
      setLimitModalVisible(true);
    } catch (err) {
      Alert.alert('Error', 'Could not save income source to backend.');
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      'Delete Income Source',
      'Are you sure you want to delete this income source?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteIncomeSourceState(id);
              setModalVisible(false);
            } catch (err) {
              Alert.alert('Error', 'Could not delete income source.');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={[tw`flex-1 ${bg}`, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[tw`flex-row items-center px-6 py-4 border-b`, { borderBottomColor: isDark ? '#1E293B' : '#E2E8F0' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={tw`p-2 -ml-2 mr-4`}>
          <Feather name="arrow-left" size={24} color={isDark ? 'white' : 'black'} />
        </TouchableOpacity>
        <View style={tw`flex-1`}>
          <Text style={tw`${textPrimary} text-xl font-bold`}>7 Types of Income</Text>
          <Text style={tw`text-xs text-gray-500`}>Configure your revenue channels</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`px-6 py-6 pb-20`}>
        <Text style={tw`text-gray-400 text-sm mb-6 leading-5`}>
          True financial sovereignty is built upon diversified income channels. Configure your monthly earnings across these 7 types to determine your daily spend limits.
        </Text>

        {INCOME_TYPES.map((item) => {
          const activeSource = getSourceForType(item.type);
          return (
            <TouchableOpacity
              key={item.type}
              onPress={() => handleSelectType(item)}
              activeOpacity={0.8}
              style={tw`${cardBg} border ${cardBorder} rounded-3xl p-5 mb-4 flex-row items-center justify-between shadow-sm`}
            >
              <View style={tw`flex-row items-center flex-1 mr-4`}>
                <View style={[tw`w-12 h-12 rounded-2xl items-center justify-center mr-4`, { backgroundColor: isDark ? item.bg : '#F3F4F6' }]}>
                  <Ionicons name={item.icon as any} size={24} color={item.color} />
                </View>
                <View style={tw`flex-1`}>
                  <Text style={tw`${textPrimary} font-bold text-base mb-1`}>{item.type}</Text>
                  <Text style={tw`text-gray-500 text-xs leading-4`}>{item.description}</Text>
                </View>
              </View>

              {activeSource ? (
                <View style={tw`items-end`}>
                  <Text style={tw`text-[#10B981] font-bold text-base`}>
                    {formatCurrency(activeSource.amount)}
                  </Text>
                  <Text style={tw`text-gray-400 text-[10px] mt-0.5`}>
                    Limit: {formatCurrency(activeSource.spendLimit)}/day
                  </Text>
                </View>
              ) : (
                <Feather name="plus-circle" size={20} color="#8B5CF6" />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Input Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={tw`flex-1 justify-end bg-black/50`}>
          <View style={tw`${isDark ? 'bg-[#0F172A]' : 'bg-white'} p-6 rounded-t-3xl border-t ${isDark ? 'border-gray-800' : 'border-gray-200'} shadow-2xl`}>
            {/* Header */}
            <View style={tw`flex-row justify-between items-center mb-5`}>
              <View style={tw`flex-row items-center`}>
                {selectedType && (
                  <View style={[tw`w-8 h-8 rounded-lg items-center justify-center mr-2.5`, { backgroundColor: isDark ? selectedType.bg : '#F3F4F6' }]}>
                    <Ionicons name={selectedType.icon as any} size={18} color={selectedType.color} />
                  </View>
                )}
                <Text style={tw`${textPrimary} text-lg font-bold`}>
                  {selectedType?.type}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <View style={tw`w-8 h-8 ${isDark ? 'bg-[#1E293B]' : 'bg-gray-100'} rounded-full items-center justify-center`}>
                  <Feather name="x" size={16} color="#9CA3AF" />
                </View>
              </TouchableOpacity>
            </View>

            <Text style={tw`text-gray-500 text-xs mb-4 leading-4`}>
              {selectedType?.description}
            </Text>

            {/* Input Amount */}
            <Text style={tw`text-gray-400 mb-1 text-sm font-semibold`}>Monthly Income Amount</Text>
            <TextInput
              style={tw`${isDark ? 'bg-[#1E293B]' : 'bg-gray-50'} ${textPrimary} p-3.5 rounded-xl mb-6 border ${isDark ? 'border-[#334155]' : 'border-gray-200'} font-bold`}
              placeholder="e.g. 50000"
              placeholderTextColor="#64748B"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />

            {/* Buttons */}
            <View style={tw`flex-row justify-between mb-6`}>
              {selectedType && getSourceForType(selectedType.type) ? (
                <TouchableOpacity
                  onPress={() => handleDelete(getSourceForType(selectedType.type).id)}
                  style={tw`bg-red-500/15 border border-red-500/30 py-3.5 px-6 rounded-xl flex-row items-center`}
                >
                  <Feather name="trash-2" size={16} color="#EF4444" style={tw`mr-2`} />
                  <Text style={tw`text-[#EF4444] font-bold`}>Delete</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={tw`${isDark ? 'bg-[#1E293B]' : 'bg-gray-100'} py-3.5 px-6 rounded-xl border ${isDark ? 'border-gray-800' : 'border-gray-200'}`}
                >
                  <Text style={tw`${textPrimary} font-bold`}>Cancel</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={handleSave}
                style={tw`bg-[#10B981] py-3.5 px-8 rounded-xl flex-1 ml-4 items-center justify-center`}
              >
                <Text style={tw`text-black font-bold`}>Calculate & Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Spend Limit Popup Modal */}
      <Modal visible={limitModalVisible} animationType="fade" transparent={true}>
        <View style={tw`flex-1 bg-black/60 justify-center items-center px-6`}>
          <View style={tw`${isDark ? 'bg-[#151B2B]' : 'bg-white'} border ${cardBorder} w-full rounded-3xl p-6 items-center shadow-2xl`}>
            {/* Success Shield Icon */}
            <View style={tw`w-16 h-16 rounded-full bg-[#10B981]/25 items-center justify-center mb-4 border border-[#10B981]/40`}>
              <Ionicons name="shield-checkmark" size={36} color="#10B981" />
            </View>

            <Text style={tw`${textPrimary} text-xl font-bold text-center mb-2`}>
              Daily Spend Limit Configured!
            </Text>
            
            <Text style={tw`text-gray-400 text-xs text-center px-4 leading-4 mb-6`}>
              Based on your monthly earnings of {formatCurrency(parseFloat(amount || '0'))} from **{selectedType?.type}**, your daily allowable limit is set:
            </Text>

            {/* Large Spend Limit Display */}
            <View style={tw`bg-[#10B981]/10 border border-[#10B981]/20 rounded-2xl py-4 px-8 mb-6 items-center justify-center`}>
              <Text style={tw`text-[#10B981] text-3xl font-bold`}>
                {formatCurrency(calculatedLimit)}
              </Text>
              <Text style={tw`text-gray-500 text-[10px] font-bold tracking-widest uppercase mt-1`}>
                Daily Limit
              </Text>
            </View>

            <Text style={tw`text-gray-500 text-[10px] text-center px-4 leading-3 mb-6`}>
              Siya AI will use this metric to audit and alert you when transaction scans approach this threshold.
            </Text>

            <TouchableOpacity
              onPress={() => setLimitModalVisible(false)}
              style={tw`bg-[#8B5CF6] py-3.5 px-8 rounded-xl w-full items-center justify-center`}
            >
              <Text style={tw`text-white font-bold`}>Acknowledge Limit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
