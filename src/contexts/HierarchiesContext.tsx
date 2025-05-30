
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback } from 'react';
import type { Hierarchy } from '@/lib/hierarchy-types';
import { initialHierarchiesData as defaultInitialHierarchies } from '@/lib/hierarchy-types';

interface HierarchiesContextType {
  hierarchies: Hierarchy[];
  addHierarchy: (newHierarchy: Hierarchy) => void;
  // Future: updateHierarchy, deleteHierarchy
}

const HierarchiesContext = createContext<HierarchiesContextType | undefined>(undefined);

export const HierarchiesProvider = ({ children }: { children: ReactNode }) => {
  const [hierarchies, setHierarchies] = useState<Hierarchy[]>(defaultInitialHierarchies);

  const addHierarchy = useCallback((newHierarchy: Hierarchy) => {
    setHierarchies(prevHierarchies => [...prevHierarchies, newHierarchy]);
  }, []);

  // Placeholder for future update/delete functions
  // const updateHierarchy = useCallback((updatedHierarchy: Hierarchy) => {
  //   setHierarchies(prev => prev.map(h => h.id === updatedHierarchy.id ? updatedHierarchy : h));
  // }, []);

  // const deleteHierarchy = useCallback((hierarchyId: string) => {
  //   setHierarchies(prev => prev.filter(h => h.id !== hierarchyId));
  // }, []);

  return (
    <HierarchiesContext.Provider value={{ hierarchies, addHierarchy }}>
      {children}
    </HierarchiesContext.Provider>
  );
};

export const useHierarchies = (): HierarchiesContextType => {
  const context = useContext(HierarchiesContext);
  if (context === undefined) {
    throw new Error('useHierarchies must be used within a HierarchiesProvider');
  }
  return context;
};
