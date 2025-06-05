
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback } from 'react';
import type { HierarchySet } from '@/lib/hierarchy-types'; // Updated import
import { initialHierarchiesData as defaultInitialHierarchySets } from '@/lib/hierarchy-types'; // Updated import

interface HierarchiesContextType {
  hierarchySets: HierarchySet[]; // Renamed from hierarchies
  addHierarchySet: (newSet: HierarchySet) => void; // Renamed
  updateHierarchySet: (updatedSet: HierarchySet) => void; // Renamed
  getHierarchySetById: (setId: string) => HierarchySet | undefined; // Renamed
  deleteHierarchySet: (setId: string) => void; // Added delete function
}

const HierarchiesContext = createContext<HierarchiesContextType | undefined>(undefined);

export const HierarchiesProvider = ({ children }: { children: ReactNode }) => {
  const [hierarchySets, setHierarchySets] = useState<HierarchySet[]>(defaultInitialHierarchySets);

  const addHierarchySet = useCallback((newSet: HierarchySet) => {
    setHierarchySets(prevSets => [...prevSets, newSet]);
  }, []);

  const updateHierarchySet = useCallback((updatedSet: HierarchySet) => {
    setHierarchySets(prevSets =>
      prevSets.map(set => (set.id === updatedSet.id ? updatedSet : set))
    );
  }, []);

  const getHierarchySetById = useCallback((setId: string): HierarchySet | undefined => {
    return hierarchySets.find(set => set.id === setId);
  }, [hierarchySets]);

  const deleteHierarchySet = useCallback((setId: string) => {
    setHierarchySets(prevSets => prevSets.filter(set => set.id !== setId));
  }, []);

  return (
    <HierarchiesContext.Provider
      value={{
        hierarchySets,
        addHierarchySet,
        updateHierarchySet,
        getHierarchySetById,
        deleteHierarchySet,
      }}
    >
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
