import React, { createContext, useContext } from 'react';
import { useAuth } from './AuthContext';

const SiyaContext = createContext(null);

export const SiyaProvider = ({ children }) => {
  const { audits, addAuditState, clearAuditsState } = useAuth();

  // Calculate Stat
  const totalNeeds = audits.filter(a => a.type === 'Need').length;
  const totalWaste = audits.filter(a => a.type === 'Waste').length;
  const totalNeedsAmount = audits.filter(a => a.type === 'Need').reduce((sum, a) => sum + (a.amount || 0), 0);
  const totalWasteAmount = audits.filter(a => a.type === 'Waste').reduce((sum, a) => sum + (a.amount || 0), 0);
  const futureLoss = audits.reduce((sum, a) => sum + (a.futureValue || 0), 0);
  const freedomDaysLost = audits.reduce((sum, a) => sum + (a.freedomDaysLost || 0), 0);
  
  const scoreRaw = totalNeeds + totalWaste > 0 ? (totalNeeds / (totalNeeds + totalWaste)) * 100 : 100;
  const sovereigntyScore = Math.round(scoreRaw);

  const addAudit = async (audit) => {
    try {
      await addAuditState(audit);
    } catch (err) {
      console.error('Failed to save audit to backend:', err);
    }
  };

  const clearHistory = async () => {
    try {
      await clearAuditsState();
    } catch (err) {
      console.error('Failed to clear audits from backend:', err);
    }
  };

  return (
    <SiyaContext.Provider value={{ 
      audits, addAudit, clearHistory, 
      totalNeeds, totalWaste, totalNeedsAmount, totalWasteAmount, futureLoss, freedomDaysLost, sovereigntyScore 
    }}>
      {children}
    </SiyaContext.Provider>
  );
};

export const useSiya = () => useContext(SiyaContext);
