
'use client';

import React, { useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { Segment, SegmentCode } from '@/lib/segment-types';
import type { JournalEntryAccountCode } from '@/lib/journal-entry-types';
import { cn } from '@/lib/utils';

interface AccountCodeBuilderProps {
  value: JournalEntryAccountCode;
  onChange: (newSelections: JournalEntryAccountCode, displayString: string) => void;
  activeSegments: Segment[];
  allSegmentCodes: Record<string, SegmentCode[]>;
  disabled?: boolean;
  lineId: string; // Unique ID for the line, used for generating unique keys for selects
}

export function AccountCodeBuilder({
  value,
  onChange,
  activeSegments,
  allSegmentCodes,
  disabled,
  lineId, 
}: AccountCodeBuilderProps) {

  const handleSegmentChange = (segmentId: string, selectedCodeValue: string | undefined) => {
    const newSelections = { ...value, [segmentId]: selectedCodeValue };
    const displayString = buildDisplayString(newSelections, activeSegments);
    onChange(newSelections, displayString);
  };

  const buildDisplayString = (
    selections: JournalEntryAccountCode,
    segments: Segment[]
  ): string => {
    return segments
      .map((segment, index) => {
        const selectedCode = selections[segment.id] || '_'.repeat(segment.maxLength > 0 ? segment.maxLength : 4); // Use underscores for unselected
        const separator = index < segments.length - 1 ? segment.separator : '';
        return `${selectedCode}${separator}`;
      })
      .join('');
  };

  const currentDisplayString = useMemo(() => {
     const hasSelection = activeSegments.some(seg => !!value[seg.id]);
     if (!hasSelection) return '';
     return buildDisplayString(value, activeSegments)
  }, [value, activeSegments]);

  return (
    <div className="space-y-2">
      <div 
        className={cn(
          "flex flex-wrap items-end gap-x-1.5 gap-y-2 border p-3 rounded-lg bg-background shadow-sm",
          "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background"
        )}
      >
        {activeSegments.map((segment, index) => (
          <React.Fragment key={`${lineId}-${segment.id}`}>
            <div className="flex items-end">
              <div className="flex flex-col">
                <Label 
                  htmlFor={`${lineId}-${segment.id}-select`} 
                  className="text-xs font-medium text-muted-foreground px-1 mb-0.5"
                >
                  {segment.displayName}
                </Label>
                <Select
                  value={value[segment.id] || ''}
                  onValueChange={(val) => handleSegmentChange(segment.id, val === '_placeholder_' ? undefined : val)}
                  disabled={disabled}
                >
                  <SelectTrigger 
                    id={`${lineId}-${segment.id}-select`} 
                    className="h-9 min-w-[100px] sm:min-w-[120px] focus:bg-accent/50"
                    aria-label={`Select ${segment.displayName}`}
                  >
                    <SelectValue placeholder={segment.codePlaceholder || "Code"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_placeholder_" disabled>Select {segment.displayName} Code...</SelectItem>
                    {(allSegmentCodes[segment.id] || [])
                      .filter(code => code.isActive) // Add more filters if needed, e.g., based on summaryIndicator
                      .map((code) => (
                        <SelectItem key={code.id} value={code.code}>
                          {code.code} - {code.description}
                        </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {index < activeSegments.length - 1 && (
                <span className="px-1.5 pb-[5px] text-muted-foreground font-semibold self-end text-lg"> {/* Adjusted for alignment */}
                  {segment.separator}
                </span>
              )}
            </div>
          </React.Fragment>
        ))}
      </div>
      <div className="mt-2 p-2.5 border rounded-md bg-muted text-sm text-muted-foreground min-h-[40px] font-mono tracking-wider">
        {currentDisplayString ? (
          <span className="text-foreground">{currentDisplayString}</span>
        ) : (
          <span className="italic text-gray-500">Select codes above to build the account string</span>
        )}
      </div>
    </div>
  );
}
