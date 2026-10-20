import * as Device from 'expo-device';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

// Set how notifications are handled when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
});

/**
 * High-converting Advertisement & Promotional Notification templates with Photos
 */
export const ADVERTISEMENT_NOTIFICATIONS = [
  {
    title: "🔥 Special Wealth Offer: 50% Off Siya Pro! 🚀",
    body: "Automate your savings & crush debt 2x faster with Siya AI. Limited time promotion — tap to claim your deal!",
    imageUrl: "https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?auto=format&fit=crop&w=900&q=80",
    badgeText: "⚡ 50% OFF TODAY",
    ctaText: "Claim 50% Discount 🚀",
    promoCode: "PRO50",
    features: [
      "Automate 35%+ monthly savings with AI",
      "Instant impulse purchase tester & blocker",
      "2x faster debt & liabilities elimination",
    ],
    screen: "SmartCart",
  },
  {
    title: "💰 Exclusive Deal: Double Your Passive Income 📈",
    body: "Turn everyday spare change into high-yield passive assets. See how Siya AI accelerates your wealth!",
    imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=900&q=80",
    badgeText: "📈 WEALTH MULTIPLIER",
    ctaText: "Explore Passive Wealth 💰",
    promoCode: "PASSIVE",
    features: [
      "Targeted passive income vs debt calculator",
      "Real-time asset dividend simulation",
      "Custom investment allocation matrix",
    ],
    screen: "PassiveVSDebt",
  },
  {
    title: "⚡ Flash Alert: Save $450+ On Monthly Expenses 💸",
    body: "Smart Cart just discovered new ways for you to cut expenses. Tap to check your personalized savings!",
    imageUrl: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=900&q=80",
    badgeText: "💸 EXPENSE REDUCTION",
    ctaText: "View Smart Cart Savings 🛒",
    promoCode: "SMART450",
    features: [
      "48-hour impulse buying protection guard",
      "AI necessity score & waste detector",
      "Automated spending leak alerts",
    ],
    screen: "SmartCart",
  },
  {
    title: "🎁 Limited Time: Free Financial Health Audit! ✨",
    body: "Siya AI prepared a complimentary debt & liability review for your account. Tap to open and review!",
    imageUrl: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=900&q=80",
    badgeText: "✨ FREE AUDIT",
    ctaText: "Start Free Audit 🎁",
    promoCode: "AUDITFREE",
    features: [
      "Full liability interest payoff accelerator",
      "Hidden debt cost breakdown",
      "Personalized debt-free roadmap",
    ],
    screen: "LiabilitiesAccelerator",
  },
];

export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    // 1. General notifications channel
    await Notifications.setNotificationChannelAsync('default', {
      name: 'General Updates',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: 'default',
      enableVibrate: true,
      enableLights: true,
      showBadge: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });

    // 2. High-priority Advertisement & Promotional Pop-up channel (Heads-up banner outside app)
    await Notifications.setNotificationChannelAsync('advertisements', {
      name: 'Promotions & Special Deals',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 300, 200, 300],
      lightColor: '#10B981',
      sound: 'default',
      enableVibrate: true,
      enableLights: true,
      showBadge: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: false,
      description: 'Instant promotional pop-ups, wealth deals, and financial recommendations',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    console.log('Failed to get push token for push notification!');
    return;
  }

  if (Device.isDevice) {
    // To send push notifications using Expo's push service, uncomment below and add your projectId
    // token = (await Notifications.getExpoPushTokenAsync({ projectId: 'your-project-id' })).data;
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}

/**
 * Triggers a high-priority advertisement notification designed to pop up as a heads-up
 * banner outside the app (e.g. on home screen, over other apps, or on lock screen) with rich photos.
 * @param delaySeconds Time in seconds to wait before the ad pops up (default: 4s)
 * @param adIndex Optional index to pick a specific advertisement template
 */
