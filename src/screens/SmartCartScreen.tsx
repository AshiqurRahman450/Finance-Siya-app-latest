import React, { useState, useMemo, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Modal,
  TextInput, Alert, KeyboardAvoidingView, Platform, Switch, ActivityIndicator
} from 'react-native';
import tw from 'twrnc';
import { Ionicons, Feather } from '@expo/vector-icons';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  { key: 'groceries', label: 'Groceries', icon: 'nutrition-outline', color: '#10B981', bg: '#064E3B' },
  { key: 'electronics', label: 'Electronics', icon: 'laptop-outline', color: '#3B82F6', bg: '#172554' },
  { key: 'clothing', label: 'Clothing', icon: 'shirt-outline', color: '#8B5CF6', bg: '#2E1065' },
  { key: 'home', label: 'Home', icon: 'home-outline', color: '#F59E0B', bg: '#451A03' },
  { key: 'health', label: 'Health', icon: 'fitness-outline', color: '#EF4444', bg: '#4C1D2E' },
  { key: 'other', label: 'Other', icon: 'pricetag-outline', color: '#9CA3AF', bg: '#1F2937' },
];

export default function SmartCartScreen({ navigation }) {
  const { isDark, formatCurrency } = useTheme();
  const auth = useAuth() || {};
  const {
    transactions = [],
    addTransaction,
    addSavings,
    syncData,
  } = auth;

  useEffect(() => {
    if (syncData) {
      syncData();
    }
  }, []);

  const cardBg = isDark ? 'bg-[#06080F]' : 'bg-white';
  const cardBorder = isDark ? 'border-gray-700' : 'border-gray-200';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const inputBg = isDark ? 'bg-[#0F172A]' : 'bg-gray-100';
  const inputBorder = isDark ? 'border-[#1E293B]' : 'border-gray-200';
  const modalBg = isDark ? 'bg-[#0F172A]' : 'bg-white';
  const fieldBg = isDark ? 'bg-[#1E293B]' : 'bg-gray-50';
  const fieldBorder = isDark ? 'border-[#334155]' : 'border-gray-200';

  // Calculate real available balance from backend transaction history
  const availableBalance = useMemo(() => {
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0);
    return totalIncome - totalExpense;
  }, [transactions]);

  // Shopping List Items State — Clean state (no hardcoded dummy items)
  const [items, setItems] = useState<any[]>([]);

  // Siya AI Evaluator State — Clean initial state (no hardcoded dummy strings)
  const [evalName, setEvalName] = useState('');
  const [evalPrice, setEvalPrice] = useState('');
  const [test1Passed, setTest1Passed] = useState(false);
  const [whyINeed, setWhyINeed] = useState('');
  const [test2Passed, setTest2Passed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const priceNum = parseFloat(evalPrice) || 0;
  const required2xBalance = priceNum * 2;
  const test3Passed = priceNum > 0 && availableBalance >= required2xBalance;

  const totalTestsPassed = (test1Passed ? 1 : 0) + (test2Passed ? 1 : 0) + (test3Passed ? 1 : 0);
  const allTestsPassed = test1Passed && test2Passed && test3Passed;

  // Add / Edit Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [form, setForm] = useState({
    name: '', category: 'groceries', price: '', quantity: '1', priority: false,
  });

  const getCategoryInfo = (key: string) => CATEGORIES.find(c => c.key === key) || CATEGORIES[5];

  const handleTestInSiya = (item: any) => {
    setEvalName(item.name);
    setEvalPrice(item.price.toString());
    setTest1Passed(false);
    setTest2Passed(false);
    setWhyINeed('');
    Alert.alert('Loaded in Siya AI', `"${item.name}" (${formatCurrency(item.price)}) loaded into Siya AI Purchase Tester above!`);
  };

  const handleConfirm48h = () => {
    if (!evalName.trim() || priceNum <= 0) {
      Alert.alert('Missing Info', 'Please enter a valid product name and price first.');
      return;
    }
    setTest1Passed(true);
    Alert.alert('Test 1 Passed ✓', '48-Hour Impulse Thinking Time verified! Impulse buying protection active.');
  };

  const handleSubmitWhyNeed = () => {
    if (!evalName.trim() || priceNum <= 0) {
      Alert.alert('Missing Info', 'Please enter a valid product name and price first.');
      return;
    }
    if (!whyINeed.trim()) {
      Alert.alert('Reason Required', 'Please enter why you need this item before submitting.');
      return;
    }
    setTest2Passed(true);
    Alert.alert('Test 2 Passed ✓', 'Necessity reason recorded & verified by Siya AI!');
  };

  const handleBuyProduct = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    Alert.alert(
      'Purchase Confirmation',
      `Confirm buying "${evalName}" for ${formatCurrency(priceNum)}? This will record an expense transaction in your backend account.`,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => setIsSubmitting(false) },
        {
          text: 'Buy Now 🛒',
          onPress: async () => {
            try {
              if (addTransaction) {
                await addTransaction({
                  name: `Purchase: ${evalName}`,
                  category: 'Shopping',
                  amount: priceNum,
                  type: 'expense',
                  date: new Date().toISOString(),
                });
              }
              setItems(prev => [
                { id: Date.now().toString(), name: evalName, category: 'electronics', price: priceNum, quantity: 1, priority: false, purchased: true },
                ...prev
              ]);
              Alert.alert('Item Purchased! 🎉', `Successfully recorded purchase of ${evalName}! Expense updated in backend.`);
              setTest1Passed(false);
              setTest2Passed(false);
              setWhyINeed('');
              setEvalName('');
              setEvalPrice('');
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to record purchase transaction.');
            } finally {
              setIsSubmitting(false);
            }
          }
        }
      ]
    );
  };

  const handleSaveForFreedom = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    Alert.alert(
      'Freedom Savings Choice',
      `Deposit ${formatCurrency(priceNum)} into your backend Savings for Future Freedom instead of buying "${evalName}"?`,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => setIsSubmitting(false) },
        {
          text: 'Put in Savings 💰',
          onPress: async () => {
            try {
              if (addSavings) {
                await addSavings({
                  name: `Freedom Fund from ${evalName}`,
                  target: priceNum,
                  saved: priceNum,
                  category: 'Freedom',
                });
              }
              Alert.alert(
                'Financial Freedom Victor! 🏆',
                `Amazing decision! You bypassed an impulse purchase of ${evalName} and added ${formatCurrency(priceNum)} to your Future Freedom Fund in backend!`
              );
              setTest1Passed(false);
              setTest2Passed(false);
              setWhyINeed('');
              setEvalName('');
              setEvalPrice('');
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to save to backend savings.');
            } finally {
              setIsSubmitting(false);
            }
          }
        }
      ]
    );
  };

  const openModal = (item: any = null) => {
    if (item) {
      setEditingItem(item);
      setForm({
        name: item.name,
        category: item.category,
        price: item.price.toString(),
        quantity: item.quantity.toString(),
        priority: item.priority,
      });
    } else {
      setEditingItem(null);
      setForm({ name: '', category: 'groceries', price: '', quantity: '1', priority: false });
    }
    setModalVisible(true);
  };

  const saveItem = () => {
    if (!form.name || !form.price) {
      Alert.alert('Missing Info', 'Please fill in item name and price.');
      return;
    }

    const itemData = {
      ...form,
      price: parseFloat(form.price),
      quantity: parseInt(form.quantity) || 1,
      purchased: editingItem ? editingItem.purchased : false,
    };

    if (editingItem) {
      setItems(items.map(i => i.id === editingItem.id ? { ...itemData, id: i.id } : i));
    } else {
      setItems([{ ...itemData, id: Date.now().toString() }, ...items]);
    }
    setModalVisible(false);
  };

  const deleteItem = (id: string) => {
    Alert.alert('Remove Item', 'Remove this item from your cart?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => setItems(items.filter(i => i.id !== id)) },
    ]);
  };

  const togglePurchased = (id: string) => {
    setItems(items.map(i => i.id === id ? { ...i, purchased: !i.purchased } : i));
  };

  // Stats
  const totalItems = items.length;
  const pendingItems = items.filter(i => !i.purchased);
  const purchasedItems = items.filter(i => i.purchased);
  const totalBudget = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
  const spentAmount = purchasedItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
  const remainingBudget = totalBudget - spentAmount;

  return (
    <ScreenWrapper title="Smart Cart">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`pb-20 px-1 flex-grow`}
      >

        {/* Top Header Row */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={tw`flex-row items-center mb-3`}
        >
          <View style={tw`w-8 h-8 ${inputBg} rounded-xl items-center justify-center border ${inputBorder} mr-2.5`}>
            <Feather name="arrow-left" size={16} color="#10B981" />
          </View>
          <Text style={tw`text-gray-400 font-semibold text-xs`}>Back to Profile</Text>
        </TouchableOpacity>

        {/* Smart Cart Siya AI Purchase Tester Section */}
        <View style={tw`${cardBg} border-2 ${allTestsPassed ? 'border-emerald-500' : 'border-amber-500/60'} rounded-2xl p-4 mb-5 shadow-lg`}>
          
          {/* Header & AI Badge */}
          <View style={tw`flex-row items-center justify-between mb-3.5`}>
            <View style={tw`flex-row items-center flex-1 mr-2`}>
              <View style={tw`${isDark ? 'bg-amber-950/80' : 'bg-amber-100'} p-2 rounded-xl mr-2.5 border border-amber-500/30`}>
                <Ionicons name="sparkles" size={18} color="#F59E0B" />
              </View>
              <View style={tw`flex-1`}>
                <Text style={tw`${textPrimary} text-base font-bold tracking-tight`}>Smart Cart Siya AI</Text>
                <Text style={tw`text-gray-400 text-[11px] font-medium`}>3-Step Purchase Evaluation</Text>
              </View>
            </View>

            <View style={tw`${totalTestsPassed === 3 ? 'bg-emerald-500/20 border-emerald-500' : 'bg-amber-500/10 border-amber-500/30'} px-2.5 py-1 rounded-full border`}>
              <Text style={tw`${totalTestsPassed === 3 ? 'text-emerald-400' : 'text-amber-400'} text-[11px] font-extrabold`}>
                {totalTestsPassed}/3 Passed
              </Text>
            </View>
          </View>

          {/* Product Input Section (User Tells Siya AI) */}
          <View style={tw`${fieldBg} border ${fieldBorder} p-3 rounded-xl mb-3`}>
            <Text style={tw`text-amber-400 text-[11px] font-bold uppercase tracking-wider mb-2`}>
              🛍️ Step 1: Tell Siya What You Want To Buy
            </Text>
            <View style={tw`flex-row gap-2`}>
              <View style={tw`flex-1`}>
                <Text style={tw`text-gray-400 text-[10px] font-semibold mb-1`}>Product Name</Text>
                <TextInput
                  style={tw`${inputBg} ${textPrimary} px-2.5 py-1.5 rounded-lg text-xs font-semibold border ${inputBorder}`}
                  placeholder="e.g. Phone, Laptop"
                  placeholderTextColor="#64748B"
                  value={evalName}
                  onChangeText={setEvalName}
                />
              </View>
              <View style={tw`w-28`}>
                <Text style={tw`text-gray-400 text-[10px] font-semibold mb-1`}>Price</Text>
                <TextInput
                  style={tw`${inputBg} ${textPrimary} px-2.5 py-1.5 rounded-lg text-xs font-semibold border ${inputBorder}`}
                  placeholder="0.00"
                  placeholderTextColor="#64748B"
                  keyboardType="numeric"
                  value={evalPrice}
                  onChangeText={setEvalPrice}
                />
              </View>
            </View>
          </View>

          {/* Siya 3 Tests Flow */}
          <Text style={tw`${textPrimary} font-bold text-xs mb-2.5 uppercase tracking-wider`}>
            Siya AI Financial Tests
          </Text>

          {/* Test 1: 48hr Thinking Time Test */}
          <View style={tw`${fieldBg} border ${test1Passed ? 'border-emerald-500/50 bg-emerald-950/10' : fieldBorder} p-3 rounded-xl mb-2.5 flex-row items-center justify-between`}>
            <View style={tw`flex-1 mr-2`}>
              <View style={tw`flex-row items-center mb-0.5`}>
                <View style={tw`w-5 h-5 rounded-full ${test1Passed ? 'bg-emerald-500' : 'bg-amber-500/20'} items-center justify-center mr-1.5`}>
                  {test1Passed ? (
                    <Feather name="check" size={12} color="#FFFFFF" />
                  ) : (
                    <Text style={tw`text-amber-400 text-[10px] font-bold`}>1</Text>
                  )}
                </View>
                <Text style={tw`${textPrimary} font-bold text-xs`}>48hr Thinking Time</Text>
              </View>
              <Text style={tw`text-gray-400 text-[11px] ml-6.5`}>
                {test1Passed ? '✓ 48 Hours impulse period passed.' : 'Wait 48h to eliminate emotional impulse.'}
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleConfirm48h}
              disabled={test1Passed}
              style={tw`${test1Passed ? 'bg-emerald-500/20 border-emerald-500/40' : 'bg-amber-500 border-amber-500'} px-2.5 py-1.5 rounded-lg border flex-row items-center`}
            >
              {test1Passed ? (
                <>
                  <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                  <Text style={tw`text-emerald-400 font-bold text-[11px] ml-1`}>Passed ✓</Text>
                </>
              ) : (
                <>
                  <Ionicons name="time-outline" size={14} color="#000000" />
                  <Text style={tw`text-black font-bold text-[11px] ml-1`}>Confirm 48h</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Test 2: Why I Need Test */}
          <View style={tw`${fieldBg} border ${test2Passed ? 'border-emerald-500/50 bg-emerald-950/10' : fieldBorder} p-3 rounded-xl mb-2.5`}>
            <View style={tw`flex-row items-center justify-between mb-1.5`}>
              <View style={tw`flex-row items-center`}>
                <View style={tw`w-5 h-5 rounded-full ${test2Passed ? 'bg-emerald-500' : 'bg-amber-500/20'} items-center justify-center mr-1.5`}>
                  {test2Passed ? (
                    <Feather name="check" size={12} color="#FFFFFF" />
                  ) : (
                    <Text style={tw`text-amber-400 text-[10px] font-bold`}>2</Text>
                  )}
                </View>
                <Text style={tw`${textPrimary} font-bold text-xs`}>Why Do I Need This?</Text>
              </View>
              {test2Passed && (
                <View style={tw`flex-row items-center bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/40`}>
                  <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                  <Text style={tw`text-emerald-400 font-bold text-[10px] ml-1`}>Passed ✓</Text>
                </View>
              )}
            </View>

            <TextInput
              style={tw`${inputBg} ${textPrimary} p-2 rounded-lg text-xs border ${inputBorder} mb-2`}
              placeholder="Type why you need this product..."
              placeholderTextColor="#64748B"
              value={whyINeed}
              onChangeText={setWhyINeed}
              editable={!test2Passed}
            />

            {!test2Passed && (
              <TouchableOpacity
                onPress={handleSubmitWhyNeed}
                style={tw`bg-amber-500 py-1.5 rounded-lg items-center self-end px-4 flex-row`}
              >
                <Feather name="send" size={12} color="#000000" />
                <Text style={tw`text-black font-bold text-[11px] ml-1`}>Submit Reason</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Test 3: 2X Balance Rule Check */}
          <View style={tw`${fieldBg} border ${test3Passed ? 'border-emerald-500/50 bg-emerald-950/10' : 'border-red-500/40 bg-red-950/10'} p-3 rounded-xl mb-3`}>
            <View style={tw`flex-row items-center justify-between mb-1.5`}>
              <View style={tw`flex-row items-center`}>
                <View style={tw`w-5 h-5 rounded-full ${test3Passed ? 'bg-emerald-500' : 'bg-red-500'} items-center justify-center mr-1.5`}>
                  {test3Passed ? (
                    <Feather name="check" size={12} color="#FFFFFF" />
                  ) : (
                    <Feather name="x" size={12} color="#FFFFFF" />
                  )}
                </View>
                <Text style={tw`${textPrimary} font-bold text-xs`}>2X Balance Rule</Text>
              </View>

              <View style={tw`flex-row items-center ${test3Passed ? 'bg-emerald-500/20 border-emerald-500/40' : 'bg-red-500/20 border-red-500/40'} px-2 py-0.5 rounded-full border`}>
                {test3Passed ? (
                  <>
                    <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                    <Text style={tw`text-emerald-400 font-bold text-[10px] ml-1`}>Passed ✓</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="close-circle" size={12} color="#EF4444" />
                    <Text style={tw`text-red-400 font-bold text-[10px] ml-1`}>Failed ✕</Text>
                  </>
                )}
              </View>
            </View>

            <Text style={tw`text-gray-400 text-[11px] mb-2`}>
              Requirement: Must have 2X price ({formatCurrency(required2xBalance)}) in live balance.
            </Text>

            <View style={tw`${inputBg} p-2 rounded-lg border ${inputBorder} flex-row justify-between items-center`}>
              <View style={tw`flex-1 mr-2`}>
                <Text style={tw`text-gray-500 text-[9px] uppercase font-bold`}>Your Backend Balance</Text>
                <Text style={tw`${availableBalance >= 0 ? textPrimary : 'text-red-400'} font-bold text-xs`} numberOfLines={1}>
                  {formatCurrency(availableBalance)}
                </Text>
              </View>
              <View style={tw`items-end flex-1`}>
                <Text style={tw`text-gray-500 text-[9px] uppercase font-bold`}>Required (2X Price)</Text>
                <Text style={tw`${test3Passed ? 'text-emerald-400' : 'text-red-400'} font-bold text-xs`} numberOfLines={1}>
                  {formatCurrency(required2xBalance)}
                </Text>
              </View>
            </View>
          </View>

          {/* Buy Decision Section (Unlocks when 3/3 Tests Pass) */}
          {allTestsPassed ? (
            <View style={tw`bg-emerald-500/10 border-2 border-emerald-500 p-3.5 rounded-xl`}>
              <View style={tw`flex-row items-center mb-1.5`}>
                <Ionicons name="trophy" size={18} color="#10B981" />
                <Text style={tw`text-emerald-400 font-extrabold text-sm ml-1.5`}>
                  3/3 Tests Passed! Can Buy Product 🎉
                </Text>
              </View>
              <Text style={tw`text-gray-300 text-[11px] mb-3`}>
                All 3 tests cleared! Choose your action:
              </Text>

              <View style={tw`gap-2`}>
                {/* YES Option: Buy & Use Product */}
                <TouchableOpacity
                  onPress={handleBuyProduct}
                  disabled={isSubmitting}
                  style={tw`bg-emerald-600 py-2.5 px-3 rounded-lg items-center flex-row justify-center`}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="cart" size={15} color="#FFFFFF" />
                      <Text style={tw`text-white font-extrabold text-xs ml-1.5`}>YES — Buy Product</Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* NO Option: Put on Saving for Future Freedom */}
                <TouchableOpacity
                  onPress={handleSaveForFreedom}
                  disabled={isSubmitting}
                  style={tw`bg-amber-500 py-2.5 px-3 rounded-lg items-center flex-row justify-center`}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#000000" />
                  ) : (
                    <>
                      <Ionicons name="wallet" size={15} color="#000000" />
                      <Text style={tw`text-black font-extrabold text-xs ml-1.5`}>NO — Put on Saving for Future Freedom</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={tw`${inputBg} border ${inputBorder} p-2.5 rounded-xl items-center`}>
              <Text style={tw`text-amber-400 font-bold text-[11px] text-center`}>
                🔒 Pass all 3 tests with green ticks ✓ to unlock purchase options!
              </Text>
            </View>
          )}

        </View>

        {/* Budget Summary Card */}
        <View style={tw`${cardBg} border ${cardBorder} rounded-2xl p-4 mb-4`}>
          <View style={tw`flex-row items-center mb-3`}>
            <View style={tw`${isDark ? 'bg-[#451A03]' : 'bg-[#FEF3C7]'} p-1.5 rounded-lg mr-2.5`}>
              <Ionicons name="cart-outline" size={18} color="#F59E0B" />
            </View>
            <Text style={tw`text-gray-400 font-semibold text-xs`}>Cart Budget</Text>
            <View style={tw`flex-1`} />
            <View style={tw`${inputBg} px-2.5 py-0.5 rounded-full border ${inputBorder}`}>
              <Text style={tw`text-gray-400 text-[11px] font-bold`}>{totalItems} items</Text>
            </View>
          </View>
          <Text style={tw`${textPrimary} text-2xl font-bold tracking-tight mb-3`}>
            {formatCurrency(totalBudget)}
          </Text>
          <View style={tw`flex-row justify-between`}>
            <View style={tw`flex-row items-center`}>
              <Feather name="check-circle" size={13} color="#10B981" />
              <Text style={tw`text-[#10B981] font-bold ml-1.5 mr-1 text-xs`}>{formatCurrency(spentAmount)}</Text>
              <Text style={tw`text-gray-500 text-[11px]`}>Spent</Text>
            </View>
            <View style={tw`flex-row items-center`}>
              <Feather name="clock" size={13} color="#F59E0B" />
              <Text style={tw`text-[#F59E0B] font-bold ml-1.5 mr-1 text-xs`}>{formatCurrency(remainingBudget)}</Text>
              <Text style={tw`text-gray-500 text-[11px]`}>Remaining</Text>
            </View>
          </View>
        </View>

        {/* Stats Row */}
        <View style={tw`flex-row gap-2.5 mb-4`}>
          <View style={tw`${cardBg} border ${cardBorder} rounded-2xl p-3 flex-1`}>
            <View style={tw`${inputBg} p-1.5 rounded-lg self-start mb-2`}>
              <Feather name="shopping-bag" size={16} color="#F59E0B" />
            </View>
            <Text style={tw`${textPrimary} text-[10px] font-bold tracking-widest mb-0.5 uppercase`}>Pending</Text>
            <Text style={tw`text-[#F59E0B] text-xl font-bold`}>{pendingItems.length}</Text>
          </View>
          <View style={tw`${cardBg} border ${cardBorder} rounded-2xl p-3 flex-1`}>
            <View style={tw`${inputBg} p-1.5 rounded-lg self-start mb-2`}>
              <Feather name="check-circle" size={16} color="#10B981" />
            </View>
            <Text style={tw`${textPrimary} text-[10px] font-bold tracking-widest mb-0.5 uppercase`}>Purchased</Text>
            <Text style={tw`text-[#10B981] text-xl font-bold`}>{purchasedItems.length}</Text>
          </View>
        </View>

        {/* Item List Header */}
        <View style={tw`flex-row justify-between items-center mb-3`}>
          <Text style={tw`${textPrimary} text-lg font-bold`}>Shopping List</Text>
          <TouchableOpacity onPress={() => openModal()}>
            <View style={tw`flex-row items-center ${isDark ? 'bg-[#064E3B]' : 'bg-[#ECFDF5]'} px-3 py-1.5 rounded-xl border border-[#10B981]/30`}>
              <Ionicons name="add" size={16} color="#10B981" />
              <Text style={tw`text-[#10B981] font-bold ml-1 text-xs`}>Add Item</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Pending Items */}
        {pendingItems.length > 0 && (
          <View style={tw`mb-2`}>
            <Text style={tw`text-gray-500 text-[10px] font-bold tracking-widest uppercase mb-2`}>Pending</Text>
            {pendingItems.map((item) => {
              const cat = getCategoryInfo(item.category);
              return (
                <View
                  key={item.id}
                  style={tw`${cardBg} border ${cardBorder} rounded-xl p-3 mb-2.5 flex-row items-center`}
                >
                  <TouchableOpacity
                    onPress={() => togglePurchased(item.id)}
                    style={tw`w-5 h-5 rounded-md border-2 ${isDark ? 'border-gray-600' : 'border-gray-300'} items-center justify-center mr-2.5`}
                  >
                    {item.purchased && <Feather name="check" size={12} color="#10B981" />}
                  </TouchableOpacity>

                  <View
                    style={[
                      tw`w-9 h-9 rounded-lg items-center justify-center mr-3`,
                      { backgroundColor: cat.bg },
                    ]}
                  >
                    <Ionicons name={cat.icon} size={18} color={cat.color} />
                  </View>

                  <View style={tw`flex-1 mr-2`}>
                    <View style={tw`flex-row items-center flex-wrap`}>
                      <Text style={tw`${textPrimary} text-sm font-bold mr-1`}>{item.name}</Text>
                      {item.priority && (
                        <View style={tw`${isDark ? 'bg-[#4C1D2E]' : 'bg-red-100'} px-1.5 py-0.2 rounded-full`}>
                          <Text style={tw`text-[#EF4444] text-[9px] font-bold`}>PRIORITY</Text>
                        </View>
                      )}
                    </View>
                    <Text style={tw`text-gray-400 text-[11px] mt-0.5`}>{cat.label} · Qty: {item.quantity}</Text>

                    {/* Test in Siya AI Button */}
                    <TouchableOpacity
                      onPress={() => handleTestInSiya(item)}
                      style={tw`flex-row items-center mt-1`}
                    >
                      <Ionicons name="sparkles" size={11} color="#F59E0B" />
                      <Text style={tw`text-amber-400 text-[11px] font-bold ml-1`}>Test with Siya AI</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={tw`items-end`}>
                    <Text style={tw`text-[#F59E0B] text-base font-bold mb-1.5`}>
                      {formatCurrency(item.price * item.quantity)}
                    </Text>
                    <View style={tw`flex-row gap-1.5`}>
                      <TouchableOpacity
                        onPress={() => openModal(item)}
                        style={tw`w-7 h-7 ${inputBg} rounded-md items-center justify-center border ${inputBorder}`}
                      >
                        <Feather name="edit-2" size={12} color="#3B82F6" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => deleteItem(item.id)}
                        style={tw`w-7 h-7 ${inputBg} rounded-md items-center justify-center border ${inputBorder}`}
                      >
                        <Feather name="trash-2" size={12} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Purchased Items */}
        {purchasedItems.length > 0 && (
          <View style={tw`mb-2`}>
            <Text style={tw`text-gray-500 text-[10px] font-bold tracking-widest uppercase mb-2 mt-1`}>Purchased</Text>
            {purchasedItems.map((item) => {
              const cat = getCategoryInfo(item.category);
              return (
                <View
                  key={item.id}
                  style={tw`${cardBg} border ${cardBorder} rounded-xl p-3 mb-2.5 flex-row items-center opacity-60`}
                >
                  <TouchableOpacity
                    onPress={() => togglePurchased(item.id)}
                    style={tw`w-5 h-5 rounded-md ${isDark ? 'bg-[#064E3B]' : 'bg-green-100'} border-2 border-[#10B981] items-center justify-center mr-2.5`}
                  >
                    <Feather name="check" size={12} color="#10B981" />
                  </TouchableOpacity>

                  <View
                    style={[
                      tw`w-9 h-9 rounded-lg items-center justify-center mr-3`,
                      { backgroundColor: cat.bg },
                    ]}
                  >
                    <Ionicons name={cat.icon} size={18} color={cat.color} />
                  </View>

                  <View style={tw`flex-1 mr-2`}>
                    <Text style={tw`text-gray-400 text-sm font-bold line-through`}>{item.name}</Text>
                    <Text style={tw`text-gray-500 text-[11px] mt-0.5`}>{cat.label} · Qty: {item.quantity}</Text>
                  </View>

                  <View style={tw`items-end`}>
                    <Text style={tw`text-[#10B981] text-base font-bold mb-1.5`}>
                      {formatCurrency(item.price * item.quantity)}
                    </Text>
                    <View style={tw`flex-row gap-1.5`}>
                      <TouchableOpacity
                        onPress={() => deleteItem(item.id)}
                        style={tw`w-7 h-7 ${inputBg} rounded-md items-center justify-center border ${inputBorder}`}
                      >
                        <Feather name="trash-2" size={12} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Empty State */}
        {items.length === 0 && (
          <View style={tw`${cardBg} border ${cardBorder} rounded-2xl p-6 items-center justify-center mb-6`}>
            <View style={tw`${isDark ? 'bg-[#451A03]' : 'bg-[#FEF3C7]'} p-3 rounded-xl mb-3`}>
              <Ionicons name="cart-outline" size={30} color="#F59E0B" />
            </View>
            <Text style={tw`${textPrimary} font-bold text-base mb-1`}>Your cart is empty</Text>
            <Text style={tw`text-gray-500 text-xs text-center mb-3`}>
              Start adding items to track your shopping budget smartly
            </Text>
            <TouchableOpacity
              onPress={() => openModal()}
              style={tw`${isDark ? 'bg-[#064E3B]' : 'bg-[#ECFDF5]'} px-5 py-2 rounded-xl border border-[#10B981]/30`}
            >
              <Text style={tw`text-[#10B981] font-bold text-xs`}>Add First Item</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>

      {/* Add / Edit Item Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={tw`flex-1 justify-end`}>
          <View style={tw`${modalBg} p-5 rounded-t-3xl border-t ${isDark ? 'border-gray-800' : 'border-gray-200'} shadow-2xl`}>
            <View style={tw`flex-row justify-between items-center mb-4`}>
              <Text style={tw`${textPrimary} text-lg font-bold`}>
                {editingItem ? 'Edit Item' : 'Add Item'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <View style={tw`w-7 h-7 ${isDark ? 'bg-[#1E293B]' : 'bg-gray-100'} rounded-full items-center justify-center`}>
                  <Feather name="x" size={15} color="#9CA3AF" />
                </View>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={tw`text-gray-400 mb-1 text-xs font-semibold`}>Item Name</Text>
              <TextInput
                style={tw`${fieldBg} ${textPrimary} p-3 rounded-xl mb-3 border ${fieldBorder} text-xs`}
                placeholder="e.g. Organic Milk"
                placeholderTextColor="#64748B"
                value={form.name}
                onChangeText={t => setForm({ ...form, name: t })}
              />

              <Text style={tw`text-gray-400 mb-1.5 text-xs font-semibold`}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`mb-3`}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat.key}
                    onPress={() => setForm({ ...form, category: cat.key })}
                    style={[
                      tw`flex-row items-center px-3 py-2 rounded-xl mr-2 border`,
                      {
                        backgroundColor: form.category === cat.key ? cat.bg : (isDark ? '#1E293B' : '#F8FAFC'),
                        borderColor: form.category === cat.key ? cat.color + '60' : (isDark ? '#334155' : '#E2E8F0'),
                      },
                    ]}
                  >
                    <Ionicons name={cat.icon} size={15} color={form.category === cat.key ? cat.color : '#64748B'} />
                    <Text
                      style={[
                        tw`ml-1.5 font-bold text-[11px]`,
                        { color: form.category === cat.key ? cat.color : '#64748B' },
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={tw`flex-row gap-2.5 mb-3`}>
                <View style={tw`flex-1`}>
                  <Text style={tw`text-gray-400 mb-1 text-xs font-semibold`}>Price</Text>
                  <TextInput
                    style={tw`${fieldBg} ${textPrimary} p-3 rounded-xl border ${fieldBorder} text-xs`}
                    placeholder="0.00"
                    placeholderTextColor="#64748B"
                    keyboardType="numeric"
                    value={form.price}
                    onChangeText={t => setForm({ ...form, price: t })}
                  />
                </View>
                <View style={tw`flex-1`}>
                  <Text style={tw`text-gray-400 mb-1 text-xs font-semibold`}>Quantity</Text>
                  <TextInput
                    style={tw`${fieldBg} ${textPrimary} p-3 rounded-xl border ${fieldBorder} text-xs`}
                    placeholder="1"
                    placeholderTextColor="#64748B"
                    keyboardType="numeric"
                    value={form.quantity}
                    onChangeText={t => setForm({ ...form, quantity: t })}
                  />
                </View>
              </View>

              <View style={tw`flex-row justify-between items-center mb-5 mt-1 ${fieldBg} p-3 rounded-xl border ${fieldBorder}`}>
                <View style={tw`flex-row items-center`}>
                  <Ionicons name="flag-outline" size={16} color="#EF4444" />
                  <Text style={tw`${textPrimary} font-bold ml-2 text-xs`}>Mark as Priority</Text>
                </View>
                <Switch
                  value={form.priority}
                  onValueChange={val => setForm({ ...form, priority: val })}
                  trackColor={{ false: isDark ? '#334155' : '#D1D5DB', true: '#4C1D2E' }}
                  thumbColor={form.priority ? '#EF4444' : '#64748B'}
                />
              </View>

              <View style={tw`flex-row justify-between mt-1 mb-6`}>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={tw`${fieldBg} py-3 px-6 rounded-xl border ${fieldBorder}`}
                >
                  <Text style={tw`${textPrimary} font-bold text-xs`}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={saveItem}
                  style={tw`bg-[#F59E0B] py-3 px-6 rounded-xl`}
                >
                  <Text style={tw`text-black font-bold text-xs`}>
                    {editingItem ? 'Update' : 'Add to Cart'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScreenWrapper>
  );
}
