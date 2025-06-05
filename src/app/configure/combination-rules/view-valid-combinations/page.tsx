
'use client';

import React, { useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCombinationRules } from '@/contexts/CombinationRulesContext';
import { useSegments } from '@/contexts/SegmentsContext';
import type { CombinationRuleCriterion, CombinationRuleMappingEntry } from '@/lib/combination-rule-types';
import type { Segment, SegmentCode } from '@/lib/segment-types';
import { mockSegmentCodesData } from '@/lib/segment-types';
import { ArrowLeft, AlertTriangle, FilterX } from 'lucide-react';

interface DisplayableCombination {
  mappingEntryId: string; 
  segmentCriteriaDisplay: Record<string, string>; // Key is segmentId, value is the code or "Any Valid Code"
}


const isCodeValidOnDate = (code: SegmentCode | undefined, targetDate: Date): boolean => {
  if (!code) return false;
  if (!code.isActive) return false;
  
  const fromDate = new Date(code.validFrom);
  if (targetDate.setHours(0,0,0,0) < fromDate.setHours(0,0,0,0)) return false;
  
  if (code.validTo) {
    const toDate = new Date(code.validTo);
    if (targetDate.setHours(0,0,0,0) > toDate.setHours(0,0,0,0)) return false;
  }
  return true;
};

// Helper to get individual codes from a criterion (code or range)
const getCodesFromCriterion = (
    criterion: CombinationRuleCriterion,
    segmentId: string,
    targetDate: Date
): SegmentCode[] => {
    const codesForSegment = mockSegmentCodesData[segmentId] || [];
    if (!codesForSegment) return [];

    switch (criterion.type) {
        case 'CODE':
            const singleCode = codesForSegment.find(sc => sc.code === criterion.codeValue);
            return singleCode && isCodeValidOnDate(singleCode, targetDate) ? [singleCode] : [];
        case 'RANGE':
            if (!criterion.rangeStartValue || !criterion.rangeEndValue) return [];
            // Basic alphanumeric sort for range comparison, might need refinement for complex numeric/alpha codes
            return codesForSegment.filter(sc => 
                sc.code >= criterion.rangeStartValue! && 
                sc.code <= criterion.rangeEndValue! &&
                isCodeValidOnDate(sc, targetDate)
            ).sort((a,b) => a.code.localeCompare(b.code)); // Ensure consistent order
        case 'HIERARCHY_NODE':
            // For now, we don't expand hierarchy nodes into individual codes.
            // This would require traversing the hierarchy.
            // We'll return a placeholder or a specific marker if needed,
            // or just rely on renderCriterionDisplay to show the node info.
            // For the purpose of generating combinations, we treat it as "not expandable into individual codes here"
            return []; // Or handle differently if one specific code should represent the node
        default:
            return [];
    }
};


const renderCriterionDisplay = (criterion: CombinationRuleCriterion): string => {
    switch (criterion.type) {
      case 'CODE':
        return `Code: ${criterion.codeValue}`;
      case 'RANGE':
        return `Range: ${criterion.rangeStartValue} - ${criterion.rangeEndValue}`;
      case 'HIERARCHY_NODE':
        return `Node: ${criterion.hierarchyNodeId}${criterion.includeChildren ? ' (+children)' : ''}`;
      default:
        return 'Invalid Criterion';
    }
};