export async function triggerAdPopUpNotification(delaySeconds: number = 4, adIndex?: number) {
  try {
    const list = ADVERTISEMENT_NOTIFICATIONS;
    const selectedAd = (adIndex !== undefined && list[adIndex])
      ? list[adIndex]
      : list[Math.floor(Math.random() * list.length)];

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: selectedAd.title,
        body: selectedAd.body,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.MAX,
        vibrate: [0, 300, 200, 300],
        badge: 1,
        attachments: selectedAd.imageUrl ? [{ url: selectedAd.imageUrl, identifier: 'ad-photo' }] : undefined,
        data: {
          screen: selectedAd.screen,
          type: 'advertisement',
          title: selectedAd.title,
          body: selectedAd.body,
          imageUrl: selectedAd.imageUrl,
          badgeText: selectedAd.badgeText,
          ctaText: selectedAd.ctaText,
          promoCode: selectedAd.promoCode,
          features: selectedAd.features,
        },
      },
      trigger: {
        seconds: Math.max(1, delaySeconds),
        channelId: 'advertisements',
      },
    });

    return notificationId;
  } catch (error) {
    console.error("Error triggering advertisement notification:", error);
    return null;
  }
}

export async function scheduleDailyNotifications() {
  try {
    // Cancel all previously scheduled notifications to avoid duplicates
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Morning notification (9:00 AM)
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Good Morning! ☀️",
        body: "Start your day right by checking your financial goals in Siya.",
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
        vibrate: [0, 250, 250, 250],
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 9,
        minute: 0,
        channelId: 'default',
      },
    });

    // Late Morning notification (11:00 AM)
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Mid-Day Check-in 📈",
        body: "Keep up the good work! Have you tracked your morning expenses?",
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
        vibrate: [0, 250, 250, 250],
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 11,
        minute: 0,
        channelId: 'default',
      },
    });

    // Afternoon Promotional Advertisement Pop-up (1:30 PM)
    const ad1 = ADVERTISEMENT_NOTIFICATIONS[0];
    await Notifications.scheduleNotificationAsync({
      content: {
        title: ad1.title,
        body: ad1.body,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.MAX,
        vibrate: [0, 300, 200, 300],
        badge: 1,
        attachments: ad1.imageUrl ? [{ url: ad1.imageUrl, identifier: 'ad-photo' }] : undefined,
        data: {
          screen: ad1.screen,
          type: 'advertisement',
          title: ad1.title,
          body: ad1.body,
          imageUrl: ad1.imageUrl,
          badgeText: ad1.badgeText,
          ctaText: ad1.ctaText,
          promoCode: ad1.promoCode,
          features: ad1.features,
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 13,
        minute: 30,
        channelId: 'advertisements',
      },
    });

    // Afternoon notification (4:00 PM)
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Afternoon Update ☕",
        body: "Time for a quick review. Stay on top of your financial goals!",
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
        vibrate: [0, 250, 250, 250],
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 16,
        minute: 0,
        channelId: 'default',
      },
    });

    // Evening notification (6:00 PM)
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Good Evening! 🌇",
        body: "Take a moment to review your daily expenses.",
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
        vibrate: [0, 250, 250, 250],
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 18,
        minute: 0,
        channelId: 'default',
      },
    });

    // Evening Promotional Advertisement Pop-up (7:30 PM)
    const ad2 = ADVERTISEMENT_NOTIFICATIONS[1];
    await Notifications.scheduleNotificationAsync({
      content: {
        title: ad2.title,
        body: ad2.body,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.MAX,
        vibrate: [0, 300, 200, 300],
        badge: 1,
        attachments: ad2.imageUrl ? [{ url: ad2.imageUrl, identifier: 'ad-photo' }] : undefined,
        data: {
          screen: ad2.screen,
          type: 'advertisement',
          title: ad2.title,
          body: ad2.body,
          imageUrl: ad2.imageUrl,
          badgeText: ad2.badgeText,
          ctaText: ad2.ctaText,
          promoCode: ad2.promoCode,
          features: ad2.features,
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 19,
        minute: 30,
        channelId: 'advertisements',
      },
    });

    // Night notification (9:00 PM)
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Good Night! 🌙",
        body: "Log your final transactions before you sleep.",
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
        vibrate: [0, 250, 250, 250],
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 21,
        minute: 0,
        channelId: 'default',
      },
    });
  } catch (error) {
    console.error("Error scheduling notifications:", error);
  }
}

