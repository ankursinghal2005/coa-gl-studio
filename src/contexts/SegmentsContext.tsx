
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback } from 'react';
import type { Segment } from '@/lib/segment-types';
import { initialSegmentsData as defaultInitialSegments } from '@/lib/segment-types';

interface SegmentsContextType {
  segments: Segment[];
  addSegment: (newSegment: Segment) => void;
  updateSegment: (updatedSegment: Segment) => void;
  toggleSegmentStatus: (segmentId: string) => void;
  getSegmentById: (segmentId: string) => Segment | undefined;
}

const SegmentsContext = createContext<SegmentsContextType | undefined>(undefined);

export const SegmentsProvider = ({ children }: { children: ReactNode }) => {
  const [segments, setSegments] = useState<Segment[]>(defaultInitialSegments);

  const addSegment = useCallback((newSegment: Segment) => {
    setSegments(prevSegments => 
      [...prevSegments, newSegment].sort((a, b) => {
        // Keep core segments first
        if (a.isCore && !b.isCore) return -1;
        if (!a.isCore && b.isCore) return 1;
        
        // Then, sort by original order if both are original, or one is original
        const indexOfAInDefault = defaultInitialSegments.findIndex(s => s.id === a.id);
        const indexOfBInDefault = defaultInitialSegments.findIndex(s => s.id === b.id);

        if (indexOfAInDefault !== -1 && indexOfBInDefault !== -1) { // Both are original segments
          return indexOfAInDefault - indexOfBInDefault;
        }
        if (indexOfAInDefault !== -1) return -1; // a is original, b is custom
        if (indexOfBInDefault !== -1) return 1;  // b is original, a is custom
        
        // If both are custom, sort by displayName, or maintain add order (current sort does not specify for two custom)
        // For now, let's maintain add order for custom segments relative to each other (which default sort does)
        // or sort by name for consistency if ids are UUIDs.
        // For simplicity, current sort after core/original distinction will effectively be add order.
        return 0; 
      })
    );
  }, []);

  const updateSegment = useCallback((updatedSegment: Segment) => {
    setSegments(prevSegments =>
      prevSegments.map(s => (s.id === updatedSegment.id ? updatedSegment : s))
    );
  }, []);

  const toggleSegmentStatus = useCallback((segmentId: string) => {
    setSegments(prevSegments =>
      prevSegments.map(s =>
        s.id === segmentId && !s.isCore ? { ...s, isActive: !s.isActive } : s
      )
    );
  }, []);

  const getSegmentById = useCallback((segmentId: string) => {
    return segments.find(s => s.id === segmentId);
  }, [segments]);

  return (
    <SegmentsContext.Provider value={{ segments, addSegment, updateSegment, toggleSegmentStatus, getSegmentById }}>
      {children}
    </SegmentsContext.Provider>
  );
};

export const useSegments = (): SegmentsContextType => {
  const context = useContext(SegmentsContext);
  if (context === undefined) {
    throw new Error('useSegments must be used within a SegmentsProvider');
  }
  return context;
};
