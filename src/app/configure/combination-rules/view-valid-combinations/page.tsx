
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
import type { CombinationRuleCriterion, CombinationRuleDefinitionEntry } from '@/lib/combination-rule-types';
import type { Segment, SegmentCode } from '@/lib/segment-types';
// mockSegmentCodesData might not be directly used for generation anymore, but isCodeValidOnDate might be useful if re-added
import { mockSegmentCodesData } from '@/lib/segment-types'; 
import { ArrowLeft, AlertTriangle, FilterX } from 'lucide-react';

interface DisplayableCombination {
  definitionEntryId: string; 
  segmentCriteriaDisplay: Record<string, string>; // Key is segmentId, value is the code/criterion display or "Any Valid Code"
}

// This function might be used if we re-introduce date-based validity checks for specific codes within criteria.
// For now, it's not directly used in generating the rows, as we display criteria themselves.
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

const renderCriterionDisplay = (criterion: CombinationRuleCriterion): string => {
    switch (criterion.type) {
      case 'CODE':
        return `Code: ${criterion.codeValue}`;
      case 'RANGE':
        return `Range: ${criterion.rangeStartValue} - ${criterion.rangeEndValue}`;
      case 'HIERARCHY_NODE':
        return `Node: ${criterion.hierarchyNodeId}${criterion.includeChildren ? ' (+children)' : ''}`;
      default:
        // This should ideally not happen if types are correct
        const exhaustiveCheck: never = criterion.type; 
        return `Unknown Criterion Type: ${exhaustiveCheck}`;
    }
};


export default function ViewValidCombinationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateString = searchParams.get('date');
  
  const { combinationRules } = useCombinationRules();
  const { segments: allSegments } = useSegments(); // Removed getSegmentById as it's not directly used

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
      // Iterate over definitionEntries, which is the new structure
      rule.definitionEntries.forEach(definitionEntry => {
        if (definitionEntry.behavior !== 'Include') return;

        const currentSegmentCriteriaDisplay: Record<string, string> = {};
        
        // For each active segment, determine what to display
        activeSegments.forEach(activeSeg => {
          const conditionForThisSegment = definitionEntry.segmentConditions.find(
            sc => sc.segmentId === activeSeg.id
          );

          if (conditionForThisSegment) {
            currentSegmentCriteriaDisplay[activeSeg.id] = renderCriterionDisplay(conditionForThisSegment.criterion);
          } else {
            currentSegmentCriteriaDisplay[activeSeg.id] = "Any Valid Code";
          }
        });
        
        entriesToDisplay.push({
          definitionEntryId: definitionEntry.id,
          segmentCriteriaDisplay: currentSegmentCriteriaDisplay,
        });
      });
    });
    
    // Deduplication based on displayed content might be complex if IDs are not truly unique per visual row.
    // For now, assuming definitionEntry.id is unique enough for keys if we show one row per definitionEntry.
    // If multiple definition entries could result in the same visual display, more sophisticated deduplication might be needed.
    return entriesToDisplay; // No complex deduplication for now, relies on definitionEntry IDs.

  }, [selectedDate, combinationRules, activeSegments]);

  const filteredCombinations = useMemo(() => {
    return generatedCombinations.filter(combo => {
      return Object.entries(columnFilters).every(([key, filterValue]) => {
        if (!filterValue) return true;
        const lowerFilterValue = filterValue.toLowerCase();
        
        if (key === 'definitionEntryId') { // Changed from mappingEntryId
            return combo.definitionEntryId.toLowerCase().includes(lowerFilterValue);
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
                    Allowed Segment Combination Criteria
                </h1>
                <p className="text-md text-muted-foreground mt-1">
                    Showing 'Include' rule entries effective as of <span className="font-semibold text-primary">{format(selectedDate, 'PPP')}</span>.
                </p>
                 <p className="text-xs text-muted-foreground mt-0.5">
                    "Any Valid Code" indicates the segment is not restricted by the rule entry that generated this row. Hierarchy Node and Range criteria are shown as defined.
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
                        Definition Entry ID 
                        <Input
                            placeholder="Filter ID..."
                            value={columnFilters['definitionEntryId'] || ''}
                            onChange={(e) => handleFilterChange('definitionEntryId', e.target.value)}
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
                    <TableRow key={`${combo.definitionEntryId}-${comboIndex}`}>{/*
                   */}<TableCell className="font-medium sticky left-0 bg-card z-10">{combo.definitionEntryId}</TableCell>{/*
                   */}{activeSegments.map(seg => (
                        <TableCell key={`${combo.definitionEntryId}-${comboIndex}-${seg.id}`}>{/*
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
                "No 'Include' rule entries found for the selected date or no rules are defined." :
                "No combination criteria match your current filter criteria."
              }
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

