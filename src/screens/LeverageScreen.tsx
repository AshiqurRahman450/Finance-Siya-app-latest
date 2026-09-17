import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, Dimensions } from 'react-native';
import tw from 'twrnc';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/* ── Video / Lesson Card ── */
const VideoLessonCard = ({ lesson, index, isDark, onPlay }) => {
  const cBg = isDark ? 'bg-[#06080F]' : 'bg-white';
  const cBorder = isDark ? 'border-gray-700/60' : 'border-gray-200';
  const tp = isDark ? 'text-white' : 'text-gray-900';
  const subText = isDark ? 'text-gray-400' : 'text-gray-500';
  const thumbBg = isDark ? 'bg-[#111827]' : 'bg-gray-100';

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onPlay(lesson)}
      style={tw`${cBg} ${cBorder} border rounded-2xl mb-3 overflow-hidden`}
    >
      {/* Video Thumbnail Area */}
      <View style={tw`${thumbBg} h-44 items-center justify-center relative`}>
        {/* Gradient overlay effect */}
        <View style={tw`absolute inset-0 bg-black/30 rounded-t-2xl`} />

        {/* Play button */}
        <View style={tw`w-16 h-16 rounded-full bg-white/20 items-center justify-center border-2 border-white/40`}>
          <Ionicons name="play" size={28} color="#FFFFFF" style={{ marginLeft: 3 }} />
        </View>

        {/* Duration badge */}
        <View style={tw`absolute bottom-3 right-3 bg-black/70 px-2.5 py-1 rounded-lg flex-row items-center`}>
          <Feather name="clock" size={11} color="#FFFFFF" />
          <Text style={tw`text-white text-xs font-semibold ml-1`}>{lesson.duration}</Text>
        </View>

        {/* Lesson number badge */}
        <View style={tw`absolute top-3 left-3 bg-[#10B981]/90 px-3 py-1 rounded-lg`}>
          <Text style={tw`text-white text-xs font-bold`}>Lesson {index + 1}</Text>
        </View>

        {/* Category color accent bar */}
        <View style={[tw`absolute bottom-0 left-0 right-0 h-1`, { backgroundColor: lesson.accentColor || '#10B981' }]} />
      </View>

      {/* Info section */}
      <View style={tw`p-4`}>
        <Text style={tw`${tp} font-bold text-base mb-1`} numberOfLines={2}>{lesson.title}</Text>
        <Text style={tw`${subText} text-sm mb-3`} numberOfLines={2}>{lesson.description}</Text>

        <View style={tw`flex-row items-center justify-between`}>
          <View style={tw`flex-row items-center`}>
            <View style={tw`flex-row items-center mr-4`}>
              <Feather name="eye" size={13} color="#6B7280" />
              <Text style={tw`${subText} text-xs ml-1`}>{lesson.views} views</Text>
            </View>
            <View style={tw`flex-row items-center`}>
              <Feather name="bar-chart-2" size={13} color="#6B7280" />
              <Text style={tw`${subText} text-xs ml-1`}>{lesson.level}</Text>
            </View>
          </View>

          {lesson.completed && (
            <View style={tw`flex-row items-center bg-[#10B981]/15 px-2.5 py-1 rounded-full`}>
              <Ionicons name="checkmark-circle" size={14} color="#10B981" />
              <Text style={tw`text-[#10B981] text-xs font-semibold ml-1`}>Done</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function LeverageScreen() {
  const { isDark } = useTheme();
  const cardBg = isDark ? 'bg-[#06080F]' : 'bg-white';
  const cardBorder = isDark ? 'border-gray-700' : 'border-gray-200';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const catBannerBg = isDark ? 'bg-[#121826]' : 'bg-gray-50';
  const catBannerBorder = isDark ? 'border-gray-800' : 'border-gray-200';
  const catIconBg = isDark ? 'bg-[#1A2235]' : 'bg-gray-100';
  const modalBg = isDark ? 'bg-[#0F172A]' : 'bg-white';

  const [categories] = useState([
    { id: '1', name: 'Code & Media', icon: 'code', color: '#3B82F6' },
    { id: '2', name: 'Specific Knowledge', icon: 'book-open', color: '#8B5CF6' },
    { id: '3', name: 'Labor Arbitrage', icon: 'clock', color: '#F59E0B' },
    { id: '4', name: 'Social Capital', icon: 'users', color: '#10B981' }
  ]);

  const { leverageLessons: lessons } = useAuth();

  const [expandedCategories, setExpandedCategories] = useState(['1']);
  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);

  const totalLessons = lessons.length;
  const completedLessons = lessons.filter(l => l.completed).length;
  const totalDurationMinutes = lessons.reduce((sum, l) => {
    const parts = l.duration.split(':');
    return sum + parseInt(parts[0]) + parseInt(parts[1]) / 60;
  }, 0);

  const toggleCategory = (categoryId) => {
    if (expandedCategories.includes(categoryId)) {
      setExpandedCategories(expandedCategories.filter(id => id !== categoryId));
    } else {
      setExpandedCategories([...expandedCategories, categoryId]);
    }
  };

  const handlePlayVideo = (lesson) => {
    setSelectedLesson(lesson);
    setVideoModalVisible(true);
  };

  return (
    <ScreenWrapper title="Leverage Lab">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`pb-8`}>
        {/* Top Summary */}
        <View style={tw`${cardBg} border ${cardBorder} rounded-3xl p-6 mb-6 relative`}>
          <Text style={tw`${textPrimary} font-semibold mb-2`}>Course Progress</Text>
          <Text style={tw`text-[#10B981] text-4xl font-bold tracking-tight mb-1`}>{completedLessons}/{totalLessons}</Text>
          <Text style={tw`text-gray-500 text-sm mb-6`}>lessons completed</Text>
          <TouchableOpacity style={tw`absolute top-6 right-6 ${isDark ? 'bg-[#064E3B]' : 'bg-[#ECFDF5]'} w-12 h-12 rounded-2xl items-center justify-center`}>
            <Ionicons name="play-circle" size={24} color="#10B981" />
          </TouchableOpacity>

          {/* Progress bar */}
          <View style={tw`${isDark ? 'bg-[#1E293B]' : 'bg-gray-200'} h-2 rounded-full mb-5 overflow-hidden`}>
            <View style={[tw`bg-[#10B981] h-2 rounded-full`, { width: `${(completedLessons / totalLessons) * 100}%` }]} />
          </View>

          <View style={tw`flex-row`}>
            <View style={tw`items-center pr-8`}>
              <Text style={tw`${textPrimary} font-bold text-lg`}>{totalLessons}</Text>
              <Text style={tw`text-gray-500 text-xs`}>Lessons</Text>
            </View>
            <View style={tw`items-center px-8 border-l border-r ${catBannerBorder}`}>
              <Text style={tw`${textPrimary} font-bold text-lg`}>{Math.round(totalDurationMinutes)}m</Text>
              <Text style={tw`text-gray-500 text-xs`}>Total Time</Text>
            </View>
            <View style={tw`items-center pl-8`}>
              <Text style={tw`${textPrimary} font-bold text-lg`}>{categories.length}</Text>
              <Text style={tw`text-gray-500 text-xs`}>Topics</Text>
            </View>
          </View>
        </View>

        {/* Categories / Modules List */}
        {categories.map(category => {
          const categoryLessons = lessons.filter(l => l.categoryId === category.id);
          const completedInCategory = categoryLessons.filter(l => l.completed).length;
          const isExpanded = expandedCategories.includes(category.id);

          return (
            <View key={category.id} style={tw`mb-4`}>
              <TouchableOpacity activeOpacity={0.8} onPress={() => toggleCategory(category.id)} style={tw`${catBannerBg} border ${catBannerBorder} rounded-2xl p-4 flex-row justify-between items-center`}>
                <View style={tw`flex-row items-center flex-1`}>
                  <View style={tw`w-12 h-12 ${catIconBg} rounded-xl items-center justify-center mr-4`}>
                    <Feather name={category.icon as any} size={20} color={category.color} />
                  </View>
                  <View style={tw`flex-1`}>
                    <Text style={tw`${textPrimary} font-bold text-lg`}>{category.name}</Text>
                    <Text style={tw`text-gray-500 text-xs`}>{completedInCategory}/{categoryLessons.length} lessons completed</Text>
                  </View>
                </View>
                <View style={tw`flex-row items-center gap-3`}>
                  {/* Mini progress ring */}
                  <View style={tw`w-9 h-9 rounded-full items-center justify-center border-2`}
                    // @ts-ignore
                    borderColor={categoryLessons.length > 0 && completedInCategory === categoryLessons.length ? '#10B981' : '#6B7280'}
                  >
                    <Text style={tw`text-xs font-bold ${completedInCategory === categoryLessons.length ? 'text-[#10B981]' : 'text-gray-500'}`}>
                      {categoryLessons.length > 0 ? Math.round((completedInCategory / categoryLessons.length) * 100) : 0}%
                    </Text>
                  </View>
                  <Feather name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color="#6B7280" />
                </View>
              </TouchableOpacity>

              {isExpanded && (
                <View style={tw`mt-3 ml-2`}>
                  {categoryLessons.map((lesson, index) => (
                    <VideoLessonCard
                      key={lesson.id}
                      lesson={lesson}
                      index={index}
                      isDark={isDark}
                      onPlay={handlePlayVideo}
                    />
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Video Player Modal */}
      <Modal visible={videoModalVisible} animationType="slide" transparent={true}>
        <View style={tw`flex-1 bg-black/60 justify-end`}>
          <View style={tw`${modalBg} rounded-t-3xl overflow-hidden border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
            {/* Video Player Area */}
            <View style={tw`bg-[#111827] h-56 items-center justify-center relative`}>
              {selectedLesson && selectedLesson.videoUrl ? (
                <Video
                  source={{ uri: selectedLesson.videoUrl }}
                  rate={1.0}
                  volume={1.0}
                  isMuted={false}
                  resizeMode={ResizeMode.CONTAIN}
                  shouldPlay
                  useNativeControls
                  style={tw`w-full h-56`}
                />
              ) : (
                <>
                  <View style={tw`absolute inset-0 bg-black/40`} />
                  <TouchableOpacity style={tw`w-20 h-20 rounded-full bg-[#10B981]/80 items-center justify-center`}>
                    <Ionicons name="play" size={36} color="#FFFFFF" style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                  {selectedLesson && (
                    <View style={tw`absolute bottom-3 left-4 right-4 flex-row justify-between items-center`}>
                      <Text style={tw`text-white/70 text-xs`}>0:00</Text>
                      <View style={tw`flex-1 mx-3 bg-white/20 h-1 rounded-full`}>
                        <View style={tw`bg-[#10B981] h-1 rounded-full w-0`} />
                      </View>
                      <Text style={tw`text-white/70 text-xs`}>{selectedLesson.duration}</Text>
                    </View>
                  )}
                </>
              )}
              {/* Close button */}
              <TouchableOpacity onPress={() => setVideoModalVisible(false)} style={tw`absolute top-4 right-4 w-9 h-9 bg-black/50 rounded-full items-center justify-center`}>
                <Feather name="x" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Lesson Info */}
            {selectedLesson && (
              <View style={tw`p-5 pb-10`}>
                <View style={tw`flex-row items-center mb-2`}>
                  <View style={[tw`px-2.5 py-1 rounded-full mr-2`, { backgroundColor: (selectedLesson.accentColor || '#10B981') + '20' }]}>
                    <Text style={[tw`text-xs font-bold`, { color: selectedLesson.accentColor || '#10B981' }]}>{selectedLesson.level}</Text>
                  </View>
                  <View style={tw`flex-row items-center`}>
                    <Feather name="clock" size={12} color="#6B7280" />
                    <Text style={tw`text-gray-500 text-xs ml-1`}>{selectedLesson.duration}</Text>
                  </View>
                </View>
                <Text style={tw`${textPrimary} text-xl font-bold mb-2`}>{selectedLesson.title}</Text>
                <Text style={tw`text-gray-500 text-sm mb-4`}>{selectedLesson.description}</Text>

                <View style={tw`flex-row items-center`}>
                  <View style={tw`flex-row items-center mr-4`}>
                    <Feather name="eye" size={14} color="#6B7280" />
                    <Text style={tw`text-gray-500 text-sm ml-1`}>{selectedLesson.views} views</Text>
                  </View>
                  {selectedLesson.completed && (
                    <View style={tw`flex-row items-center bg-[#10B981]/15 px-3 py-1.5 rounded-full`}>
                      <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                      <Text style={tw`text-[#10B981] text-sm font-semibold ml-1`}>Completed</Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}
