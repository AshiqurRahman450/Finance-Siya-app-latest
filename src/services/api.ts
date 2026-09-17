import { Platform } from 'react-native';

export const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.kidsgenlab.com';

let authToken = '';

export const setAuthToken = (token: string) => {
  authToken = token;
};

export const getAuthToken = () => {
  return authToken;
};

// Generic fetch wrapper with token injection and error handling
async function request(endpoint: string, options: any = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const isFormData = options.body instanceof FormData;
  
  const headers: any = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
    ...(options.headers || {})
  };

  const config = {
    ...options,
    headers
  };

  if (config.body && typeof config.body === 'object' && !isFormData) {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);
    const contentType = response.headers.get('content-type');
    
    let data: any;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      if (!response.ok) {
        throw new Error(`Endpoint not found or server error (${response.status})`);
      }
      data = { message: text };
    }
    
    if (!response.ok) {
      throw new Error(data?.error || `Request failed with status ${response.status}`);
    }
    
    return data;
  } catch (error: any) {
    console.warn(`API Notice [${config.method || 'GET'} ${endpoint}]:`, error?.message || error);
    throw error;
  }
}

export const api = {
  // Authentication
  login: async (credentials: any) => {
    const data = await request('/api/auth/login', {
      method: 'POST',
      body: credentials
    });
    if (data.token) {
      setAuthToken(data.token);
    }
    return data;
  },

  signUp: async (userData: any) => {
    const data = await request('/api/auth/signup', {
      method: 'POST',
      body: userData
    });
    if (data.token) {
      setAuthToken(data.token);
    }
    return data;
  },

  getMe: () => {
    return request('/api/auth/me', { method: 'GET' });
  },

  updateProfile: (profileData: any) => {
    return request('/api/auth/profile', {
      method: 'PUT',
      body: profileData
    });
  },

  // Sync all page data
  getAllData: () => {
    return request('/api/data', { method: 'GET' });
  },

  // Transactions CRUD
  getTransactionAnalytics: () => {
    return request('/api/transactions/analytics', { method: 'GET' });
  },

  createTransaction: (txData: any) => {
    return request('/api/transactions', {
      method: 'POST',
      body: txData
    });
  },

  updateTransaction: (id: string, txData: any) => {
    return request(`/api/transactions/${id}`, {
      method: 'PUT',
      body: txData
    });
  },

  deleteTransaction: (id: string) => {
    return request(`/api/transactions/${id}`, {
      method: 'DELETE'
    });
  },

  // Assets CRUD
  createAsset: (assetData: any) => {
    return request('/api/assets', {
      method: 'POST',
      body: assetData
    });
  },

  updateAsset: (id: string, assetData: any) => {
    return request(`/api/assets/${id}`, {
      method: 'PUT',
      body: assetData
    });
  },

  deleteAsset: (id: string) => {
    return request(`/api/assets/${id}`, {
      method: 'DELETE'
    });
  },

  // Debts CRUD
  createDebt: (debtData: any) => {
    return request('/api/debts', {
      method: 'POST',
      body: debtData
    });
  },

  updateDebt: (id: string, debtData: any) => {
    return request(`/api/debts/${id}`, {
      method: 'PUT',
      body: debtData
    });
  },

  deleteDebt: (id: string) => {
    return request(`/api/debts/${id}`, {
      method: 'DELETE'
    });
  },

  // Expense Audits CRUD
  createAudit: (auditData: any) => {
    return request('/api/audits', {
      method: 'POST',
      body: auditData
    });
  },

  clearAudits: () => {
    return request('/api/audits', {
      method: 'DELETE'
    });
  },

  // Savings Goals CRUD
  createSavings: (savingsData: any) => {
    return request('/api/savings', {
      method: 'POST',
      body: savingsData
    });
  },

  updateSavings: (id: string, savingsData: any) => {
    return request(`/api/savings/${id}`, {
      method: 'PUT',
      body: savingsData
    });
  },

  deleteSavings: (id: string) => {
    return request(`/api/savings/${id}`, {
      method: 'DELETE'
    });
  },

  // Leverage Lessons CRUD (Admin)
  getLessons: () => {
    return request('/api/leverage/lessons', { method: 'GET' });
  },
  createLesson: (lessonData: any) => {
    return request('/api/leverage/lessons', {
      method: 'POST',
      body: lessonData
    });
  },
  updateLesson: (id: string, lessonData: any) => {
    return request(`/api/leverage/lessons/${id}`, {
      method: 'PUT',
      body: lessonData
    });
  },
  deleteLesson: (id: string) => {
    return request(`/api/leverage/lessons/${id}`, {
      method: 'DELETE'
    });
  },

  // HVP Skills CRUD (Admin)
  getSkills: () => {
    return request('/api/hvp/skills', { method: 'GET' });
  },
  createSkill: (skillData: any) => {
    return request('/api/hvp/skills', {
      method: 'POST',
      body: skillData
    });
  },
  updateSkill: (id: string, skillData: any) => {
    return request(`/api/hvp/skills/${id}`, {
      method: 'PUT',
      body: skillData
    });
  },
  deleteSkill: (id: string) => {
    return request(`/api/hvp/skills/${id}`, {
      method: 'DELETE'
    });
  },
  uploadVideo: (formData: FormData) => {
    return request('/api/upload', {
      method: 'POST',
      body: formData
    });
  },

  // Income Sources CRUD
  getIncomeSources: () => {
    return request('/api/income-sources', { method: 'GET' });
  },
  saveIncomeSource: (sourceData: any) => {
    return request('/api/income-sources', {
      method: 'POST',
      body: sourceData
    });
  },
  deleteIncomeSource: (id: string) => {
    return request(`/api/income-sources/${id}`, {
      method: 'DELETE'
    });
  },

  // Survival Spending CRUD
  getSurvivalSpending: () => {
    return request('/api/survival-spending', { method: 'GET' });
  },
  saveSurvivalSpending: (spendingData: any) => {
    return request('/api/survival-spending', {
      method: 'POST',
      body: spendingData
    });
  }
};
