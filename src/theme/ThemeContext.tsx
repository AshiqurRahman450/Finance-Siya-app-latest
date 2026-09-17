import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import tw from 'twrnc';

const CURRENCIES = [
  { key: 'USD', symbol: '$', label: 'US Dollar', flag: '🇺🇸' },
  { key: 'INR', symbol: '₹', label: 'Indian Rupee', flag: '🇮🇳' },
  { key: 'EUR', symbol: '€', label: 'Euro', flag: '🇪🇺' },
  { key: 'GBP', symbol: '£', label: 'British Pound', flag: '🇬🇧' },
  { key: 'JPY', symbol: '¥', label: 'Japanese Yen', flag: '🇯🇵' },
  { key: 'AUD', symbol: 'A$', label: 'Australian Dollar', flag: '🇦🇺' },
  { key: 'CAD', symbol: 'C$', label: 'Canadian Dollar', flag: '🇨🇦' },
  { key: 'AED', symbol: 'د.إ', label: 'UAE Dirham', flag: '🇦🇪' },
];

const ThemeContext = createContext({});

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [theme, setTheme] = useState(systemColorScheme || 'dark');
  const [currency, setCurrency] = useState('INR');

  useEffect(() => {
    tw.setColorScheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const setMode = (mode) => {
    setTheme(mode);
  };

  const getCurrencyInfo = () => CURRENCIES.find(c => c.key === currency) || CURRENCIES[0];

  const formatCurrency = (amount) => {
    const info = getCurrencyInfo();
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return `${info.symbol}0`;
    return `${info.symbol}${num.toLocaleString()}`;
  };

  return (
    <ThemeContext.Provider value={{
      theme, toggleTheme, setMode, isDark: theme === 'dark',
      currency, setCurrency, getCurrencyInfo, formatCurrency,
      currencies: CURRENCIES,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
