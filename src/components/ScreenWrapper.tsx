import React from 'react';
import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import tw from 'twrnc';
import { useTheme } from '../theme/ThemeContext';

export const ScreenWrapper = ({ title, children, headerRight = null }) => {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();

  return (
    <View style={[tw`flex-1 items-center`, { backgroundColor: isDark ? '#0B0F19' : '#F1F5F9', paddingTop: insets.top }]}>
      <View style={tw`flex-1 w-full max-w-lg px-6 pt-4 pb-2`}>
        <View style={tw`flex-row justify-between items-center mb-6`}>
          <Text style={tw`text-2xl font-bold tracking-wide ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {title}
          </Text>
          {headerRight}
        </View>
        {children}
      </View>
    </View>
  );
};
