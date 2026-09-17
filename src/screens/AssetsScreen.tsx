import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import tw from 'twrnc';
import { Feather, Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { useTheme } from '../theme/ThemeContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';

const ASSET_CATEGORIES = [
  { key: 'Real Estate', icon: 'home', color: '#3B82F6', bg: '#172554' },
  { key: 'Vehicle', icon: 'truck', color: '#F59E0B', bg: '#451A03' },
  { key: 'Investment', icon: 'trending-up', color: '#10B981', bg: '#064E3B' },
  { key: 'Gold & Jewelry', icon: 'award', color: '#EAB308', bg: '#422006' },
  { key: 'Cash & Bank', icon: 'dollar-sign', color: '#06B6D4', bg: '#083344' },
  { key: 'Crypto', icon: 'zap', color: '#8B5CF6', bg: '#2E1065' },
  { key: 'Business', icon: 'briefcase', color: '#EC4899', bg: '#500724' },
  { key: 'Other', icon: 'package', color: '#9CA3AF', bg: '#1F2937' },
];

const AssetCard = ({ item, onEdit, onDelete, isDark, formatCurrency }) => {
  const cBg = isDark ? 'bg-[#06080F]' : 'bg-white';
  const cBorder = isDark ? 'border-gray-700' : 'border-gray-200';
  const btnBg = isDark ? 'bg-[#0F172A]' : 'bg-gray-100';
  const btnBorder = isDark ? 'border-[#1E293B]' : 'border-gray-200';
  const tp = isDark ? 'text-white' : 'text-gray-900';

  const cat = ASSET_CATEGORIES.find(c => c.key === item.category) || ASSET_CATEGORIES[7];

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

      <View style={tw`flex-row items-center pr-24 mb-3`}>
        <View style={[tw`w-11 h-11 rounded-xl items-center justify-center mr-3`, { backgroundColor: isDark ? cat.bg : cat.color + '15' }]}>
          <Feather name={cat.icon as any} size={20} color={cat.color} />
        </View>
        <View style={tw`flex-1`}>
          <Text style={tw`${tp} font-bold text-lg`} numberOfLines={1}>{item.name}</Text>
          <Text style={tw`text-gray-500 text-xs mt-0.5`}>{item.category}</Text>
        </View>
      </View>

      <View style={tw`flex-row justify-between items-end mt-2`}>
        <View>
          <Text style={tw`text-gray-400 text-xs font-semibold mb-1`}>Current Value</Text>
          <Text style={tw`text-[#10B981] text-2xl font-bold`}>{formatCurrency(item.value)}</Text>
        </View>
        <View style={tw`items-end`}>
          {item.purchaseValue > 0 && (
            <View>
              <Text style={tw`text-gray-400 text-xs font-semibold mb-1`}>Purchase</Text>
              <Text style={tw`text-gray-400 font-semibold`}>{formatCurrency(item.purchaseValue)}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Appreciation / Depreciation indicator */}
      {item.purchaseValue > 0 && (
        <View style={tw`flex-row items-center mt-3 pt-3 border-t ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
          {(() => {
            const change = item.value - item.purchaseValue;
            const changePercent = ((change / item.purchaseValue) * 100).toFixed(1);
            const isUp = change >= 0;
            return (
              <>
                <Feather name={isUp ? "arrow-up-right" : "arrow-down-right"} size={14} color={isUp ? "#10B981" : "#EF4444"} />
                <Text style={tw`${isUp ? 'text-[#10B981]' : 'text-[#EF4444]'} font-bold text-sm ml-1`}>
                  {isUp ? '+' : ''}{formatCurrency(change)} ({changePercent}%)
                </Text>
                <Text style={tw`text-gray-500 text-xs ml-2`}>{isUp ? 'Appreciation' : 'Depreciation'}</Text>
              </>
            );
          })()}
        </View>
      )}

      {item.notes ? (
        <Text style={tw`text-gray-500 text-xs mt-3 italic`}>{item.notes}</Text>
      ) : null}
    </View>
  );
};

export default function AssetsScreen() {
  const { isDark, formatCurrency } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();

  const cardBg = isDark ? 'bg-[#06080F]' : 'bg-white';
  const cardBorder = isDark ? 'border-gray-700' : 'border-gray-200';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const inputBg = isDark ? 'bg-[#0F172A]' : 'bg-gray-100';
  const modalBg = isDark ? 'bg-[#0F172A]' : 'bg-white';
  const fieldBg = isDark ? 'bg-[#1E293B]' : 'bg-gray-50';
  const fieldBorder = isDark ? 'border-[#334155]' : 'border-gray-200';

  const {
    assets,
    addAsset,
    updateAssetState,
    deleteAssetState
  } = useAuth();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [form, setForm] = useState({ name: '', category: 'Real Estate', value: '', purchaseValue: '', notes: '' });

  const totalAssets = assets.reduce((sum, a) => sum + (a.value || 0), 0);
  const totalPurchaseValue = assets.reduce((sum, a) => sum + (a.purchaseValue || 0), 0);
  const totalAppreciation = totalAssets - totalPurchaseValue;
  const appreciationPercent = totalPurchaseValue > 0 ? ((totalAppreciation / totalPurchaseValue) * 100).toFixed(1) : '0';

  // Grouped by category
  const categoryTotals = ASSET_CATEGORIES.map(cat => {
    const catAssets = assets.filter(a => a.category === cat.key);
    const total = catAssets.reduce((sum, a) => sum + (a.value || 0), 0);
    return { ...cat, total, count: catAssets.length };
  }).filter(c => c.count > 0);

  const openModal = (asset = null) => {
    if (asset) {
      setEditingAsset(asset);
      setForm({
        name: asset.name,
        category: asset.category,
        value: asset.value.toString(),
        purchaseValue: asset.purchaseValue?.toString() || '',
        notes: asset.notes || '',
      });
    } else {
      setEditingAsset(null);
      setForm({ name: '', category: 'Real Estate', value: '', purchaseValue: '', notes: '' });
    }
    setModalVisible(true);
  };

  const saveAsset = async () => {
    if (!form.name || !form.value) {
      Alert.alert('Error', 'Please enter asset name and current value.');
      return;
    }

    const assetData = {
      name: form.name,
      category: form.category,
      value: parseFloat(form.value) || 0,
      purchaseValue: parseFloat(form.purchaseValue) || 0,
      notes: form.notes,
    };

    try {
      if (editingAsset) {
        await updateAssetState(editingAsset.id, assetData);
      } else {
        await addAsset(assetData);
      }
      setModalVisible(false);
    } catch (err) {
      Alert.alert('Error', 'Could not save asset to the server.');
    }
  };

  const deleteAsset = (id) => {
    Alert.alert('Delete Asset', 'Are you sure you want to delete this asset?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive', 
        onPress: async () => {
          try {
            await deleteAssetState(id);
          } catch (err) {
            Alert.alert('Error', 'Could not delete asset from server.');
          }
        }
      }
    ]);
  };

  return (
    <ScreenWrapper title="My Assets">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`pb-8`}>

        {/* Total Assets Summary */}
        <View style={tw`${cardBg} border ${cardBorder} rounded-3xl p-6 mb-6 relative`}>
          <Text style={tw`text-gray-400 font-semibold mb-1`}>Total Assets</Text>
          <Text style={tw`text-[#10B981] text-4xl font-bold tracking-tight mb-2`}>{formatCurrency(totalAssets)}</Text>
          <TouchableOpacity style={tw`absolute top-6 right-6 ${isDark ? 'bg-[#064E3B]' : 'bg-[#ECFDF5]'} w-12 h-12 rounded-2xl items-center justify-center`}>
            <Ionicons name="diamond-outline" size={24} color="#10B981" />
          </TouchableOpacity>

          {/* Appreciation summary */}
          <View style={tw`flex-row items-center mt-1 mb-5`}>
            <Feather name={totalAppreciation >= 0 ? "arrow-up-right" : "arrow-down-right"} size={16} color={totalAppreciation >= 0 ? "#10B981" : "#EF4444"} />
            <Text style={tw`${totalAppreciation >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'} font-bold ml-1`}>
              {totalAppreciation >= 0 ? '+' : ''}{formatCurrency(totalAppreciation)} ({appreciationPercent}%)
            </Text>
            <Text style={tw`text-gray-500 text-xs ml-2`}>total growth</Text>
          </View>

          {/* Category breakdown mini-bars */}
          <View style={tw`flex-row flex-wrap gap-3`}>
            {categoryTotals.map(cat => (
              <View key={cat.key} style={tw`flex-row items-center`}>
                <View style={[tw`w-2 h-2 rounded-full mr-1.5`, { backgroundColor: cat.color }]} />
                <Text style={tw`text-gray-500 text-xs`}>{cat.key}</Text>
                <Text style={tw`${textPrimary} text-xs font-bold ml-1`}>{formatCurrency(cat.total)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Category Cards Row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`mb-6`}>
          {categoryTotals.map(cat => (
            <View key={cat.key} style={tw`${cardBg} border ${cardBorder} rounded-2xl p-4 mr-3 w-36`}>
              <View style={[tw`w-10 h-10 rounded-xl items-center justify-center mb-3`, { backgroundColor: isDark ? cat.bg : cat.color + '15' }]}>
                <Feather name={cat.icon as any} size={18} color={cat.color} />
              </View>
              <Text style={tw`text-gray-500 text-xs font-semibold mb-1`}>{cat.key}</Text>
              <Text style={[tw`font-bold text-lg`, { color: cat.color }]}>{formatCurrency(cat.total)}</Text>
              <Text style={tw`text-gray-500 text-xs mt-1`}>{cat.count} {cat.count === 1 ? 'asset' : 'assets'}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Assets List */}
        <View style={tw`flex-row justify-between items-center mb-4`}>
          <Text style={tw`${textPrimary} text-xl font-bold`}>All Assets</Text>
          <TouchableOpacity onPress={() => openModal()} style={tw`${isDark ? 'bg-[#064E3B]' : 'bg-[#ECFDF5]'} px-3 py-1.5 rounded-lg flex-row items-center`}>
            <Feather name="plus" size={14} color="#10B981" />
            <Text style={tw`text-[#10B981] font-bold ml-1 text-sm`}>Add</Text>
          </TouchableOpacity>
        </View>

        {assets.length > 0 ? (
          assets.map(asset => (
            <AssetCard key={asset.id} item={asset} onEdit={openModal} onDelete={deleteAsset} isDark={isDark} formatCurrency={formatCurrency} />
          ))
        ) : (
          <View style={tw`${cardBg} border ${cardBorder} rounded-3xl p-8 items-center`}>
            <View style={tw`${isDark ? 'bg-[#0F172A]' : 'bg-gray-100'} w-16 h-16 rounded-2xl items-center justify-center mb-4`}>
              <Ionicons name="diamond-outline" size={32} color="#4B5563" />
            </View>
            <Text style={tw`${textPrimary} font-bold text-lg mb-1`}>No Assets Yet</Text>
            <Text style={tw`text-gray-500 text-sm text-center mb-5`}>Start tracking your wealth by adding your first asset.</Text>
            <TouchableOpacity onPress={() => openModal()} style={tw`bg-[#10B981] px-6 py-3 rounded-xl flex-row items-center`}>
              <Feather name="plus" size={16} color="#fff" />
              <Text style={tw`text-white font-bold ml-2`}>Add Asset</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>

      {/* Asset Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={tw`flex-1 justify-end`}>
          <View style={tw`${modalBg} p-6 rounded-t-3xl border-t ${isDark ? 'border-gray-800' : 'border-gray-200'} shadow-2xl`}>
            <View style={tw`flex-row justify-between items-center mb-5`}>
              <Text style={tw`${textPrimary} text-xl font-bold`}>{editingAsset ? 'Edit Asset' : 'Add New Asset'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <View style={tw`w-8 h-8 ${fieldBg} rounded-full items-center justify-center`}><Feather name="x" size={16} color="#9CA3AF" /></View>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Asset Name */}
              <Text style={tw`text-gray-400 mb-1 text-sm font-semibold`}>Asset Name</Text>
              <TextInput
                style={tw`${fieldBg} ${textPrimary} p-3.5 rounded-xl mb-4 border ${fieldBorder}`}
                placeholder="e.g. Apartment Downtown"
                placeholderTextColor="#64748B"
                value={form.name}
                onChangeText={t => setForm({...form, name: t})}
              />

              {/* Category Selector */}
              <Text style={tw`text-gray-400 mb-2 text-sm font-semibold`}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`mb-4`}>
                {ASSET_CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat.key}
                    onPress={() => setForm({...form, category: cat.key})}
                    style={[
                      tw`flex-row items-center px-3.5 py-2.5 rounded-xl mr-2 border`,
                      {
                        backgroundColor: form.category === cat.key ? (isDark ? cat.bg : cat.color + '15') : (isDark ? '#1E293B' : '#F8FAFC'),
                        borderColor: form.category === cat.key ? cat.color + '60' : (isDark ? '#334155' : '#E2E8F0'),
                      },
                    ]}
                  >
                    <Feather name={cat.icon as any} size={14} color={form.category === cat.key ? cat.color : '#64748B'} />
                    <Text
                      style={[
                        tw`ml-2 font-bold text-xs`,
                        { color: form.category === cat.key ? cat.color : '#64748B' },
                      ]}
                    >
                      {cat.key}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Current Value */}
              <Text style={tw`text-gray-400 mb-1 text-sm font-semibold`}>Current Value</Text>
              <TextInput
                style={tw`${fieldBg} ${textPrimary} p-3.5 rounded-xl mb-4 border ${fieldBorder}`}
                placeholder="185000"
                placeholderTextColor="#64748B"
                keyboardType="numeric"
                value={form.value}
                onChangeText={t => setForm({...form, value: t})}
              />

              {/* Purchase Value */}
              <Text style={tw`text-gray-400 mb-1 text-sm font-semibold`}>Purchase Value (optional)</Text>
              <TextInput
                style={tw`${fieldBg} ${textPrimary} p-3.5 rounded-xl mb-4 border ${fieldBorder}`}
                placeholder="150000"
                placeholderTextColor="#64748B"
                keyboardType="numeric"
                value={form.purchaseValue}
                onChangeText={t => setForm({...form, purchaseValue: t})}
              />

              {/* Notes */}
              <Text style={tw`text-gray-400 mb-1 text-sm font-semibold`}>Notes (optional)</Text>
              <TextInput
                style={tw`${fieldBg} ${textPrimary} p-3.5 rounded-xl mb-4 border ${fieldBorder}`}
                placeholder="e.g. 2BHK, Rented out"
                placeholderTextColor="#64748B"
                value={form.notes}
                onChangeText={t => setForm({...form, notes: t})}
                multiline
              />

              {/* Action Buttons */}
              <View style={tw`flex-row justify-between mt-2 mb-8`}>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={tw`${fieldBg} py-3.5 px-8 rounded-xl border ${fieldBorder}`}>
                  <Text style={tw`${textPrimary} font-bold`}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={saveAsset} style={tw`bg-[#10B981] py-3.5 px-8 rounded-xl`}>
                  <Text style={tw`text-white font-bold`}>{editingAsset ? 'Update' : 'Save'}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScreenWrapper>
  );
}
