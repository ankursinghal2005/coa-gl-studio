
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, addMonths, startOfMonth, endOfMonth, getYear, subDays, addDays } from 'date-fns';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription as CardDesc } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CalendarCog, CalendarDays, CheckCircle2, XCircle, Clock, AlertTriangle, Lock, SlidersHorizontal } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useToast } from "@/hooks/use-toast"
import { FormattedDateTime } from '@/components/ui/FormattedDateTime';

const fiscalCalendarSchema = z.object({
  startMonth: z.string().min(1, "Start month is required."),
  startYear: z.coerce
    .number({ invalid_type_error: "Year must be a number." })
    .int()
    .min(1900, "Year must be 1900 or later.")
    .max(2100, "Year must be 2100 or earlier."),
  periodFrequency: z.enum(['Monthly', '4-4-5'] as [string, ...string[]], {
    required_error: "Period frequency is required.",
  }),
});

type FiscalCalendarFormValues = z.infer<typeof fiscalCalendarSchema>;

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const initialExampleCalendarConfig: FiscalCalendarFormValues = {
  startMonth: 'January',
  startYear: 2025,
  periodFrequency: 'Monthly' as 'Monthly' | '4-4-5',
};

const defaultFormValues: FiscalCalendarFormValues = initialExampleCalendarConfig;

export type PeriodStatus = 'Open' | 'Closed' | 'Future' | 'Adjustment' | 'Hard Closed';
export type PeriodAction = 'Open' | 'Close' | 'Hard Close' | 'Reopen';

const subledgerNames = ['General Ledger', 'Accounts Payable', 'Accounts Receivable'] as const;
export type SubledgerName = typeof subledgerNames[number];

interface DisplayPeriod {
  id: string;
  name: string;
  startDate?: Date;
  endDate?: Date;
  isAdhoc?: boolean;
  subledgerStatuses: Record<SubledgerName, PeriodStatus>;
}

interface DisplayFiscalYear {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  periods: DisplayPeriod[];
}

interface ActionDialogState {
  isOpen: boolean;
  periodId: string | null;
  periodName: string | null;
  subledgerName?: SubledgerName | null; // null for period-level actions
  currentStatus: PeriodStatus | null; // For subledger, its status. For period, its OVERALL status.
  fiscalYearId: string | null;
  availableActions: PeriodAction[];
}


