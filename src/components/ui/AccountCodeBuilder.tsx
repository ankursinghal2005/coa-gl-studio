
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
        const selectedCode = selections[segment.id] || '';
        const separator = index < segments.length - 1 ? segment.separator : '';
        return `${selectedCode}${separator}`;
      })
      .join('');
  };

  const currentDisplayString = useMemo(() => buildDisplayString(value, activeSegments), [value, activeSegments]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-x-2 gap-y-3">
        {activeSegments.map((segment, index) => (
          <div key={`${lineId}-${segment.id}`} className="flex items-end space-x-1">
            <div className="flex-grow min-w-[120px]">
              <Label htmlFor={`${lineId}-${segment.id}-select`} className="text-xs text-muted-foreground">
                {segment.displayName}
              </Label>
              <Select
                value={value[segment.id] || ''}
                onValueChange={(val) => handleSegmentChange(segment.id, val === '_placeholder_' ? undefined : val)}
                disabled={disabled}
              >
                <SelectTrigger id={`${lineId}-${segment.id}-select`} className="h-9">
                  <SelectValue placeholder={`Select ${segment.codePlaceholder || 'Code'}`} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_placeholder_" disabled>Select Code...</SelectItem>
                  {(allSegmentCodes[segment.id] || [])
                    .filter(code => code.isActive)
                    .map((code) => (
                      <SelectItem key={code.id} value={code.code}>
                        {code.code} - {code.description}
                      </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {index < activeSegments.length - 1 && (
              <span className="pb-2 text-muted-foreground font-semibold">{segment.separator}</span>
            )}
          </div>
        ))}
      </div>
      {currentDisplayString && (
        <div className="mt-1 p-2 border rounded-md bg-muted text-sm text-muted-foreground">
          Preview: {currentDisplayString}
        </div>
      )}
    </div>
  );
}
