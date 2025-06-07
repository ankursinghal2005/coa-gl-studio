
'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, ChevronsUpDown } from 'lucide-react';
import type { Segment, SegmentCode } from '@/lib/segment-types';
import type { JournalEntryAccountCode } from '@/lib/journal-entry-types';
import { cn } from '@/lib/utils';

interface AccountCodeBuilderProps {
  value: JournalEntryAccountCode;
  onChange: (newSelections: JournalEntryAccountCode, displayString: string) => void;
  activeSegments: Segment[];
  allSegmentCodes: Record<string, SegmentCode[]>;
  disabled?: boolean;
  lineId: string; 
}

export function AccountCodeBuilder({
  value,
  onChange,
  activeSegments,
  allSegmentCodes,
  disabled,
  lineId,
}: AccountCodeBuilderProps) {
  // State to manage open/closed state of each segment's popover
  const [openPopovers, setOpenPopovers] = useState<Record<string, boolean>>({});

  const togglePopover = (segmentId: string) => {
    setOpenPopovers(prev => ({ ...prev, [segmentId]: !prev[segmentId] }));
  };

  const setPopoverState = (segmentId: string, isOpen: boolean) => {
    setOpenPopovers(prev => ({ ...prev, [segmentId]: isOpen }));
  };

  const handleSegmentChange = (segmentId: string, selectedCodeValue: string | undefined) => {
    const newSelections = { ...value, [segmentId]: selectedCodeValue };
    const displayString = buildDisplayString(newSelections);
    onChange(newSelections, displayString);
    setPopoverState(segmentId, false); // Close popover on select
  };

  const buildDisplayString = (selections: JournalEntryAccountCode): string => {
    return activeSegments
      .map((segment, index) => {
        const selectedCode = selections[segment.id] || '_'.repeat(segment.maxLength > 0 ? segment.maxLength : 4);
        const separator = index < activeSegments.length - 1 ? segment.separator : '';
        return `${selectedCode}${separator}`;
      })
      .join('');
  };

  const currentDisplayString = useMemo(() => {
    const hasSelection = activeSegments.some(seg => !!value[seg.id]);
    if (!hasSelection && activeSegments.length > 0) { // Show placeholder structure if no selections but segments exist
        return activeSegments.map((segment, index) => {
            const placeholder = '_'.repeat(segment.maxLength > 0 ? segment.maxLength : 4);
            const separator = index < activeSegments.length - 1 ? segment.separator : '';
            return `${placeholder}${separator}`;
        }).join('');
    }
    return buildDisplayString(value);
  }, [value, activeSegments]);

  return (
    <div className="space-y-3">
      <div
        className={cn(
          "flex flex-wrap items-end gap-x-1.5 gap-y-3 border p-3 rounded-lg bg-background shadow-sm",
          "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background"
        )}
      >
        {activeSegments.map((segment, index) => {
          const selectedCodeObject = value[segment.id]
            ? allSegmentCodes[segment.id]?.find(sc => sc.code === value[segment.id])
            : null;

          const selectedCodeDisplay = selectedCodeObject
            ? `${selectedCodeObject.code}` // Just the code on the button for brevity
            : (segment.codePlaceholder || "Code");

          return (
            <React.Fragment key={`${lineId}-${segment.id}`}>
              <div className="flex items-end">
                <div className="flex flex-col">
                  <Label
                    htmlFor={`${lineId}-${segment.id}-combobox`}
                    className="text-xs font-medium text-muted-foreground px-1 mb-0.5"
                  >
                    {segment.displayName}
                  </Label>
                  <Popover open={openPopovers[segment.id] || false} onOpenChange={(isOpen) => setPopoverState(segment.id, isOpen)}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openPopovers[segment.id] || false}
                        id={`${lineId}-${segment.id}-combobox`}
                        className="h-9 min-w-[100px] sm:min-w-[120px] justify-between focus:bg-accent/50"
                        disabled={disabled}
                        aria-label={`Select ${segment.displayName}`}
                      >
                        <span className="truncate w-full text-left">{selectedCodeDisplay}</span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0" style={{ width: 'var(--radix-popover-trigger-width)' }}>
                      <Command
                        filter={(itemValue, search) => {
                          const codeObj = allSegmentCodes[segment.id]?.find(c => c.code === itemValue);
                          if (!codeObj) return 0;
                          const textToSearch = `${codeObj.code} ${codeObj.description}`.toLowerCase();
                          return textToSearch.includes(search.toLowerCase()) ? 1 : 0;
                        }}
                      >
                        <CommandInput placeholder={`Search ${segment.displayName}...`} />
                        <CommandEmpty>No {segment.displayName} code found.</CommandEmpty>
                        <CommandList>
                          <ScrollArea className="max-h-60">
                            <CommandGroup>
                              <CommandItem
                                value="_placeholder_" 
                                onSelect={() => handleSegmentChange(segment.id, undefined)}
                                className={cn(!value[segment.id] && "bg-accent text-accent-foreground")}
                              >
                                <Check className={cn("mr-2 h-4 w-4", !value[segment.id] ? "opacity-100" : "opacity-0")} />
                                Select {segment.displayName} Code...
                              </CommandItem>
                              {(allSegmentCodes[segment.id] || [])
                                .filter(code => code.isActive)
                                .map((code) => (
                                  <CommandItem
                                    key={code.id}
                                    value={code.code}
                                    onSelect={(currentValue) => {
                                      handleSegmentChange(segment.id, currentValue);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        value[segment.id] === code.code ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {code.code} - {code.description}
                                  </CommandItem>
                                ))}
                            </CommandGroup>
                          </ScrollArea>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                {index < activeSegments.length - 1 && (
                  <span className="px-1.5 pb-[5px] text-muted-foreground font-semibold self-end text-lg">
                    {segment.separator}
                  </span>
                )}
              </div>
            </React.Fragment>
          );
        })}
      </div>
      <div className="mt-2 p-2.5 border rounded-md bg-muted text-sm text-muted-foreground min-h-[40px] font-mono tracking-wider">
        {currentDisplayString ? (
          <span className={cn(!activeSegments.some(seg => !!value[seg.id]) && "italic text-gray-500")}>
             {currentDisplayString}
          </span>
        ) : (
          <span className="italic text-gray-500">Select codes above to build the account string</span>
        )}
      </div>
    </div>
  );
}
