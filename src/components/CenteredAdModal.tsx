import React from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Dimensions,
} from 'react-native';
import tw from 'twrnc';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useAdModal } from '../context/AdModalContext';
import { useTheme } from '../theme/ThemeContext';
import { navigationRef } from '../navigation/RootNavigator';

const { width } = Dimensions.get('window');

export const CenteredAdModal: React.FC = () => {
  const { isAdVisible, currentAd, hideAdModal } = useAdModal();
  const { isDark } = useTheme() as any;

  if (!isAdVisible || !currentAd) return null;

  const handleActionPress = () => {
    hideAdModal();
    if (currentAd.screen && navigationRef.isReady()) {
      navigationRef.navigate(currentAd.screen as never);
    }
  };

  const cardBg = isDark ? '#0A0F1D' : '#FFFFFF';
  const cardBorder = isDark ? '#1E293B' : '#E2E8F0';
  const textPrimary = isDark ? '#FFFFFF' : '#0F172A';
  const textSecondary = isDark ? '#94A3B8' : '#64748B';
  const featureBg = isDark ? '#111827' : '#F8FAFC';

  return (
    <Modal
      visible={isAdVisible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={hideAdModal}
    >
      <TouchableWithoutFeedback onPress={hideAdModal}>
        <View style={tw`flex-1 justify-center items-center px-5 bg-black/75`}>
          <TouchableWithoutFeedback>
            <View
              style={[
                tw`w-full max-w-sm rounded-3xl overflow-hidden border shadow-2xl`,
                {
                  backgroundColor: cardBg,
                  borderColor: cardBorder,
                  maxHeight: Dimensions.get('window').height * 0.85,
                },
              ]}
            >
              {/* Photo Banner with Close & Badge Overlay */}
              <View style={tw`relative w-full h-44 bg-gray-900 overflow-hidden`}>
                <Image
                  source={{ uri: currentAd.imageUrl }}
                  style={tw`w-full h-full`}
                  resizeMode="cover"
                />

                {/* Subtle Gradient / Shadow over image */}
                <View style={tw`absolute inset-0 bg-black/25`} />

                {/* Top Promo Tag Badge */}
                {currentAd.badgeText && (
                  <View
                    style={tw`absolute top-3.5 left-3.5 bg-emerald-500/90 px-3 py-1 rounded-full shadow-md flex-row items-center`}
                  >
                    <Text style={tw`text-white text-xs font-extrabold tracking-wider uppercase`}>
                      {currentAd.badgeText}
                    </Text>
                  </View>
                )}

                {/* Close Button (X) */}
                <TouchableOpacity
                  onPress={hideAdModal}
                  activeOpacity={0.7}
                  style={tw`absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-black/50 items-center justify-center border border-white/20`}
                >
                  <Ionicons name="close" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {/* Scrollable Content Body */}
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={tw`p-5 pt-4 pb-5`}
              >
                {/* Headline */}
                <Text
                  style={[
                    tw`text-xl font-black mb-2 leading-6`,
                    { color: textPrimary },
                  ]}
                >
                  {currentAd.title}
                </Text>

                {/* Subtitle / Body Copy */}
                <Text
                  style={[
                    tw`text-sm font-medium mb-4 leading-5`,
                    { color: textSecondary },
                  ]}
                >
                  {currentAd.body}
                </Text>

                {/* Feature Bullet Points */}
                {currentAd.features && currentAd.features.length > 0 && (
                  <View style={tw`mb-4 gap-2`}>
                    {currentAd.features.map((feature, idx) => (
                      <View
                        key={idx}
                        style={[
                          tw`flex-row items-center p-2.5 rounded-xl border`,
                          {
                            backgroundColor: featureBg,
                            borderColor: isDark ? '#1F2937' : '#E2E8F0',
                          },
                        ]}
                      >
                        <View style={tw`w-5 h-5 rounded-full bg-emerald-500/20 items-center justify-center mr-2.5`}>
                          <Feather name="check" size={12} color="#10B981" />
                        </View>
                        <Text
                          style={[
                            tw`text-xs font-semibold flex-1`,
                            { color: textPrimary },
                          ]}
                        >
                          {feature}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Promo Code Pill (if present) */}
                {currentAd.promoCode && (
                  <View
                    style={[
                      tw`flex-row items-center justify-center py-2 px-3 rounded-xl border border-dashed mb-4`,
                      {
                        borderColor: '#10B981',
                        backgroundColor: isDark ? '#064E3B25' : '#ECFDF5',
                      },
                    ]}
                  >
                    <Ionicons name="pricetag-outline" size={14} color="#10B981" style={tw`mr-2`} />
                    <Text style={tw`text-xs font-bold text-emerald-500`}>
                      CODE: <Text style={tw`text-emerald-400 font-extrabold`}>{currentAd.promoCode}</Text> • Limited Slots
                    </Text>
                  </View>
                )}

                {/* Primary Call to Action Button */}
                <TouchableOpacity
                  onPress={handleActionPress}
                  activeOpacity={0.85}
                  style={tw`w-full py-3.5 rounded-2xl bg-emerald-500 items-center justify-center shadow-lg shadow-emerald-500/30 flex-row mb-2`}
                >
                  <Text style={tw`text-white font-extrabold text-base mr-2`}>
                    {currentAd.ctaText || 'Claim Offer Now 🚀'}
                  </Text>
                  <Feather name="arrow-right" size={18} color="#FFFFFF" />
                </TouchableOpacity>

                {/* Dismiss Link */}
                <TouchableOpacity
                  onPress={hideAdModal}
                  activeOpacity={0.7}
                  style={tw`py-1.5 items-center justify-center`}
                >
                  <Text style={[tw`text-xs font-semibold`, { color: textSecondary }]}>
                    No thanks, maybe later
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};
