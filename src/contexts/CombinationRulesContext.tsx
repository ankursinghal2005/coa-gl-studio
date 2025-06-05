
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback } from 'react';
import type { CombinationRule } from '@/lib/combination-rule-types';
// Import the empty initial data
import { initialCombinationRulesData } from '@/lib/combination-rule-types';

interface CombinationRulesContextType {
  combinationRules: CombinationRule[];
  addCombinationRule: (newRule: CombinationRule) => void;
  updateCombinationRule: (updatedRule: CombinationRule) => void;
  getCombinationRuleById: (ruleId: string) => CombinationRule | undefined;
  deleteCombinationRule: (ruleId: string) => void;
}

const CombinationRulesContext = createContext<CombinationRulesContextType | undefined>(undefined);

export const CombinationRulesProvider = ({ children }: { children: ReactNode }) => {
  // Use the imported initialCombinationRulesData which is now an empty array
  const [combinationRules, setCombinationRules] = useState<CombinationRule[]>(initialCombinationRulesData);

  const addCombinationRule = useCallback((newRule: CombinationRule) => {
    setCombinationRules(prevRules => [...prevRules, newRule]);
  }, []);

  const updateCombinationRule = useCallback((updatedRule: CombinationRule) => {
    setCombinationRules(prevRules =>
      prevRules.map(rule => (rule.id === updatedRule.id ? updatedRule : rule))
    );
  }, []);

  const getCombinationRuleById = useCallback((ruleId: string): CombinationRule | undefined => {
    return combinationRules.find(rule => rule.id === ruleId);
  }, [combinationRules]);

  const deleteCombinationRule = useCallback((ruleId: string) => {
    setCombinationRules(prevRules => prevRules.filter(rule => rule.id !== ruleId));
  }, []);

  return (
    <CombinationRulesContext.Provider
      value={{
        combinationRules,
        addCombinationRule,
        updateCombinationRule,
        getCombinationRuleById,
        deleteCombinationRule,
      }}
    >
      {children}
    </CombinationRulesContext.Provider>
  );
};

export const useCombinationRules = (): CombinationRulesContextType => {
  const context = useContext(CombinationRulesContext);
  if (context === undefined) {
    throw new Error('useCombinationRules must be used within a CombinationRulesProvider');
  }
  return context;
};
