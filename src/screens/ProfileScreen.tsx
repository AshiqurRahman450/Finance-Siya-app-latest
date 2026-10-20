import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import tw from 'twrnc';
import { Ionicons, Feather } from '@expo/vector-icons';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { triggerAdPopUpNotification } from '../services/NotificationService';
import { useAdModal } from '../context/AdModalContext';


const MenuItem = ({ icon, title, subtitle, iconColor, iconBgColor, isLast = false, onPress, isDark }: any) => (
  <TouchableOpacity
    onPress={onPress}
    style={tw`flex-row items-center justify-between py-3 ${!isLast ? `border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}` : ''}`}
  >
    <View style={tw`flex-row items-center`}>
      <View style={[tw`w-10 h-10 rounded-xl items-center justify-center mr-4`, { backgroundColor: iconBgColor }]}>
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <View>
        <Text style={tw`${isDark ? 'text-white' : 'text-gray-900'} font-bold text-base`}>{title}</Text>
        {subtitle && <Text style={tw`text-gray-500 text-sm mt-0.5`}>{subtitle}</Text>}
      </View>
    </View>
    <Feather name="chevron-right" size={20} color="#4B5563" />
  </TouchableOpacity>
);

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { isDark, formatCurrency } = useTheme() as any;
  const { user, logout, transactions, debts } = useAuth() as any;
  const { showAdModal } = useAdModal();

  // ── Compute wallet figures from real transaction data ──
  const totalIncome = useMemo(
    () => transactions.filter((t: any) => t.type === 'income').reduce((sum: number, t: any) => sum + (t.amount || 0), 0),
    [transactions]
  );
  const totalExpense = useMemo(
    () => transactions.filter((t: any) => t.type === 'expense').reduce((sum: number, t: any) => sum + (t.amount || 0), 0),
    [transactions]
  );
  const walletBalance = totalIncome - totalExpense;

  // Total debt from real debts data
  const totalDebt = useMemo(
    () => debts.reduce((sum: number, d: any) => sum + (d.amount || d.totalAmount || 0), 0),
    [debts]
  );


  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of Finverse?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive', 
          onPress: () => {
            logout();
            navigation.navigate('Login' as never);
          }
        }
      ]
    );
  };

  const cardBg = isDark ? 'bg-[#06080F]' : 'bg-white';
  const cardBorder = isDark ? 'border-gray-700' : 'border-gray-200';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';

  return (
    <ScreenWrapper title="You">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`pb-8`}>
        <View style={tw`${cardBg} border ${cardBorder} rounded-3xl p-5 flex-row items-center justify-between mb-4`}>
          <View style={tw`flex-row items-center flex-1`}>
            <View style={tw`w-14 h-14 bg-gray-300 rounded-full mr-3.5 overflow-hidden border-2 border-[#10B981]`}>
               <Image source={{uri: user?.avatar || 'https://i.pravatar.cc/150?u=a042581f4e29026704d'}} style={tw`w-full h-full`} />
            </View>
            <View style={tw`flex-1`}>
              <Text style={tw`${textPrimary} font-bold text-lg mb-0.5`}>{user?.name || 'Alex Chen'}</Text>
              <Text style={tw`text-gray-400 text-xs mb-1.5`}>{user?.email || 'alex.chen@example.com'}</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('EditProfile' as never)}
                style={tw`flex-row items-center bg-[#10B981]/15 px-2.5 py-1 rounded-full self-start border border-[#10B981]/30`}
              >
                <Feather name="phone" size={12} color="#10B981" style={tw`mr-1.5`} />
                <Text style={tw`text-[#10B981] text-xs font-bold`}>
                  {user?.phone && user.phone.trim().length > 0 ? user.phone : 'Add Phone Number'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('EditProfile' as never)}
            style={tw`w-10 h-10 ${isDark ? 'bg-[#0F172A]' : 'bg-gray-100'} rounded-xl items-center justify-center ml-2 border ${isDark ? 'border-[#1E293B]' : 'border-gray-200'}`}
          >
            <Feather name="edit-2" size={16} color="#10B981" />
          </TouchableOpacity>
        </View>

        {/* Wallet Card — real data from API */}
        <View style={tw`${cardBg} border ${cardBorder} rounded-3xl p-4 mb-5`}>
          <View style={tw`flex-row items-center mb-4`}>
            <View style={tw`${isDark ? 'bg-[#0F172A]' : 'bg-gray-100'} p-2 rounded-xl mr-3`}>
              <Ionicons name="wallet-outline" size={20} color="#10B981" />
            </View>
            <Text style={tw`${textPrimary} font-semibold`}>Wallet</Text>
          </View>
          <Text style={tw`${textPrimary} text-3xl font-bold tracking-tight mb-4`}>{formatCurrency(walletBalance)}</Text>
          <View style={tw`flex-row`}>
            <View style={tw`flex-row items-center mr-6`}>
              <Feather name="arrow-up-right" size={16} color="#10B981" />
              <Text style={tw`text-[#10B981] font-bold ml-1 mr-1`}>{formatCurrency(totalIncome)}</Text>
              <Text style={tw`text-gray-500`}>Income</Text>
            </View>
            <View style={tw`flex-row items-center`}>
              <Feather name="arrow-down-right" size={16} color="#EF4444" />
              <Text style={tw`text-[#EF4444] font-bold ml-1 mr-1`}>{formatCurrency(totalExpense)}</Text>
              <Text style={tw`text-gray-500`}>Expense</Text>
            </View>
          </View>
        </View>


        {/* Menu Section */}
        <View style={tw`mt-4 mb-4`}>
          <Text style={tw`${textPrimary} text-xl font-bold mb-4`}>Menu</Text>
          <View style={tw`${cardBg} border ${cardBorder} rounded-3xl p-2 px-3 mb-6 py-0.2 mt-4`}>
            <MenuItem
              isDark={isDark}
              icon="logo-reddit"
              title="SIYA AI Assistant"
              iconColor="#8B5CF6"
              iconBgColor={isDark ? '#2E1065' : '#EDE9FE'}
              onPress={() => navigation.navigate('Siya' as never)}
            />
            <MenuItem
              isDark={isDark}
              icon="cart-outline"
              title="Smart Cart"
              subtitle="3 items"
              iconColor="#F59E0B"
              iconBgColor={isDark ? '#451A03' : '#FEF3C7'}
              onPress={() => navigation.navigate('SmartCart' as never)}
            />
            <MenuItem isDark={isDark} icon="card-outline" title="Debt Overview" subtitle={formatCurrency(totalDebt)} iconColor="#EF4444" iconBgColor={isDark ? '#4C1D2E' : '#FEE2E2'} />
            <MenuItem
              isDark={isDark}
              icon="notifications-outline"
              title="Notifications & Offers"
              subtitle="Centered ad modal & outside pop-up"
              iconColor="#3B82F6"
              iconBgColor={isDark ? '#172554' : '#DBEAFE'}
              onPress={() => {
                Alert.alert(
                  "Advertisement Pop-up 📢",
                  "Test the advertisement pop-ups with photos:\n\n1. Centered Pop-up: Opens the centered advertisement modal with photos and deals.\n2. Outside-App Pop-up: Triggers a high-priority heads-up banner with photo outside the app in 4 seconds.",
                  [
                    {
                      text: "🖼️ Centered Modal",
                      onPress: () => {
                        showAdModal();
                      }
                    },
                    {
                      text: "🚀 Outside Pop-up (4s)",
                      onPress: async () => {
                        await triggerAdPopUpNotification(4);
                        Alert.alert(
                          "Pop-up Scheduled! ⏳",
                          "Press your phone's Home button NOW to see the advertisement notification pop up outside the app!"
                        );
                      }
                    },
                    { text: "Cancel", style: "cancel" },
                  ]
                );
              }}
            />
            <MenuItem
              isDark={isDark}
              icon="settings-outline"
              title="Settings"
              iconColor="#9CA3AF"
              iconBgColor={isDark ? '#1F2937' : '#F3F4F6'}
              onPress={() => navigation.navigate('Settings' as never)}
            />
            <MenuItem isDark={isDark} icon="help-circle-outline" title="Help Center" iconColor="#10B981" iconBgColor={isDark ? '#064E3B' : '#ECFDF5'} isLast />
          </View>

          {/* Sign Out Button */}
          <TouchableOpacity 
            onPress={handleSignOut}
            style={tw`${isDark ? 'bg-[#1A0B16]' : 'bg-red-50'} border ${isDark ? 'border-[#4C1D2E]' : 'border-red-200'} rounded-2xl p-4 flex-row items-center justify-center mb-4`}
          >
            <Feather name="log-out" size={20} color="#EF4444" style={tw`mr-2`} />
            <Text style={tw`text-[#EF4444] font-bold text-lg`}>Sign Out</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </ScreenWrapper>
  );
}
