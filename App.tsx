import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { SiyaProvider } from './src/context/SiyaContext';
import { AuthProvider } from './src/context/AuthContext';

function AppContent() {
  const { isDark } = useTheme();
  return (
    <>
      <RootNavigator />
      <StatusBar style={isDark ? "light" : "dark"} />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <SiyaProvider>
            <AppContent />
          </SiyaProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}


