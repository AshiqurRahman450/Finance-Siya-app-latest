import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import LeverageScreen from '../screens/LeverageScreen';
import HVPScreen from '../screens/HVPScreen';
import DebtScreen from '../screens/DebtScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { useTheme } from '../theme/ThemeContext';
import tw from 'twrnc';

const Tab = createBottomTabNavigator();

const AnimatedTabIcon = ({ focused, color, size, routeName }) => {
  const animatedValue = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: focused ? 1 : 0,
      useNativeDriver: true,
      friction: 5,
      tension: 100,
    }).start();
  }, [focused]);

  let iconName = 'grid-outline';
  let filledIconName = 'grid';
  
  if (routeName === 'Dashboard') { iconName = 'grid-outline'; filledIconName = 'grid'; }
  else if (routeName === 'Lab') { iconName = 'beaker-outline'; filledIconName = 'beaker'; }
  else if (routeName === 'HVP') { iconName = 'analytics-outline'; filledIconName = 'analytics'; }
  else if (routeName === 'Debt') { iconName = 'card-outline'; filledIconName = 'card'; }
  else if (routeName === 'You') { iconName = 'person-outline'; filledIconName = 'person'; }

  const scale = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.15]
  });

  const pillOpacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.2]
  });

  const pillScale = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1]
  });

  return (
    <View style={tw`items-center justify-center w-16 h-8 mt-1`}>
      {/* Pill Background */}
      <Animated.View style={[
        tw`absolute bg-[#10B981] rounded-2xl`,
        { 
          height: 32, 
          width: 56,
          opacity: pillOpacity,
          transform: [{ scale: pillScale }]
        }
      ]} />
      {/* Icon */}
      <Animated.View style={{ transform: [{ scale }] }}>
        <Ionicons name={focused ? filledIconName : iconName} size={size} color={color} />
      </Animated.View>
    </View>
  );
};

export default function MainTabNavigator() {
  const { isDark } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => (
          <AnimatedTabIcon focused={focused} color={color} size={size} routeName={route.name} />
        ),
        tabBarActiveTintColor: '#10B981',
        tabBarInactiveTintColor: isDark ? '#4B5563' : '#6B7280',
        tabBarStyle: {
          backgroundColor: isDark ? '#0B0F19' : '#FFFFFF',
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          paddingBottom: 5,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500'
        }
      })}
    >
      <Tab.Screen name="Dashboard" component={HomeScreen} />
      <Tab.Screen name="Lab" component={LeverageScreen} />
      <Tab.Screen name="HVP" component={HVPScreen} />
      <Tab.Screen name="Debt" component={DebtScreen} />
      <Tab.Screen name="You" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
