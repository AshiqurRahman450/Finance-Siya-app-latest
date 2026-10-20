import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface AdData {
  id?: string;
  title: string;
  body: string;
  imageUrl: string;
  badgeText?: string;
  ctaText?: string;
  promoCode?: string;
  features?: string[];
  screen?: string;
}

interface AdModalContextType {
  isAdVisible: boolean;
  currentAd: AdData | null;
  showAdModal: (ad?: Partial<AdData>) => void;
  hideAdModal: () => void;
}

const AdModalContext = createContext<AdModalContextType | undefined>(undefined);

export const DEFAULT_AD: AdData = {
  id: 'PROMO_50',
  title: '🔥 Unlock Siya Pro: 50% Off Today!',
  body: 'Supercharge your path to financial freedom with AI auto-tracking, real-time waste analysis, and custom wealth blueprints.',
  imageUrl: 'https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?auto=format&fit=crop&w=900&q=80',
  badgeText: '⚡ LIMITED TIME OFFER',
  ctaText: 'Claim 50% Discount Now 🚀',
  promoCode: 'PRO50',
  features: [
    'Automate 35%+ monthly savings with AI',
    'Instant impulse purchase tester & blocker',
    '2x faster debt & liabilities elimination',
  ],
  screen: 'SmartCart',
};

export const AdModalProvider = ({ children }: { children: ReactNode }) => {
  const [isAdVisible, setIsAdVisible] = useState(false);
  const [currentAd, setCurrentAd] = useState<AdData | null>(null);

  const showAdModal = (ad?: Partial<AdData>) => {
    setCurrentAd({
      ...DEFAULT_AD,
      ...ad,
    });
    setIsAdVisible(true);
  };

  const hideAdModal = () => {
    setIsAdVisible(false);
  };

  return (
    <AdModalContext.Provider value={{ isAdVisible, currentAd, showAdModal, hideAdModal }}>
      {children}
    </AdModalContext.Provider>
  );
};

export const useAdModal = () => {
  const context = useContext(AdModalContext);
  if (!context) {
    throw new Error('useAdModal must be used within an AdModalProvider');
  }
  return context;
};
