
'use client';

import React, { useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
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
import type { CombinationRule, CombinationRuleCriterion, CombinationRuleMappingEntry } from '@/lib/combination-rule-types';
import type { Segment, SegmentCode } from '@/lib/segment-types';
import { mockSegmentCodesData } from '@/lib/segment-types'; // Using mock data for code validity
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface ProcessedMappingEntry extends CombinationRuleMappingEntry {
  ruleName: string;
  segmentAName: string;
  segmentBName: string;
  statusOnDate: 'Effective' | 'Segment A Code Inactive' | 'Segment B Code Inactive' | 'Both Codes Inactive' | 'Code Validity Unknown';
}

const isCodeValidOnDate = (code: SegmentCode | undefined, targetDate: Date): boolean => {
  if (!code) return false; // If code itself is not found, it's not valid.
  if (!code.isActive) return false;
  
  const fromDate = new Date(code.validFrom);
  // If targetDate is before validFrom, it's not valid.
  if (targetDate.setHours(0,0,0,0) < fromDate.setHours(0,0,0,0)) return false;
  
  // If validTo exists and targetDate is after validTo, it's not valid.
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


const renderCriterionDisplay = (criterion: CombinationRuleCriterion, segmentName?: string): string => {
    const namePrefix = segmentName ? `${segmentName} ` : '';
    switch (criterion.type) {
      case 'CODE':
        return `${namePrefix}Code: ${criterion.codeValue}`;
      case 'RANGE':
        return `${namePrefix}Range: ${criterion.rangeStartValue} - ${criterion.rangeEndValue}`;
      case 'HIERARCHY_NODE':
        return `${namePrefix}Hierarchy Node: ${criterion.hierarchyNodeId}${criterion.includeChildren ? ' (and children)' : ''}`;
      default:
        return 'Invalid Criterion';
    }
};


export default function ViewValidCombinationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateString = searchParams.get('date');
  
  const { combinationRules } = useCombinationRules();
  const { getSegmentById } = useSegments();

  const selectedDate = useMemo(() => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  }, [dateString]);

  const processedEntries = useMemo(() => {
    if (!selectedDate) return [];

    const activeRules = combinationRules.filter(rule => rule.status === 'Active');
    const entries: ProcessedMappingEntry[] = [];

    activeRules.forEach(rule => {
      const segmentA = getSegmentById(rule.segmentAId);
      const segmentB = getSegmentById(rule.segmentBId);

      rule.mappingEntries.forEach(entry => {
        let statusOnDate: ProcessedMappingEntry['statusOnDate'] = 'Effective';
        let segmentAValid = true;
        let segmentBValid = true;

        if (entry.segmentACriterion.type === 'CODE' && entry.segmentACriterion.codeValue) {
          const codeA = getSegmentCode(rule.segmentAId, entry.segmentACriterion.codeValue);
          segmentAValid = codeA ? isCodeValidOnDate(codeA, selectedDate) : false;
           if (!codeA) statusOnDate = 'Code Validity Unknown'; // Code not found in mock data
        } else {
           // For RANGE or HIERARCHY_NODE, we simplify and assume validity if rule is active
           // A more robust solution would check all codes in range/hierarchy
           statusOnDate = 'Code Validity Unknown'; // Mark as unknown for non-CODE types for now
        }
        
        if (entry.segmentBCriterion.type === 'CODE' && entry.segmentBCriterion.codeValue) {
          const codeB = getSegmentCode(rule.segmentBId, entry.segmentBCriterion.codeValue);
          segmentBValid = codeB ? isCodeValidOnDate(codeB, selectedDate) : false;
          if (!codeB && statusOnDate !== 'Code Validity Unknown') statusOnDate = 'Code Validity Unknown';
        } else if (statusOnDate !== 'Code Validity Unknown') {
            // Also mark as unknown if Segment B is not a specific code.
           statusOnDate = 'Code Validity Unknown';
        }


        if (statusOnDate !== 'Code Validity Unknown') { // Only proceed if codes were found
            if (!segmentAValid && !segmentBValid) {
            statusOnDate = 'Both Codes Inactive';
            } else if (!segmentAValid) {
            statusOnDate = 'Segment A Code Inactive';
            } else if (!segmentBValid) {
            statusOnDate = 'Segment B Code Inactive';
            }
        }
        

        entries.push({
          ...entry,
          ruleName: rule.name,
          segmentAName: segmentA?.displayName || rule.segmentAId,
          segmentBName: segmentB?.displayName || rule.segmentBId,
          statusOnDate,
        });
      });
    });
    return entries;
  }, [selectedDate, combinationRules, getSegmentById]);

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
  
  const getStatusIndicator = (status: ProcessedMappingEntry['statusOnDate']) => {
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
    <div className="w-full max-w-6xl mx-auto">
      <Breadcrumbs items={breadcrumbItems} />
      <header className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary">
            Valid Combination Rule Entries
          </h1>
          <p className="text-md text-muted-foreground mt-1">
            Showing combination rule entries and their code validity as of <span className="font-semibold text-primary">{format(selectedDate, 'PPP')}</span>.
          </p>
        </div>
        <Button onClick={() => router.push('/configure/combination-rules')} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to All Rules
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Rule Entries Status on {format(selectedDate, 'MM/dd/yyyy')}</CardTitle>
          <CardDescription>
            This table lists mapping entries from active combination rules. The 'Status on Date' column indicates if the specific codes mentioned in an entry are active and valid on the selected date. 'Code Validity Unknown' means the criterion was not a specific code (e.g., a range or hierarchy node) or the code was not found, and its date validity cannot be determined with the current simplified logic.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {processedEntries.length > 0 ? (
            <ScrollArea className="w-full whitespace-nowrap">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rule Name</TableHead>
                    <TableHead>Behavior</TableHead>
                    <TableHead>Segment A Criterion</TableHead>
                    <TableHead>Segment B Criterion</TableHead>
                    <TableHead className="text-center">Status on Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedEntries.map(entry => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">{entry.ruleName}</TableCell>
                      <TableCell
                        className={entry.behavior === 'Include' ? 'text-green-600' : 'text-red-600'}
                      >
                        {entry.behavior}
                      </TableCell>
                      <TableCell>{renderCriterionDisplay(entry.segmentACriterion, entry.segmentAName)}</TableCell>
                      <TableCell>{renderCriterionDisplay(entry.segmentBCriterion, entry.segmentBName)}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                           {getStatusIndicator(entry.statusOnDate)}
                           <span className="text-xs mt-1">{entry.statusOnDate}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No active combination rule entries to display for the selected date, or no rules configured.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

    