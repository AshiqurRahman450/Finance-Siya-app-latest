import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import tw from 'twrnc';
import { Feather, Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';

const DebtCard = ({ item, onEdit, onDelete, isDark }) => {
  const remainingNum = parseFloat(item.remaining?.toString().replace(/[^0-9.-]+/g,"")) || 0;
  const paidNum = parseFloat(item.paid?.toString().replace(/[^0-9.-]+/g,"")) || 0;
  const total = remainingNum + paidNum;
  const progressPercent = total > 0 ? (paidNum / total) * 100 : 0;
  const cBg = isDark ? 'bg-[#06080F]' : 'bg-white';
  const cBorder = isDark ? 'border-gray-700' : 'border-gray-200';
  const btnBg = isDark ? 'bg-[#0F172A]' : 'bg-gray-100';
  const btnBorder = isDark ? 'border-[#1E293B]' : 'border-gray-200';
  const tp = isDark ? 'text-white' : 'text-gray-900';

  return (
    <View style={tw`${cBg} border ${cBorder} rounded-3xl p-5 mb-4 relative`}>
      <View style={tw`absolute top-5 right-5 flex-row gap-2 z-10`}>
        <TouchableOpacity onPress={() => onEdit(item)} style={tw`w-10 h-10 ${btnBg} rounded-xl items-center justify-center border ${btnBorder}`}>
          <Feather name="edit-2" size={16} color="#3B82F6" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onDelete(item.id)} style={tw`w-10 h-10 ${btnBg} rounded-xl items-center justify-center border ${btnBorder}`}>
          <Feather name="trash-2" size={16} color="#EF4444" />
        </TouchableOpacity>
      </View>
      <Text style={tw`${tp} font-bold text-lg mb-1 pr-24`}>{item.title}</Text>
      <Text style={tw`text-gray-500 text-sm mb-4`}>{item.category}{item.interest ? ` • ${item.interest}% APR` : ''}</Text>
      <View style={tw`flex-row justify-between flex-end items-baseline mb-4 mt-2`}>
        <View style={tw`flex-row items-baseline`}>
          <Text style={tw`${tp} font-bold text-2xl`}>{item.remaining}</Text>
          <Text style={tw`text-gray-500 text-xs ml-1`}>remaining</Text>
        </View>
        <Text style={tw`${isDark ? 'text-gray-300' : 'text-gray-600'} font-semibold`}>{item.monthly}</Text>
      </View>
      <View style={tw`h-2 ${isDark ? 'bg-[#0F172A]' : 'bg-gray-100'} rounded-full mb-4 overflow-hidden`}>
        <View style={[{ width: `${progressPercent}%` }, tw`h-full bg-[#10B981] rounded-full`]} />
      </View>
      <View style={tw`flex-row justify-between items-center`}>
        <View style={tw`flex-row items-center`}>
          <Feather name="calendar" size={12} color="#6B7280" />
          <Text style={tw`text-gray-500 text-xs ml-1`}>Due: {item.due}</Text>
        </View>
        <Text style={tw`text-[#10B981] font-bold text-sm`}>{item.paid} paid</Text>
      </View>
    </View>
  );
};

const SavingsGoalCard = ({ item, onEdit, onDelete, isDark, formatCurrency }) => {
  const targetNum = parseFloat(item.target?.toString()) || 0;
  const savedNum = parseFloat(item.saved?.toString()) || 0;
  const progress = Math.min((savedNum / targetNum) * 100, 100) || 0;
  const cBg = isDark ? 'bg-[#06080F]' : 'bg-white';
  const cBorder = isDark ? 'border-gray-700' : 'border-gray-200';
  const btnBg = isDark ? 'bg-[#0F172A]' : 'bg-gray-100';
  const btnBorder = isDark ? 'border-[#1E293B]' : 'border-gray-200';
  const tp = isDark ? 'text-white' : 'text-gray-900';

  return (
    <View style={tw`${cBg} border ${cBorder} rounded-3xl p-5 mb-4 relative`}>
      <View style={tw`absolute top-5 right-5 flex-row gap-2 z-10`}>
        <TouchableOpacity onPress={() => onEdit(item)} style={tw`w-10 h-10 ${btnBg} rounded-xl items-center justify-center border ${btnBorder}`}>
          <Feather name="edit-2" size={16} color="#3B82F6" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onDelete(item.id)} style={tw`w-10 h-10 ${isDark ? 'bg-[#4C1D2E]' : 'bg-red-100'} rounded-xl items-center justify-center`}>
          <Ionicons name="trash-outline" size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>
      <Text style={tw`${tp} font-bold text-lg mb-1 pr-24`}>{item.name}</Text>
      <Text style={tw`text-gray-400 text-sm mb-3`}>Target: {formatCurrency(targetNum)}</Text>
      <View style={tw`flex-row items-baseline mb-3 mt-2`}>
        <Text style={tw`text-[#10B981] font-bold text-2xl`}>{formatCurrency(savedNum)}</Text>
        <Text style={tw`text-gray-400 text-sm ml-2`}>saved</Text>
      </View>
      <View style={tw`h-2.5 ${isDark ? 'bg-[#1E293B]' : 'bg-gray-100'} rounded-full overflow-hidden`}>
        <View style={[{ width: `${progress}%` }, tw`h-full bg-[#10B981] rounded-full`]} />
      </View>
    </View>
  );
};

