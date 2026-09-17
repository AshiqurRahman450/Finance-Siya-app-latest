import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Animated, Modal } from 'react-native';
import tw from 'twrnc';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';

/* ── Skill Card (read-only, keeps level animation & growth bars) ── */
const SkillCard = ({ item, isDark, onExpand, isExpanded }) => {
  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: item.level,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [item.level]);

  const widthStyle = animatedWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%']
  });

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onExpand}
      style={tw`${isDark ? 'bg-[#06080F]' : 'bg-white'} ${isDark ? 'border-gray-700' : 'border-gray-200'} border rounded-3xl p-5 mb-4`}
    >
      <View style={tw`flex-row items-center justify-between mb-4`}>
        <View style={tw`flex-row items-center flex-1`}>
          <View style={[{ backgroundColor: item.dotColor }, tw`w-3 h-3 rounded-full mr-3`]} />
          <Text style={tw`${isDark ? 'text-white' : 'text-gray-900'} font-bold text-lg`}>{item.title}</Text>
        </View>
        <View style={tw`flex-row items-center`}>
          <View style={tw`${isDark ? 'bg-[#0F172A]' : 'bg-gray-100'} px-2.5 py-1 rounded-lg mr-2`}>
            <Text style={tw`text-xs font-bold text-gray-500`}>{item.lessons.length} lessons</Text>
          </View>
          <Feather name={isExpanded ? "chevron-up" : "chevron-down"} size={18} color="#6B7280" />
        </View>
      </View>

      <View style={tw`flex-row justify-between mb-2`}>
        <Text style={tw`text-gray-400 font-semibold`}>Level</Text>
        <Text style={[{ color: item.dotColor }, tw`font-bold`]}>{item.level}%</Text>
      </View>
      <View style={tw`h-2 ${isDark ? 'bg-[#0F172A]' : 'bg-gray-100'} rounded-full mb-4 overflow-hidden`}>
        <Animated.View style={[{ width: widthStyle, backgroundColor: item.dotColor }, tw`h-full rounded-full`]} />
      </View>
      <Text style={tw`text-gray-500 text-xs italic mb-4`}>{item.subtitle}</Text>
      <View style={tw`flex-row items-center h-8`}>
        <Feather name="trending-up" size={14} color="#6B7280" style={tw`mr-3`} />
        <Text style={tw`text-gray-500 font-semibold mr-4 text-xs`}>Growth</Text>
        <View style={tw`flex-row items-end flex-1 h-full max-w-[60%]`}>
          {item.bars.map((height, index) => (
            <View key={index} style={[{ height: `${height}%`, backgroundColor: item.dotColor }, tw`flex-1 mx-1 rounded-sm opacity-90`]} />
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
};

/* ── Video Lesson Card ── */
const VideoLessonCard = ({ lesson, index, isDark, accentColor, onPlay }) => {
  const cBg = isDark ? 'bg-[#0A0F1A]' : 'bg-gray-50';
  const cBorder = isDark ? 'border-gray-700/50' : 'border-gray-200';
  const tp = isDark ? 'text-white' : 'text-gray-900';
  const subText = isDark ? 'text-gray-400' : 'text-gray-500';
  const thumbBg = isDark ? 'bg-[#111827]' : 'bg-gray-200';

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onPlay(lesson)}
      style={tw`${cBg} ${cBorder} border rounded-2xl mb-3 overflow-hidden`}
    >
      {/* Video Thumbnail */}
      <View style={tw`${thumbBg} h-40 items-center justify-center relative`}>
        <View style={tw`absolute inset-0 bg-black/30`} />

        {/* Play button */}
        <View style={tw`w-14 h-14 rounded-full bg-white/20 items-center justify-center border-2 border-white/40`}>
          <Ionicons name="play" size={24} color="#FFFFFF" style={{ marginLeft: 2 }} />
        </View>

        {/* Duration badge */}
        <View style={tw`absolute bottom-3 right-3 bg-black/70 px-2.5 py-1 rounded-lg flex-row items-center`}>
          <Feather name="clock" size={11} color="#FFFFFF" />
          <Text style={tw`text-white text-xs font-semibold ml-1`}>{lesson.duration}</Text>
        </View>

        {/* Lesson number */}
        <View style={[tw`absolute top-3 left-3 px-3 py-1 rounded-lg`, { backgroundColor: accentColor + 'DD' }]}>
          <Text style={tw`text-white text-xs font-bold`}>Lesson {index + 1}</Text>
        </View>

        {/* Accent bar */}
        <View style={[tw`absolute bottom-0 left-0 right-0 h-1`, { backgroundColor: accentColor }]} />
      </View>

      {/* Info */}
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

export default function HVPScreen() {
  const { isDark } = useTheme();
  const cardBg = isDark ? 'bg-[#06080F]' : 'bg-white';
  const cardBorder = isDark ? 'border-gray-700' : 'border-gray-200';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const inputBg = isDark ? 'bg-[#0F172A]' : 'bg-gray-100';
  const modalBg = isDark ? 'bg-[#0F172A]' : 'bg-white';

  const { hvpSkills: skills } = useAuth();

  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);
  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);

  const averageScore = Math.round(skills.reduce((sum, skill) => sum + skill.level, 0) / (skills.length || 1));
  const totalLessons = skills.reduce((sum, s) => sum + s.lessons.length, 0);
  const completedLessons = skills.reduce((sum, s) => sum + s.lessons.filter(l => l.completed).length, 0);

  const animatedMainWidth = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(animatedMainWidth, {
      toValue: averageScore,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [averageScore]);

  const mainWidthStyle = animatedMainWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%']
  });

  const toggleSkill = (id: string) => {
    setExpandedSkill(expandedSkill === id ? null : id);
  };

  const handlePlayVideo = (lesson: any) => {
    setSelectedLesson(lesson);
    setVideoModalVisible(true);
  };

  return (
    <ScreenWrapper title="High Value Person">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`pb-8`}>
        {/* HVP Score Banner */}
        <View style={tw`${cardBg} ${cardBorder} border rounded-3xl p-6 mb-6 relative`}>
          <Text style={tw`${textPrimary} font-semibold mb-2`}>HVP Score</Text>
          <Text style={tw`text-[#10B981] text-4xl font-semibold tracking-tight mb-2`}>{averageScore}%</Text>
          <Text style={tw`text-gray-400 text-sm mb-4`}>Average across {skills.length} skills</Text>
          <TouchableOpacity style={tw`absolute top-6 right-6 ${inputBg} w-12 h-12 rounded-2xl items-center justify-center`}>
            <Ionicons name="disc-outline" size={24} color="#10B981" />
          </TouchableOpacity>
          <View style={tw`h-2 ${inputBg} rounded-full mt-2 overflow-hidden`}>
            <Animated.View style={[tw`h-full bg-[#10B981] rounded-full`, { width: mainWidthStyle }]} />
          </View>

          {/* Course stats row */}
          <View style={tw`flex-row mt-5`}>
            <View style={tw`items-center pr-6`}>
              <Text style={tw`${textPrimary} font-bold text-lg`}>{totalLessons}</Text>
              <Text style={tw`text-gray-500 text-xs`}>Lessons</Text>
            </View>
            <View style={tw`items-center px-6 border-l border-r ${cardBorder}`}>
              <Text style={tw`${textPrimary} font-bold text-lg`}>{completedLessons}</Text>
              <Text style={tw`text-gray-500 text-xs`}>Completed</Text>
            </View>
            <View style={tw`items-center pl-6`}>
              <Text style={tw`${textPrimary} font-bold text-lg`}>{Math.round((completedLessons / totalLessons) * 100)}%</Text>
              <Text style={tw`text-gray-500 text-xs`}>Progress</Text>
            </View>
          </View>
        </View>

        {/* Skill Cards with expandable video lessons */}
        {skills.map(skill => {
          const isExpanded = expandedSkill === skill.id;
          return (
            <View key={skill.id}>
              <SkillCard
                item={skill}
                isDark={isDark}
                onExpand={() => toggleSkill(skill.id)}
                isExpanded={isExpanded}
              />

              {/* Expandable Video Lessons List */}
              {isExpanded && (
                <View style={tw`ml-3 mb-4 -mt-2`}>
                  {skill.lessons.map((lesson, index) => (
                    <VideoLessonCard
                      key={lesson.id}
                      lesson={lesson}
                      index={index}
                      isDark={isDark}
                      accentColor={skill.dotColor}
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
              {/* Close */}
              <TouchableOpacity onPress={() => setVideoModalVisible(false)} style={tw`absolute top-4 right-4 w-9 h-9 bg-black/50 rounded-full items-center justify-center`}>
                <Feather name="x" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Lesson Info */}
            {selectedLesson && (
              <View style={tw`p-5 pb-10`}>
                <View style={tw`flex-row items-center mb-2`}>
                  <View style={tw`bg-[#10B981]/15 px-2.5 py-1 rounded-full mr-2`}>
                    <Text style={tw`text-[#10B981] text-xs font-bold`}>{selectedLesson.level}</Text>
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
