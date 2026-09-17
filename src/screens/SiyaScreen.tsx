import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import tw from 'twrnc';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { useSiya } from '../context/SiyaContext';
import { useAuth } from '../context/AuthContext';
import { auditExpense, auditExpenseWithAudio } from '../services/SiyaAI';
import { api } from '../services/api';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';

const StatCard = ({ title, value, subtext, valueColor, isDark }: { title: string; value: string; subtext: string; valueColor: string; isDark: boolean }) => (
  <View style={tw`${isDark ? 'bg-[#151B2B]' : 'bg-white'} rounded-2xl p-4 w-[48%] mb-4 shadow-sm`}>
    <Text style={tw`text-gray-500 text-xs font-bold uppercase tracking-wider mb-2`}>{title}</Text>
    <Text style={[tw`text-2xl font-bold mb-1`, { color: valueColor }]}>{value}</Text>
    <Text style={tw`text-gray-500 text-xs`}>{subtext}</Text>
  </View>
);

const AuditCard = ({ item, isDark, formatCurrency }: { item: any; isDark: boolean; formatCurrency: any }) => {
  const isWaste = item.type === 'Waste';
  const accentColor = isWaste ? '#EF4444' : '#10B981';

  return (
    <View style={tw`${isDark ? 'bg-[#151B2B]' : 'bg-white'} rounded-2xl p-5 mb-4`}>
      <View style={tw`flex-row justify-between items-center mb-3`}>
        <View style={tw`flex-row items-center`}>
          <View style={tw`w-8 h-8 rounded-full items-center justify-center bg-[${accentColor}20] mr-3`}>
            <Feather name={isWaste ? 'alert-circle' : 'check-circle'} size={14} color={accentColor} />
          </View>
          <Text style={tw`${isDark ? 'text-white' : 'text-gray-900'} font-bold text-lg`}>{item.item}</Text>
        </View>
        <View style={tw`px-3 py-1 rounded-full bg-[${accentColor}20]`}>
          <Text style={tw`text-[${accentColor}] font-bold text-xs`}>{item.type}</Text>
        </View>
      </View>

      <Text style={tw`text-gray-400 text-sm mb-4`}>Category: {item.category} • {formatCurrency(item.amount)}</Text>

      {isWaste && (
        <View style={tw`${isDark ? 'bg-[#0B0E14]' : 'bg-gray-50'} p-4 rounded-xl mb-4`}>
          <View style={tw`flex-row justify-between mb-2`}>
            <Text style={tw`text-gray-500 font-semibold`}>Future Value Lost</Text>
            <Text style={tw`text-[#EF4444] font-bold`}>{formatCurrency(item.futureValue)}</Text>
          </View>
          <View style={tw`flex-row justify-between`}>
            <Text style={tw`text-gray-500 font-semibold`}>Freedom Days Lost</Text>
            <Text style={tw`text-[#F59E0B] font-bold`}>{item.freedomDaysLost} days</Text>
          </View>
        </View>
      )}

      <View style={tw`flex-row mt-2`}>
        <Ionicons name="sparkles" size={16} color={accentColor} style={tw`mr-2 mt-0.5`} />
        <Text style={tw`text-[${accentColor}] font-medium flex-1 leading-5`}>{item.aiNudge}</Text>
      </View>
    </View>
  );
};