const generateCalendarData = (
  config: FiscalCalendarFormValues,
  monthNames: string[]
): DisplayFiscalYear[] => {
  const yearsData: DisplayFiscalYear[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startMonthIndex = monthNames.indexOf(config.startMonth);
  if (startMonthIndex === -1) {
    console.error("Invalid start month in configuration:", config.startMonth);
    return [];
  }

  for (let i = 0; i < 3; i++) {
    const currentFYStartCalendarYear = config.startYear + i;
    let fyStartDate = new Date(currentFYStartCalendarYear, startMonthIndex, 1);
    fyStartDate.setHours(0,0,0,0);

    const periods: DisplayPeriod[] = [];
    let fyActualEndDate: Date;
    let fiscalYearLabel: string;

    const determineInitialStatus = (pStart?: Date, pEnd?: Date): PeriodStatus => {
        if (!pStart || !pEnd) return 'Future'; 
        if (today > pEnd) return "Closed";
        if (today < pStart) return "Future";
        return "Open";
    };
    
    const getDefaultSubledgerStatuses = (periodStartDate?: Date, periodEndDate?: Date): Record<SubledgerName, PeriodStatus> => {
        const initialStatus = determineInitialStatus(periodStartDate, periodEndDate);
        return {
            'General Ledger': initialStatus,
            'Accounts Payable': initialStatus,
            'Accounts Receivable': initialStatus,
        };
    };


    if (config.periodFrequency === 'Monthly') {
      fyActualEndDate = endOfMonth(addMonths(fyStartDate, 11));
      fiscalYearLabel = `FY${getYear(fyActualEndDate)}`;

      for (let m = 0; m < 12; m++) {
        const periodStart = startOfMonth(addMonths(fyStartDate, m));
        const periodEnd = endOfMonth(periodStart);
        
        periods.push({
          id: `${fiscalYearLabel}-P${m + 1}`,
          name: `${format(periodStart, 'MMM').toUpperCase()}-${fiscalYearLabel}`,
          startDate: periodStart,
          endDate: periodEnd,
          subledgerStatuses: getDefaultSubledgerStatuses(periodStart, periodEnd),
          isAdhoc: false,
        });
      }
    } else if (config.periodFrequency === '4-4-5') { 
      let currentPeriodStartDate = new Date(fyStartDate);
      fyActualEndDate = endOfMonth(addMonths(fyStartDate, 11)); 
      fiscalYearLabel = `FY${getYear(fyActualEndDate)}`;

      for (let q = 0; q < 4; q++) {
        const periodStart = new Date(currentPeriodStartDate);
        // Each quarter is 3 months
        const periodEnd = endOfMonth(addMonths(periodStart, 2));
        
        periods.push({
          id: `${fiscalYearLabel}-Q${q + 1}`,
          name: `Q${q + 1}-${fiscalYearLabel}`,
          startDate: periodStart,
          endDate: periodEnd,
          subledgerStatuses: getDefaultSubledgerStatuses(periodStart, periodEnd),
          isAdhoc: false,
        });
        currentPeriodStartDate = addDays(periodEnd, 1);
      }
    } else {
        console.error("Unknown period frequency:", config.periodFrequency);
        fyActualEndDate = endOfMonth(addMonths(fyStartDate, 11));
        fiscalYearLabel = `FY${getYear(fyActualEndDate)}`;
    }
    
    const adjPeriodSubledgerStatuses: Record<SubledgerName, PeriodStatus> = {
        'General Ledger': 'Adjustment',
        'Accounts Payable': 'Future', 
        'Accounts Receivable': 'Future',
    };
    const adjPeriod: DisplayPeriod = {
      id: `${fiscalYearLabel}-ADJ`,
      name: `ADJ-${fiscalYearLabel}`,
      startDate: undefined,
      endDate: undefined,
      subledgerStatuses: adjPeriodSubledgerStatuses,
      isAdhoc: true,
    };
    periods.push(adjPeriod);

    yearsData.push({
      id: fiscalYearLabel,
      name: fiscalYearLabel,
      startDate: fyStartDate,
      endDate: fyActualEndDate,
      periods: periods,
    });
  }
  return yearsData;
};


export default function FiscalPeriodsPage() {
  const [isConfigureDialogOpen, setIsConfigureDialogOpen] = useState(false);
  const [configuredCalendar, setConfiguredCalendar] = useState<FiscalCalendarFormValues>(initialExampleCalendarConfig);
  const [generatedFiscalYears, setGeneratedFiscalYears] = useState<DisplayFiscalYear[]>([]);
  const { toast } = useToast();

  const [actionDialogState, setActionDialogState] = useState<ActionDialogState>({
    isOpen: false,
    periodId: null,
    periodName: null,
    subledgerName: undefined,
    currentStatus: null,
    fiscalYearId: null,
    availableActions: [],
  });

  const form = useForm<FiscalCalendarFormValues>({
    resolver: zodResolver(fiscalCalendarSchema),
    defaultValues: defaultFormValues,
  });

  const onSubmitConfig = (values: FiscalCalendarFormValues) => {
    setConfiguredCalendar(values);
    toast({
      title: "Configuration Saved",
      description: `Calendar configured: Start ${values.startMonth} ${values.startYear}, Frequency: ${values.periodFrequency === '4-4-5' ? 'Quarterly (4 periods per FY)' : values.periodFrequency}.`,
    });
    setIsConfigureDialogOpen(false);
  };
  
  useEffect(() => {
    if (!configuredCalendar || !configuredCalendar.startMonth) {
      setGeneratedFiscalYears([]);
      return;
    }
    try {
      const data = generateCalendarData(configuredCalendar, months);
      setGeneratedFiscalYears(data);
    } catch (error) {
      console.error("Error generating fiscal calendar:", error);
      toast({
        title: "Error Generating Calendar",
        description: `Could not generate fiscal periods. ${error instanceof Error ? error.message : 'Unknown error.'}`,
        variant: "destructive",
      });
      setGeneratedFiscalYears([]);
    }
  }, [configuredCalendar, toast]); 

  const handleOpenConfigDialog = (mode: 'create' | 'edit') => {
    if (mode === 'edit' && configuredCalendar) {
      form.reset(configuredCalendar);
    } else {
      form.reset(defaultFormValues);
    }
    setIsConfigureDialogOpen(true);
  };

  const getStatusIconAndColor = (status: PeriodStatus): { Icon: LucideIcon, colorClass: string, title: string } => {
    switch (status) {
      case 'Open': return { Icon: CheckCircle2, colorClass: 'text-green-600', title: 'Open' };
      case 'Closed': return { Icon: XCircle, colorClass: 'text-red-600', title: 'Closed' };
      case 'Future': return { Icon: Clock, colorClass: 'text-yellow-500', title: 'Future' };
      case 'Adjustment': return { Icon: CalendarCog, colorClass: 'text-blue-500', title: 'Adjustment Period' };
      case 'Hard Closed': return { Icon: Lock, colorClass: 'text-destructive', title: 'Hard Closed' };
      default: return { Icon: AlertTriangle, colorClass: 'text-muted-foreground', title: 'Unknown' };
    }
  };

  const getOverallPeriodStatus = (period: DisplayPeriod): PeriodStatus => {
    if (period.isAdhoc) return period.subledgerStatuses['General Ledger'] || 'Adjustment'; 

    const statuses = Object.values(period.subledgerStatuses);
    if (statuses.every(s => s === 'Hard Closed')) return 'Hard Closed';
    if (statuses.every(s => s === 'Closed' || s === 'Hard Closed')) return 'Closed'; 
    if (statuses.some(s => s === 'Open')) return 'Open'; 
    if (statuses.every(s => s === 'Future' || s === 'Closed' || s === 'Hard Closed')) {
         if (statuses.every(s => s === 'Future')) return 'Future'; 
         if (statuses.some(s => s === 'Future')) return 'Future'; 
         return 'Closed'; 
    }
    return 'Open'; 
  };

  const getOverallFiscalYearStatus = (fiscalYear: DisplayFiscalYear): PeriodStatus => {
    const regularPeriods = fiscalYear.periods.filter(p => !p.isAdhoc);
    if (regularPeriods.length === 0) return 'Future';

    const overallPeriodStatuses = regularPeriods.map(p => getOverallPeriodStatus(p));

    if (overallPeriodStatuses.every(s => s === 'Hard Closed')) return 'Hard Closed';
    if (overallPeriodStatuses.every(s => s === 'Closed' || s === 'Hard Closed')) return 'Closed';
    if (overallPeriodStatuses.some(s => s === 'Open')) return 'Open';
    if (overallPeriodStatuses.every(s => s === 'Future')) return 'Future';
    
    if (overallPeriodStatuses.some(s => s === 'Future')) return 'Future';
    
    return 'Open';
  };

  const determineSubledgerActions = (
    period: DisplayPeriod,
    fiscalYear: DisplayFiscalYear,
    subledger: SubledgerName
  ): PeriodAction[] => {
    const currentSubledgerStatus = period.subledgerStatuses[subledger];
    let actions: PeriodAction[] = [];

    if (currentSubledgerStatus === 'Hard Closed') return [];

    if (period.isAdhoc) {
      if (subledger === 'General Ledger') {
        const allRegularGLClosedOrHardClosed = fiscalYear.periods.filter(p => !p.isAdhoc).every(p =>
          p.subledgerStatuses['General Ledger'] === 'Closed' || p.subledgerStatuses['General Ledger'] === 'Hard Closed'
        );
        if (['Adjustment', 'Future', 'Closed'].includes(currentSubledgerStatus)) {
          if (allRegularGLClosedOrHardClosed) actions.push('Open');
        } else if (currentSubledgerStatus === 'Open') {
          actions.push('Close');
          actions.push('Hard Close');
        }
      }
      // No actions for AP/AR in ADJ periods
    } else { // Regular periods
      const periodIndex = fiscalYear.periods.findIndex(p => p.id === period.id);
      switch (currentSubledgerStatus) {
        case 'Open':
          actions = ['Close', 'Hard Close'];
          break;
        case 'Closed':
          actions = ['Reopen', 'Hard Close'];
          break;
        case 'Future':
          if (subledger === 'General Ledger') {
            if (periodIndex > 0) {
              const previousPeriod = fiscalYear.periods[periodIndex - 1];
              if (!previousPeriod.isAdhoc && (previousPeriod.subledgerStatuses['General Ledger'] === 'Closed' || previousPeriod.subledgerStatuses['General Ledger'] === 'Hard Closed')) {
                actions.push('Open');
              }
            } else if (periodIndex === 0) {
              actions.push('Open');
            }
          } else { // For AP/AR in Future state
            actions.push('Open');
          }
          break;
        default:
          actions = [];
          break;
      }
    }
    return actions;
  };
  
  const handleSubledgerStatusClick = (period: DisplayPeriod, fiscalYearId: string, subledger: SubledgerName) => {
    const fy = generatedFiscalYears.find(f => f.id === fiscalYearId);
    if (!fy) {
      toast({ title: "Error", description: "Fiscal year not found.", variant: "destructive" });
      return;
    }
    const currentSubledgerStatus = period.subledgerStatuses[subledger];
    if (currentSubledgerStatus === 'Hard Closed') {
      toast({ title: "Action Denied", description: `${subledger} for period "${period.name}" is Hard Closed and cannot be modified.`, variant: "destructive" });
      return;
    }
    
    const actions = determineSubledgerActions(period, fy, subledger);
    
    setActionDialogState({
      isOpen: true,
      periodId: period.id,
      periodName: period.name,
      subledgerName: subledger,
      currentStatus: currentSubledgerStatus,
      fiscalYearId: fiscalYearId,
      availableActions: actions,
    });
  };
  
  const handleOverallPeriodClick = (period: DisplayPeriod, fiscalYearId: string) => {
    const overallStatus = getOverallPeriodStatus(period);
    if (overallStatus === 'Hard Closed') {
      toast({ title: "Action Denied", description: `Period "${period.name}" is Hard Closed and cannot be modified.`, variant: "destructive" });
      return;
    }

    let actions: PeriodAction[] = [];
    const fy = generatedFiscalYears.find(f => f.id === fiscalYearId);
    if (!fy) {
        toast({ title: "Error", description: "Fiscal year not found for period click.", variant: "destructive" });
        return;
    }

    if (period.isAdhoc) { // ADJ period specific overall actions (maps to its GL)
        const glStatus = period.subledgerStatuses['General Ledger'];
        const allRegularGLClosed = fy.periods.filter(p => !p.isAdhoc).every(p => 
            p.subledgerStatuses['General Ledger'] === 'Closed' || p.subledgerStatuses['General Ledger'] === 'Hard Closed'
        );
        if (['Adjustment', 'Future', 'Closed'].includes(glStatus)) {
            if (allRegularGLClosed) actions.push('Open');
        } else if (glStatus === 'Open') {
            actions.push('Close');
            actions.push('Hard Close');
        }
    } else { // Regular period overall actions
        switch (overallStatus) {
            case 'Open': actions = ['Close', 'Hard Close']; break;
            case 'Closed': actions = ['Reopen', 'Hard Close']; break;
            case 'Future': actions.push('Open'); break; // 'Open Period'
            default: actions = [];
        }
    }

    setActionDialogState({
      isOpen: true,
      periodId: period.id,
      periodName: period.name,
      subledgerName: null, // Indicate period-level action
      currentStatus: overallStatus,
      fiscalYearId: fiscalYearId,
      availableActions: actions,
    });
  };

  const performSubledgerAction = (
    targetFiscalYear: DisplayFiscalYear,
    targetPeriod: DisplayPeriod,
    subledger: SubledgerName,
    action: PeriodAction
  ): { success: boolean; message?: string; newStatus?: PeriodStatus } => {
    const currentStatus = targetPeriod.subledgerStatuses[subledger];
    let newStatus: PeriodStatus = currentStatus;
    let ruleViolationMessage: string | undefined;

    // Rule checks for General Ledger
    if (subledger === 'General Ledger') {
      const periodIndex = targetFiscalYear.periods.findIndex(p => p.id === targetPeriod.id);
      if (action === 'Close' && !targetPeriod.isAdhoc) {
        if (periodIndex > 0) {
          const prevPeriod = targetFiscalYear.periods[periodIndex - 1];
          if (!prevPeriod.isAdhoc && prevPeriod.subledgerStatuses['General Ledger'] !== 'Closed' && prevPeriod.subledgerStatuses['General Ledger'] !== 'Hard Closed') {
            ruleViolationMessage = `Cannot perform '${action}' on ${subledger} for period "${targetPeriod.name}". Rule: ${subledger} in the previous regular period ("${prevPeriod.name}") must be 'Closed' or 'Hard Closed' first.`;
          }
        }
      } else if (action === 'Open') {
        if (targetPeriod.isAdhoc) {
          const allRegularGLClosed = targetFiscalYear.periods.filter(p => !p.isAdhoc).every(p =>
            p.subledgerStatuses['General Ledger'] === 'Closed' || p.subledgerStatuses['General Ledger'] === 'Hard Closed'
          );
          if (!allRegularGLClosed) {
            ruleViolationMessage = `Cannot perform '${action}' on ${subledger} for ADJ period "${targetPeriod.name}". Rule: ${subledger} for all regular periods in ${targetFiscalYear.name} must be 'Closed' or 'Hard Closed' first.`;
          }
        } else if (currentStatus === 'Future' && periodIndex > 0) {
          const prevPeriod = targetFiscalYear.periods[periodIndex - 1];
          if (!prevPeriod.isAdhoc && prevPeriod.subledgerStatuses['General Ledger'] !== 'Closed' && prevPeriod.subledgerStatuses['General Ledger'] !== 'Hard Closed') {
            ruleViolationMessage = `Cannot perform '${action}' on ${subledger} for future period "${targetPeriod.name}". Rule: ${subledger} in the previous regular period ("${prevPeriod.name}") must be 'Closed' or 'Hard Closed' first.`;
          }
        }
      }
    }

    if (ruleViolationMessage) {
      return { success: false, message: ruleViolationMessage };
    }

    switch (action) {
      case 'Open': newStatus = 'Open'; break;
      case 'Close': newStatus = 'Closed'; break;
      case 'Hard Close': newStatus = 'Hard Closed'; break;
      case 'Reopen': newStatus = 'Open'; break;
    }
    
    // Create new objects for state update
    const newSubledgerStatuses = { ...targetPeriod.subledgerStatuses, [subledger]: newStatus };
    const updatedPeriod = { ...targetPeriod, subledgerStatuses: newSubledgerStatuses };
    
    const periodIndexToUpdate = targetFiscalYear.periods.findIndex(p => p.id === updatedPeriod.id);
    const newPeriods = [...targetFiscalYear.periods];
    newPeriods[periodIndexToUpdate] = updatedPeriod;
    
    // This function now returns the new status and expects the caller (handlePerformAction) to manage the main state.
    // Also, it means we need to find targetFiscalYear and targetPeriod again in handlePerformAction after this.
    // To avoid this, this function should directly mutate the passed (cloned) fiscal year.
    targetPeriod.subledgerStatuses[subledger] = newStatus;


    // Cascade for GL Close/HardClose
    if (subledger === 'General Ledger' && (newStatus === 'Closed' || newStatus === 'Hard Closed')) {
      if (targetPeriod.subledgerStatuses['Accounts Payable'] !== 'Hard Closed' && targetPeriod.subledgerStatuses['Accounts Payable'] !== 'Closed') {
        targetPeriod.subledgerStatuses['Accounts Payable'] = 'Closed';
      }
      if (targetPeriod.subledgerStatuses['Accounts Receivable'] !== 'Hard Closed' && targetPeriod.subledgerStatuses['Accounts Receivable'] !== 'Closed') {
        targetPeriod.subledgerStatuses['Accounts Receivable'] = 'Closed';
      }
    }
    
    // Cascade for GL Open (if it was Future and now Open, also Open AP/AR if they were Future)
    if (subledger === 'General Ledger' && newStatus === 'Open' && currentStatus === 'Future') {
        if(targetPeriod.subledgerStatuses['Accounts Payable'] === 'Future') {
            targetPeriod.subledgerStatuses['Accounts Payable'] = 'Open';
        }
        if(targetPeriod.subledgerStatuses['Accounts Receivable'] === 'Future') {
            targetPeriod.subledgerStatuses['Accounts Receivable'] = 'Open';
        }
    }


    return { success: true, newStatus };
  };

  const handlePerformAction = (action: PeriodAction) => {
    const { periodId, periodName, fiscalYearId, subledgerName, currentStatus: statusFromDialog } = actionDialogState;
    console.log(`Attempting Action: "${action}", Period: "${periodName}", Subledger: "${subledgerName || 'PERIOD-LEVEL'}", Current Overall/Subledger Status: "${statusFromDialog}"`);

    if (!periodId || !fiscalYearId || (!subledgerName && subledgerName !== null) || !statusFromDialog) {
        console.error("Missing details for operation:", actionDialogState);
        toast({title:"Error", description: "Action details missing for operation.", variant: "destructive"});
        return;
    }

    const confirmationMessage = subledgerName 
        ? `Are you sure you want to ${action.toLowerCase()} ${subledgerName} for period "${periodName}"?`
        : `Are you sure you want to ${action.toLowerCase()} period "${periodName}"? This may affect its subledgers.`;

    if (window.confirm(confirmationMessage)) {
        setGeneratedFiscalYears(prevYears => {
            const updatedYears = JSON.parse(JSON.stringify(prevYears)) as DisplayFiscalYear[];
            const targetFiscalYear = updatedYears.find(fy => fy.id === fiscalYearId);

            if (!targetFiscalYear) {
                console.error(`Critical Error: Fiscal year "${fiscalYearId}" not found during update.`);
                toast({ title: "Critical Error", description: `FY ${fiscalYearId} not found.`, variant: "destructive" });
                return prevYears;
            }

            const targetPeriod = targetFiscalYear.periods.find(p => p.id === periodId);
            if (!targetPeriod) {
                console.error(`Critical Error: Period "${periodId}" not found in FY "${fiscalYearId}" during update.`);
                toast({ title: "Critical Error", description: `Period ${periodId} not found.`, variant: "destructive" });
                return prevYears;
            }

            let mainActionResult: { success: boolean; message?: string; newStatus?: PeriodStatus } = { success: false };
            let finalToastMessage = "";

            if (subledgerName) { // Specific subledger action
                mainActionResult = performSubledgerAction(targetFiscalYear, targetPeriod, subledgerName, action);
                if (mainActionResult.success && mainActionResult.newStatus) {
                    finalToastMessage = `${subledgerName} for period "${periodName}" status changed to ${mainActionResult.newStatus}.`;
                    // Check for GL cascade message if applicable
                     if (subledgerName === 'General Ledger' && (mainActionResult.newStatus === 'Closed' || mainActionResult.newStatus === 'Hard Closed')) {
                        if (targetPeriod.subledgerStatuses['Accounts Payable'] === 'Closed' &&
                            targetPeriod.subledgerStatuses['Accounts Receivable'] === 'Closed') {
                             finalToastMessage += " AP and AR were also set to Closed.";
                        }
                    } else if (subledgerName === 'General Ledger' && mainActionResult.newStatus === 'Open' && statusFromDialog === 'Future') {
                         if(targetPeriod.subledgerStatuses['Accounts Payable'] === 'Open' && targetPeriod.subledgerStatuses['Accounts Receivable'] === 'Open') {
                             finalToastMessage += " AP and AR were also set to Open.";
                         }
                    }
                }
            } else { // Period-level action
                if (action === 'Close Period') {
                    mainActionResult = performSubledgerAction(targetFiscalYear, targetPeriod, 'General Ledger', 'Close');
                    if (mainActionResult.success) {
                        finalToastMessage = `Period "${periodName}" closed (GL, AP, AR set to Closed).`;
                    }
                } else if (action === 'Hard Close Period') {
                    let glHardCloseResult = performSubledgerAction(targetFiscalYear, targetPeriod, 'General Ledger', 'Hard Close');
                    if (glHardCloseResult.success) {
                        performSubledgerAction(targetFiscalYear, targetPeriod, 'Accounts Payable', 'Hard Close'); // Attempt, ignore result for now for simplicity
                        performSubledgerAction(targetFiscalYear, targetPeriod, 'Accounts Receivable', 'Hard Close');
                        mainActionResult = { success: true }; // Overall success if GL hard closed
                        finalToastMessage = `Period "${periodName}" hard closed (all subledgers attempted).`;
                    } else {
                        mainActionResult = glHardCloseResult; // Propagate GL failure
                    }
                } else if (action === 'Reopen Period') {
                    mainActionResult = performSubledgerAction(targetFiscalYear, targetPeriod, 'General Ledger', 'Reopen');
                     if (mainActionResult.success) {
                        finalToastMessage = `Period "${periodName}" reopened (GL set to Open). AP/AR may need individual reopening.`;
                    }
                } else if (action === 'Open Period') { // For Future or ADJ periods
                    mainActionResult = performSubledgerAction(targetFiscalYear, targetPeriod, 'General Ledger', 'Open');
                    if (mainActionResult.success) {
                        finalToastMessage = `Period "${periodName}" opened (GL, AP, AR set to Open).`;
                    }
                }
            }

            if (mainActionResult.success) {
                toast({ title: "Success", description: finalToastMessage || `Action "${action}" on "${periodName}" successful.` });
                return updatedYears;
            } else {
                toast({ title: "Action Failed", description: mainActionResult.message || `Could not perform '${action}' on ${subledgerName || 'period'} "${periodName}".`, variant: "destructive", duration: 7000 });
                return prevYears; // Return original state if action failed
            }
        });
        setActionDialogState({ isOpen: false, periodId: null, periodName: null, subledgerName: undefined, currentStatus: null, fiscalYearId: null, availableActions: [] });
    } else {
        console.log("User cancelled action.");
    }
};


  const breadcrumbItems = [
    { label: 'COA Configuration', href: '/' },
    { label: 'Settings', href: '/configure/settings' },
    { label: 'Fiscal Period Management' },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Breadcrumbs items={breadcrumbItems} />
      <header className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-primary flex items-center">
          <CalendarCog className="mr-3 h-7 w-7" />
          Fiscal Period Management
        </h1>
        <p className="text-md text-muted-foreground mt-1">
          Define and manage your organization's fiscal years and accounting periods, including subledger controls.
        </p>
      </header>

      <Card>
        <Accordion type="single" collapsible className="w-full" defaultValue="calendar-definition">
          <AccordionItem value="calendar-definition">
            <AccordionTrigger className="p-6 hover:no-underline">
              <div className="flex flex-col items-start text-left">
                <CardTitle>Accounting Calendar Definition</CardTitle>
                <CardDesc className="mt-1">
                  {configuredCalendar
                    ? 'View or edit your current accounting calendar configuration.'
                    : 'Configure the start date and period frequency for your primary accounting calendar.'}
                </CardDesc>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              {configuredCalendar ? (
                <div className="space-y-3 pt-2 border-t">
                  <h3 className="text-md font-semibold text-primary pt-3">Current Configuration:</h3>
                  <p className="text-sm">
                    <span className="font-medium text-muted-foreground">Start Date:</span> {configuredCalendar.startMonth} 1, {configuredCalendar.startYear}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium text-muted-foreground">Period Frequency:</span> {configuredCalendar.periodFrequency === '4-4-5' ? 'Quarterly (4 periods per FY)' : configuredCalendar.periodFrequency}
                  </p>
                  <Button onClick={() => handleOpenConfigDialog('edit')} className="mt-2">
                    Edit Configuration
                  </Button>
                </div>
              ) : (
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground pt-3">
                    Currently, no accounting calendar is defined. Click below to set it up.
                  </p>
                  <Button onClick={() => handleOpenConfigDialog('create')} className="mt-3">
                    Configure Accounting Calendar
                  </Button>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Card>

      {configuredCalendar && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <CalendarDays className="mr-2 h-6 w-6 text-primary" />
              Generated Fiscal Calendar
            </CardTitle>
            <CardDesc>
              Based on your configuration. Expand fiscal years to view periods and manage subledger statuses.
              Includes an Adjustment (ADJ) period for each year.
            </CardDesc>
          </CardHeader>
          <CardContent>
            {generatedFiscalYears.length > 0 ? (
              <Accordion type="multiple" className="w-full">
                {generatedFiscalYears.map((fy) => {
                  const overallFYStatus = getOverallFiscalYearStatus(fy);
                  const { Icon: FyIcon, colorClass: fyColorClass, title: fyTitle } = getStatusIconAndColor(overallFYStatus);
                  return (
                    <AccordionItem value={fy.id} key={fy.id}>
                      <AccordionTrigger>
                        <div className="flex justify-between items-center w-full text-left">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
                            <span className="font-semibold text-primary text-left">
                              {fy.name}
                            </span>
                            <span className="text-xs text-muted-foreground mt-1 sm:mt-0">
                              (<FormattedDateTime date={fy.startDate} formatString="MMM d, yyyy" /> - <FormattedDateTime date={fy.endDate} formatString="MMM d, yyyy" />)
                            </span>
                          </div>
                          <FyIcon className={`h-5 w-5 ml-auto sm:ml-4 mr-3 shrink-0 ${fyColorClass}`} title={fyTitle}/>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 pl-2 sm:pl-4 pt-2">
                          {fy.periods.map(period => {
                             const overallPeriodStatus = getOverallPeriodStatus(period);
                             const { Icon: PeriodOverallIcon, colorClass: periodOverallColorClass, title: periodOverallTitle } = getStatusIconAndColor(overallPeriodStatus);
                            return (
                            <Card key={period.id} className="p-3 shadow-sm bg-card hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-center mb-2">
                                   <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
                                      <span 
                                        className="text-sm font-medium text-primary/90 cursor-pointer hover:underline"
                                        onClick={() => handleOverallPeriodClick(period, fy.id)}
                                        title={`Manage Period: ${period.name}`}
                                      >
                                        {period.name}
                                      </span>
                                       <span className="text-xs text-muted-foreground mt-0.5 sm:mt-0">
                                          {period.startDate && period.endDate ? (
                                            <>(<FormattedDateTime date={period.startDate} formatString="MMM d" /> - <FormattedDateTime date={period.endDate} formatString="MMM d, yyyy" />)</>
                                          ) : (
                                            <>(No Date Range)</>
                                          )}
                                        </span>
                                  </div>
                                  <PeriodOverallIcon className={`h-5 w-5 shrink-0 ${periodOverallColorClass}`} title={`Overall Period Status: ${periodOverallTitle}`} />
                                </div>
                                <div className="space-y-1.5 pl-3 border-l-2 border-border ml-1 pt-1">
                                  {subledgerNames.map(subledger => {
                                    const subStatus = period.subledgerStatuses[subledger];
                                    const { Icon: SubIcon, colorClass: subColorClass, title: subTitle } = getStatusIconAndColor(subStatus);
                                    const isSubledgerClickable = !(period.isAdhoc && (subledger === 'Accounts Payable' || subledger === 'Accounts Receivable'));
                                    
                                    return (
                                      <div key={subledger} className="flex justify-between items-center text-xs py-0.5">
                                        <button 
                                          onClick={() => isSubledgerClickable && handleSubledgerStatusClick(period, fy.id, subledger)}
                                          className={` ${isSubledgerClickable && subStatus !== 'Hard Closed' ? 'text-muted-foreground hover:text-accent-foreground cursor-pointer' : 'text-muted-foreground/70 cursor-default'}`}
                                          disabled={!isSubledgerClickable || subStatus === 'Hard Closed'}
                                          title={isSubledgerClickable && subStatus !== 'Hard Closed' ? `Manage ${subledger} status` : `${subledger} status is ${subTitle}`}
                                        >
                                          {subledger}
                                        </button>
                                        <SubIcon className={`h-4 w-4 shrink-0 ${subColorClass}`} title={subTitle}/>
                                      </div>
                                    );
                                  })}
                                </div>
                            </Card>
                          )})}
                          {fy.periods.length === 0 && <p className="text-sm text-muted-foreground p-2">No periods generated for this fiscal year.</p>}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                {configuredCalendar ? 'No fiscal periods generated. Check configuration or dates.' : 'Please configure the accounting calendar to view periods.'}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={isConfigureDialogOpen} onOpenChange={setIsConfigureDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {configuredCalendar && !form.formState.isDirty && configuredCalendar.startMonth === form.getValues().startMonth && configuredCalendar.startYear === form.getValues().startYear && configuredCalendar.periodFrequency === form.getValues().periodFrequency
                ? 'View/Edit Accounting Calendar' 
                : (configuredCalendar ? 'Edit Accounting Calendar' : 'Configure Accounting Calendar')
              }
            </DialogTitle>
            <DialogDescription>
              Set the start date and period frequency. The start day is always the 1st of the month.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitConfig)} className="space-y-6 py-2">
              <FormField
                control={form.control}
                name="startMonth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Month *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select start month" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {months.map((month) => (
                          <SelectItem key={month} value={month}>
                            {month}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="startYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Year *</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Enter start year (e.g., 2024)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="periodFrequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Period Frequency *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select period frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Monthly">Monthly</SelectItem>
                        <SelectItem value="4-4-5">Quarterly (4 periods per FY)</SelectItem> 
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-4">
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit">Save Configuration</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={actionDialogState.isOpen} onOpenChange={(isOpen) => setActionDialogState(prev => ({ ...prev, isOpen }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Manage Status: {actionDialogState.subledgerName ? `${actionDialogState.subledgerName} for ` : 'Period: '}
              {actionDialogState.periodName}
            </DialogTitle>
            <DialogDescription>
              Current Status: <span className="font-semibold">{actionDialogState.currentStatus}</span>. Select an action.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {actionDialogState.availableActions.map(action => {
              const buttonText = actionDialogState.subledgerName ? `${action} ${actionDialogState.subledgerName}` : `${action} Period`;
              return (
                <Button
                  key={action}
                  onClick={() => handlePerformAction(action)}
                  className="w-full"
                  variant={action === 'Hard Close' || action === 'Close' ? 'destructive' : (action === 'Reopen' ? 'outline' : 'default')}
                >
                  {buttonText}
                </Button>
              );
            })}
            {actionDialogState.availableActions.length === 0 && (
                <p className="text-sm text-muted-foreground text-center">No actions available for this {actionDialogState.subledgerName ? 'subledger' : 'period'} in its current state or due to other period statuses.</p>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

