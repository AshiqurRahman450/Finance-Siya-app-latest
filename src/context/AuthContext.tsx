import React, { createContext, useState, useContext, useEffect } from 'react';
import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { api, setAuthToken } from '../services/api';

const USER_STORAGE_PATH = `${FileSystem.documentDirectory}user_profile.json`;

const DEFAULT_USER = {
  id: 'user_1',
  name: 'Alex Chen',
  email: 'alex.chen@example.com',
  phone: '',
  avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d'
};

const mergeUserObjects = (existing: any, incoming: any) => {
  if (!incoming && !existing) return DEFAULT_USER;
  const base = existing || DEFAULT_USER;
  const inc = incoming || {};
  return {
    ...DEFAULT_USER,
    ...base,
    ...inc,
    phone: (inc.phone && String(inc.phone).trim().length > 0)
      ? String(inc.phone).trim()
      : (base.phone && String(base.phone).trim().length > 0 ? String(base.phone).trim() : ''),
    avatar: (inc.avatar && String(inc.avatar).trim().length > 0)
      ? String(inc.avatar).trim()
      : (base.avatar && String(base.avatar).trim().length > 0 ? String(base.avatar).trim() : DEFAULT_USER.avatar),
    name: (inc.name && String(inc.name).trim().length > 0)
      ? String(inc.name).trim()
      : (base.name && String(base.name).trim().length > 0 ? String(base.name).trim() : DEFAULT_USER.name),
  };
};

interface AuthContextType {
  user: any;
  token: string | null;
  loading: boolean;
  transactions: any[];
  assets: any[];
  debts: any[];
  audits: any[];
  savings: any[];
  leverageLessons: any[];
  hvpSkills: any[];
  incomeSources: any[];
  survivalSpending: any;
  login: (email: string, password: string) => Promise<any>;
  signUp: (name: string, email: string, password: string) => Promise<any>;
  logout: () => void;
  syncData: () => Promise<void>;
  
  // CRUD state bindings
  addTransaction: (tx: any) => Promise<void>;
  updateTransactionState: (id: string, tx: any) => Promise<void>;
  deleteTransactionState: (id: string) => Promise<void>;
  
  addAsset: (asset: any) => Promise<void>;
  updateAssetState: (id: string, asset: any) => Promise<void>;
  deleteAssetState: (id: string) => Promise<void>;
  
  addDebt: (debt: any) => Promise<void>;
  updateDebtState: (id: string, debt: any) => Promise<void>;
  deleteDebtState: (id: string) => Promise<void>;
  
  addAuditState: (audit: any) => Promise<void>;
  clearAuditsState: () => Promise<void>;
  
  addSavings: (savings: any) => Promise<void>;
  updateSavingsState: (id: string, savings: any) => Promise<void>;
  deleteSavingsState: (id: string) => Promise<void>;

  addLeverageLesson: (lesson: any) => Promise<void>;
  updateLeverageLessonState: (id: string, lesson: any) => Promise<void>;
  deleteLeverageLessonState: (id: string) => Promise<void>;

  addHVPSkill: (skill: any) => Promise<void>;
  updateHVPSkillState: (id: string, skill: any) => Promise<void>;
  deleteHVPSkillState: (id: string) => Promise<void>;
  uploadVideo: (formData: FormData) => Promise<any>;
  
