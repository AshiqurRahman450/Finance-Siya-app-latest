import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import tw from 'twrnc';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { getSiyaIncomeImprovementSuggestions } from '../services/SiyaAI';

export default function SurvivalScreen() {
  const navigation = useNavigation();
  const { isDark, formatCurrency } = useTheme() as any;
  const insets = useSafeAreaInsets();
  const { 
    survivalSpending, 
    saveSurvivalSpendingState, 
    incomeSources, 
    transactions 
  } = useAuth();

  const bg = isDark ? 'bg-[#0B0E14]' : 'bg-gray-50';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const cardBg = isDark ? 'bg-[#151B2B]' : 'bg-white';
  const cardBorder = isDark ? 'border-gray-800' : 'border-gray-200';
  const inputBg = isDark ? 'bg-[#0B0E14]' : 'bg-gray-100';

  // Budget states
  const [food, setFood] = useState('');
  const [clothes, setClothes] = useState('');
  const [travel, setTravel] = useState('');
  const [rent, setRent] = useState('');
  const [other, setOther] = useState('');
  const [loan, setLoan] = useState('');

  // AI suggestions states
  const [suggestions, setSuggestions] = useState<string>('');
  const [loadingAI, setLoadingAI] = useState(false);

  // Initialize values from global sync state
  useEffect(() => {
    if (survivalSpending) {
      setFood(survivalSpending.food ? survivalSpending.food.toString() : '');
      setClothes(survivalSpending.clothes ? survivalSpending.clothes.toString() : '');
      setTravel(survivalSpending.travel ? survivalSpending.travel.toString() : '');
      setRent(survivalSpending.rent ? survivalSpending.rent.toString() : '');
      setOther(survivalSpending.other ? survivalSpending.other.toString() : '');
      setLoan(survivalSpending.loan ? survivalSpending.loan.toString() : '');
    }
  }, [survivalSpending]);

  const calculateTotal = () => {
    const f = parseFloat(food) || 0;
    const c = parseFloat(clothes) || 0;
    const t = parseFloat(travel) || 0;
    const r = parseFloat(rent) || 0;
    const o = parseFloat(other) || 0;
    const l = parseFloat(loan) || 0;
    return f + c + t + r + o + l;
  };

  const total = calculateTotal();

  // Get active income for prompting
  const totalIncomeFromSources = useMemo(() => {
    return (incomeSources || []).reduce((sum, src) => sum + src.amount, 0);
  }, [incomeSources]);

  const fallbackIncome = useMemo(() => {
    return transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const userMonthlyIncome = totalIncomeFromSources > 0 ? totalIncomeFromSources : (fallbackIncome > 0 ? fallbackIncome : 5000);

  const handleSave = async () => {
    try {
      await saveSurvivalSpendingState({
        food: parseFloat(food) || 0,
        clothes: parseFloat(clothes) || 0,
        travel: parseFloat(travel) || 0,
        rent: parseFloat(rent) || 0,
        other: parseFloat(other) || 0,
        loan: parseFloat(loan) || 0
      });
      Alert.alert('Success', 'Survival budget saved successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (err) {
      Alert.alert('Error', 'Could not save survival spending to server.');
    }
  };

  const handleAskSiya = async () => {
    setLoadingAI(true);
    setSuggestions('');
    try {
      const spendingData = {
        food: parseFloat(food) || 0,
        clothes: parseFloat(clothes) || 0,
        travel: parseFloat(travel) || 0,
        rent: parseFloat(rent) || 0,
        other: parseFloat(other) || 0,
        loan: parseFloat(loan) || 0
      };
      const result = await getSiyaIncomeImprovementSuggestions(spendingData, userMonthlyIncome);
      setSuggestions(result.suggestions || 'No recommendations generated.');
    } catch (err) {
      console.error(err);
      setSuggestions('Siya could not compile the plans at this time. Check your AI configuration.');
    } finally {
      setLoadingAI(false);
    }
  };

  // Helper to render formatted AI suggestion markdown beautifully in React Native
  const renderMarkdownSuggestions = (text: string) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, index) => {
      let content = line.trim();
      if (!content) return <View key={index} style={tw`h-2`} />;

      // Header h3
      if (content.startsWith('###')) {
        return (
          <Text key={index} style={tw`text-[#8B5CF6] text-lg font-bold mt-4 mb-2`}>
            {content.replace('###', '').trim()}
          </Text>
        );
      }
      // Header h4
      if (content.startsWith('####')) {
        return (
          <Text key={index} style={tw`${textPrimary} text-sm font-bold mt-3 mb-1.5 uppercase tracking-wide`}>
            {content.replace('####', '').trim()}
          </Text>
        );
      }
      // Bold items
      let isBoldItem = content.startsWith('**') || content.startsWith('- **') || content.startsWith('* **');
      if (isBoldItem) {
        let cleanText = content.replace(/^[-*]\s*\*\*/, '').replace(/\*\*$/, '').replace(/\*\*/g, '').trim();
        return (
          <View key={index} style={tw`flex-row items-start mb-2 pl-2`}>
            <View style={tw`w-1.5 h-1.5 rounded-full bg-[#8B5CF6] mt-2 mr-2.5`} />
            <Text style={tw`${textPrimary} text-xs font-semibold flex-1 leading-5`}>
              {cleanText}
            </Text>
          </View>
        );
      }
      // Bullets
      if (content.startsWith('-') || content.startsWith('*')) {
        return (
          <View key={index} style={tw`flex-row items-start mb-2 pl-3`}>
            <View style={tw`w-1.5 h-1.5 rounded-full bg-gray-500 mt-1.5 mr-2`} />
            <Text style={tw`text-gray-400 text-xs flex-1 leading-4`}>
              {content.replace(/^[-*]\s*/, '').trim()}
            </Text>
          </View>
        );
      }

      // Normal paragraph
      return (
        <Text key={index} style={tw`text-gray-400 text-xs leading-5 mb-3`}>
          {content}
        </Text>
      );
    });
  };

  const CategoryItem = ({ title, subtitle, value, setValue, icon, color }) => (
    <View style={tw`${cardBg} rounded-3xl p-5 mb-4 flex-row justify-between items-center border ${cardBorder} shadow-sm`}>
      <View style={tw`flex-row items-center flex-1 mr-4`}>
        <View style={tw`w-10 h-10 rounded-xl bg-gray-900 border ${cardBorder} items-center justify-center mr-3`}>
          <Feather name={icon} size={18} color={color} />
        </View>
        <View style={tw`flex-1`}>
          <Text style={tw`${textPrimary} font-bold text-base mb-0.5`}>{title}</Text>
          <Text style={tw`text-gray-500 text-xs`}>{subtitle}</Text>
        </View>
      </View>
      <View style={tw`flex-row items-center`}>
        <Text style={tw`text-gray-500 font-bold mr-2 text-sm`}>₹</Text>
        <TextInput
          style={tw`${inputBg} ${textPrimary} font-bold text-sm rounded-xl px-3.5 py-2.5 w-24 text-right border ${cardBorder}`}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor="#64748B"
          value={value}
          onChangeText={setValue}
        />
      </View>
    </View>
  );

  return (
    <View style={[tw`flex-1 ${bg}`, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={tw`flex-1`}>
        {/* Header */}
        <View style={[tw`flex-row items-center px-6 py-4 border-b`, { borderBottomColor: isDark ? '#1E293B' : '#E2E8F0' }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={tw`p-2 -ml-2 mr-4`}>
            <Feather name="arrow-left" size={24} color={isDark ? 'white' : 'black'} />
          </TouchableOpacity>
          <View style={tw`flex-1`}>
            <Text style={tw`${textPrimary} text-xl font-bold`}>Survival Spending</Text>
            <Text style={tw`text-xs text-gray-500`}>Your fixed monthly regular costs</Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`px-6 pb-36 pt-4`}>
          {/* Total Card */}
          <View style={tw`${cardBg} rounded-3xl p-6 items-center justify-center mb-6 border ${cardBorder} shadow-sm`}>
            <Text style={tw`text-gray-400 font-bold tracking-widest text-[10px] mb-2 uppercase`}>Survival Threshold</Text>
            <Text style={tw`text-[#10B981] font-bold text-4xl`}>{formatCurrency(total)}</Text>
            <Text style={tw`text-gray-500 text-[10px] mt-1.5 text-center`}>
              Minimum monthly budget required to sustain your current lifestyle.
            </Text>
          </View>

          {/* Categories */}
          <CategoryItem title="Rent & Housing" subtitle="Rent, mortgage, society charges" value={rent} setValue={setRent} icon="home" color="#EF4444" />
          <CategoryItem title="Food & Groceries" subtitle="Supermarket, staples, dining essentials" value={food} setValue={setFood} icon="shopping-bag" color="#10B981" />
          <CategoryItem title="Travel & Commute" subtitle="Fuel, public transport, cab services" value={travel} setValue={setTravel} icon="map-pin" color="#06B6D4" />
          <CategoryItem title="Clothes & Utility" subtitle="Basic apparel, hygiene, monthly bills" value={clothes} setValue={setClothes} icon="scissors" color="#EC4899" />
          <CategoryItem title="Loan & EMI" subtitle="Car loan, personal loan, credit cards EMI" value={loan} setValue={setLoan} icon="credit-card" color="#F59E0B" />
          <CategoryItem title="Other Essentials" subtitle="Subscriptions, medicine, miscellaneous" value={other} setValue={setOther} icon="grid" color="#9CA3AF" />

          {/* SIYA AI SUGGESTIONS SECTION */}
          <View style={tw`${cardBg} border ${cardBorder} rounded-3xl p-5 mt-4 mb-4 shadow-sm`}>
            <View style={tw`flex-row items-center justify-between mb-4`}>
              <View style={tw`flex-row items-center flex-1 mr-2`}>
                <View style={tw`w-9 h-9 rounded-xl bg-[#8B5CF6] items-center justify-center mr-3`}>
                  <Ionicons name="sparkles" size={20} color="white" />
                </View>
                <View style={tw`flex-1`}>
                  <Text style={tw`${textPrimary} font-bold text-sm`}>Sovereignty AI Nudges</Text>
                  <Text style={tw`text-[10px] text-gray-500`}>Scale income to cover expenses</Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={handleAskSiya}
                disabled={loadingAI}
                style={tw`bg-[#8B5CF6] px-3.5 py-2 rounded-xl flex-row items-center justify-center`}
              >
                {loadingAI ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Ionicons name="flash-outline" size={14} color="white" style={tw`mr-1`} />
                    <Text style={tw`text-white font-bold text-xs`}>Consult</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Suggestions Display */}
            {suggestions ? (
              <View style={tw`bg-white-950/45 rounded-2xl p-4 border border-[#8B5CF6]/15`}>
                {renderMarkdownSuggestions(suggestions)}
              </View>
            ) : (
              <Text style={tw`text-gray-500 text-xs italic text-center py-4`}>
                Click "Consult" to let Siya AI formulate custom plans to increase your income based on your monthly spending profile.
              </Text>
            )}
          </View>
        </ScrollView>

        {/* Save Button */}
        <View style={tw`absolute bottom-0 w-full px-6 py-6 ${bg} border-t ${isDark ? 'border-gray-950' : 'border-gray-200'}`}>
          <TouchableOpacity 
            style={tw`bg-[#10B981] rounded-2xl py-4 flex-row items-center justify-center shadow-lg`}
            onPress={handleSave}
          >
            <Feather name="check" size={20} color="#000" style={tw`mr-2`} />
            <Text style={tw`text-black font-bold text-lg`}>Save Survival Budget</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
