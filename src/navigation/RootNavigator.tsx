import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainTabNavigator from './MainTabNavigator';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import SmartCartScreen from '../screens/SmartCartScreen';
import SettingsScreen from '../screens/SettingsScreen';
import SiyaScreen from '../screens/SiyaScreen';
import AssetsScreen from '../screens/AssetsScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import PassiveVSDebtScreen from '../screens/PassiveVSDebtScreen';
import IncomeSourceScreen from '../screens/IncomeSourceScreen';
import SurvivalScreen from '../screens/SurvivalScreen';
import EditProfileScreen from '../screens/EditProfileScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="Main" component={MainTabNavigator} />
        <Stack.Screen name="SmartCart" component={SmartCartScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Siya" component={SiyaScreen} />
        <Stack.Screen name="Assets" component={AssetsScreen} />
        <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
        <Stack.Screen name="PassiveVSDebt" component={PassiveVSDebtScreen} />
        <Stack.Screen name="IncomeSource" component={IncomeSourceScreen} />
        <Stack.Screen name="Survival" component={SurvivalScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