export default function DebtScreen() {
  const { isDark, formatCurrency } = useTheme();
  const cardBg = isDark ? 'bg-[#06080F]' : 'bg-white';
  const cardBorder = isDark ? 'border-gray-700' : 'border-gray-200';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const modalBg = isDark ? 'bg-[#0F172A]' : 'bg-white';
  const fieldBg = isDark ? 'bg-[#1E293B]' : 'bg-gray-50';
  const fieldBorder = isDark ? 'border-[#334155]' : 'border-gray-200';

  const {
    debts,
    addDebt,
    updateDebtState,
    deleteDebtState,
    transactions,
    savings,
    addSavings,
    updateSavingsState,
    deleteSavingsState
  } = useAuth();

  const [debtModalVisible, setDebtModalVisible] = useState(false);
  const [savingsModalVisible, setSavingsModalVisible] = useState(false);
  const [editingDebt, setEditingDebt] = useState(null);
  const [editingSavings, setEditingSavings] = useState(null);
  const [debtForm, setDebtForm] = useState({ title: '', category: '', remaining: '', monthly: '', due: '', paid: '', interest: '' });
  const [savingsForm, setSavingsForm] = useState({ name: '', target: '', saved: '' });

  // Auto-calculate interest rate when remaining, monthly, and paid are filled
  useEffect(() => {
    if (!debtForm.remaining || !debtForm.monthly || !debtForm.paid) return;
    
    const r = parseFloat(debtForm.remaining.toString().replace(/[^0-9.-]+/g, ''));
    const m = parseFloat(debtForm.monthly.toString().replace(/[^0-9.-]+/g, ''));
    const p = parseFloat(debtForm.paid.toString().replace(/[^0-9.-]+/g, ''));
    
    if (!isNaN(r) && !isNaN(m) && !isNaN(p) && p !== 0) {
      const calculatedInterest = Math.round((r * m) / p).toString();
      if (debtForm.interest !== calculatedInterest) {
        setDebtForm(prev => ({ ...prev, interest: calculatedInterest }));
      }
    }
  }, [debtForm.remaining, debtForm.monthly, debtForm.paid]);

  // ── Computed from real API data ──
  const totalDebtRemaining = debts.reduce((sum, item) => sum + parseFloat(item.remaining?.toString().replace(/[^0-9.-]+/g,"") || '0'), 0);
  const totalDebtPaid = debts.reduce((sum, item) => sum + parseFloat(item.paid?.toString().replace(/[^0-9.-]+/g,"") || '0'), 0);
  const totalDebt = totalDebtRemaining + totalDebtPaid;
  const overallDebtProgress = totalDebt > 0 ? (totalDebtPaid / totalDebt) * 100 : 0;

  // Total savings from real savings goals API data
  const totalSavings = useMemo(
    () => savings.reduce((sum, item) => sum + (parseFloat(item.saved?.toString()) || 0), 0),
    [savings]
  );

  // Total expenses from real transaction data
  const totalExpense = useMemo(
    () => transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0),
    [transactions]
  );

  const openDebtModal = (debt = null) => {
    if (debt) { setEditingDebt(debt); setDebtForm(debt); }
    else { setEditingDebt(null); setDebtForm({ title: '', category: '', remaining: '', monthly: '', due: '', paid: '', interest: '' }); }
    setDebtModalVisible(true);
  };
  const saveDebt = async () => {
    try {
      if (editingDebt) { 
        await updateDebtState(editingDebt.id, debtForm); 
      } else { 
        await addDebt(debtForm); 
      }
      setDebtModalVisible(false);
    } catch (err) {
      Alert.alert('Error', 'Could not save debt to server.');
    }
  };
  const deleteDebt = (id) => {
    Alert.alert('Delete Debt', 'Are you sure you want to delete this debt?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive', 
        onPress: async () => {
          try {
            await deleteDebtState(id);
          } catch (err) {
            Alert.alert('Error', 'Could not delete debt from server.');
          }
        } 
      }
    ]);
  };
  const openSavingsModal = (savingsItem = null) => {
    if (savingsItem) {
      setEditingSavings(savingsItem);
      setSavingsForm({
        name: savingsItem.name,
        target: savingsItem.target?.toString() || '',
        saved: savingsItem.saved?.toString() || ''
      });
    } else {
      setEditingSavings(null);
      setSavingsForm({ name: '', target: '', saved: '' });
    }
    setSavingsModalVisible(true);
  };
  const saveSavingsGoal = async () => {
    if (!savingsForm.name || !savingsForm.target) {
      Alert.alert('Error', 'Please fill in name and target amount.');
      return;
    }
    try {
      const payload = {
        name: savingsForm.name,
        target: parseFloat(savingsForm.target),
        saved: parseFloat(savingsForm.saved) || 0
      };
      if (editingSavings) {
        await updateSavingsState(editingSavings.id, payload);
      } else {
        await addSavings(payload);
      }
      setSavingsModalVisible(false);
    } catch (err) {
      Alert.alert('Error', 'Could not save savings goal to server.');
    }
  };
  const deleteSavingsGoal = (id) => {
    Alert.alert('Delete Goal', 'Are you sure you want to delete this savings goal?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteSavingsState(id);
          } catch (err) {
            Alert.alert('Error', 'Could not delete savings goal from server.');
          }
        }
      }
    ]);
  };

  return (
    <ScreenWrapper title="Debt Liberator">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`pb-8`}>

        {/* Top Summary Card */}
        <View style={tw`${cardBg} border ${cardBorder} rounded-3xl p-6 mb-6`}>
          <View style={tw`flex-row justify-between mb-6`}>
            <View style={tw`items-center`}>
              <Feather name="trending-down" size={18} color="#EF4444" style={tw`mb-1`} />
              <Text style={tw`text-gray-400 text-[10px] font-bold tracking-widest uppercase mb-1`}>Total Debt</Text>
              <Text style={tw`text-[#EF4444] text-lg font-bold`}>{formatCurrency(totalDebtRemaining)}</Text>
            </View>
            <View style={tw`items-center`}>
              <Ionicons name="cart-outline" size={18} color="#10B981" style={tw`mb-1`} />
              <Text style={tw`text-gray-400 text-[10px] font-bold tracking-widest uppercase mb-1`}>Savings</Text>
              <Text style={tw`text-[#10B981] text-lg font-bold`}>{formatCurrency(totalSavings)}</Text>
            </View>
            <View style={tw`items-center`}>
              <Feather name="dollar-sign" size={18} color="#3B82F6" style={tw`mb-1`} />
              <Text style={tw`text-gray-400 text-[10px] font-bold tracking-widest uppercase mb-1`}>Expenses</Text>
              <Text style={tw`text-[#3B82F6] text-lg font-bold`}>{formatCurrency(totalExpense)}</Text>
            </View>
          </View>
          <View style={tw`flex-row justify-between items-end mb-2`}>
            <Text style={tw`text-gray-400 font-semibold text-sm`}>Debt Payoff Progress</Text>
            <Text style={tw`text-[#10B981] font-bold`}>{overallDebtProgress.toFixed(0)}%</Text>
          </View>
          <View style={tw`h-2 ${isDark ? 'bg-[#0F172A]' : 'bg-gray-100'} rounded-full overflow-hidden`}>
            <View style={[tw`h-full bg-[#10B981] rounded-full`, { width: `${overallDebtProgress}%` }]} />
          </View>
        </View>

        {/* Section Header */}
        <View style={tw`flex-row justify-between items-center mb-4`}>
          <Text style={tw`${textPrimary} text-xl font-bold`}>Debts</Text>
          <TouchableOpacity onPress={() => openDebtModal()} style={tw`${isDark ? 'bg-[#064E3B]' : 'bg-[#ECFDF5]'} px-3 py-1.5 rounded-lg flex-row items-center`}>
            <Feather name="plus" size={14} color="#10B981" />
            <Text style={tw`text-[#10B981] font-bold ml-1 text-sm`}>Add</Text>
          </TouchableOpacity>
        </View>

        {debts.length > 0 ? (
          debts.map(debt => (
            <DebtCard key={debt.id} item={debt} onEdit={openDebtModal} onDelete={deleteDebt} isDark={isDark} />
          ))
        ) : (
          <View style={tw`${cardBg} border ${cardBorder} rounded-2xl p-6 mb-3 items-center`}>
            <Ionicons name="card-outline" size={32} color="#4B5563" style={tw`mb-2`} />
            <Text style={tw`text-gray-500 text-sm`}>No debts yet</Text>
          </View>
        )}

        {/* Savings Goals Section */}
        <View style={tw`flex-row justify-between items-center mb-4 mt-4`}>
          <Text style={tw`${textPrimary} text-xl font-bold`}>Savings Goals</Text>
          <TouchableOpacity onPress={() => openSavingsModal()} style={tw`${isDark ? 'bg-[#064E3B]' : 'bg-[#ECFDF5]'} px-3 py-1.5 rounded-lg flex-row items-center`}>
            <Feather name="plus" size={14} color="#10B981" />
            <Text style={tw`text-[#10B981] font-bold ml-1 text-sm`}>Add</Text>
          </TouchableOpacity>
        </View>

        {savings.length > 0 ? (
          savings.map(goal => (
            <SavingsGoalCard key={goal.id} item={goal} onEdit={openSavingsModal} onDelete={deleteSavingsGoal} isDark={isDark} formatCurrency={formatCurrency} />
          ))
        ) : (
          <View style={tw`${cardBg} border ${cardBorder} rounded-2xl p-6 mb-3 items-center`}>
            <Ionicons name="wallet-outline" size={32} color="#4B5563" style={tw`mb-2`} />
            <Text style={tw`text-gray-500 text-sm`}>No savings goals yet</Text>
          </View>
        )}

      </ScrollView>

      {/* Debt Modal */}
      <Modal visible={debtModalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={tw`flex-1 justify-end`}>
          <View style={tw`${modalBg} p-6 rounded-t-3xl border-t ${isDark ? 'border-gray-800' : 'border-gray-200'} shadow-2xl`}>
            <View style={tw`flex-row justify-between items-center mb-5`}>
              <Text style={tw`${textPrimary} text-xl font-bold`}>{editingDebt ? 'Edit Debt' : 'Add New Debt'}</Text>
              <TouchableOpacity onPress={() => setDebtModalVisible(false)}>
                <View style={tw`w-8 h-8 ${fieldBg} rounded-full items-center justify-center`}><Feather name="x" size={16} color="#9CA3AF" /></View>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={tw`text-gray-400 mb-1 text-sm font-semibold`}>Title</Text>
              <TextInput style={tw`${fieldBg} ${textPrimary} p-3.5 rounded-xl mb-4 border ${fieldBorder}`} placeholder="e.g. Student Loan" placeholderTextColor="#64748B" value={debtForm.title} onChangeText={t => setDebtForm({...debtForm, title: t})} />
              <Text style={tw`text-gray-400 mb-1 text-sm font-semibold`}>Category</Text>
              <TextInput style={tw`${fieldBg} ${textPrimary} p-3.5 rounded-xl mb-4 border ${fieldBorder}`} placeholder="e.g. Education" placeholderTextColor="#64748B" value={debtForm.category} onChangeText={t => setDebtForm({...debtForm, category: t})} />
              <Text style={tw`text-gray-400 mb-1 text-sm font-semibold`}>Remaining Amount</Text>
              <TextInput style={tw`${fieldBg} ${textPrimary} p-3.5 rounded-xl mb-4 border ${fieldBorder}`} placeholder="$16,500" placeholderTextColor="#64748B" keyboardType="numeric" value={debtForm.remaining} onChangeText={t => setDebtForm({...debtForm, remaining: t})} />
              <Text style={tw`text-gray-400 mb-1 text-sm font-semibold`}>Interest Rate (%)</Text>
              <TextInput style={tw`${fieldBg} ${textPrimary} p-3.5 rounded-xl mb-4 border ${fieldBorder}`} placeholder="e.g. 5.5" placeholderTextColor="#64748B" keyboardType="numeric" value={debtForm.interest?.toString()} onChangeText={t => setDebtForm({...debtForm, interest: t})} />
              <Text style={tw`text-gray-400 mb-1 text-sm font-semibold`}>Monthly Payment</Text>
              <TextInput style={tw`${fieldBg} ${textPrimary} p-3.5 rounded-xl mb-4 border ${fieldBorder}`} placeholder="$450/mo" placeholderTextColor="#64748B" value={debtForm.monthly} onChangeText={t => setDebtForm({...debtForm, monthly: t})} />
              <Text style={tw`text-gray-400 mb-1 text-sm font-semibold`}>Due Date</Text>
              <TextInput style={tw`${fieldBg} ${textPrimary} p-3.5 rounded-xl mb-4 border ${fieldBorder}`} placeholder="YYYY-MM-DD" placeholderTextColor="#64748B" value={debtForm.due} onChangeText={t => setDebtForm({...debtForm, due: t})} />
              <Text style={tw`text-gray-400 mb-1 text-sm font-semibold`}>Amount Paid</Text>
              <TextInput style={tw`${fieldBg} ${textPrimary} p-3.5 rounded-xl mb-4 border ${fieldBorder}`} placeholder="$8,500" placeholderTextColor="#64748B" keyboardType="numeric" value={debtForm.paid} onChangeText={t => setDebtForm({...debtForm, paid: t})} />
              <View style={tw`flex-row justify-between mt-2 mb-8`}>
                <TouchableOpacity onPress={() => setDebtModalVisible(false)} style={tw`${fieldBg} py-3.5 px-8 rounded-xl border ${fieldBorder}`}>
                  <Text style={tw`${textPrimary} font-bold`}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={saveDebt} style={tw`bg-[#10B981] py-3.5 px-8 rounded-xl`}>
                  <Text style={tw`text-white font-bold`}>Save</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Savings Modal */}
      <Modal visible={savingsModalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={tw`flex-1 justify-end`}>
          <View style={tw`${modalBg} p-6 rounded-t-3xl border-t ${isDark ? 'border-gray-800' : 'border-gray-200'} shadow-2xl`}>
            <View style={tw`flex-row justify-between items-center mb-5`}>
              <Text style={tw`${textPrimary} text-xl font-bold`}>{editingSavings ? 'Edit Goal' : 'Add Savings Goal'}</Text>
              <TouchableOpacity onPress={() => setSavingsModalVisible(false)}>
                <View style={tw`w-8 h-8 ${fieldBg} rounded-full items-center justify-center`}><Feather name="x" size={16} color="#9CA3AF" /></View>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={tw`text-gray-400 mb-1 text-sm font-semibold`}>Name</Text>
              <TextInput style={tw`${fieldBg} ${textPrimary} p-3.5 rounded-xl mb-4 border ${fieldBorder}`} placeholder="e.g. Emergency Fund" placeholderTextColor="#64748B" value={savingsForm.name} onChangeText={t => setSavingsForm({...savingsForm, name: t})} />
              <Text style={tw`text-gray-400 mb-1 text-sm font-semibold`}>Target Amount</Text>
              <TextInput style={tw`${fieldBg} ${textPrimary} p-3.5 rounded-xl mb-4 border ${fieldBorder}`} placeholder="10000" placeholderTextColor="#64748B" keyboardType="numeric" value={savingsForm.target?.toString()} onChangeText={t => setSavingsForm({...savingsForm, target: t})} />
              <Text style={tw`text-gray-400 mb-1 text-sm font-semibold`}>Amount Saved</Text>
              <TextInput style={tw`${fieldBg} ${textPrimary} p-3.5 rounded-xl mb-4 border ${fieldBorder}`} placeholder="6500" placeholderTextColor="#64748B" keyboardType="numeric" value={savingsForm.saved?.toString()} onChangeText={t => setSavingsForm({...savingsForm, saved: t})} />
              <View style={tw`flex-row justify-between mt-2 mb-8`}>
                <TouchableOpacity onPress={() => setSavingsModalVisible(false)} style={tw`${fieldBg} py-3.5 px-8 rounded-xl border ${fieldBorder}`}>
                  <Text style={tw`${textPrimary} font-bold`}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={saveSavingsGoal} style={tw`bg-[#10B981] py-3.5 px-8 rounded-xl`}>
                  <Text style={tw`text-white font-bold`}>Save</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </ScreenWrapper>
  );
}
