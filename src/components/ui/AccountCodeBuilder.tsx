
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
  const [openPopovers, setOpenPopovers] = useState<Record<string, boolean>>({});

  const setPopoverState = (segmentId: string, isOpen: boolean) => {
    setOpenPopovers(prev => ({ ...prev, [segmentId]: isOpen }));
  };

  const handleSegmentChange = (segmentId: string, selectedCodeValue: string | undefined) => {
    const actualCodeToSet = selectedCodeValue === "_placeholder_clear_" ? undefined : selectedCodeValue;
    const newSelections = { ...value, [segmentId]: actualCodeToSet };
    const displayString = buildDisplayString(newSelections);
    onChange(newSelections, displayString);
    requestAnimationFrame(() => {
      setPopoverState(segmentId, false);
    });
  };

  const buildDisplayString = (selections: JournalEntryAccountCode): string => {
    return activeSegments
      .map((segment, index) => {
        const selectedCode = selections[segment.id] || '_'.repeat(segment.maxLength > 0 ? Math.max(1, segment.maxLength) : 4);
        const separator = index < activeSegments.length - 1 ? segment.separator : '';
        return `${selectedCode}${separator}`;
      })
      .join('');
  };

  const currentDisplayString = useMemo(() => {
    return buildDisplayString(value);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, activeSegments]);

  const isPreviewPlaceholder = useMemo(() => {
    return !activeSegments.some(seg => !!value[seg.id]);
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

          const triggerButtonText = selectedCodeObject
            ? selectedCodeObject.code
            : '_'.repeat(segment.maxLength > 0 ? Math.max(1, segment.maxLength) : 4);
          
          const uniquePopoverId = `${lineId}-${segment.id}-popover-content`;

          return (
            <React.Fragment key={`${lineId}-${segment.id}`}>
              <div className="flex flex-col">
                <Label
                  htmlFor={`${lineId}-${segment.id}-combobox-trigger`}
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
                      aria-controls={openPopovers[segment.id] ? uniquePopoverId : undefined}
                      id={`${lineId}-${segment.id}-combobox-trigger`}
                      className={cn(
                        "h-9 justify-between focus:bg-accent/50 font-mono",
                        `min-w-[${Math.max(60, segment.maxLength * 8 + 24)}px]` // Adjusted min-width slightly
                      )}
                      style={{ minWidth: `${Math.max(60, segment.maxLength * 8 + 24)}px`}} // Character width approx 8px, padding 24px
                      disabled={disabled}
                      aria-label={`Select ${segment.displayName}`}
                    >
                      <span className={cn("truncate", !selectedCodeObject && "text-muted-foreground/70")}>
                        {triggerButtonText}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent 
                    id={uniquePopoverId} 
                    className="p-0 w-auto min-w-[var(--radix-popover-trigger-width)] max-w-sm"
                    onPointerDownOutside={(e) => {
                      // If the click target is inside an element with 'cmdk-list' attribute (which cmdk uses)
                      // prevent the popover from closing, so the item's onSelect can fire.
                      if ((e.target as HTMLElement)?.closest('[cmdk-list=""]')) {
                        e.preventDefault();
                      }
                    }}
                  >
                    <Command
                      filter={(itemValue, search) => {
                        const codeObj = allSegmentCodes[segment.id]?.find(c => c.code === itemValue);
                        if (!codeObj) return 0;
                        const textToSearch = `${codeObj.code} ${codeObj.description}`.toLowerCase();
                        return textToSearch.includes(search.toLowerCase()) ? 1 : 0;
                      }}
                    >
                      <CommandInput placeholder={`Search ${segment.displayName}...`} />
                      <CommandList>
                        <ScrollArea className="max-h-60">
                           <CommandEmpty>No {segment.displayName} code found.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem
                              value="_placeholder_clear_"
                              onSelect={() => handleSegmentChange(segment.id, undefined)}
                              onPointerDown={(e) => e.preventDefault()}
                              className={cn("text-muted-foreground italic", !value[segment.id] && "bg-accent text-accent-foreground")}
                            >
                              <Check className={cn("mr-2 h-4 w-4", !value[segment.id] ? "opacity-100" : "opacity-0")} />
                              Clear selection
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
                                  onPointerDown={(e) => e.preventDefault()} // Keep this for good measure
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
            </React.Fragment>
          );
        })}
      </div>
      <Label className="text-xs text-muted-foreground">Full Account Code Preview:</Label>
      <div className="mt-1 p-2.5 border rounded-md bg-muted text-sm min-h-[40px] font-mono tracking-wider">
        {currentDisplayString ? (
          <span className={cn(isPreviewPlaceholder && "italic text-gray-400")}>
             {currentDisplayString}
          </span>
        ) : (
          <span className="italic text-gray-400">Select codes above to build the account string.</span>
        )}
      </div>
    </div>
  );
}