export default function ViewValidCombinationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateString = searchParams.get('date');
  
  const { combinationRules } = useCombinationRules();
  const { segments: allSegments, getSegmentById } = useSegments();

  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});

  const activeSegments = useMemo(() => {
    return allSegments.filter(s => s.isActive).sort((a, b) => {
        if (a.isCore && !b.isCore) return -1;
        if (!a.isCore && b.isCore) return 1;
        return a.displayName.localeCompare(b.displayName);
    });
  }, [allSegments]);

  const selectedDate = useMemo(() => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  }, [dateString]);

  const generatedCombinations = useMemo((): DisplayableCombination[] => {
    if (!selectedDate) return [];

    const activeCombinationRules = combinationRules.filter(rule => rule.status === 'Active');
    const entriesToDisplay: DisplayableCombination[] = [];

    activeCombinationRules.forEach(rule => {
      rule.mappingEntries.forEach(entry => {
        if (entry.behavior !== 'Include') return;

        const codesA = getCodesFromCriterion(entry.segmentACriterion, rule.segmentAId, selectedDate);
        const codesB = getCodesFromCriterion(entry.segmentBCriterion, rule.segmentBId, selectedDate);
        
        const segmentADisplay = renderCriterionDisplay(entry.segmentACriterion);
        const segmentBDisplay = renderCriterionDisplay(entry.segmentBCriterion);

        if (codesA.length > 0 && codesB.length > 0) { // Both criteria yielded specific codes
            codesA.forEach(codeA => {
                codesB.forEach(codeB => {
                    const segmentCriteriaDisplay: Record<string, string> = {};
                    activeSegments.forEach(activeSeg => {
                        if (activeSeg.id === rule.segmentAId) {
                            segmentCriteriaDisplay[activeSeg.id] = codeA.code;
                        } else if (activeSeg.id === rule.segmentBId) {
                            segmentCriteriaDisplay[activeSeg.id] = codeB.code;
                        } else {
                            segmentCriteriaDisplay[activeSeg.id] = "Any Valid Code";
                        }
                    });
                    entriesToDisplay.push({
                        mappingEntryId: entry.id,
                        segmentCriteriaDisplay,
                    });
                });
            });
        } else if (codesA.length > 0 && entry.segmentBCriterion.type === 'HIERARCHY_NODE') {
             codesA.forEach(codeA => {
                const segmentCriteriaDisplay: Record<string, string> = {};
                activeSegments.forEach(activeSeg => {
                    if (activeSeg.id === rule.segmentAId) segmentCriteriaDisplay[activeSeg.id] = codeA.code;
                    else if (activeSeg.id === rule.segmentBId) segmentCriteriaDisplay[activeSeg.id] = segmentBDisplay;
                    else segmentCriteriaDisplay[activeSeg.id] = "Any Valid Code";
                });
                entriesToDisplay.push({ mappingEntryId: entry.id, segmentCriteriaDisplay });
            });
        } else if (codesB.length > 0 && entry.segmentACriterion.type === 'HIERARCHY_NODE') {
            codesB.forEach(codeB => {
                const segmentCriteriaDisplay: Record<string, string> = {};
                activeSegments.forEach(activeSeg => {
                    if (activeSeg.id === rule.segmentAId) segmentCriteriaDisplay[activeSeg.id] = segmentADisplay;
                    else if (activeSeg.id === rule.segmentBId) segmentCriteriaDisplay[activeSeg.id] = codeB.code;
                    else segmentCriteriaDisplay[activeSeg.id] = "Any Valid Code";
                });
                entriesToDisplay.push({ mappingEntryId: entry.id, segmentCriteriaDisplay });
            });
        } else if (entry.segmentACriterion.type === 'HIERARCHY_NODE' && entry.segmentBCriterion.type === 'HIERARCHY_NODE') {
            // Both are hierarchy nodes, show them as they are
            const segmentCriteriaDisplay: Record<string, string> = {};
            activeSegments.forEach(activeSeg => {
                if (activeSeg.id === rule.segmentAId) segmentCriteriaDisplay[activeSeg.id] = segmentADisplay;
                else if (activeSeg.id === rule.segmentBId) segmentCriteriaDisplay[activeSeg.id] = segmentBDisplay;
                else segmentCriteriaDisplay[activeSeg.id] = "Any Valid Code";
            });
            entriesToDisplay.push({ mappingEntryId: entry.id, segmentCriteriaDisplay });
        }
        // If one is a hierarchy and the other yields no codes, we don't list it as it's not a specific combination
      });
    });
    // Deduplicate entries based on the content of segmentCriteriaDisplay to avoid identical rows from different rules/entries
    // This is a simple string-based deduplication. More complex scenarios might need smarter logic.
    const uniqueEntries = new Map<string, DisplayableCombination>();
    entriesToDisplay.forEach(entry => {
        const key = JSON.stringify(entry.segmentCriteriaDisplay); // Create a key from the displayed values
        if (!uniqueEntries.has(key)) {
            uniqueEntries.set(key, entry);
        }
    });

    return Array.from(uniqueEntries.values());
  }, [selectedDate, combinationRules, activeSegments]);

  const filteredCombinations = useMemo(() => {
    return generatedCombinations.filter(combo => {
      return Object.entries(columnFilters).every(([key, filterValue]) => {
        if (!filterValue) return true;
        const lowerFilterValue = filterValue.toLowerCase();
        
        if (key === 'mappingEntryId') {
            // For combinations generated from ranges/multiple codes, mappingEntryId might not be unique.
            // Consider if filtering by the displayed content is more appropriate or if mappingEntryId is still useful.
            // If a single mapping entry can produce many rows, this filter might be less intuitive.
            // For now, keeping it as is:
            return combo.mappingEntryId.toLowerCase().includes(lowerFilterValue);
        }
        // For dynamic segment columns
        const segmentValue = combo.segmentCriteriaDisplay[key];
        return segmentValue?.toLowerCase().includes(lowerFilterValue) ?? false;
      });
    });
  }, [generatedCombinations, columnFilters]);

  const handleFilterChange = (columnId: string, value: string) => {
    setColumnFilters(prev => ({ ...prev, [columnId]: value }));
  };
  
  const clearAllFilters = () => {
    setColumnFilters({});
  };


  if (!selectedDate) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <Breadcrumbs items={[{ label: 'COA Configuration', href: '/' }, { label: 'Combination Rules', href: '/configure/combination-rules' }, {label: 'Error'}]} />
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive flex items-center">
                <AlertTriangle className="mr-2 h-6 w-6" />
                Invalid Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>No valid date was provided to view combinations.</p>
            <Button onClick={() => router.push('/configure/combination-rules')} className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Combination Rules
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const breadcrumbItems = [
    { label: 'COA Configuration', href: '/' },
    { label: 'Combination Rules', href: '/configure/combination-rules' },
    { label: `Valid Combinations for ${format(selectedDate, 'MM/dd/yyyy')}` },
  ];
  
  return (
    <div className="w-full max-w-7xl mx-auto">
      <Breadcrumbs items={breadcrumbItems} />
      <header className="mb-6">
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-primary">
                    Valid Segment Code Combinations
                </h1>
                <p className="text-md text-muted-foreground mt-1">
                    Showing specific code combinations derived from 'Include' rule entries effective as of <span className="font-semibold text-primary">{format(selectedDate, 'PPP')}</span>.
                </p>
                 <p className="text-xs text-muted-foreground mt-0.5">
                    "Any Valid Code" indicates the segment is not restricted by the 2-segment rule that generated this row. Hierarchy Node criteria are shown as defined.
                </p>
            </div>
            <Button onClick={() => router.push('/configure/combination-rules')} variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to All Rules
            </Button>
        </div>
        <div className="mt-4 flex justify-end">
            <Button onClick={clearAllFilters} variant="ghost" size="sm" disabled={Object.values(columnFilters).every(f => !f)}>
                <FilterX className="mr-2 h-4 w-4" /> Clear All Filters
            </Button>
        </div>
      </header>

      <Card>
        <CardContent className="pt-6">
          {filteredCombinations.length > 0 ? (
            <ScrollArea className="w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px] sticky left-0 bg-card z-10">
                        Mapping Entry ID
                        <Input
                            placeholder="Filter ID..."
                            value={columnFilters['mappingEntryId'] || ''}
                            onChange={(e) => handleFilterChange('mappingEntryId', e.target.value)}
                            className="mt-1 h-8"
                        />
                    </TableHead>
                    {activeSegments.map(seg => (
                        <TableHead key={seg.id} className="min-w-[180px]">
                            {seg.displayName}
                            <Input
                                placeholder={`Filter ${seg.displayName}...`}
                                value={columnFilters[seg.id] || ''}
                                onChange={(e) => handleFilterChange(seg.id, e.target.value)}
                                className="mt-1 h-8"
                            />
                        </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCombinations.map((combo, comboIndex) => (
                    <TableRow key={`${combo.mappingEntryId}-${comboIndex}`}>{/*
                   */}<TableCell className="font-medium sticky left-0 bg-card z-10">{combo.mappingEntryId}</TableCell>{/*
                   */}{activeSegments.map(seg => (
                        <TableCell key={`${combo.mappingEntryId}-${comboIndex}-${seg.id}`}>{/*
                       */}{combo.segmentCriteriaDisplay[seg.id]}{/*
                     */}</TableCell>
                      ))}{/*
                 */}</TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              {generatedCombinations.length === 0 ? 
                "No 'Include' rule entries generate specific combinations for the selected date." :
                "No combinations match your current filter criteria."
              }
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
