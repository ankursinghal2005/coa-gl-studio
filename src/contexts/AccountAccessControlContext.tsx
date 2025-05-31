
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback } from 'react';
import type { AccessControlRule } from '@/lib/account-access-control-types';
import { initialAccountAccessControlRulesData } from '@/lib/account-access-control-types';

interface AccountAccessControlContextType {
  rules: AccessControlRule[];
  addRule: (newRule: AccessControlRule) => void;
  updateRule: (updatedRule: AccessControlRule) => void;
  getRuleById: (ruleId: string) => AccessControlRule | undefined;
  deleteRule: (ruleId: string) => void; // Added deleteRule
}

const AccountAccessControlContext = createContext<AccountAccessControlContextType | undefined>(undefined);

export const AccountAccessControlProvider = ({ children }: { children: ReactNode }) => {
  const [rules, setRules] = useState<AccessControlRule[]>(initialAccountAccessControlRulesData);

  const addRule = useCallback((newRule: AccessControlRule) => {
    setRules(prevRules => [...prevRules, newRule]);
  }, []);

  const updateRule = useCallback((updatedRule: AccessControlRule) => {
    setRules(prevRules =>
      prevRules.map(rule => (rule.id === updatedRule.id ? updatedRule : rule))
    );
  }, []);

  const getRuleById = useCallback((ruleId: string): AccessControlRule | undefined => {
    return rules.find(rule => rule.id === ruleId);
  }, [rules]);

  const deleteRule = useCallback((ruleId: string) => {
    setRules(prevRules => prevRules.filter(rule => rule.id !== ruleId));
  }, []);

  return (
    <AccountAccessControlContext.Provider
      value={{
        rules,
        addRule,
        updateRule,
        getRuleById,
        deleteRule,
      }}
    >
      {children}
    </AccountAccessControlContext.Provider>
  );
};

export const useAccountAccessControl = (): AccountAccessControlContextType => {
  const context = useContext(AccountAccessControlContext);
  if (context === undefined) {
    throw new Error('useAccountAccessControl must be used within an AccountAccessControlProvider');
  }
  return context;
};
