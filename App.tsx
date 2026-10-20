import React, { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync, scheduleDailyNotifications } from './src/services/NotificationService';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { SiyaProvider } from './src/context/SiyaContext';
import { AuthProvider } from './src/context/AuthContext';

import { AdModalProvider, useAdModal } from './src/context/AdModalContext';
import { CenteredAdModal } from './src/components/CenteredAdModal';

function AppContent() {
  const { isDark } = useTheme();
  const { showAdModal } = useAdModal();
  const lastNotificationResponse = Notifications.useLastNotificationResponse();

  // Handle cold-start launch from outside-app notification tap
  useEffect(() => {
    if (lastNotificationResponse) {
      const data = lastNotificationResponse.notification.request.content.data as any;
      if (data?.type === 'advertisement') {
        showAdModal({
          title: data.title,
          body: data.body,
          imageUrl: data.imageUrl,
          badgeText: data.badgeText,
          ctaText: data.ctaText,
          promoCode: data.promoCode,
          features: data.features,
          screen: data.screen,
        });
      }
    }
  }, [lastNotificationResponse]);

  // Handle foreground/background notification tap while app is already in memory
  useEffect(() => {
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as any;
      if (data?.type === 'advertisement') {
        showAdModal({
          title: data.title,
          body: data.body,
          imageUrl: data.imageUrl,
          badgeText: data.badgeText,
          ctaText: data.ctaText,
          promoCode: data.promoCode,
          features: data.features,
          screen: data.screen,
        });
      }
    });

    return () => {
      responseSubscription.remove();
    };
  }, []);

  return (
    <>
      <RootNavigator />
      <CenteredAdModal />
      <StatusBar style={isDark ? "light" : "dark"} />
    </>
  );
}

export default function App() {
  useEffect(() => {
    async function setupNotifications() {
      await registerForPushNotificationsAsync();
      await scheduleDailyNotifications();
    }
    setupNotifications();
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <SiyaProvider>
            <AdModalProvider>
              <AppContent />
            </AdModalProvider>
          </SiyaProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}


