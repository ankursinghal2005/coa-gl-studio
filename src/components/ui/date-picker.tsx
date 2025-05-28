
"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  value?: Date;
  onValueChange: (date?: Date) => void;
  placeholder?: string;
  disabled?: boolean; // For disabling the entire component/trigger
  disableDates?: (date: Date) => boolean; // For disabling specific dates in the calendar
}

export function DatePicker({ value, onValueChange, placeholder, disabled, disableDates }: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground"
          )}
          disabled={disabled} // Apply overall disabled state to the button
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, "PPP") : <span>{placeholder || "Pick a date"}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={value}
          onSelect={onValueChange}
          disabled={disableDates} // Pass specific date disabling logic to the calendar
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}

