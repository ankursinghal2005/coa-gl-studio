
'use client';

import React, { useMemo } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCombinationRules } from '@/contexts/CombinationRulesContext';
import { useSegments } from '@/contexts/SegmentsContext';
import type { CombinationRuleCriterion, CombinationRuleMappingEntry } from '@/lib/combination-rule-types';
import type { Segment, SegmentCode } from '@/lib/segment-types';
import { mockSegmentCodesData } from '@/lib/segment-types';
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

type EffectiveStatus = 'Effective' | 'Segment A Code Inactive' | 'Segment B Code Inactive' | 'Both Codes Inactive' | 'Code Validity Unknown';

interface DisplayableCombinationEntry {
  id: string; // Mapping Entry ID
  ruleName: string;
  [segmentId: string]: string | EffectiveStatus; // Dynamic properties for each active segment's criterion display
  effectiveStatus: EffectiveStatus;
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

const getSegmentCode = (segmentId: string, codeValue: string): SegmentCode | undefined => {
    const codesForSegment = mockSegmentCodesData[segmentId];
    if (!codesForSegment) return undefined;
    return codesForSegment.find(sc => sc.code === codeValue);
};


const renderCriterionDisplay = (criterion: CombinationRuleCriterion): string => {
    // Segment name prefix is removed as it will be part of the column header
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

  const activeSegments = useMemo(() => {
    return allSegments.filter(s => s.isActive).sort((a, b) => {
        // Optional: Consistent ordering, e.g., core segments first, then by name
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

  const processedEntries = useMemo((): DisplayableCombinationEntry[] => {
    if (!selectedDate) return [];

    const activeCombinationRules = combinationRules.filter(rule => rule.status === 'Active');
    const entriesToDisplay: DisplayableCombinationEntry[] = [];

    activeCombinationRules.forEach(rule => {
      rule.mappingEntries.forEach(entry => {
        if (entry.behavior !== 'Include') return;

        let currentEffectiveStatus: EffectiveStatus = 'Effective';
        let segmentAValidOnDate = true;
        let segmentBValidOnDate = true;

        // Check validity for Segment A code
        if (entry.segmentACriterion.type === 'CODE' && entry.segmentACriterion.codeValue) {
          const codeA = getSegmentCode(rule.segmentAId, entry.segmentACriterion.codeValue);
          segmentAValidOnDate = codeA ? isCodeValidOnDate(codeA, selectedDate) : false;
          if (!codeA && currentEffectiveStatus !== 'Code Validity Unknown') currentEffectiveStatus = 'Code Validity Unknown';
        } else if (entry.segmentACriterion.type !== 'CODE') {
           if (currentEffectiveStatus !== 'Code Validity Unknown') currentEffectiveStatus = 'Code Validity Unknown';
        }
        
        // Check validity for Segment B code
        if (entry.segmentBCriterion.type === 'CODE' && entry.segmentBCriterion.codeValue) {
          const codeB = getSegmentCode(rule.segmentBId, entry.segmentBCriterion.codeValue);
          segmentBValidOnDate = codeB ? isCodeValidOnDate(codeB, selectedDate) : false;
          if (!codeB && currentEffectiveStatus !== 'Code Validity Unknown') currentEffectiveStatus = 'Code Validity Unknown';
        } else if (entry.segmentBCriterion.type !== 'CODE') {
           if (currentEffectiveStatus !== 'Code Validity Unknown') currentEffectiveStatus = 'Code Validity Unknown';
        }
        
        // Determine overall status if not already 'Code Validity Unknown'
        if (currentEffectiveStatus !== 'Code Validity Unknown') {
            if (!segmentAValidOnDate && !segmentBValidOnDate) {
                currentEffectiveStatus = 'Both Codes Inactive';
            } else if (!segmentAValidOnDate) {
                currentEffectiveStatus = 'Segment A Code Inactive';
            } else if (!segmentBValidOnDate) {
                currentEffectiveStatus = 'Segment B Code Inactive';
            }
        }

        // Only include if the specific codes in rule are effective OR if validity is unknown (for ranges/hierarchies)
        if (currentEffectiveStatus === 'Effective' || currentEffectiveStatus === 'Code Validity Unknown') {
          const rowData: DisplayableCombinationEntry = {
            id: entry.id,
            ruleName: rule.name,
            effectiveStatus: currentEffectiveStatus,
          };

          activeSegments.forEach(activeSeg => {
            if (activeSeg.id === rule.segmentAId) {
              rowData[activeSeg.id] = renderCriterionDisplay(entry.segmentACriterion);
            } else if (activeSeg.id === rule.segmentBId) {
              rowData[activeSeg.id] = renderCriterionDisplay(entry.segmentBCriterion);
            } else {
              rowData[activeSeg.id] = "Any Valid Code";
            }
          });
          entriesToDisplay.push(rowData);
        }
      });
    });
    return entriesToDisplay;
  }, [selectedDate, combinationRules, getSegmentById, activeSegments]);

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
  
  const getStatusIndicator = (status: EffectiveStatus) => {
    switch(status) {
        case 'Effective': return <CheckCircle className="h-5 w-5 text-green-600" />;
        case 'Segment A Code Inactive':
        case 'Segment B Code Inactive':
        case 'Both Codes Inactive':
            return <XCircle className="h-5 w-5 text-red-600" />;
        case 'Code Validity Unknown':
            return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
        default: return null;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto"> {/* Increased max-width for wider table */}
      <Breadcrumbs items={breadcrumbItems} />
      <header className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary">
            Valid Combinations by Rule Entry
          </h1>
          <p className="text-md text-muted-foreground mt-1">
            Showing 'Include' rule entries from active rules, and their code validity as of <span className="font-semibold text-primary">{format(selectedDate, 'PPP')}</span>.
            <br/>"Any Valid Code" indicates the segment is not restricted by this specific 2-segment rule entry.
          </p>
        </div>
        <Button onClick={() => router.push('/configure/combination-rules')} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to All Rules
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Rule Entries Effective on {format(selectedDate, 'MM/dd/yyyy')}</CardTitle>
          <CardDescription>
            This table lists 'Include' mapping entries from active combination rules. The 'Effective Status' indicates if specific codes in the Segment A/B criteria are active on the selected date. 'Code Validity Unknown' applies if criteria are ranges/hierarchies or codes were not found.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {processedEntries.length > 0 ? (
            <ScrollArea className="w-full whitespace-nowrap">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Mapping Entry ID</TableHead>
                    <TableHead className="min-w-[200px]">Rule Name</TableHead>
                    {activeSegments.map(seg => (
                        <TableHead key={seg.id} className="min-w-[150px]">{seg.displayName}</TableHead>
                    ))}
                    <TableHead className="text-center min-w-[150px]">Effective Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedEntries.map(entry => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">{entry.id}</TableCell>
                      <TableCell>{entry.ruleName}</TableCell>
                      {activeSegments.map(seg => (
                        <TableCell key={`${entry.id}-${seg.id}`}>{entry[seg.id]}</TableCell>
                      ))}
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                           {getStatusIndicator(entry.effectiveStatus)}
                           <span className="text-xs mt-1">{entry.effectiveStatus}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No 'Include' rule entries are effectively active for the selected date, or no relevant rules configured.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
