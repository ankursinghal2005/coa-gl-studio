
'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
  lineId: string; // For generating unique IDs
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
  const [searchTermCache, setSearchTermCache] = useState<Record<string, string>>({});

  const setPopoverState = (segmentId: string, isOpen: boolean) => {
    setOpenPopovers(prev => ({ ...prev, [segmentId]: isOpen }));
    if (!isOpen) {
      setSearchTermCache(prev => ({...prev, [segmentId]: ''}));
    }
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
  
  const handleSegmentChange = (segmentId: string, selectedCodeValue: string | undefined) => {
    const actualCodeToSet = selectedCodeValue === "_placeholder_clear_" ? undefined : selectedCodeValue;
    const newSelections = { ...value, [segmentId]: actualCodeToSet };
    const displayString = buildDisplayString(newSelections);
    onChange(newSelections, displayString);
    
    // Defer closing the popover to ensure selection processing is complete
    requestAnimationFrame(() => {
      setPopoverState(segmentId, false);
    });
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
          
          const triggerButtonId = `${lineId}-${segment.id}-combobox-trigger`;
          const uniquePopoverId = `${lineId}-${segment.id}-popover-content`;
          const commandInputId = `${lineId}-${segment.id}-combobox-input`;

          return (
            <React.Fragment key={`${lineId}-${segment.id}`}>
              <div className="flex flex-col">
                <Label
                  htmlFor={triggerButtonId}
                  className="text-xs font-medium text-muted-foreground px-1 mb-0.5"
                >
                  {segment.displayName}
                </Label>
                <Popover 
                  open={openPopovers[segment.id] || false} 
                  onOpenChange={(isOpen) => {
                    setPopoverState(segment.id, isOpen);
                    if (isOpen) {
                      setTimeout(() => {
                        document.getElementById(commandInputId)?.focus();
                      }, 0);
                    }
                  }}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openPopovers[segment.id] || false}
                      aria-controls={openPopovers[segment.id] ? uniquePopoverId : undefined}
                      id={triggerButtonId}
                      className={cn(
                        "h-9 justify-between focus:bg-accent/50 font-mono max-w-[200px]",
                        !selectedCodeObject && "text-muted-foreground/70"
                      )}
                      style={{ minWidth: `${Math.max(60, (segment.maxLength > 0 ? segment.maxLength : 4) * 10 + 28)}px` }}
                      disabled={disabled}
                      aria-label={`Select ${segment.displayName}`}
                    >
                      <span className={cn("truncate")}>
                        {triggerButtonText}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent 
                    id={uniquePopoverId} 
                    className="p-0 w-auto min-w-[var(--radix-popover-trigger-width)] max-w-sm"
                    onPointerDownOutside={(event) => {
                      // If the click target is a CommandItem, prevent the Popover from closing.
                      // This allows CMDK's onSelect to fire and handle the logic,
                      // including programmatically closing the popover via handleSegmentChange.
                      if ((event.target as HTMLElement)?.closest('[data-cmdk-item="true"]')) {
                        event.preventDefault();
                      }
                    }}
                  >
                    <Command
                      filter={(itemValue, search) => {
                        const codeObj = allSegmentCodes[segment.id]?.find(c => c.code === itemValue);
                        if (!codeObj) return 0;
                        if (itemValue === "_placeholder_clear_" && "clear selection".includes(search.toLowerCase())) return 1;
                        const textToSearch = `${codeObj.code} ${codeObj.description}`.toLowerCase();
                        return textToSearch.includes(search.toLowerCase()) ? 1 : 0;
                      }}
                      value={searchTermCache[segment.id] || ''}
                      onValueChange={(currentSearchTerm) => {
                        setSearchTermCache(prev => ({...prev, [segment.id]: currentSearchTerm}));
                      }}
                    >
                      <CommandInput 
                        id={commandInputId}
                        placeholder={`Search ${segment.displayName}...`} 
                      />
                      <CommandList data-cmdk-list="true">
                        <ScrollArea className="max-h-60">
                           <CommandEmpty>No {segment.displayName} code found.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem
                              value="_placeholder_clear_"
                              onSelect={() => handleSegmentChange(segment.id, undefined)}
                              data-cmdk-item="true"
                              className={cn(
                                "text-muted-foreground italic hover:bg-accent/50 cursor-pointer",
                                !value[segment.id] && "bg-accent text-accent-foreground"
                              )}
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
                                  onSelect={() => {
                                    handleSegmentChange(segment.id, code.code);
                                  }}
                                  data-cmdk-item="true"
                                  className="hover:bg-accent/50 cursor-pointer"
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
        {activeSegments.length > 0 ? (
            <span className={cn(isPreviewPlaceholder && "italic text-muted-foreground/70")}>
                {currentDisplayString}
            </span>
        ) : (
          <span className="italic text-muted-foreground/70">No active segments configured.</span>
        )}
      </div>
    </div>
  );
}
    
