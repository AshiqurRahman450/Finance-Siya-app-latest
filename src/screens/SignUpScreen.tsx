import React, { useState } from 'react';
import {
  Text,
  TouchableOpacity,
  View,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import tw from 'twrnc';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';

export default function SignUpScreen({ navigation }) {
  const { isDark, toggleTheme } = useTheme();
  const { signUp, loading } = useAuth();

  // Registration states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Focus states for dynamic active highlights
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);

  // Stylings synchronized with the rest of the application
  const bgScreen = isDark ? 'bg-[#0B0F19]' : 'bg-[#F1F5F9]';
  const bgCard = isDark ? 'bg-[#06080F]' : 'bg-white';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-500';
  const borderCol = isDark ? 'border-gray-800' : 'border-gray-200';
  const inputBg = isDark ? 'bg-[#0F172A]' : 'bg-gray-50';

  const handleSignUp = async () => {
    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('Missing Fields', 'Please fill in all requested fields to create your account.');
      return;
    }

    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match. Please verify both inputs.');
      return;
    }

    try {
      await signUp(name, email, password);
      Alert.alert(
        'Success',
        'Account created successfully! Welcome to Finverse.',
        [{ text: 'Get Started', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Main' as never }] }) }]
      );
    } catch (err: any) {
      Alert.alert('Registration Failed', err.message || 'An error occurred during account creation.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={tw`flex-1 ${bgScreen}`}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`flex-grow justify-center px-6 py-10`}
      >
        {/* Floating Quick Theme Toggle */}
        <View style={tw`absolute top-12 right-6 z-10`}>
          <TouchableOpacity
            onPress={toggleTheme}
            style={[
              tw`w-10 h-10 rounded-full items-center justify-center border`,
              {
                backgroundColor: isDark ? '#1E293B' : '#E2E8F0',
                borderColor: isDark ? '#334155' : '#CBD5E1',
              },
            ]}
          >
            <Feather
              name={isDark ? 'sun' : 'moon'}
              size={18}
              color={isDark ? '#F59E0B' : '#4F46E5'}
            />
          </TouchableOpacity>
        </View>

        {/* Brand Identity Header */}
        <View style={tw`items-center mb-6 mt-6`}>
          <View
            style={[
              tw`w-14 h-14 rounded-2xl items-center justify-center mb-3 shadow-lg`,
              {
                backgroundColor: isDark ? '#2E1065' : '#EDE9FE',
                shadowColor: '#8B5CF6',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
              },
            ]}
          >
            <Ionicons name="diamond-outline" size={28} color="#8B5CF6" />
          </View>
          <Text style={tw`text-2xl font-extrabold tracking-tight ${textPrimary}`}>
            FINVERSE<Text style={tw`text-purple-500`}>.AI</Text>
          </Text>
          <Text style={tw`text-[10px] ${textSecondary} mt-0.5 font-semibold tracking-wider uppercase`}>
            Your Intelligent Wealth Companion
          </Text>
        </View>

        {/* Signup form Card */}
        <View
          style={tw`w-full max-w-sm mx-auto ${bgCard} border ${borderCol} rounded-3xl p-6 shadow-xl`}
        >
          <Text style={tw`text-lg font-bold mb-5 ${textPrimary}`}>Create Account</Text>

          {/* Full Name Input */}
          <View style={tw`mb-3.5`}>
            <Text style={tw`text-xs font-bold mb-1.5 uppercase ${textSecondary}`}>
              Full Name
            </Text>
            <View
              style={[
                tw`flex-row items-center border rounded-2xl px-4 ${inputBg}`,
                {
                  borderColor: nameFocused ? '#8B5CF6' : isDark ? '#1E293B' : '#E2E8F0',
                },
              ]}
            >
              <Feather
                name="user"
                size={18}
                color={nameFocused ? '#8B5CF6' : '#64748B'}
                style={tw`mr-3`}
              />
              <TextInput
                style={tw`flex-1 py-3 text-base font-medium ${textPrimary}`}
                placeholder="Alex Chen"
                placeholderTextColor={isDark ? '#475569' : '#94A3B8'}
                value={name}
                onChangeText={setName}
                onFocus={() => setNameFocused(true)}
                onBlur={() => setNameFocused(false)}
              />
            </View>
          </View>

          {/* Email Input */}
          <View style={tw`mb-3.5`}>
            <Text style={tw`text-xs font-bold mb-1.5 uppercase ${textSecondary}`}>
              Email Address
            </Text>
            <View
              style={[
                tw`flex-row items-center border rounded-2xl px-4 ${inputBg}`,
                {
                  borderColor: emailFocused ? '#8B5CF6' : isDark ? '#1E293B' : '#E2E8F0',
                },
              ]}
            >
              <Feather
                name="mail"
                size={18}
                color={emailFocused ? '#8B5CF6' : '#64748B'}
                style={tw`mr-3`}
              />
              <TextInput
                style={tw`flex-1 py-3 text-base font-medium ${textPrimary}`}
                placeholder="alex.chen@example.com"
                placeholderTextColor={isDark ? '#475569' : '#94A3B8'}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={tw`mb-3.5`}>
            <Text style={tw`text-xs font-bold mb-1.5 uppercase ${textSecondary}`}>
              Password
            </Text>
            <View
              style={[
                tw`flex-row items-center border rounded-2xl px-4 ${inputBg}`,
                {
                  borderColor: passwordFocused ? '#8B5CF6' : isDark ? '#1E293B' : '#E2E8F0',
                },
              ]}
            >
              <Feather
                name="lock"
                size={18}
                color={passwordFocused ? '#8B5CF6' : '#64748B'}
                style={tw`mr-3`}
              />
              <TextInput
                style={tw`flex-1 py-3 text-base font-medium ${textPrimary}`}
                placeholder="Min 6 characters"
                placeholderTextColor={isDark ? '#475569' : '#94A3B8'}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={tw`p-1`}
              >
                <Feather
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={18}
                  color="#64748B"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password Input */}
          <View style={tw`mb-6`}>
            <Text style={tw`text-xs font-bold mb-1.5 uppercase ${textSecondary}`}>
              Confirm Password
            </Text>
            <View
              style={[
                tw`flex-row items-center border rounded-2xl px-4 ${inputBg}`,
                {
                  borderColor: confirmFocused ? '#8B5CF6' : isDark ? '#1E293B' : '#E2E8F0',
                },
              ]}
            >
              <Feather
                name="lock"
                size={18}
                color={confirmFocused ? '#8B5CF6' : '#64748B'}
                style={tw`mr-3`}
              />
              <TextInput
                style={tw`flex-1 py-3 text-base font-medium ${textPrimary}`}
                placeholder="Re-enter password"
                placeholderTextColor={isDark ? '#475569' : '#94A3B8'}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                onFocus={() => setConfirmFocused(true)}
                onBlur={() => setConfirmFocused(false)}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={tw`p-1`}
              >
                <Feather
                  name={showConfirmPassword ? 'eye-off' : 'eye'}
                  size={18}
                  color="#64748B"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Sign Up CTA Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleSignUp}
            disabled={loading}
            style={[
              tw`w-full rounded-2xl py-4 items-center justify-center shadow-lg`,
              {
                backgroundColor: '#8B5CF6',
                shadowColor: '#8B5CF6',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
              },
            ]}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={tw`text-white font-extrabold text-base tracking-wide`}>
                Sign Up
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer Navigation back to Sign In */}
        <View style={tw`flex-row justify-center items-center mt-6`}>
          <Text style={tw`text-xs font-semibold ${textSecondary}`}>
            Already have an account?{' '}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={tw`text-xs font-extrabold text-purple-500`}>
              Sign In
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
