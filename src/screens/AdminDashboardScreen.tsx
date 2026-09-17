import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import tw from 'twrnc';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import { ScreenWrapper } from '../components/ScreenWrapper';

const LEVERAGE_CATEGORIES = [
  { id: '1', name: 'Code & Media', color: '#3B82F6' },
  { id: '2', name: 'Specific Knowledge', color: '#8B5CF6' },
  { id: '3', name: 'Labor Arbitrage', color: '#F59E0B' },
  { id: '4', name: 'Social Capital', color: '#10B981' }
];

export default function AdminDashboardScreen({ navigation }) {
  const { isDark, formatCurrency } = useTheme();
  const insets = useSafeAreaInsets();
  const {
    logout,
    leverageLessons,
    hvpSkills,
    addLeverageLesson,
    updateLeverageLessonState,
    deleteLeverageLessonState,
    addHVPSkill,
    updateHVPSkillState,
    deleteHVPSkillState,
    uploadVideo
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'analytics' | 'leverage' | 'hvp'>('analytics');
  
  // Modals
  const [leverageModalVisible, setLeverageModalVisible] = useState(false);
  const [hvpModalVisible, setHvpModalVisible] = useState(false);
  
  // Editing State
  const [editingLesson, setEditingLesson] = useState<any>(null);
  const [editingSkill, setEditingSkill] = useState<any>(null);

  // Leverage Form State
  const [leverageForm, setLeverageForm] = useState({
    title: '',
    description: '',
    duration: '15:00',
    level: 'Intermediate',
    categoryId: '1',
    views: '120',
    completed: false,
    videoUrl: ''
  });

  // HVP Form State
  const [hvpForm, setHvpForm] = useState({
    title: '',
    subtitle: '',
    level: '50',
    dotColor: '#EF4444',
    barsString: '50, 60, 70, 80',
    lessonsString: '' // JSON format string for simplicity, or we will manage it dynamically
  });

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Dynamic Theme Styling
  const bgScreen = isDark ? 'bg-[#0B0F19]' : 'bg-[#F1F5F9]';
  const bgCard = isDark ? 'bg-[#06080F]' : 'bg-white';
  const borderCol = isDark ? 'border-gray-800' : 'border-gray-200';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-500';
  const inputBg = isDark ? 'bg-[#0F172A]' : 'bg-gray-50';

  // Calculations for Analytics
  const totalLeverageLessons = leverageLessons.length;
  const totalHVPSkills = hvpSkills.length;
  
  const leverageCompletedCount = leverageLessons.filter(l => l.completed).length;
  const leverageProgress = totalLeverageLessons > 0 ? Math.round((leverageCompletedCount / totalLeverageLessons) * 100) : 0;
  
  const hvpAverageScore = totalHVPSkills > 0 
    ? Math.round(hvpSkills.reduce((sum, skill) => sum + (skill.level || 0), 0) / totalHVPSkills) 
    : 0;

  // Leverage Course Managers
  const openLeverageModal = (lesson: any = null) => {
    if (lesson) {
      setEditingLesson(lesson);
      setLeverageForm({
        title: lesson.title,
        description: lesson.description || '',
        duration: lesson.duration || '15:00',
        level: lesson.level || 'Intermediate',
        categoryId: lesson.categoryId || '1',
        views: lesson.views ? lesson.views.toString() : '0',
        completed: lesson.completed || false,
        videoUrl: lesson.videoUrl || ''
      });
    } else {
      setEditingLesson(null);
      setLeverageForm({
        title: '',
        description: '',
        duration: '15:00',
        level: 'Intermediate',
        categoryId: '1',
        views: '120',
        completed: false,
        videoUrl: ''
      });
    }
    setLeverageModalVisible(true);
  };

  const handleUploadVideo = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Denied', 'Permission to access media library is required to upload videos.');
        return;
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 1,
      });

      if (pickerResult.canceled || !pickerResult.assets || pickerResult.assets.length === 0) {
        return;
      }

      const selectedAsset = pickerResult.assets[0];
      setUploading(true);
      
      const formData = new FormData();
      const uri = selectedAsset.uri;
      const uriParts = uri.split('/');
      const fileName = uriParts[uriParts.length - 1] || 'video.mp4';
      
      formData.append('video', {
        uri,
        name: fileName,
        type: 'video/mp4'
      } as any);

      const response = await uploadVideo(formData);
      setLeverageForm(prev => ({
        ...prev,
        videoUrl: response.videoUrl
      }));
      Alert.alert('Success', 'Video uploaded successfully!');
    } catch (err: any) {
      console.error(err);
      Alert.alert('Upload Error', err.message || 'Failed to upload video.');
    } finally {
      setUploading(false);
    }
  };

  const saveLeverageLesson = async () => {
    if (!leverageForm.title.trim()) {
      Alert.alert('Validation Error', 'Lesson title is required.');
      return;
    }
    setSaving(true);
    try {
      const selectedCategory = LEVERAGE_CATEGORIES.find(c => c.id === leverageForm.categoryId);
      const payload = {
        ...leverageForm,
        accentColor: selectedCategory ? selectedCategory.color : '#3B82F6',
        views: leverageForm.views.includes('K') ? leverageForm.views : parseFloat(leverageForm.views).toLocaleString()
      };

      if (editingLesson) {
        await updateLeverageLessonState(editingLesson.id, payload);
      } else {
        await addLeverageLesson(payload);
      }
      setLeverageModalVisible(false);
      Alert.alert('Success', 'Leverage Lab lesson saved successfully!');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save lesson.');
    } finally {
      setSaving(false);
    }
  };

  const deleteLeverageLesson = (id: string) => {
    Alert.alert(
      'Delete Lesson',
      'Are you sure you want to delete this Leverage Lab lesson?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteLeverageLessonState(id);
              Alert.alert('Deleted', 'Lesson has been successfully deleted.');
            } catch (err: any) {
              Alert.alert('Error', 'Failed to delete lesson.');
            }
          }
        }
      ]
    );
  };

  // HVP Skill Managers
  const openHvpModal = (skill: any = null) => {
    if (skill) {
      setEditingSkill(skill);
      setHvpForm({
        title: skill.title,
        subtitle: skill.subtitle || '',
        level: skill.level ? skill.level.toString() : '50',
        dotColor: skill.dotColor || '#EF4444',
        barsString: skill.bars ? skill.bars.join(', ') : '50, 60, 70',
        lessonsString: skill.lessons ? JSON.stringify(skill.lessons, null, 2) : '[]'
      });
    } else {
      setEditingSkill(null);
      setHvpForm({
        title: '',
        subtitle: '',
        level: '50',
        dotColor: '#EF4444',
        barsString: '50, 60, 70, 80',
        lessonsString: '[\n  {\n    "id": "l_temp_1",\n    "title": "Introduction to Skill",\n    "description": "Basics of the skill.",\n    "duration": "15:00",\n    "views": "120",\n    "level": "Beginner",\n    "completed": false,\n    "videoUrl": ""\n  }\n]'
      });
    }
    setHvpModalVisible(true);
  };

  const saveHvpSkill = async () => {
    if (!hvpForm.title.trim()) {
      Alert.alert('Validation Error', 'Skill title is required.');
      return;
    }
    setSaving(true);
    try {
      const parsedBars = hvpForm.barsString.split(',').map(s => parseFloat(s.trim()) || 0);
      let parsedLessons = [];
      try {
        parsedLessons = JSON.parse(hvpForm.lessonsString || '[]');
      } catch (e) {
        Alert.alert('JSON Error', 'Lessons array must be a valid JSON representation.');
        setSaving(false);
        return;
      }

      const payload = {
        title: hvpForm.title,
        subtitle: hvpForm.subtitle,
        level: parseInt(hvpForm.level) || 0,
        dotColor: hvpForm.dotColor,
        bars: parsedBars,
        lessons: parsedLessons
      };

      if (editingSkill) {
        await updateHVPSkillState(editingSkill.id, payload);
      } else {
        await addHVPSkill(payload);
      }
      setHvpModalVisible(false);
      Alert.alert('Success', 'HVP Skill saved successfully!');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save HVP skill.');
    } finally {
      setSaving(false);
    }
  };

  const deleteHvpSkill = (id: string) => {
    Alert.alert(
      'Delete Skill',
      'Are you sure you want to delete this HVP Skill?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteHVPSkillState(id);
              Alert.alert('Deleted', 'Skill has been successfully deleted.');
            } catch (err: any) {
              Alert.alert('Error', 'Failed to delete skill.');
            }
          }
        }
      ]
    );
  };

  const handleSignOut = () => {
    logout();
    navigation.navigate('Login');
  };

  return (
    <View style={[tw`flex-1 ${bgScreen}`, { paddingTop: insets.top }]}>
      {/* Top Professional Admin Bar */}
      <View style={tw`flex-row justify-between items-center px-6 py-4 border-b ${borderCol} ${isDark ? 'bg-[#0B0F19]' : 'bg-white'} z-10`}>
        <View style={tw`flex-row items-center`}>
          <View style={tw`w-8 h-8 rounded-lg bg-[#8B5CF6] items-center justify-center mr-3`}>
            <Ionicons name="key" size={16} color="white" />
          </View>
          <Text style={tw`text-lg font-extrabold ${textPrimary} tracking-wider`}>ADMIN PANEL</Text>
        </View>

        <View style={tw`flex-row items-center gap-3`}>
          {/* User Switcher Bypass */}
          <TouchableOpacity 
            onPress={() => navigation.navigate('Main')}
            style={tw`flex-row items-center bg-[#10B981]/15 border border-[#10B981]/30 px-3 py-1.5 rounded-xl`}
          >
            <Feather name="user" size={14} color="#10B981" />
            <Text style={tw`text-[#10B981] font-bold ml-1.5 text-xs`}>User Mode</Text>
          </TouchableOpacity>

          {/* Logout */}
          <TouchableOpacity 
            onPress={handleSignOut}
            style={tw`p-2 bg-red-500/10 border border-red-500/20 rounded-xl`}
          >
            <Feather name="log-out" size={14} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={tw`flex-row border-b ${borderCol} ${isDark ? 'bg-[#0B0F19]' : 'bg-white'}`}>
        <TouchableOpacity 
          onPress={() => setActiveTab('analytics')} 
          style={tw`flex-1 py-3.5 items-center ${activeTab === 'analytics' ? 'border-b-2 border-[#8B5CF6]' : ''}`}
        >
          <Text style={tw`font-bold text-xs tracking-wider ${activeTab === 'analytics' ? 'text-[#8B5CF6]' : 'text-gray-500'}`}>ANALYTICS</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setActiveTab('leverage')} 
          style={tw`flex-1 py-3.5 items-center ${activeTab === 'leverage' ? 'border-b-2 border-[#8B5CF6]' : ''}`}
        >
          <Text style={tw`font-bold text-xs tracking-wider ${activeTab === 'leverage' ? 'text-[#8B5CF6]' : 'text-gray-500'}`}>LEVERAGE LAB</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setActiveTab('hvp')} 
          style={tw`flex-1 py-3.5 items-center ${activeTab === 'hvp' ? 'border-b-2 border-[#8B5CF6]' : ''}`}
        >
          <Text style={tw`font-bold text-xs tracking-wider ${activeTab === 'hvp' ? 'text-[#8B5CF6]' : 'text-gray-500'}`}>HVP SKILLS</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`p-6 pb-12`}>
        
        {/* ======================================================== */}
        {/* TAB 1: ANALYTICS                                        */}
        {/* ======================================================== */}
        {activeTab === 'analytics' && (
          <View>
            <Text style={tw`${textPrimary} text-xl font-extrabold mb-5`}>Live Data Metrics</Text>
            
            {/* 4 Stats Cards */}
            <View style={tw`flex-row flex-wrap justify-between mb-6`}>
              <View style={tw`${bgCard} border ${borderCol} rounded-2xl p-4 w-[48%] mb-4`}>
                <Text style={tw`text-gray-500 text-[10px] font-extrabold uppercase tracking-wider mb-2`}>Total Lessons</Text>
                <Text style={tw`text-[#3B82F6] text-3xl font-extrabold mb-1`}>{totalLeverageLessons}</Text>
                <Text style={tw`text-gray-500 text-xs`}>Leverage Lab courses</Text>
              </View>
              <View style={tw`${bgCard} border ${borderCol} rounded-2xl p-4 w-[48%] mb-4`}>
                <Text style={tw`text-gray-500 text-[10px] font-extrabold uppercase tracking-wider mb-2`}>Lessons Completed</Text>
                <Text style={tw`text-[#10B981] text-3xl font-extrabold mb-1`}>{leverageCompletedCount}</Text>
                <Text style={tw`text-gray-500 text-xs`}>{leverageProgress}% progress ratio</Text>
              </View>
              <View style={tw`${bgCard} border ${borderCol} rounded-2xl p-4 w-[48%] mb-4`}>
                <Text style={tw`text-gray-500 text-[10px] font-extrabold uppercase tracking-wider mb-2`}>HVP Skills Tracked</Text>
                <Text style={tw`text-[#8B5CF6] text-3xl font-extrabold mb-1`}>{totalHVPSkills}</Text>
                <Text style={tw`text-gray-500 text-xs`}>Dynamic HVP categories</Text>
              </View>
              <View style={tw`${bgCard} border ${borderCol} rounded-2xl p-4 w-[48%] mb-4`}>
                <Text style={tw`text-gray-500 text-[10px] font-extrabold uppercase tracking-wider mb-2`}>HVP Average Score</Text>
                <Text style={tw`text-[#F59E0B] text-3xl font-extrabold mb-1`}>{hvpAverageScore}%</Text>
                <Text style={tw`text-gray-500 text-xs`}>Across HVP skill levels</Text>
              </View>
            </View>

            {/* Analysis & Visualization block */}
            <View style={tw`${bgCard} border ${borderCol} rounded-3xl p-5 mb-6`}>
              <View style={tw`flex-row items-center justify-between mb-4`}>
                <View style={tw`flex-row items-center`}>
                  <Ionicons name="bar-chart" size={18} color="#8B5CF6" style={tw`mr-2`} />
                  <Text style={tw`${textPrimary} font-bold text-base`}>Course User Coverage</Text>
                </View>
                <View style={tw`bg-[#8B5CF6]/15 px-2.5 py-1 rounded-full`}>
                  <Text style={tw`text-[#8B5CF6] font-bold text-[10px]`}>LIVE FEED</Text>
                </View>
              </View>

              <Text style={tw`text-gray-500 text-sm mb-6 leading-5`}>
                Analysis of interactive module coverage shows significant progress inside Leverage Lab and high-end consultative sales tracks. Specific knowledge remains a core focal area for expanding curriculum.
              </Text>

              {/* Mock Bar Chart using CSS/Flexboxes */}
              <View style={tw`h-32 flex-row justify-between items-end px-3 mt-2 mb-2`}>
                <View style={tw`items-center flex-1`}>
                  <View style={tw`bg-[#3B82F6] w-6 h-[80%] rounded-t-md opacity-80 justify-end items-center pb-2`}><Text style={tw`text-white font-extrabold text-[8px]`}>80%</Text></View>
                  <Text style={tw`text-gray-500 text-[9px] mt-2 font-semibold`}>Code/Media</Text>
                </View>
                <View style={tw`items-center flex-1`}>
                  <View style={tw`bg-[#8B5CF6] w-6 h-[50%] rounded-t-md opacity-80 justify-end items-center pb-2`}><Text style={tw`text-white font-extrabold text-[8px]`}>50%</Text></View>
                  <Text style={tw`text-gray-500 text-[9px] mt-2 font-semibold`}>Knowledge</Text>
                </View>
                <View style={tw`items-center flex-1`}>
                  <View style={tw`bg-[#F59E0B] w-6 h-[65%] rounded-t-md opacity-80 justify-end items-center pb-2`}><Text style={tw`text-white font-extrabold text-[8px]`}>65%</Text></View>
                  <Text style={tw`text-gray-500 text-[9px] mt-2 font-semibold`}>Arbitrage</Text>
                </View>
                <View style={tw`items-center flex-1`}>
                  <View style={tw`bg-[#10B981] w-6 h-[90%] rounded-t-md opacity-80 justify-end items-center pb-2`}><Text style={tw`text-white font-extrabold text-[8px]`}>90%</Text></View>
                  <Text style={tw`text-gray-500 text-[9px] mt-2 font-semibold`}>Social Cap</Text>
                </View>
              </View>
            </View>

            <View style={tw`${bgCard} border ${borderCol} rounded-3xl p-5 mb-4`}>
              <View style={tw`flex-row items-center mb-4`}>
                <Feather name="info" size={18} color="#10B981" style={tw`mr-2`} />
                <Text style={tw`${textPrimary} font-bold text-base`}>Admin Audit Overview</Text>
              </View>
              <Text style={tw`text-gray-500 text-sm leading-5`}>
                Administrators can freely adjust courses, lesson plans, duration targets, and high-value person progress metrics in real-time. Any changes made here are instantly pushed and reflected inside client screens automatically.
              </Text>
            </View>
          </View>
        )}

        {/* ======================================================== */}
        {/* TAB 2: LEVERAGE LAB COURSES                             */}
        {/* ======================================================== */}
        {activeTab === 'leverage' && (
          <View>
            <View style={tw`flex-row justify-between items-center mb-5`}>
              <Text style={tw`${textPrimary} text-xl font-extrabold`}>Lessons Manager ({totalLeverageLessons})</Text>
              <TouchableOpacity
                onPress={() => openLeverageModal()}
                style={tw`flex-row items-center bg-[#8B5CF6] px-4 py-2 rounded-xl`}
              >
                <Feather name="plus" size={14} color="white" />
                <Text style={tw`text-white font-bold ml-1.5 text-xs`}>Add Lesson</Text>
              </TouchableOpacity>
            </View>

            {leverageLessons.map((lesson) => {
              const category = LEVERAGE_CATEGORIES.find(c => c.id === lesson.categoryId) || LEVERAGE_CATEGORIES[0];
              return (
                <View 
                  key={lesson.id} 
                  style={tw`${bgCard} border ${borderCol} rounded-2xl p-4 mb-3 flex-row items-center justify-between`}
                >
                  <View style={tw`flex-1 pr-4`}>
                    <View style={tw`flex-row items-center mb-1.5`}>
                      <View style={[tw`px-2 py-0.5 rounded-full mr-2`, { backgroundColor: category.color + '20' }]}>
                        <Text style={[tw`text-[10px] font-bold`, { color: category.color }]}>{category.name}</Text>
                      </View>
                      <Text style={tw`text-gray-500 text-xs`}>{lesson.duration} · {lesson.level}</Text>
                    </View>
                    <Text style={tw`${textPrimary} font-bold text-base mb-1`}>{lesson.title}</Text>
                    <Text style={tw`text-gray-500 text-xs`} numberOfLines={2}>{lesson.description}</Text>
                  </View>

                  <View style={tw`flex-row gap-2`}>
                    <TouchableOpacity
                      onPress={() => openLeverageModal(lesson)}
                      style={tw`w-10 h-10 ${inputBg} rounded-xl items-center justify-center border ${borderCol}`}
                    >
                      <Feather name="edit-2" size={14} color="#3B82F6" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => deleteLeverageLesson(lesson.id)}
                      style={tw`w-10 h-10 ${isDark ? 'bg-red-500/10' : 'bg-red-100'} rounded-xl items-center justify-center`}
                    >
                      <Feather name="trash-2" size={14} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ======================================================== */}
        {/* TAB 3: HVP SKILLS                                       */}
        {/* ======================================================== */}
        {activeTab === 'hvp' && (
          <View>
            <View style={tw`flex-row justify-between items-center mb-5`}>
              <Text style={tw`${textPrimary} text-xl font-extrabold`}>Skills Manager ({totalHVPSkills})</Text>
              <TouchableOpacity
                onPress={() => openHvpModal()}
                style={tw`flex-row items-center bg-[#8B5CF6] px-4 py-2 rounded-xl`}
              >
                <Feather name="plus" size={14} color="white" />
                <Text style={tw`text-white font-bold ml-1.5 text-xs`}>Add Skill</Text>
              </TouchableOpacity>
            </View>

            {hvpSkills.map((skill) => {
              return (
                <View 
                  key={skill.id} 
                  style={tw`${bgCard} border ${borderCol} rounded-2xl p-4 mb-3 flex-row items-center justify-between`}
                >
                  <View style={tw`flex-1 pr-4`}>
                    <View style={tw`flex-row items-center mb-1.5`}>
                      <View style={[{ backgroundColor: skill.dotColor || '#EF4444' }, tw`w-2.5 h-2.5 rounded-full mr-2`]} />
                      <Text style={tw`${textPrimary} font-bold text-base`}>{skill.title}</Text>
                    </View>
                    <Text style={tw`text-gray-500 text-xs mb-1.5`}>{skill.subtitle}</Text>
                    <View style={tw`flex-row items-center gap-4`}>
                      <View style={tw`flex-row items-center`}>
                        <Feather name="trending-up" size={12} color="#10B981" />
                        <Text style={tw`text-[#10B981] font-bold text-xs ml-1`}>Level {skill.level}%</Text>
                      </View>
                      <View style={tw`flex-row items-center`}>
                        <Feather name="book-open" size={12} color="#6B7280" />
                        <Text style={tw`text-gray-500 text-xs ml-1`}>{skill.lessons ? skill.lessons.length : 0} lessons</Text>
                      </View>
                    </View>
                  </View>

                  <View style={tw`flex-row gap-2`}>
                    <TouchableOpacity
                      onPress={() => openHvpModal(skill)}
                      style={tw`w-10 h-10 ${inputBg} rounded-xl items-center justify-center border ${borderCol}`}
                    >
                      <Feather name="edit-2" size={14} color="#3B82F6" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => deleteHvpSkill(skill.id)}
                      style={tw`w-10 h-10 ${isDark ? 'bg-red-500/10' : 'bg-red-100'} rounded-xl items-center justify-center`}
                    >
                      <Feather name="trash-2" size={14} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

      </ScrollView>

      {/* ======================================================== */}
      {/* MODAL: Leverage Lab Lesson                              */}
      {/* ======================================================== */}
      <Modal visible={leverageModalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={tw`flex-1 justify-end`}>
          <View style={tw`${isDark ? 'bg-[#0F172A]' : 'bg-white'} p-6 rounded-t-3xl border-t ${borderCol} shadow-2xl max-h-[90%]`}>
            <View style={tw`flex-row justify-between items-center mb-5`}>
              <Text style={tw`${textPrimary} text-xl font-bold`}>
                {editingLesson ? 'Edit Leverage Lesson' : 'Add Leverage Lesson'}
              </Text>
              <TouchableOpacity onPress={() => setLeverageModalVisible(false)}>
                <View style={tw`w-8 h-8 ${inputBg} rounded-full items-center justify-center`}>
                  <Feather name="x" size={16} color="#9CA3AF" />
                </View>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Title */}
              <Text style={tw`text-gray-400 mb-1 text-sm font-semibold`}>Lesson Title</Text>
              <TextInput
                style={tw`${inputBg} ${textPrimary} p-3.5 rounded-xl mb-4 border ${borderCol}`}
                placeholder="e.g. Scaling with React Native"
                placeholderTextColor="#64748B"
                value={leverageForm.title}
                onChangeText={t => setLeverageForm({ ...leverageForm, title: t })}
              />

              {/* Description */}
              <Text style={tw`text-gray-400 mb-1 text-sm font-semibold`}>Description</Text>
              <TextInput
                style={tw`${inputBg} ${textPrimary} p-3.5 rounded-xl mb-4 border ${borderCol} h-20`}
                placeholder="Brief course curriculum description..."
                placeholderTextColor="#64748B"
                multiline={true}
                value={leverageForm.description}
                onChangeText={t => setLeverageForm({ ...leverageForm, description: t })}
              />

              {/* Category Selector */}
              <Text style={tw`text-gray-400 mb-2.5 text-sm font-semibold`}>Topic Category</Text>
              <View style={tw`flex-row flex-wrap gap-2 mb-4`}>
                {LEVERAGE_CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setLeverageForm({ ...leverageForm, categoryId: cat.id })}
                    style={[
                      tw`px-3.5 py-2.5 rounded-xl border flex-row items-center`,
                      {
                        backgroundColor: leverageForm.categoryId === cat.id ? cat.color : (isDark ? '#1E293B' : '#F8FAFC'),
                        borderColor: leverageForm.categoryId === cat.id ? cat.color : (isDark ? '#334155' : '#E2E8F0'),
                      }
                    ]}
                  >
                    <View style={[{ backgroundColor: cat.color }, tw`w-2 h-2 rounded-full mr-2`]} />
                    <Text style={tw`text-xs font-bold ${leverageForm.categoryId === cat.id ? 'text-white' : 'text-gray-500'}`}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Video URL & Upload */}
              <Text style={tw`text-gray-400 mb-1 text-sm font-semibold`}>Video URL</Text>
              <View style={tw`flex-row gap-3 mb-4 items-center`}>
                <TextInput
                  style={tw`flex-1 ${inputBg} ${textPrimary} p-3.5 rounded-xl border ${borderCol}`}
                  placeholder="e.g. http://..."
                  placeholderTextColor="#64748B"
                  value={leverageForm.videoUrl}
                  onChangeText={t => setLeverageForm({ ...leverageForm, videoUrl: t })}
                />
                <TouchableOpacity
                  onPress={handleUploadVideo}
                  disabled={uploading}
                  style={tw`bg-[#8B5CF6] h-13 px-4 rounded-xl items-center justify-center flex-row`}
                >
                  {uploading ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <>
                      <Feather name="upload-cloud" size={16} color="white" style={tw`mr-2`} />
                      <Text style={tw`text-white font-bold text-xs`}>Upload</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              <View style={tw`flex-row gap-3 mb-4`}>
                {/* Duration */}
                <View style={tw`flex-1`}>
                  <Text style={tw`text-gray-400 mb-1 text-sm font-semibold`}>Duration</Text>
                  <TextInput
                    style={tw`${inputBg} ${textPrimary} p-3.5 rounded-xl border ${borderCol}`}
                    placeholder="25:10"
                    placeholderTextColor="#64748B"
                    value={leverageForm.duration}
                    onChangeText={t => setLeverageForm({ ...leverageForm, duration: t })}
                  />
                </View>
                
                {/* Views */}
                <View style={tw`flex-1`}>
                  <Text style={tw`text-gray-400 mb-1 text-sm font-semibold`}>Views Count</Text>
                  <TextInput
                    style={tw`${inputBg} ${textPrimary} p-3.5 rounded-xl border ${borderCol}`}
                    placeholder="1.2K"
                    placeholderTextColor="#64748B"
                    value={leverageForm.views}
                    onChangeText={t => setLeverageForm({ ...leverageForm, views: t })}
                  />
                </View>
              </View>

              {/* Level */}
              <Text style={tw`text-gray-400 mb-2 text-sm font-semibold`}>Skill Level</Text>
              <View style={tw`flex-row gap-2 mb-4`}>
                {['Beginner', 'Intermediate', 'Advanced'].map(lvl => (
                  <TouchableOpacity
                    key={lvl}
                    onPress={() => setLeverageForm({ ...leverageForm, level: lvl })}
                    style={tw`flex-1 py-2.5 rounded-xl items-center border ${leverageForm.level === lvl ? 'bg-[#8B5CF6] border-[#8B5CF6]' : `${inputBg} ${borderCol}`}`}
                  >
                    <Text style={tw`text-xs font-bold ${leverageForm.level === lvl ? 'text-white' : 'text-gray-500'}`}>{lvl}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Completed Status */}
              <View style={tw`flex-row justify-between items-center mb-6 mt-2 ${inputBg} p-4 rounded-xl border ${borderCol}`}>
                <Text style={tw`${textPrimary} font-bold text-sm`}>Mark Completed by default?</Text>
                <TouchableOpacity
                  onPress={() => setLeverageForm({ ...leverageForm, completed: !leverageForm.completed })}
                  style={tw`w-12 h-6 rounded-full p-0.5 justify-center ${leverageForm.completed ? 'bg-[#10B981] items-end' : 'bg-gray-500 items-start'}`}
                >
                  <View style={tw`w-5 h-5 rounded-full bg-white`} />
                </TouchableOpacity>
              </View>

              {/* Save CTAs */}
              <View style={tw`flex-row justify-between mt-2 mb-6`}>
                <TouchableOpacity
                  onPress={() => setLeverageModalVisible(false)}
                  style={tw`${inputBg} py-3.5 px-8 rounded-xl border ${borderCol} w-[45%] items-center`}
                >
                  <Text style={tw`${textPrimary} font-bold`}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={saveLeverageLesson}
                  disabled={saving}
                  style={tw`bg-[#8B5CF6] py-3.5 px-8 rounded-xl w-[45%] items-center`}
                >
                  {saving ? <ActivityIndicator color="white" size="small" /> : <Text style={tw`text-white font-bold`}>Save</Text>}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL: HVP Skill Customizer                             */}
      {/* ======================================================== */}
      <Modal visible={hvpModalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={tw`flex-1 justify-end`}>
          <View style={tw`${isDark ? 'bg-[#0F172A]' : 'bg-white'} p-6 rounded-t-3xl border-t ${borderCol} shadow-2xl max-h-[90%]`}>
            <View style={tw`flex-row justify-between items-center mb-5`}>
              <Text style={tw`${textPrimary} text-xl font-bold`}>
                {editingSkill ? 'Edit HVP Skill' : 'Add HVP Skill'}
              </Text>
              <TouchableOpacity onPress={() => setHvpModalVisible(false)}>
                <View style={tw`w-8 h-8 ${inputBg} rounded-full items-center justify-center`}>
                  <Feather name="x" size={16} color="#9CA3AF" />
                </View>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Title */}
              <Text style={tw`text-gray-400 mb-1 text-sm font-semibold`}>Skill Title</Text>
              <TextInput
                style={tw`${inputBg} ${textPrimary} p-3.5 rounded-xl mb-4 border ${borderCol}`}
                placeholder="e.g. Consultative Selling"
                placeholderTextColor="#64748B"
                value={hvpForm.title}
                onChangeText={t => setHvpForm({ ...hvpForm, title: t })}
              />

              {/* Subtitle */}
              <Text style={tw`text-gray-400 mb-1 text-sm font-semibold`}>Subtitle</Text>
              <TextInput
                style={tw`${inputBg} ${textPrimary} p-3.5 rounded-xl mb-4 border ${borderCol}`}
                placeholder="e.g. Master high-ticket persuasion"
                placeholderTextColor="#64748B"
                value={hvpForm.subtitle}
                onChangeText={t => setHvpForm({ ...hvpForm, subtitle: t })}
              />

              <View style={tw`flex-row gap-3 mb-4`}>
                {/* Level */}
                <View style={tw`flex-1`}>
                  <Text style={tw`text-gray-400 mb-1 text-sm font-semibold`}>Level Score (%)</Text>
                  <TextInput
                    style={tw`${inputBg} ${textPrimary} p-3.5 rounded-xl border ${borderCol}`}
                    placeholder="75"
                    keyboardType="numeric"
                    placeholderTextColor="#64748B"
                    value={hvpForm.level}
                    onChangeText={t => setHvpForm({ ...hvpForm, level: t })}
                  />
                </View>

                {/* Dot Color */}
                <View style={tw`flex-1`}>
                  <Text style={tw`text-gray-400 mb-1 text-sm font-semibold`}>Color Hex</Text>
                  <TextInput
                    style={tw`${inputBg} ${textPrimary} p-3.5 rounded-xl border ${borderCol}`}
                    placeholder="#EF4444"
                    placeholderTextColor="#64748B"
                    value={hvpForm.dotColor}
                    onChangeText={t => setHvpForm({ ...hvpForm, dotColor: t })}
                  />
                </View>
              </View>

              {/* Bars array */}
              <Text style={tw`text-gray-400 mb-1 text-sm font-semibold`}>Growth Bar values (comma-separated)</Text>
              <TextInput
                style={tw`${inputBg} ${textPrimary} p-3.5 rounded-xl mb-4 border ${borderCol}`}
                placeholder="40, 50, 60, 80"
                placeholderTextColor="#64748B"
                value={hvpForm.barsString}
                onChangeText={t => setHvpForm({ ...hvpForm, barsString: t })}
              />

              {/* JSON Lessons */}
              <Text style={tw`text-gray-400 mb-1 text-sm font-semibold`}>Nested Skill Lessons (JSON array format)</Text>
              <TextInput
                style={tw`${inputBg} ${textPrimary} p-3.5 rounded-xl mb-4 border ${borderCol} font-mono text-xs h-36`}
                placeholder="[ { 'id': 'l1', ... } ]"
                placeholderTextColor="#64748B"
                multiline={true}
                value={hvpForm.lessonsString}
                onChangeText={t => setHvpForm({ ...hvpForm, lessonsString: t })}
              />

              {/* Save CTAs */}
              <View style={tw`flex-row justify-between mt-2 mb-6`}>
                <TouchableOpacity
                  onPress={() => setHvpModalVisible(false)}
                  style={tw`${inputBg} py-3.5 px-8 rounded-xl border ${borderCol} w-[45%] items-center`}
                >
                  <Text style={tw`${textPrimary} font-bold`}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={saveHvpSkill}
                  disabled={saving}
                  style={tw`bg-[#8B5CF6] py-3.5 px-8 rounded-xl w-[45%] items-center`}
                >
                  {saving ? <ActivityIndicator color="white" size="small" /> : <Text style={tw`text-white font-bold`}>Save</Text>}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
}
