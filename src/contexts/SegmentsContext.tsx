
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
  setOrderedSegments: (orderedSegments: Segment[]) => void; // New function for reordering
}

const SegmentsContext = createContext<SegmentsContextType | undefined>(undefined);

export const SegmentsProvider = ({ children }: { children: ReactNode }) => {
  const [segments, setSegments] = useState<Segment[]>(defaultInitialSegments);

  const addSegment = useCallback((newSegment: Segment) => {
    setSegments(prevSegments =>
      [...prevSegments, newSegment].sort((a, b) => {
        if (a.isCore && !b.isCore) return -1;
        if (!a.isCore && b.isCore) return 1;
        
        const indexOfAInDefault = defaultInitialSegments.findIndex(s => s.id === a.id);
        const indexOfBInDefault = defaultInitialSegments.findIndex(s => s.id === b.id);

        if (indexOfAInDefault !== -1 && indexOfBInDefault !== -1) {
          return indexOfAInDefault - indexOfBInDefault;
        }
        if (indexOfAInDefault !== -1) return -1;
        if (indexOfBInDefault !== -1) return 1;
        
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

  const setOrderedSegments = useCallback((orderedSegments: Segment[]) => {
    // Ensure core segments remain at the top if that's a hard rule,
    // or allow free reordering if that's intended.
    // For now, this function will trust the incoming order.
    // If core segments need to be fixed, further logic would be needed here or in the calling component.
    setSegments(orderedSegments);
  }, []);

  return (
    <SegmentsContext.Provider value={{ segments, addSegment, updateSegment, toggleSegmentStatus, getSegmentById, setOrderedSegments }}>
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