const AnalyticsView = ({ analytics, isDark, formatCurrency }: { analytics: any; isDark: boolean; formatCurrency: any }) => {
  const categories = analytics.categoryWise || [];
  const dates = analytics.dateWise || [];
  
  const totalSpend = categories.reduce((sum: number, c: any) => sum + (c.amount || 0), 0) || 1;

  return (
    <View style={tw`px-2 pb-4`}>
      {/* Category Wise */}
      <Text style={tw`font-bold text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-3 uppercase tracking-wider`}>Category-wise Spend</Text>
      {categories.length === 0 ? (
        <Text style={tw`text-xs text-gray-500 mb-4`}>No transaction history found to analyze.</Text>
      ) : (
        categories.map((cat: any, index: number) => {
          const percent = Math.round(((cat.amount || 0) / totalSpend) * 100);
          return (
            <View key={cat.category || index} style={tw`mb-3`}>
              <View style={tw`flex-row justify-between items-center mb-1`}>
                <Text style={tw`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'} font-medium`}>{cat.category}</Text>
                <Text style={tw`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'} font-bold`}>
                  {formatCurrency(cat.amount)} ({percent}%)
                </Text>
              </View>
              <View style={tw`h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full w-full`}>
                <View style={[tw`h-1.5 bg-[#10B981] rounded-full`, { width: `${percent}%` }]} />
              </View>
            </View>
          );
        })
      )}

      {/* Divider */}
      <View style={tw`h-[1px] ${isDark ? 'bg-gray-800' : 'bg-gray-200'} my-4`} />

      {/* Date Wise */}
      <Text style={tw`font-bold text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-3 uppercase tracking-wider`}>Date-wise Timeline</Text>
      {dates.length === 0 ? (
        <Text style={tw`text-xs text-gray-500`}>No transaction history found to analyze.</Text>
      ) : (
        <ScrollView style={tw`max-h-48`} showsVerticalScrollIndicator={true} nestedScrollEnabled={true}>
          {dates.map((dt: any, index: number) => (
            <View key={dt.date || index} style={tw`flex-row justify-between items-center py-2 border-b ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
              <View style={tw`flex-row items-center`}>
                <Feather name="calendar" size={14} color={isDark ? '#94A3B8' : '#64748B'} style={tw`mr-2`} />
                <Text style={tw`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{dt.date}</Text>
              </View>
              <Text style={tw`text-xs ${isDark ? 'text-gray-300' : 'text-gray-700'} font-bold`}>
                {formatCurrency(dt.amount)} ({dt.count} spends)
              </Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

export default function SiyaScreen() {
  const navigation = useNavigation();
  const { isDark, formatCurrency } = useTheme() as any;
  const insets = useSafeAreaInsets();
  const { audits, clearHistory, totalNeeds, totalWaste, totalNeedsAmount, totalWasteAmount, futureLoss, freedomDaysLost, sovereigntyScore, addAudit } = useSiya() as any;
  const { addTransaction } = useAuth() as any;
  
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(true);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const scrollViewRef = useRef<any>(null);

  // Spend analytics aggregations
  const [analytics, setAnalytics] = useState<any>({ categoryWise: [], dateWise: [] });
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Audio Recording States
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingTimerRef = useRef<any>(null);

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const data = await api.getTransactionAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to fetch spend analytics:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  const handleAudit = async () => {
    if (!input.trim()) return;
    Keyboard.dismiss();
    setLoading(true);
    try {
      const result = await auditExpense(input, 10000000);
      addAudit(result);
      
      // Save Transaction as well
      await addTransaction({
        name: result.item,
        category: result.category,
        amount: result.amount,
        type: 'expense'
      });

      setInput('');
      setHistoryOpen(true);
      fetchAnalytics(); // Refresh analytics
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access microphone is required!');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Stop any existing recording
      if (recording) {
        await recording.stopAndUnloadAsync();
      }

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(newRecording);
      setIsRecording(true);
      setRecordingDuration(0);

      // Start duration timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Failed to start recording:', err);
    }
  };

  const cancelRecording = async () => {
    if (!recording) return;
    try {
      clearInterval(recordingTimerRef.current);
      await recording.stopAndUnloadAsync();
      setRecording(null);
      setIsRecording(false);
      setRecordingDuration(0);
    } catch (err) {
      console.error('Failed to cancel recording:', err);
    }
  };

  const stopAndProcessRecording = async () => {
    if (!recording) return;
    try {
      clearInterval(recordingTimerRef.current);
      setIsRecording(false);
      setLoading(true);
      
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      setRecordingDuration(0);

      if (!uri) {
        throw new Error('Recording URI is null');
      }

      // Convert local file to base64
      const base64Audio = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64' as any,
      });

      // Call Gemini Audio Audit
      const result = await auditExpenseWithAudio(base64Audio, 'audio/x-m4a', 10000000);
      
      // Save Audit to backend
      addAudit(result);

      // Save Transaction to backend
      await addTransaction({
        name: result.item,
        category: result.category,
        amount: result.amount,
        type: 'expense'
      });

      // Refresh Analytics
      fetchAnalytics();
      setHistoryOpen(true);

    } catch (err) {
      console.error('Failed to stop and process recording:', err);
      alert('Failed to process voice spend details.');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const bg = isDark ? 'bg-[#0B0E14]' : 'bg-gray-50';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';

  return (
    <View style={[tw`flex-1 ${bg}`, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[tw`flex-row items-center px-6 py-3 border-b`, { borderBottomColor: isDark ? '#151B2B' : '#E2E8F0' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={tw`p-2 -ml-2 mr-4`}>
          <Feather name="arrow-left" size={24} color={isDark ? 'white' : 'black'} />
        </TouchableOpacity>
        <Text style={tw`${textPrimary} text-lg font-bold tracking-wider`}>SIYA AI</Text>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        style={tw`flex-1`}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 + insets.top : 0}
      >
        <ScrollView 
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={tw`px-6 pb-24 pt-4`} 
          keyboardShouldPersistTaps="handled"
        >
          
          {/* Hero Section */}
          <View style={tw`items-center mb-8`}>
            <View style={tw`w-20 h-20 rounded-3xl border-2 border-[#10B981] items-center justify-center mb-4`}>
              <Ionicons name="shield-checkmark-outline" size={32} color="#10B981" />
            </View>
            <Text style={tw`${textPrimary} text-3xl font-bold tracking-[0.2em] mb-1`}>SIYA</Text>
            <Text style={tw`text-[#10B981] font-bold tracking-widest text-xs mb-4`}>SOVEREIGNTY GUARDIAN</Text>
            <Text style={tw`text-gray-400 text-center text-sm leading-5 mb-6 px-4`}>
              Every expense is audited. Each decision builds your empire or delays your freedom.
            </Text>
            <View style={tw`flex-row items-center bg-[#064E3B] px-4 py-2 rounded-full`}>
              <Ionicons name="flash" size={16} color="#10B981" />
              <Text style={tw`text-[#10B981] font-bold ml-2`}>Sovereignty: {sovereigntyScore}%</Text>
            </View>
          </View>

          {/* 4-Card Dashboard */}
          <View style={tw`flex-row flex-wrap justify-between mb-8`}>
            <StatCard title="Future Loss" value={formatCurrency(futureLoss)} subtext="at 12% CAGR x 18yr" valueColor="#EF4444" isDark={isDark} />
            <StatCard title="Freedom Days" value={freedomDaysLost.toString()} subtext="lost to waste" valueColor="#F59E0B" isDark={isDark} />
            <StatCard title="Needs" value={formatCurrency(totalNeedsAmount)} subtext={`${totalNeeds} audited`} valueColor="#10B981" isDark={isDark} />
            <StatCard title="Waste" value={formatCurrency(totalWasteAmount)} subtext={`${totalWaste} flagged`} valueColor="#EF4444" isDark={isDark} />
          </View>

          {/* Input Section */}
          <View style={tw`mb-8`}>
            <Text style={tw`${textPrimary} text-lg font-bold mb-1`}>Audit an expense</Text>
            <Text style={tw`text-gray-500 text-xs mb-4`}>e.g. "Spent 500 on silk dress" or "Paid 2000 for school fees"</Text>
            <View style={tw`flex-row items-center`}>
              {isRecording ? (
                /* Recording overlay inside input container */
                <View style={tw`flex-1 flex-row items-center bg-[#FFE8E8] dark:bg-[#2C1818] rounded-2xl px-5 py-4 mr-3 justify-between border border-red-500`}>
                  <View style={tw`flex-row items-center`}>
                    <Ionicons name="mic" size={18} color="#EF4444" style={tw`mr-2`} />
                    <Text style={tw`text-sm font-bold text-red-500 mr-3`}>{formatDuration(recordingDuration)}</Text>
                    <Text style={tw`text-xs text-gray-500 dark:text-gray-400`}>Recording spend...</Text>
                  </View>
                  <TouchableOpacity onPress={cancelRecording} style={tw`p-1`}>
                    <Feather name="trash-2" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ) : (
                /* Standard TextInput */
                <TextInput
                  style={tw`flex-1 ${isDark ? 'bg-[#151B2B] text-white' : 'bg-gray-100 text-gray-900'} rounded-2xl px-5 py-4 mr-3`}
                  placeholder="What did you spend on?"
                  placeholderTextColor="#64748B"
                  value={input}
                  onChangeText={setInput}
                  onFocus={() => {
                    setTimeout(() => {
                      scrollViewRef.current?.scrollTo({ y: 260, animated: true });
                    }, 100);
                  }}
                  onBlur={() => {
                    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
                  }}
                />
              )}
              
              {/* Dynamic Send / Mic / Check Action Button */}
              <TouchableOpacity 
                onPress={isRecording ? stopAndProcessRecording : (input.trim() ? handleAudit : startRecording)} 
                disabled={loading}
                style={tw`w-14 h-14 rounded-2xl items-center justify-center ${isRecording ? 'bg-red-500' : (isDark ? 'bg-[#151B2B]' : 'bg-gray-100')}`}
              >
                {loading ? (
                  <ActivityIndicator color="#10B981" />
                ) : isRecording ? (
                  <Feather name="check" size={22} color="white" />
                ) : input.trim() ? (
                  <Feather name="send" size={20} color="#10B981" />
                ) : (
                  <Feather name="mic" size={22} color="#64748B" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Spend Analytics Accordion */}
          <TouchableOpacity onPress={() => setAnalyticsOpen(!analyticsOpen)} style={tw`flex-row justify-between items-center py-4 border-b border-t ${isDark ? 'border-[#1E293B]' : 'border-gray-200'} mb-4`}>
            <View style={tw`flex-row items-center`}>
              <Feather name="bar-chart-2" size={16} color={textPrimary === 'text-white' ? '#fff' : '#000'} />
              <Text style={tw`${textPrimary} text-lg font-semibold ml-2`}>Spend Analytics</Text>
            </View>
            <Feather name={analyticsOpen ? "chevron-up" : "chevron-down"} size={20} color="#6B7280" />
          </TouchableOpacity>

          {analyticsOpen && (
            <View style={tw`mb-4`}>
              <AnalyticsView analytics={analytics} isDark={isDark} formatCurrency={formatCurrency} />
            </View>
          )}

          {/* Audit History Accordion */}
          <TouchableOpacity onPress={() => setHistoryOpen(!historyOpen)} style={tw`flex-row justify-between items-center py-4 border-b border-t ${isDark ? 'border-[#1E293B]' : 'border-gray-200'} mb-4`}>
            <View style={tw`flex-row items-center`}>
              <Feather name="clock" size={16} color={textPrimary === 'text-white' ? '#fff' : '#000'} />
              <Text style={tw`${textPrimary} text-lg font-semibold ml-2`}>Audit History ({audits.length})</Text>
            </View>
            <Feather name={historyOpen ? "chevron-up" : "chevron-down"} size={20} color="#6B7280" />
          </TouchableOpacity>

          {historyOpen && (
            <View>
              {audits.length > 0 && (
                <TouchableOpacity onPress={clearHistory} style={tw`self-end mb-4`}>
                  <Text style={tw`text-gray-500 text-sm`}>Clear History</Text>
                </TouchableOpacity>
              )}
              {audits.map((audit: any) => <AuditCard key={audit.id} item={audit} isDark={isDark} formatCurrency={formatCurrency} />)}
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
