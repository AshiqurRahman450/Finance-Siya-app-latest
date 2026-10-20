import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import tw from 'twrnc';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { getSiyaSavingsVsDebtRecommendation } from '../services/SiyaAI';

const parseNumber = (val: any): number => {
  if (val === undefined || val === null) return 0;
  const num = parseFloat(val.toString().replace(/[^0-9.-]+/g, ''));
  return isNaN(num) ? 0 : num;
};

const YIELD_OPTIONS = [
  { label: '5% (HYSA)', value: 0.05, desc: 'Safe cash reserves' },
  { label: '8% (Index)', value: 0.08, desc: 'Broad market equities' },
  { label: '10% (Bonds)', value: 0.10, desc: 'Corporate/Gov bonds' },
  { label: '12% (Equity)', value: 0.12, desc: 'Sovereign dividend portfolio' },
  { label: '15% (Growth)', value: 0.15, desc: 'Aggressive asset leverage' }
];

export default function PassiveVSDebtScreen() {
  const navigation = useNavigation();
  const { isDark, formatCurrency } = useTheme() as any;
  const insets = useSafeAreaInsets();
  const { debts, transactions, incomeSources } = useAuth();

  // Income sources aggregation
  const totalIncomeFromSources = useMemo(() => {
    return (incomeSources || []).reduce((sum, src) => sum + src.amount, 0);
  }, [incomeSources]);

  const fallbackIncome = useMemo(() => {
    return transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const userMonthlyIncome = totalIncomeFromSources > 0 ? totalIncomeFromSources : (fallbackIncome > 0 ? fallbackIncome : 5000);

  const slaveryDaysFromIncome = useMemo(() => {
    if (totalDebt === 0 || userMonthlyIncome === 0) return 0;
    return Math.round(totalDebt / (userMonthlyIncome / 30));
  }, [totalDebt, userMonthlyIncome]);

  // Computed Base Financials
  const actualSavings = useMemo(() => {
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    return Math.max(0, totalIncome - totalExpense);
  }, [transactions]);

  const totalDebt = useMemo(() => {
    return debts.reduce((sum, d) => sum + parseNumber(d.remaining), 0);
  }, [debts]);

  const totalMonthlyDebtPayment = useMemo(() => {
    return debts.reduce((sum, d) => sum + parseNumber(d.monthly), 0);
  }, [debts]);

  // Simulation States
  const [allocatedSavings, setAllocatedSavings] = useState<number>(0);
  const [allocatedSavingsInput, setAllocatedSavingsInput] = useState<string>('');
  const [selectedYield, setSelectedYield] = useState<number>(0.10);
  const [selectedStrategy, setSelectedStrategy] = useState<'hybrid' | 'passive' | 'paydown'>('hybrid');

  // Siya Advice states
  const [siyaPlan, setSiyaPlan] = useState<string>('');
  const [loadingSiya, setLoadingSiya] = useState<boolean>(false);

  // Initialize allocated savings once base savings is available
  useEffect(() => {
    const defaultVal = actualSavings > 0 ? actualSavings : 10000;
    setAllocatedSavings(defaultVal);
    setAllocatedSavingsInput(defaultVal.toString());
  }, [actualSavings]);

  // Sync manual input to numeric savings state
  const handleSavingsInputChange = (text: string) => {
    setAllocatedSavingsInput(text);
    const num = parseFloat(text);
    if (!isNaN(num) && num >= 0) {
      setAllocatedSavings(num);
    }
  };

  const adjustSavings = (amount: number) => {
    const newVal = Math.max(0, allocatedSavings + amount);
    setAllocatedSavings(newVal);
    setAllocatedSavingsInput(newVal.toString());
  };

  // Mathematical Simulations
  const passiveMonthlyIncome = useMemo(() => {
    return (allocatedSavings * selectedYield) / 12;
  }, [allocatedSavings, selectedYield]);

  // Slavery days calculations
  const minimumPayoffMonths = useMemo(() => {
    if (totalDebt === 0 || totalMonthlyDebtPayment === 0) return 0;
    return totalDebt / totalMonthlyDebtPayment;
  }, [totalDebt, totalMonthlyDebtPayment]);

  const directPaydownPayoffMonths = useMemo(() => {
    if (totalDebt === 0 || totalMonthlyDebtPayment === 0) return 0;
    const remainingDebt = Math.max(0, totalDebt - allocatedSavings);
    return remainingDebt / totalMonthlyDebtPayment;
  }, [totalDebt, allocatedSavings, totalMonthlyDebtPayment]);

  const hybridPayoffMonths = useMemo(() => {
    if (totalDebt === 0) return 0;
    const combinedPayment = totalMonthlyDebtPayment + passiveMonthlyIncome;
    if (combinedPayment === 0) return 0;
    return totalDebt / combinedPayment;
  }, [totalDebt, totalMonthlyDebtPayment, passiveMonthlyIncome]);

  const directPaydownSlaveryDaysSaved = useMemo(() => {
    const monthsSaved = Math.max(0, minimumPayoffMonths - directPaydownPayoffMonths);
    return Math.round(monthsSaved * 30.4);
  }, [minimumPayoffMonths, directPaydownPayoffMonths]);

  const hybridSlaveryDaysSaved = useMemo(() => {
    const monthsSaved = Math.max(0, minimumPayoffMonths - hybridPayoffMonths);
    return Math.round(monthsSaved * 30.4);
  }, [minimumPayoffMonths, hybridPayoffMonths]);

  // Siya recommendation fetcher
  const askSiyaForAdvice = async () => {
    setLoadingSiya(true);
    setSiyaPlan('');
    try {
      const response = await getSiyaSavingsVsDebtRecommendation(allocatedSavings, debts);
      setSiyaPlan(response.recommendation);
    } catch (err) {
      console.error(err);
      setSiyaPlan('Siya could not compile the plan. Check network connectivity.');
    } finally {
      setLoadingSiya(false);
    }
  };

  const bg = isDark ? 'bg-[#0B0E14]' : 'bg-gray-50';
  const cardBg = isDark ? 'bg-[#151B2B]' : 'bg-white';
  const cardBorder = isDark ? 'border-gray-800' : 'border-gray-200';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';
  const inputBg = isDark ? 'bg-[#0B0E14]' : 'bg-gray-100';

  return (
    <View style={[tw`flex-1 ${bg}`, { paddingTop: insets.top }]}>
      {/* Custom Header */}
      <View style={[tw`flex-row items-center px-6 py-4 border-b`, { borderBottomColor: isDark ? '#1E293B' : '#E2E8F0' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={tw`p-2 -ml-2 mr-4`}>
          <Feather name="arrow-left" size={24} color={isDark ? 'white' : 'black'} />
        </TouchableOpacity>
        <View style={tw`flex-1`}>
          <Text style={tw`${textPrimary} text-lg font-bold tracking-wider`}>Sovereignty Lab</Text>
          <Text style={tw`text-xs text-gray-500`}>Passive vs Debt Split Analysis</Text>
        </View>
        <View style={tw`px-3 py-1 rounded-full bg-[#10B981]/25 border border-[#10B981]/40`}>
          <Text style={tw`text-[#10B981] font-bold text-xs`}>Active</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`px-6 pb-24 pt-4`}>
        
        {/* Simulation Control Card */}
        <View style={tw`${cardBg} border ${cardBorder} rounded-3xl p-5 mb-5`}>
          <Text style={tw`${textPrimary} text-sm font-bold uppercase tracking-wider mb-3`}>
            1. Allocate Savings for Simulation
          </Text>
          
          <Text style={tw`text-gray-500 text-xs mb-3`}>
            Your actual monthly net savings is <Text style={tw`text-[#10B981] font-bold`}>{formatCurrency(actualSavings)}</Text>. Simulate allocating a different amount below to see the impact.
          </Text>

          <View style={tw`flex-row items-center mb-4`}>
            <TouchableOpacity 
              onPress={() => adjustSavings(-5000)}
              style={tw`w-10 h-10 ${inputBg} rounded-xl items-center justify-center`}
            >
              <Feather name="minus" size={16} color={isDark ? 'white' : 'black'} />
            </TouchableOpacity>
            
            <TextInput
              style={tw`flex-1 mx-3 py-3 rounded-xl text-center font-bold text-lg ${isDark ? 'bg-[#0B0E14] text-white' : 'bg-gray-100 text-gray-900'}`}
              keyboardType="numeric"
              value={allocatedSavingsInput}
              onChangeText={handleSavingsInputChange}
            />

            <TouchableOpacity 
              onPress={() => adjustSavings(5000)}
              style={tw`w-10 h-10 ${inputBg} rounded-xl items-center justify-center`}
            >
              <Feather name="plus" size={16} color={isDark ? 'white' : 'black'} />
            </TouchableOpacity>
          </View>

          {/* Target Yield Selection */}
          <Text style={tw`${textPrimary} text-xs font-bold uppercase tracking-wider mb-2`}>Target Asset Yield</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={tw`py-1`}>
            {YIELD_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                onPress={() => setSelectedYield(opt.value)}
                style={tw`px-3 py-2 mr-2 rounded-xl border ${selectedYield === opt.value ? 'bg-[#10B981]/20 border-[#10B981]' : (isDark ? 'bg-[#0B0E14] border-gray-800' : 'bg-gray-100 border-gray-200')}`}
              >
                <Text style={tw`text-xs font-bold ${selectedYield === opt.value ? 'text-[#10B981]' : (isDark ? 'text-gray-400' : 'text-gray-600')}`}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* SPLIT PAGE SECTION: Side-by-Side Comparison */}
        <View style={tw`flex-row justify-between mb-5`}>
          
          {/* Centralized & Enlarged: Passive (Time Freedom) */}
          <View style={tw`${cardBg} border ${cardBorder} rounded-3xl p-8 w-full items-center shadow-lg`}>
            
            {/* Header */}
            <View style={tw`items-center mb-6`}>
              <View style={tw`w-14 h-14 rounded-full bg-[#3B82F6]/15 items-center justify-center mb-3`}>
                <Feather name="trending-up" size={26} color="#3B82F6" />
              </View>
              <Text style={tw`${textPrimary} font-extrabold text-2xl tracking-wide`}>Time Freedom</Text>
              <Text style={tw`text-gray-500 text-xs text-center mt-2 px-4 leading-5`}>
                Allocated to wealth-generating assets to buy back control of your day.
              </Text>
            </View>
            
            {/* Investment Info */}
            <View style={tw`w-full flex-row justify-between items-center mb-6 bg-[#3B82F6]/5 p-5 rounded-2xl border border-[#3B82F6]/10`}>
              <View style={tw`items-center flex-1`}>
                <Text style={tw`text-xs text-gray-500 uppercase font-bold tracking-widest mb-1.5`}>Total Invested</Text>
                <Text style={tw`text-[#3B82F6] font-black text-3xl`}>
                  {formatCurrency(allocatedSavings)}
                </Text>
              </View>
              <View style={tw`h-10 w-px bg-[#3B82F6]/20 mx-2`} />
              <View style={tw`items-center flex-1`}>
                <Text style={tw`text-xs text-gray-500 uppercase font-bold tracking-widest mb-1.5`}>Passive Yield</Text>
                <Text style={tw`${textPrimary} font-bold text-2xl`}>
                  {(selectedYield * 100).toFixed(0)}% <Text style={tw`text-sm font-medium text-gray-500`}>APY</Text>
                </Text>
              </View>
            </View>

            {/* Cashflow Result */}
            <View style={tw`w-full items-center pt-5 border-t border-dashed ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
              <Text style={tw`text-gray-400 text-xs uppercase font-extrabold tracking-widest mb-2`}>Monthly Cashflow Generator</Text>
              <Text style={tw`text-[#10B981] font-black text-4xl mb-2`}>
                +{formatCurrency(passiveMonthlyIncome)}
              </Text>
              <View style={tw`bg-[#10B981]/15 px-3 py-1 rounded-full`}>
                <Text style={tw`text-[#10B981] text-[10px] font-bold uppercase tracking-wider`}>
                  +{formatCurrency(passiveMonthlyIncome * 12)} / year
                </Text>
              </View>
            </View>
          </View>

        </View>

        {/* SIYA AI SECTION */}
        <View style={tw`${cardBg} border ${cardBorder} rounded-3xl p-5 mb-8`}>
          <View style={tw`flex-row items-center justify-between mb-4`}>
            <View style={tw`flex-row items-center`}>
              <View style={tw`w-9 h-9 rounded-xl bg-[#10B981] items-center justify-center mr-3`}>
                <Ionicons name="sparkles" size={20} color="white" />
              </View>
              <View>
                <Text style={tw`${textPrimary} font-bold text-sm`}>Ask SIYA AI</Text>
                <Text style={tw`text-[10px] text-gray-500`}>Get customized strategy suggestions</Text>
              </View>
            </View>
            
            <TouchableOpacity
              onPress={askSiyaForAdvice}
              disabled={loadingSiya}
              style={tw`bg-[#10B981] px-2 py-2 rounded-xl flex-row items-center`}
            >
              {loadingSiya ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="flash-outline" size={14} color="white" style={tw`mr-1.5`} />
                  <Text style={tw`text-white font-bold text-xs`}>Optimize</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* AI Response Window */}
          {loadingSiya ? (
            <View style={tw`py-8 items-center justify-center`}>
              <ActivityIndicator size="large" color="#10B981" />
              <Text style={tw`text-gray-500 text-xs mt-3`}>Siya is auditing your portfolios...</Text>
            </View>
          ) : siyaPlan ? (
            <View style={tw`${inputBg} p-4 rounded-2xl border ${cardBorder}`}>
              <Text style={tw`${textPrimary} text-xs leading-5`}>
                {siyaPlan.replace(/###/g, '').replace(/\*\*/g, '').replace(/#/g, '')}
              </Text>
            </View>
          ) : (
            <View style={tw`border-2 border-dashed ${cardBorder} rounded-2xl py-6 items-center justify-center`}>
              <Text style={tw`text-gray-500 text-xs`}>No recommendations loaded yet.</Text>
              <Text style={tw`text-[10px] text-gray-500 mt-1`}>Click Optimize to invoke Sovereignty Guardian</Text>
            </View>
          )}
        </View>

      </ScrollView>
    </View>
  );
}
