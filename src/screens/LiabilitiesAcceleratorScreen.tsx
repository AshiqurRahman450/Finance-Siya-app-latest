import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import tw from 'twrnc';
import { Ionicons, Feather } from '@expo/vector-icons';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';

export default function LiabilitiesAcceleratorScreen() {
  const navigation = useNavigation();
  const { isDark, formatCurrency } = useTheme();
  const { debts, transactions, survivalSpending } = useAuth();
  
  const [strategy, setStrategy] = useState<'avalanche' | 'snowball'>('avalanche');
  const [selectedStrategy, setSelectedStrategy] = useState<'hybrid' | 'passive' | 'paydown'>('hybrid');

  const cardBg = isDark ? 'bg-[#0B0F19]' : 'bg-white';
  const cardBorder = isDark ? 'border-gray-800' : 'border-gray-200';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-500';

  const parseNumberFromString = (str: string) => {
    if (!str) return 0;
    const clean = str.replace(/[^0-9.]/g, '');
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? 0 : parsed;
  };

  const netSurplus = useMemo(() => {
    let income = 0;
    transactions.forEach((t: any) => { if (t.type === 'income') income += t.amount; });
    let expenses = 0;
    if (survivalSpending) {
      expenses += (survivalSpending.food || 0) + (survivalSpending.clothes || 0) + (survivalSpending.travel || 0) + (survivalSpending.rent || 0) + (survivalSpending.other || 0) + (survivalSpending.loan || 0);
    }
    const net = income - expenses;
    return net > 0 ? net : 500; // default to 500 if no surplus is calculated
  }, [transactions, survivalSpending]);

  const { totalDebt, uniqueCategories } = useMemo(() => {
    let total = 0;
    const categories = new Set<string>();
    debts.forEach((d: any) => {
      total += parseNumberFromString(d.remaining);
      if (d.category) categories.add(d.category);
    });
    return {
      totalDebt: total,
      uniqueCategories: Array.from(categories).join(' + ') || 'Liabilities'
    };
  }, [debts]);

  const totalMonthlyDebtPayment = useMemo(() => {
    return debts.reduce((sum: any, d: any) => sum + parseNumberFromString(d.monthly || d.minPayment), 0);
  }, [debts]);

  const userMonthlyIncome = useMemo(() => {
    let income = 0;
    transactions.forEach((t: any) => { if (t.type === 'income') income += t.amount; });
    return income > 0 ? income : 5000;
  }, [transactions]);

  const slaveryDaysFromIncome = useMemo(() => {
    if (totalDebt === 0 || userMonthlyIncome === 0) return 0;
    return Math.round(totalDebt / (userMonthlyIncome / 30));
  }, [totalDebt, userMonthlyIncome]);

  const passiveMonthlyIncome = useMemo(() => {
    return (netSurplus * 0.10) / 12; // Assuming default 10% yield
  }, [netSurplus]);

  const minimumPayoffMonths = useMemo(() => {
    if (totalDebt === 0 || totalMonthlyDebtPayment === 0) return 0;
    return totalDebt / totalMonthlyDebtPayment;
  }, [totalDebt, totalMonthlyDebtPayment]);

  const directPaydownPayoffMonths = useMemo(() => {
    if (totalDebt === 0 || totalMonthlyDebtPayment === 0) return 0;
    const remainingDebt = Math.max(0, totalDebt - netSurplus);
    return remainingDebt / totalMonthlyDebtPayment;
  }, [totalDebt, netSurplus, totalMonthlyDebtPayment]);

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

  // Simulation logic extracted to calculate both strategies
  const simulatePayoff = (strat: 'avalanche' | 'snowball') => {
    if (debts.length === 0 || totalDebt === 0) {
      return { freedomDate: 'Debt Free', acceleratedYears: '0.0', interestSaved: 0 };
    }

    let sortedDebts = [...debts].map((d: any) => ({
      ...d,
      remainingNum: parseNumberFromString(d.remaining),
      interestNum: parseNumberFromString(d.interest) || (d.category && d.category.toLowerCase().includes('credit') ? 22 : 10),
      minPaymentNum: parseNumberFromString(d.monthly || d.minPayment) || (parseNumberFromString(d.remaining) * 0.02)
    }));

    if (strat === 'avalanche') {
      sortedDebts.sort((a, b) => b.interestNum - a.interestNum); // Highest % First
    } else {
      sortedDebts.sort((a, b) => a.remainingNum - b.remainingNum); // Lowest Balance First
    }

    let baselineMonths = 0;
    let baselineTotalInterest = 0;
    let tempBaselineDebts = sortedDebts.map(d => ({...d}));
    
    while (tempBaselineDebts.some(d => d.remainingNum > 0) && baselineMonths < 360) {
      baselineMonths++;
      for (let i = 0; i < tempBaselineDebts.length; i++) {
        const d = tempBaselineDebts[i];
        if (d.remainingNum > 0) {
          const interestCharge = d.remainingNum * (d.interestNum / 100 / 12);
          baselineTotalInterest += interestCharge;
          d.remainingNum += interestCharge;
          d.remainingNum -= d.minPaymentNum;
          if (d.remainingNum < 0) d.remainingNum = 0;
        }
      }
    }

    let accelMonths = 0;
    let accelTotalInterest = 0;
    let tempAccelDebts = sortedDebts.map(d => ({...d}));
    
    while (tempAccelDebts.some(d => d.remainingNum > 0) && accelMonths < 360) {
      accelMonths++;
      let extraPayment = netSurplus;
      
      for (let i = 0; i < tempAccelDebts.length; i++) {
        const d = tempAccelDebts[i];
        if (d.remainingNum > 0) {
          const interestCharge = d.remainingNum * (d.interestNum / 100 / 12);
          accelTotalInterest += interestCharge;
          d.remainingNum += interestCharge;
          
          let payment = Math.min(d.remainingNum, d.minPaymentNum);
          d.remainingNum -= payment;
        }
      }

      for (let i = 0; i < tempAccelDebts.length; i++) {
        const d = tempAccelDebts[i];
        if (d.remainingNum > 0 && extraPayment > 0) {
          let payment = Math.min(d.remainingNum, extraPayment);
          d.remainingNum -= payment;
          extraPayment -= payment;
        }
      }
    }

    const saved = Math.max(0, baselineTotalInterest - accelTotalInterest);
    const yearsSaved = Math.max(0, (baselineMonths - accelMonths) / 12).toFixed(1);
    
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + accelMonths);
    const dateStr = futureDate.toLocaleString('en-US', { month: 'short', year: 'numeric' });

    return { freedomDate: dateStr, acceleratedYears: yearsSaved, interestSaved: saved };
  };

  const avalancheStats = useMemo(() => simulatePayoff('avalanche'), [debts, netSurplus, totalDebt]);
  const snowballStats = useMemo(() => simulatePayoff('snowball'), [debts, netSurplus, totalDebt]);

  const activeStats = strategy === 'avalanche' ? avalancheStats : snowballStats;
  const { freedomDate, acceleratedYears, interestSaved } = activeStats;

  return (
    <ScreenWrapper>
      <View style={tw`pb-6 flex-row items-center justify-between`}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={tw`w-10 h-10 rounded-full ${isDark ? 'bg-gray-800' : 'bg-gray-100'} items-center justify-center`}
        >
          <Ionicons name="arrow-back" size={20} color={isDark ? '#FFF' : '#000'} />
        </TouchableOpacity>
        <Text style={tw`${textPrimary} text-lg font-bold`}>Liabilities</Text>
        <View style={tw`w-10 h-10`} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`pb-12`}>
        {/* Header section */}
        <View style={tw`${cardBg} rounded-2xl p-6 border ${cardBorder} mb-6`}>
          <Text style={tw`${textPrimary} text-lg font-bold mb-2`}>Liabilities Payoff Accelerator</Text>
          <Text style={tw`${textSecondary} text-sm mb-6`}>
            Simulate snowball vs. avalanche strategy using monthly net surplus.
          </Text>

          <View style={tw`flex-row justify-between bg-gray-900 rounded-xl overflow-hidden`}>
            <TouchableOpacity
              onPress={() => setStrategy('avalanche')}
              style={[
                tw`flex-1 py-3 items-center justify-center`,
                strategy === 'avalanche' ? tw`bg-[#10B981] rounded-xl` : tw`bg-transparent`
              ]}
            >
              <Text style={tw`${strategy === 'avalanche' ? 'text-gray-900' : 'text-gray-400'} font-bold text-sm text-center`}>
                Avalanche{'\n'}<Text style={tw`text-xs font-medium`}>(Highest % First)</Text>{'\n'}
                <Text style={tw`text-[10px] ${strategy === 'avalanche' ? 'text-gray-800' : 'text-[#10B981]'}`}>Saves {formatCurrency(avalancheStats.interestSaved)}</Text>
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => setStrategy('snowball')}
              style={[
                tw`flex-1 py-3 items-center justify-center`,
                strategy === 'snowball' ? tw`bg-[#10B981] rounded-xl` : tw`bg-transparent`
              ]}
            >
              <Text style={tw`${strategy === 'snowball' ? 'text-gray-900' : 'text-gray-400'} font-bold text-sm text-center`}>
                Snowball{'\n'}<Text style={tw`text-xs font-medium`}>(Lowest Balance)</Text>{'\n'}
                <Text style={tw`text-[10px] ${strategy === 'snowball' ? 'text-gray-800' : 'text-[#10B981]'}`}>Saves {formatCurrency(snowballStats.interestSaved)}</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Total Liabilities */}
        <View style={tw`${cardBg} rounded-2xl p-6 border ${cardBorder} mb-4`}>
          <Text style={tw`${textSecondary} text-sm mb-2`}>Total Outstanding Liabilities</Text>
          <Text style={tw`text-[#EF4444] text-3xl font-bold mb-2`}>{formatCurrency(totalDebt)}</Text>
          <Text style={tw`${textSecondary} text-xs capitalize`}>{uniqueCategories}</Text>
        </View>

        {/* Estimated Freedom Date */}
        <View style={tw`${cardBg} rounded-2xl p-6 border ${cardBorder} mb-4`}>
          <Text style={tw`${textSecondary} text-sm mb-2`}>Estimated Freedom Date</Text>
          <Text style={tw`text-[#10B981] text-3xl font-bold mb-2`}>{freedomDate}</Text>
          <Text style={tw`text-[#10B981] text-xs font-medium`}>Accelerated by {acceleratedYears} Years</Text>
        </View>

        {/* Estimated Interest Saved */}
        <View style={tw`${cardBg} rounded-2xl p-6 border ${cardBorder} mb-6`}>
          <Text style={tw`${textSecondary} text-sm mb-2`}>Estimated Interest Saved</Text>
          <Text style={tw`text-[#F59E0B] text-3xl font-bold mb-2`}>{formatCurrency(interestSaved)}</Text>
          <Text style={tw`${textSecondary} text-xs capitalize`}>{strategy} Strategy Return</Text>
        </View>

        {/* Reduce Slavery Section */}
        <View style={tw`${cardBg} border ${cardBorder} rounded-3xl p-6 mb-6`}>
          <View style={tw`flex-row items-center mb-3`}>
            <View style={tw`w-8 h-8 rounded-lg bg-[#EF4444]/20 items-center justify-center mr-2`}>
              <Ionicons name="shield-outline" size={16} color="#EF4444" />
            </View>
            <Text style={tw`${textPrimary} font-bold text-sm`}>Reduce Slavery</Text>
          </View>

          <View style={tw`flex-row justify-between mb-4`}>
            <View>
              <Text style={tw`text-[10px] text-gray-500 uppercase font-bold mb-1`}>Total Debt Burden</Text>
              <Text style={tw`text-[#EF4444] font-bold text-lg`}>
                {formatCurrency(totalDebt)}
              </Text>
            </View>
            <View>
              <Text style={tw`text-[10px] text-gray-500 uppercase font-bold mb-1`}>Slavery Days (Income)</Text>
              <Text style={tw`text-[#EF4444] font-bold text-lg`}>
                {slaveryDaysFromIncome} days
              </Text>
            </View>
          </View>

          {totalDebt > 0 ? (
            <Text style={tw`text-gray-500 text-[10px] leading-4 mb-4`}>
              It takes <Text style={tw`font-bold ${textPrimary}`}>{slaveryDaysFromIncome} days</Text> of your monthly income (₹{userMonthlyIncome.toLocaleString()}/mo) to pay off this debt. Under min payments of {formatCurrency(totalMonthlyDebtPayment)}/mo, you are bound for {minimumPayoffMonths.toFixed(1)} months.
            </Text>
          ) : (
            <Text style={tw`text-green-500 text-[10px] font-bold mb-4`}>
              No debt slavery! 100% sovereign status.
            </Text>
          )}

          <View style={tw`pt-3 border-t border-dashed ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
            <Text style={tw`text-gray-500 text-[10px] uppercase font-bold mb-0.5`}>Slavery Days Saved</Text>
            <Text style={tw`text-[#EF4444] font-bold text-base`}>
              -{selectedStrategy === 'paydown' ? directPaydownSlaveryDaysSaved : hybridSlaveryDaysSaved} days
            </Text>
            <Text style={tw`text-[9px] text-gray-500`}>
              Using {selectedStrategy === 'paydown' ? 'Direct Paydown' : 'Siya Hybrid Path'}
            </Text>
          </View>
        </View>

        {/* Strategy Comparison Simulator */}
        <View style={tw`${cardBg} border ${cardBorder} rounded-3xl p-5 mb-5`}>
          <Text style={tw`${textPrimary} text-sm font-bold uppercase tracking-wider mb-4`}>
            Choose & Simulate Payoff Strategy
          </Text>

          {/* Strategy Selectors */}
          <View style={tw`flex-col gap-3`}>
            {/* Strategy 3: Hybrid (Recommended) */}
            <TouchableOpacity
              onPress={() => setSelectedStrategy('hybrid')}
              style={tw`border-2 rounded-2xl p-4 ${selectedStrategy === 'hybrid' ? 'border-[#10B981] bg-[#10B981]/5' : (isDark ? 'border-gray-800 bg-[#0B0E14]' : 'border-gray-200 bg-gray-50')}`}
            >
              <View style={tw`flex-row justify-between items-center mb-1`}>
                <View style={tw`flex-row items-center`}>
                  <Ionicons name="sparkles" size={16} color="#10B981" style={tw`mr-2`} />
                  <Text style={tw`font-bold text-sm ${selectedStrategy === 'hybrid' ? 'text-[#10B981]' : textPrimary}`}>
                    Siya Hybrid Sovereignty Path
                  </Text>
                </View>
                <View style={tw`px-2 py-0.5 bg-[#10B981]/20 rounded-full`}>
                  <Text style={tw`text-[#10B981] text-[9px] font-bold uppercase`}>Rec</Text>
                </View>
              </View>
              <Text style={tw`text-[11px] ${textSecondary} mb-3 leading-4`}>
                Invest savings into passive returns. Channel passive returns to accelerate debt payoffs. Keep the assets!
              </Text>
              {totalDebt > 0 && (
                <View style={tw`flex-row justify-between items-center mt-2 pt-2 border-t border-dashed ${isDark ? 'border-gray-800' : 'border-gray-300'}`}>
                  <Text style={tw`text-[11px] text-gray-500`}>Payoff: <Text style={tw`font-bold ${textPrimary}`}>{hybridPayoffMonths.toFixed(1)} mos</Text></Text>
                  <Text style={tw`text-[11px] text-[#10B981] font-bold`}>Saves {hybridSlaveryDaysSaved} days</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Strategy 2: Direct Paydown */}
            <TouchableOpacity
              onPress={() => setSelectedStrategy('paydown')}
              style={tw`border-2 rounded-2xl p-4 ${selectedStrategy === 'paydown' ? 'border-[#3B82F6] bg-[#3B82F6]/5' : (isDark ? 'border-gray-800 bg-[#0B0E14]' : 'border-gray-200 bg-gray-50')}`}
            >
              <View style={tw`flex-row items-center mb-1`}>
                <Feather name="trash-2" size={15} color="#3B82F6" style={tw`mr-2`} />
                <Text style={tw`font-bold text-sm ${selectedStrategy === 'paydown' ? 'text-[#3B82F6]' : textPrimary}`}>
                  Pure Debt Paydown
                </Text>
              </View>
              <Text style={tw`text-[11px] ${textSecondary} mb-3 leading-4`}>
                Inject savings directly into debt principal to clear it as fast as possible. (Asset column remains empty).
              </Text>
              {totalDebt > 0 && (
                <View style={tw`flex-row justify-between items-center mt-2 pt-2 border-t border-dashed ${isDark ? 'border-gray-800' : 'border-gray-300'}`}>
                  <Text style={tw`text-[11px] text-gray-500`}>Payoff: <Text style={tw`font-bold ${textPrimary}`}>{directPaydownPayoffMonths.toFixed(1)} mos</Text></Text>
                  <Text style={tw`text-[11px] text-[#3B82F6] font-bold`}>Saves {directPaydownSlaveryDaysSaved} days</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Strategy 1: Pure Passive */}
            <TouchableOpacity
              onPress={() => setSelectedStrategy('passive')}
              style={tw`border-2 rounded-2xl p-4 ${selectedStrategy === 'passive' ? 'border-gray-500 bg-gray-500/5' : (isDark ? 'border-gray-800 bg-[#0B0E14]' : 'border-gray-200 bg-gray-50')}`}
            >
              <View style={tw`flex-row items-center mb-1`}>
                <Feather name="clock" size={15} color="#9CA3AF" style={tw`mr-2`} />
                <Text style={tw`font-bold text-sm ${selectedStrategy === 'passive' ? 'text-gray-400' : textPrimary}`}>
                  Pure Passive Growth
                </Text>
              </View>
              <Text style={tw`text-[11px] ${textSecondary} mb-3 leading-4`}>
                Keep savings fully invested and pay only minimum monthly payments on debts.
              </Text>
              {totalDebt > 0 && (
                <View style={tw`flex-row justify-between items-center mt-2 pt-2 border-t border-dashed ${isDark ? 'border-gray-800' : 'border-gray-300'}`}>
                  <Text style={tw`text-[11px] text-gray-500`}>Payoff: <Text style={tw`font-bold ${textPrimary}`}>{minimumPayoffMonths.toFixed(1)} mos</Text></Text>
                  <Text style={tw`text-[11px] text-gray-400 font-bold`}>Saves 0 days</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </ScreenWrapper>
  );
}
