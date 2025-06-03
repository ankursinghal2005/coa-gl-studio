
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
  setOrderedSegments: (orderedSegments: Segment[]) => void; 
}

const SegmentsContext = createContext<SegmentsContextType | undefined>(undefined);

export const SegmentsProvider = ({ children }: { children: ReactNode }) => {
  const [segments, setSegments] = useState<Segment[]>(defaultInitialSegments);

  const addSegment = useCallback((newSegment: Segment) => {
    setSegments(prevSegments => [...prevSegments, newSegment]);
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

