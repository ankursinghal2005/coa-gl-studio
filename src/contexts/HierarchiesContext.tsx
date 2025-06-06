
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback } from 'react';
import type { HierarchySet, SegmentHierarchyInSet, HierarchyNode } from '@/lib/hierarchy-types';
import { initialHierarchiesData as defaultInitialHierarchySets } from '@/lib/hierarchy-types';
import { initialSegmentsData } from '@/lib/segment-types'; // For iterating through segments
import { mockSegmentCodesData, type SegmentCode } from '@/lib/segment-types'; // For segment codes

interface HierarchiesContextType {
  hierarchySets: HierarchySet[];
  addHierarchySet: (newSet: HierarchySet) => void;
  updateHierarchySet: (updatedSet: HierarchySet) => void;
  getHierarchySetById: (setId: string) => HierarchySet | undefined;
  deleteHierarchySet: (setId: string) => void;
}

const HierarchiesContext = createContext<HierarchiesContextType | undefined>(undefined);

// Helper function to build tree for a segment
function buildTreeForSegment(segmentCodes: SegmentCode[]): HierarchyNode[] {
  if (!segmentCodes || segmentCodes.length === 0) {
    return [];
  }

  const nodesById: Record<string, HierarchyNode> = {}; // Store nodes by SegmentCode.id
  const codeToNodeId: Record<string, string> = {}; // Map SegmentCode.code to SegmentCode.id

  // First pass: create all nodes and map code strings to node IDs
  segmentCodes.forEach(sc => {
    // Ensure SegmentCode.id is unique and suitable for HierarchyNode.id
    const nodeId = sc.id || `node-${sc.code}-${Math.random().toString(36).substr(2, 9)}`;
    nodesById[nodeId] = {
      id: nodeId,
      segmentCode: { ...sc }, // Clone segment code
      children: [],
    };
    codeToNodeId[sc.code] = nodeId;
  });

  const allNodes = Object.values(nodesById);

  // Second pass: link children to parents
  allNodes.forEach(node => {
    const parentCodeString = node.segmentCode.defaultParentCode;
    if (parentCodeString) {
      const parentNodeId = codeToNodeId[parentCodeString];
      if (parentNodeId && nodesById[parentNodeId]) {
        const parentNode = nodesById[parentNodeId];
        if (parentNode.segmentCode.summaryIndicator) {
          // Check if child already exists to prevent duplicates
          if (!parentNode.children.some(child => child.id === node.id)) {
            parentNode.children.push(node);
          }
        }
        // If parent is not summary or not found, node remains a potential root, handled by filtering later
      }
      // If parent code string exists but parent node not found, node remains potential root
    }
  });

  // Identify true root nodes (nodes that are not a child of any other node)
  const childNodeIds = new Set<string>();
  allNodes.forEach(node => {
    node.children.forEach(child => childNodeIds.add(child.id));
  });

  return allNodes.filter(node => !childNodeIds.has(node.id));
}


export const HierarchiesProvider = ({ children }: { children: ReactNode }) => {
  const [hierarchySets, setHierarchySets] = useState<HierarchySet[]>(() => {
    // Deep clone to avoid modifying the imported constant
    const initialSets: HierarchySet[] = JSON.parse(JSON.stringify(defaultInitialHierarchySets));
    const systemDefaultSet = initialSets.find(s => s.id === 'hset-system-default-code-hierarchy');

    if (systemDefaultSet) {
      const newSegmentHierarchies: SegmentHierarchyInSet[] = [];
      initialSegmentsData.forEach(segment => {
        const codesForSegment = mockSegmentCodesData[segment.id];
        if (codesForSegment && codesForSegment.length > 0) {
          const treeNodes = buildTreeForSegment(codesForSegment);
          if (treeNodes.length > 0) {
            newSegmentHierarchies.push({
              id: `${systemDefaultSet.id}-${segment.id}-sh`, // Consistent ID
              segmentId: segment.id,
              description: `Default hierarchy for ${segment.displayName}`,
              treeNodes: treeNodes,
            });
          }
        }
      });
      systemDefaultSet.segmentHierarchies = newSegmentHierarchies;
      systemDefaultSet.lastModifiedDate = undefined; // Set by actual modifications
      systemDefaultSet.lastModifiedBy = 'System (Initial Build)';
    }
    return initialSets;
  });

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