  saveIncomeSourceState: (source: any) => Promise<void>;
  deleteIncomeSourceState: (id: string) => Promise<void>;
  saveSurvivalSpendingState: (spending: any) => Promise<void>;
  updateUserProfile: (profileData: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(DEFAULT_USER);
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  
  // Persistent Storage Helper
  const persistUserProfile = async (userData: any) => {
    try {
      if (userData) {
        await FileSystem.writeAsStringAsync(USER_STORAGE_PATH, JSON.stringify(userData));
      }
    } catch (err) {
      console.warn('Failed to save profile to disk:', err);
    }
  };

  // Load saved profile on app launch / reload
  useEffect(() => {
    const loadSavedUser = async () => {
      try {
        const fileInfo = await FileSystem.getInfoAsync(USER_STORAGE_PATH);
        if (fileInfo.exists) {
          const content = await FileSystem.readAsStringAsync(USER_STORAGE_PATH);
          if (content) {
            const savedUser = JSON.parse(content);
            if (savedUser && typeof savedUser === 'object') {
              setUser((prev: any) => mergeUserObjects(prev, savedUser));
            }
          }
        }
      } catch (err) {
        console.warn('Failed to load saved user profile:', err);
      }
    };
    loadSavedUser();
  }, []);

  // Centralized reactive states matching Node/Express tables
  const [transactions, setTransactions] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [debts, setDebts] = useState<any[]>([]);
  const [audits, setAudits] = useState<any[]>([]);
  const [savings, setSavings] = useState<any[]>([]);
  const [leverageLessons, setLeverageLessons] = useState<any[]>([]);
  const [hvpSkills, setHvpSkills] = useState<any[]>([]);
  const [incomeSources, setIncomeSources] = useState<any[]>([]);
  const [survivalSpending, setSurvivalSpending] = useState<any>(null);

  const syncData = async () => {
    try {
      const data = await api.getAllData();
      if (data.user) {
        setUser((prev: any) => {
          const merged = mergeUserObjects(prev, data.user);
          persistUserProfile(merged);
          return merged;
        });
      }
      setTransactions(data.transactions || []);
      setAssets(data.assets || []);
      setDebts(data.debts || []);
      setAudits(data.audits || []);
      setSavings(data.savings || []);
      setLeverageLessons(data.lessons || []);
      setHvpSkills(data.skills || []);
      setIncomeSources(data.incomeSources || []);
      setSurvivalSpending(data.survivalSpending || null);
    } catch (err) {
      console.error('Failed to sync financial data from backend:', err);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const data = await api.login({ email, password });
      setTokenState(data.token);
      setUser(data.user);
      await persistUserProfile(data.user);
      setAuthToken(data.token);
      
      // Auto sync all page data on successful login
      const initialData = await api.getAllData();
      setTransactions(initialData.transactions || []);
      setAssets(initialData.assets || []);
      setDebts(initialData.debts || []);
      setAudits(initialData.audits || []);
      setSavings(initialData.savings || []);
      setLeverageLessons(initialData.lessons || []);
      setHvpSkills(initialData.skills || []);
      setIncomeSources(initialData.incomeSources || []);
      setSurvivalSpending(initialData.survivalSpending || null);
      
      return data;
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      const data = await api.signUp({ name, email, password });
      setTokenState(data.token);
      setUser(data.user);
      await persistUserProfile(data.user);
      setAuthToken(data.token);
      
      // Auto sync (new user has empty datasets)
      setTransactions([]);
      setAssets([]);
      setDebts([]);
      setAudits([]);
      setSavings([]);
      setLeverageLessons([]);
      setHvpSkills([]);
      setIncomeSources([]);
      setSurvivalSpending(null);
      
      return data;
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setTokenState(null);
    setUser(null);
    setAuthToken('');
    setTransactions([]);
    setAssets([]);
    setDebts([]);
    setAudits([]);
    setSavings([]);
    setLeverageLessons([]);
    setHvpSkills([]);
    setIncomeSources([]);
    setSurvivalSpending(null);
  };

  // ── Transactions Backend Sync operations ──
  const addTransaction = async (txData: any) => {
    const totalDailyLimit = (incomeSources || []).reduce((sum, src) => sum + src.spendLimit, 0);
    if (txData.type === 'expense' && totalDailyLimit > 0 && txData.amount > totalDailyLimit) {
      Alert.alert(
        'Daily Limit Exceeded',
        `Transaction blocked! The amount ₹${txData.amount.toLocaleString()} exceeds your configured total daily spend limit of ₹${totalDailyLimit.toLocaleString()}. Please increase your income sources or adjust your transaction amount.`
      );
      throw new Error('Daily spend limit exceeded.');
    }

    try {
      const newTx = await api.createTransaction(txData);
      setTransactions(prev => [newTx, ...prev]);
    } catch (err) {
      console.error('Failed to create transaction on server:', err);
      throw err;
    }
  };

  const updateTransactionState = async (id: string, txData: any) => {
    const totalDailyLimit = (incomeSources || []).reduce((sum, src) => sum + src.spendLimit, 0);
    if (txData.type === 'expense' && totalDailyLimit > 0 && txData.amount > totalDailyLimit) {
      Alert.alert(
        'Daily Limit Exceeded',
        `Transaction blocked! The amount ₹${txData.amount.toLocaleString()} exceeds your configured total daily spend limit of ₹${totalDailyLimit.toLocaleString()}. Please increase your income sources or adjust your transaction amount.`
      );
      throw new Error('Daily spend limit exceeded.');
    }

    try {
      const updatedTx = await api.updateTransaction(id, txData);
      setTransactions(prev => prev.map(t => t.id === id ? updatedTx : t));
    } catch (err) {
      console.error('Failed to update transaction on server:', err);
      throw err;
    }
  };

  const deleteTransactionState = async (id: string) => {
    try {
      await api.deleteTransaction(id);
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error('Failed to delete transaction on server:', err);
      throw err;
    }
  };

  // ── Assets Backend Sync operations ──
  const addAsset = async (assetData: any) => {
    try {
      const newAsset = await api.createAsset(assetData);
      setAssets(prev => [...prev, newAsset]);
    } catch (err) {
      console.error('Failed to create asset on server:', err);
      throw err;
    }
  };

  const updateAssetState = async (id: string, assetData: any) => {
    try {
      const updatedAsset = await api.updateAsset(id, assetData);
      setAssets(prev => prev.map(a => a.id === id ? updatedAsset : a));
    } catch (err) {
      console.error('Failed to update asset on server:', err);
      throw err;
    }
  };

  const deleteAssetState = async (id: string) => {
    try {
      await api.deleteAsset(id);
      setAssets(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.error('Failed to delete asset on server:', err);
      throw err;
    }
  };

  // ── Debts Backend Sync operations ──
  const addDebt = async (debtData: any) => {
    try {
      const newDebt = await api.createDebt(debtData);
      setDebts(prev => [...prev, newDebt]);
    } catch (err) {
      console.error('Failed to create debt on server:', err);
      throw err;
    }
  };

  const updateDebtState = async (id: string, debtData: any) => {
    try {
      const updatedDebt = await api.updateDebt(id, debtData);
      setDebts(prev => prev.map(d => d.id === id ? updatedDebt : d));
    } catch (err) {
      console.error('Failed to update debt on server:', err);
      throw err;
    }
  };

  const deleteDebtState = async (id: string) => {
    try {
      await api.deleteDebt(id);
      setDebts(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      console.error('Failed to delete debt on server:', err);
      throw err;
    }
  };

  // ── Audits Backend Sync operations ──
  const addAuditState = async (auditData: any) => {
    try {
      const newAudit = await api.createAudit(auditData);
      setAudits(prev => [newAudit, ...prev]);
    } catch (err) {
      console.error('Failed to save audit on server:', err);
      throw err;
    }
  };

  const clearAuditsState = async () => {
    try {
      await api.clearAudits();
      setAudits([]);
    } catch (err) {
      console.error('Failed to clear audits on server:', err);
      throw err;
    }
  };

  // ── Savings Goals Backend Sync operations ──
  const addSavings = async (savingsData: any) => {
    try {
      const newGoal = await api.createSavings(savingsData);
      setSavings(prev => [newGoal, ...prev]);
    } catch (err) {
      console.error('Failed to create savings goal on server:', err);
      throw err;
    }
  };

  const updateSavingsState = async (id: string, savingsData: any) => {
    try {
      const updatedGoal = await api.updateSavings(id, savingsData);
      setSavings(prev => prev.map(s => s.id === id ? updatedGoal : s));
    } catch (err) {
      console.error('Failed to update savings goal on server:', err);
      throw err;
    }
  };

  const deleteSavingsState = async (id: string) => {
    try {
      await api.deleteSavings(id);
      setSavings(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error('Failed to delete savings goal on server:', err);
      throw err;
    }
  };

  // ── Leverage Lab Lessons Backend Sync operations ──
  const addLeverageLesson = async (lessonData: any) => {
    try {
      const newLesson = await api.createLesson(lessonData);
      setLeverageLessons(prev => [...prev, newLesson]);
    } catch (err) {
      console.error('Failed to create leverage lesson on server:', err);
      throw err;
    }
  };

  const updateLeverageLessonState = async (id: string, lessonData: any) => {
    try {
      const updatedLesson = await api.updateLesson(id, lessonData);
      setLeverageLessons(prev => prev.map(l => l.id === id ? updatedLesson : l));
    } catch (err) {
      console.error('Failed to update leverage lesson on server:', err);
      throw err;
    }
  };

  const deleteLeverageLessonState = async (id: string) => {
    try {
      await api.deleteLesson(id);
      setLeverageLessons(prev => prev.filter(l => l.id !== id));
    } catch (err) {
      console.error('Failed to delete leverage lesson on server:', err);
      throw err;
    }
  };

  // ── HVP Skills Backend Sync operations ──
  const addHVPSkill = async (skillData: any) => {
    try {
      const newSkill = await api.createSkill(skillData);
      setHvpSkills(prev => [...prev, newSkill]);
    } catch (err) {
      console.error('Failed to create HVP skill on server:', err);
      throw err;
    }
  };

  const updateHVPSkillState = async (id: string, skillData: any) => {
    try {
      const updatedSkill = await api.updateSkill(id, skillData);
      setHvpSkills(prev => prev.map(s => s.id === id ? updatedSkill : s));
    } catch (err) {
      console.error('Failed to update HVP skill on server:', err);
      throw err;
    }
  };

  const deleteHVPSkillState = async (id: string) => {
    try {
      await api.deleteSkill(id);
      setHvpSkills(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error('Failed to delete HVP skill on server:', err);
      throw err;
    }
  };
  
  const uploadVideo = async (formData: FormData) => {
    try {
      return await api.uploadVideo(formData);
    } catch (err) {
      console.error('Failed to upload video to server:', err);
      throw err;
    }
  };

  const saveIncomeSourceState = async (sourceData: any) => {
    try {
      const newSource = await api.saveIncomeSource(sourceData);
      setIncomeSources(prev => {
        const exists = prev.some(s => s.type === newSource.type);
        if (exists) {
          return prev.map(s => s.type === newSource.type ? newSource : s);
        }
        return [newSource, ...prev];
      });
    } catch (err) {
      console.error('Failed to save income source on server:', err);
      throw err;
    }
  };

  const deleteIncomeSourceState = async (id: string) => {
    try {
      await api.deleteIncomeSource(id);
      setIncomeSources(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error('Failed to delete income source on server:', err);
      throw err;
    }
  };

  const saveSurvivalSpendingState = async (spendingData: any) => {
    try {
      const updatedSpending = await api.saveSurvivalSpending(spendingData);
      setSurvivalSpending(updatedSpending);
    } catch (err) {
      console.error('Failed to save survival spending on server:', err);
      throw err;
    }
  };

  const updateUserProfile = async (profileData: any) => {
    let updatedUser: any = null;
    try {
      const res = await api.updateProfile(profileData);
      const serverUser = res?.user || res || {};
      updatedUser = mergeUserObjects(user, { ...serverUser, ...profileData });
    } catch (err) {
      console.warn('Backend updateProfile failed, updating local state:', err);
      updatedUser = mergeUserObjects(user, profileData);
    }
    setUser(updatedUser);
    await persistUserProfile(updatedUser);
  };

  return (
    <AuthContext.Provider value={{
      user, token, loading, transactions, assets, debts, audits, savings,
      leverageLessons, hvpSkills, incomeSources, survivalSpending,
      login, signUp, logout, syncData,
      addTransaction, updateTransactionState, deleteTransactionState,
      addAsset, updateAssetState, deleteAssetState,
      addDebt, updateDebtState, deleteDebtState,
      addAuditState, clearAuditsState,
      addSavings, updateSavingsState, deleteSavingsState,
      addLeverageLesson, updateLeverageLessonState, deleteLeverageLessonState,
      addHVPSkill, updateHVPSkillState, deleteHVPSkillState,
      uploadVideo,
      saveIncomeSourceState, deleteIncomeSourceState, saveSurvivalSpendingState,
      updateUserProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
