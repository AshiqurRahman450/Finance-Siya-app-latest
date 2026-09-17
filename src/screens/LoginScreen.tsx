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

export default function LoginScreen({ navigation }) {
  const { isDark, toggleTheme } = useTheme();
  const { login } = useAuth();

  // State values for standard credentials
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

  // Focus states for dynamic premium borders
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Stylings consistent with other screens
  const bgScreen = isDark ? 'bg-[#0B0F19]' : 'bg-[#F1F5F9]';
  const bgCard = isDark ? 'bg-[#06080F]' : 'bg-white';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-500';
  const borderCol = isDark ? 'border-gray-800' : 'border-gray-200';
  const inputBg = isDark ? 'bg-[#0F172A]' : 'bg-gray-50';

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert(
        'Missing Credentials',
        'Please enter your email and password to proceed.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Simple email validation
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.', [
        { text: 'OK' },
      ]);
      return;
    }

    try {
      const data = await login(email, password);
      if (data && data.user && data.user.role === 'admin') {
        navigation.reset({
          index: 0,
          routes: [{ name: 'AdminDashboard' as never }],
        });
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main' as never }],
        });
      }
    } catch (err: any) {
      Alert.alert(
        'Login Failed',
        err.message || 'Invalid email or password. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  // Quick helper to autofill dev credentials for convenience
  const autofillDevCredentials = () => {
    setEmail('alex.chen@example.com');
    setPassword('finance123');
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
        {/* Floating Quick Theme Toggle & Dev Helper */}
        <View style={tw`absolute top-12 right-6 flex-row items-center gap-3 z-10`}>
          {/* <TouchableOpacity
            onPress={autofillDevCredentials}
            style={[
              tw`px-3 py-1.5 rounded-full flex-row items-center border`,
              {
                backgroundColor: isDark ? '#1E293B' : '#E2E8F0',
                borderColor: isDark ? '#334155' : '#CBD5E1',
              },
            ]}
          >
            <Feather
              name="terminal"
              size={12}
              color={isDark ? '#10B981' : '#059669'}
              style={tw`mr-1`}
            />
            <Text
              style={tw`text-[10px] font-bold ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              Autofill
            </Text>
          </TouchableOpacity> */}

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

        {/* Brand/Identity Header */}
        <View style={tw`items-center mb-8 mt-6`}>
          <View
            style={[
              tw`w-16 h-16 rounded-3xl items-center justify-center mb-4 shadow-lg`,
              {
                backgroundColor: isDark ? '#2E1065' : '#EDE9FE',
                shadowColor: '#8B5CF6',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
              },
            ]}
          >
            <Ionicons name="diamond-outline" size={32} color="#8B5CF6" />
          </View>
          <Text style={tw`text-3xl font-extrabold tracking-tight ${textPrimary}`}>
            FINVERSE<Text style={tw`text-purple-500`}>.AI</Text>
          </Text>
          <Text style={tw`text-xs ${textSecondary} mt-1 font-semibold tracking-wider uppercase`}>
            Your Intelligent Wealth Companion
          </Text>
        </View>

        {/* Card containing inputs and buttons */}
        <View
          style={tw`w-full max-w-sm mx-auto ${bgCard} border ${borderCol} rounded-3xl p-6 shadow-xl`}
        >
          {/* Section title */}
          <Text style={tw`text-xl font-bold mb-6 ${textPrimary}`}>Sign In</Text>

          {/* Email Address Input */}
          <View style={tw`mb-4`}>
            <Text style={tw`text-xs font-bold mb-1.5 uppercase ${textSecondary}`}>
              Email Address
            </Text>
            <View
              style={[
                tw`flex-row items-center border rounded-2xl px-4 ${inputBg}`,
                {
                  borderColor: emailFocused
                    ? '#8B5CF6'
                    : isDark
                    ? '#1E293B'
                    : '#E2E8F0',
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
                style={tw`flex-1 py-3.5 text-base font-medium ${textPrimary}`}
                placeholder="email@example.com"
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
          <View style={tw`mb-5`}>
            <View style={tw`flex-row justify-between items-center mb-1.5`}>
              <Text style={tw`text-xs font-bold uppercase ${textSecondary}`}>
                Password
              </Text>
              <TouchableOpacity>
                <Text style={tw`text-xs font-bold text-purple-500`}>
                  Forgot Password?
                </Text>
              </TouchableOpacity>
            </View>
            <View
              style={[
                tw`flex-row items-center border rounded-2xl px-4 ${inputBg}`,
                {
                  borderColor: passwordFocused
                    ? '#8B5CF6'
                    : isDark
                    ? '#1E293B'
                    : '#E2E8F0',
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
                style={tw`flex-1 py-3.5 text-base font-medium ${textPrimary}`}
                placeholder="••••••••"
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

          {/* Remember Me Toggle */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setRememberMe(!rememberMe)}
            style={tw`flex-row items-center mb-6`}
          >
            <View
              style={[
                tw`w-5 h-5 rounded-md border items-center justify-center mr-2.5`,
                {
                  borderColor: rememberMe
                    ? '#8B5CF6'
                    : isDark
                    ? '#334155'
                    : '#CBD5E1',
                  backgroundColor: rememberMe ? '#8B5CF6' : 'transparent',
                },
              ]}
            >
              {rememberMe && <Ionicons name="checkmark" size={14} color="white" />}
            </View>
            <Text style={tw`text-xs font-semibold ${textSecondary}`}>
              Remember this device
            </Text>
          </TouchableOpacity>

          {/* Sign In CTA Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleLogin}
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
                Sign In
              </Text>
            )}
          </TouchableOpacity>

          {/* Quick Direct Bypass for convenience */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Main')}
            style={tw`mt-4 items-center`}
          >
            <Text style={tw`text-[11px] font-bold text-gray-500 uppercase tracking-widest`}>
              Bypass Secure Mode (Dev)
            </Text>
          </TouchableOpacity>

          {/* Divider line */}
          <View style={tw`flex-row items-center my-6`}>
            <View style={tw`flex-1 h-[1px] ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`} />
            <Text style={tw`mx-3 text-[10px] font-extrabold tracking-widest ${textSecondary} uppercase`}>
              Or Login With
            </Text>
            <View style={tw`flex-1 h-[1px] ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`} />
          </View>

          {/* Social Auth Mocks */}
          <View style={tw`flex-row justify-center gap-4`}>
            {/* Google Icon Button */}
            <TouchableOpacity
              style={[
                tw`w-12 h-12 rounded-xl items-center justify-center border ${inputBg}`,
                { borderColor: isDark ? '#1E293B' : '#E2E8F0' },
              ]}
            >
              <Ionicons name="logo-google" size={18} color={isDark ? '#F3F4F6' : '#4B5563'} />
            </TouchableOpacity>

            {/* Apple Icon Button */}
            <TouchableOpacity
              style={[
                tw`w-12 h-12 rounded-xl items-center justify-center border ${inputBg}`,
                { borderColor: isDark ? '#1E293B' : '#E2E8F0' },
              ]}
            >
              <Ionicons name="logo-apple" size={20} color={isDark ? '#F3F4F6' : '#4B5563'} />
            </TouchableOpacity>

            {/* Fingerprint / Biometric */}
            <TouchableOpacity
              style={[
                tw`w-12 h-12 rounded-xl items-center justify-center border ${inputBg}`,
                { borderColor: isDark ? '#1E293B' : '#E2E8F0' },
              ]}
            >
              <Ionicons name="finger-print-outline" size={20} color="#8B5CF6" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign Up Navigation / Footer */}
        <View style={tw`flex-row justify-center items-center mt-8`}>
          <Text style={tw`text-xs font-semibold ${textSecondary}`}>
            New to Finverse?{' '}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
            <Text style={tw`text-xs font-extrabold text-purple-500`}>
              Create Account
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

