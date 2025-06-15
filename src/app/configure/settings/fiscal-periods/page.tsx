
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
  subledgerStatuses: Partial<Record<SubledgerName, PeriodStatus>>;
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
  subledgerName: SubledgerName | null; 
  currentStatus: PeriodStatus | null;
  fiscalYearId: string | null;
  availableActions: PeriodAction[];
  isAdhocPeriod?: boolean; 
}

interface ActionFeedback {
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
  duration?: number;
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
    throw new Error("Invalid start month specified in configuration.");
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
    
    const adjPeriod: DisplayPeriod = {
      id: `${fiscalYearLabel}-ADJ`,
      name: `ADJ-${fiscalYearLabel}`,
      startDate: undefined, 
      endDate: undefined,   
      subledgerStatuses: { 'General Ledger': 'Future' }, 
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
  const [calendarGenerationError, setCalendarGenerationError] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<ActionFeedback | null>(null);


  const [actionDialogState, setActionDialogState] = useState<ActionDialogState>({
    isOpen: false,
    periodId: null,
    periodName: null,
    subledgerName: null,
    currentStatus: null,
    fiscalYearId: null,
    availableActions: [],
    isAdhocPeriod: false,
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
      setCalendarGenerationError(null);
      return;
    }
    try {
      const data = generateCalendarData(configuredCalendar, months);
      setGeneratedFiscalYears(data);
      setCalendarGenerationError(null); 
    } catch (error) {
      console.error("Error generating fiscal calendar:", error);
      const errorMessage = `Could not generate fiscal periods. ${error instanceof Error ? error.message : 'Unknown error.'}`;
      setCalendarGenerationError(errorMessage);
      setGeneratedFiscalYears([]);
    }
  }, [configuredCalendar]); 

  useEffect(() => {
    if (calendarGenerationError) {
      toast({
        title: "Error Generating Calendar",
        description: calendarGenerationError,
        variant: "destructive",
      });
    }
  }, [calendarGenerationError, toast]);
  
  useEffect(() => {
    if (actionFeedback) {
      toast({
        title: actionFeedback.title,
        description: actionFeedback.description,
        variant: actionFeedback.variant,
        duration: actionFeedback.duration,
      });
      setActionFeedback(null); 
    }
  }, [actionFeedback, toast]);


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
    if (period.isAdhoc) {
      return period.subledgerStatuses['General Ledger'] || 'Future'; 
    }
    const statuses = Object.values(period.subledgerStatuses);
    if (statuses.length === 0) return 'Future';
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
    const allPeriodStatuses = fiscalYear.periods.map(p => getOverallPeriodStatus(p));
    if (allPeriodStatuses.every(s => s === 'Hard Closed')) return 'Hard Closed';
    if (allPeriodStatuses.every(s => s === 'Closed' || s === 'Hard Closed')) return 'Closed';
    if (allPeriodStatuses.some(s => s === 'Open')) return 'Open';
    if (allPeriodStatuses.every(s => s === 'Future')) return 'Future';
    if (allPeriodStatuses.some(s => s === 'Future')) return 'Future';
    return 'Open';
  };

  const determineSubledgerActions = (
    period: DisplayPeriod,
    fiscalYear: DisplayFiscalYear,
    subledger: SubledgerName
  ): PeriodAction[] => {
    if (period.isAdhoc) {
      if (subledger !== 'General Ledger') return []; 
      const glStatus = period.subledgerStatuses['General Ledger'];
      if (glStatus === 'Hard Closed') return [];

      if (glStatus === 'Future') {
        const allRegularGLsClosed = fiscalYear.periods
            .filter(p => !p.isAdhoc)
            .every(p => p.subledgerStatuses['General Ledger'] === 'Closed' || p.subledgerStatuses['General Ledger'] === 'Hard Closed');
        return allRegularGLsClosed ? ['Open'] : [];
      }
      if (glStatus === 'Open') return ['Close', 'Hard Close'];
      if (glStatus === 'Closed') return ['Reopen', 'Hard Close'];
      return [];
    }

    const currentSubledgerStatus = period.subledgerStatuses[subledger];
    if (currentSubledgerStatus === 'Hard Closed') return [];

    let actions: PeriodAction[] = [];
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
          // Allow opening GL for a future period regardless of previous period status
 if (periodIndex >= 0) { // Can open any future GL period
            actions.push('Open');
          }
        } else { 
          actions.push('Open');
        }
        break;
      default:
        actions = [];
        break;
    }
    return actions;
  };
  
  const handleSubledgerStatusClick = (period: DisplayPeriod, fiscalYearId: string, subledger: SubledgerName) => {
    const fy = generatedFiscalYears.find(f => f.id === fiscalYearId);
    if (!fy) {
      setActionFeedback({ title: "Error", description: "Fiscal year not found.", variant: "destructive", type: 'error' });
      return;
    }

    const currentSubledgerStatus = period.subledgerStatuses[subledger];
    if (currentSubledgerStatus === 'Hard Closed') {
      setActionFeedback({ title: "Action Denied", description: `${subledger} for period "${period.name}" is Hard Closed and cannot be modified.`, variant: "destructive", type: 'error' });
      return;
    }
    
    const actions = determineSubledgerActions(period, fy, subledger);
    
    setActionDialogState({
      isOpen: true,
      periodId: period.id,
      periodName: period.name,
      subledgerName: subledger, 
      currentStatus: currentSubledgerStatus || null,
      fiscalYearId: fiscalYearId,
      availableActions: actions,
      isAdhocPeriod: period.isAdhoc,
    });
  };
  
  const handleOverallPeriodClick = (period: DisplayPeriod, fiscalYearId: string) => {
    const fy = generatedFiscalYears.find(f => f.id === fiscalYearId);
    if (!fy) {
      setActionFeedback({ title: "Error", description: "Fiscal year not found.", variant: "destructive", type: 'error' });
      return;
    }

    if (period.isAdhoc) {
        handleSubledgerStatusClick(period, fiscalYearId, 'General Ledger');
        return;
    }
    
    const overallStatus = getOverallPeriodStatus(period);
    if (overallStatus === 'Hard Closed') {
      setActionFeedback({ title: "Action Denied", description: `Period "${period.name}" is Hard Closed and cannot be modified.`, variant: "destructive", type: 'error' });
      return;
    }

    let actions: PeriodAction[] = [];
    switch (overallStatus) {
        case 'Open': actions = ['Close', 'Hard Close']; break;
        case 'Closed': actions = ['Reopen', 'Hard Close']; break;
        case 'Future': 
            // Allow opening an overall future period, which implies opening GL (and potentially others)
 actions.push('Open');
            break;
        default: actions = [];
    }
    
    setActionDialogState({
      isOpen: true,
      periodId: period.id,
      periodName: period.name,
      subledgerName: null, 
      currentStatus: overallStatus,
      fiscalYearId: fiscalYearId,
      availableActions: actions,
      isAdhocPeriod: period.isAdhoc, 
    });
  };

  const performSubledgerAction = (
    targetFiscalYear: DisplayFiscalYear,
    targetPeriod: DisplayPeriod,
    subledger: SubledgerName,
    action: PeriodAction,
    isAdhocContext: boolean 
  ): { success: boolean; message?: string; newStatus?: PeriodStatus } => {
    const originalStatus = targetPeriod.subledgerStatuses[subledger];
    let newStatus: PeriodStatus = originalStatus || 'Future'; 
    let ruleViolationMessage: string | undefined;

    if (subledger === 'General Ledger') {
      const periodIndex = targetFiscalYear.periods.findIndex(p => p.id === targetPeriod.id);
      if (action === 'Close' && !isAdhocContext) { 
       // No rule preventing close based on next period, only previous
      } else if (action === 'Open') { // Removed the previous period check for 'Open' action
        if (isAdhocContext) { 
          const allRegularGLsClosed = targetFiscalYear.periods
            .filter(p => !p.isAdhoc)
            .every(p => p.subledgerStatuses['General Ledger'] === 'Closed' || p.subledgerStatuses['General Ledger'] === 'Hard Closed');
          if (!allRegularGLsClosed) {
            ruleViolationMessage = `Cannot open General Ledger for ADJ period "${targetPeriod.name}" until all regular periods' General Ledger in this fiscal year are 'Closed' or 'Hard Closed'.`;
          }
        } else if (originalStatus === 'Closed' && !isAdhocContext) { 
            const adjPeriodForFY = targetFiscalYear.periods.find(p => p.isAdhoc);
            if (adjPeriodForFY && adjPeriodForFY.subledgerStatuses['General Ledger'] && adjPeriodForFY.subledgerStatuses['General Ledger'] !== 'Future') {
                ruleViolationMessage = `Cannot reopen General Ledger for regular period "${targetPeriod.name}" because the Adjustment Period for ${targetFiscalYear.name} has already been processed (status: ${adjPeriodForFY.subledgerStatuses['General Ledger']}). Manage the ADJ period first if needed.`;
            }
        }
      }
    }


    if (ruleViolationMessage) {
      console.error("Rule violation for subledger action:", ruleViolationMessage);
      return { success: false, message: ruleViolationMessage };
    }

    switch (action) {
      case 'Open': newStatus = 'Open'; break;
      case 'Close': newStatus = 'Closed'; break;
      case 'Hard Close': newStatus = 'Hard Closed'; break;
      case 'Reopen': newStatus = 'Open'; break;
    }
    
    const updatedSubledgerStatuses = { ...targetPeriod.subledgerStatuses, [subledger]: newStatus };
    let cascadedMessagePart = "";

    if (!isAdhocContext) {
        if (subledger === 'General Ledger' && (newStatus === 'Closed' || newStatus === 'Hard Closed')) {
          let apChanged = false, arChanged = false;
          if (updatedSubledgerStatuses['Accounts Payable'] !== 'Hard Closed') {
            updatedSubledgerStatuses['Accounts Payable'] = 'Closed';
            apChanged = true;
          }
          if (updatedSubledgerStatuses['Accounts Receivable'] !== 'Hard Closed') {
            updatedSubledgerStatuses['Accounts Receivable'] = 'Closed';
            arChanged = true;
          }
          if (apChanged || arChanged) {
              cascadedMessagePart = ` Also, ${apChanged ? "AP" : ""}${apChanged && arChanged ? " and " : ""}${arChanged ? "AR" : ""} automatically set to Closed.`;
          }
        } else if (subledger === 'General Ledger' && newStatus === 'Open') {
            let apChanged = false, arChanged = false;
            if(originalStatus === 'Future' && updatedSubledgerStatuses['Accounts Payable'] === 'Future') { 
                updatedSubledgerStatuses['Accounts Payable'] = 'Open';
                apChanged = true;
            } else if (originalStatus === 'Closed' && targetPeriod.subledgerStatuses['Accounts Payable'] === 'Closed') {
                 updatedSubledgerStatuses['Accounts Payable'] = 'Open';
                 apChanged = true;
            }

            if(originalStatus === 'Future' && updatedSubledgerStatuses['Accounts Receivable'] === 'Future') {
                updatedSubledgerStatuses['Accounts Receivable'] = 'Open';
                arChanged = true;
            } else if (originalStatus === 'Closed' && targetPeriod.subledgerStatuses['Accounts Receivable'] === 'Closed') {
                updatedSubledgerStatuses['Accounts Receivable'] = 'Open';
                arChanged = true;
            }
            if (apChanged || arChanged) {
               cascadedMessagePart = ` Also, ${apChanged ? "AP" : ""}${apChanged && arChanged ? " and " : ""}${arChanged ? "AR" : ""} automatically set to Open.`;
            }
        }
    }
    
    targetPeriod.subledgerStatuses = updatedSubledgerStatuses;
    return { success: true, newStatus, message: cascadedMessagePart };
  };

  const handlePerformAction = (action: PeriodAction) => {
    const { periodId, periodName, fiscalYearId, subledgerName, isAdhocPeriod } = actionDialogState;

    if (!periodId || !fiscalYearId ) {
        console.error("ACTION_ERROR: Missing details for operation in dialog state:", actionDialogState);
        setActionFeedback({title:"Error", description: "Action details missing for operation.", variant: "destructive", type: 'error'});
        return;
    }

    setGeneratedFiscalYears(prevYears => {
      const updatedYears = JSON.parse(JSON.stringify(prevYears)) as DisplayFiscalYear[]; 
      const targetFiscalYearIndex = updatedYears.findIndex(fy => fy.id === fiscalYearId);

      if (targetFiscalYearIndex === -1) {
          console.error(`CRITICAL_ERROR: Fiscal year "${fiscalYearId}" not found during update.`);
          setActionFeedback({ title: "Critical Error", description: `FY ${fiscalYearId} not found. Cannot perform action.`, variant: "destructive", type: 'error' });
          return prevYears; 
      }
      const targetFiscalYear = updatedYears[targetFiscalYearIndex];
      const targetPeriodIndex = targetFiscalYear.periods.findIndex(p => p.id === periodId);

      if (targetPeriodIndex === -1) {
          console.error(`CRITICAL_ERROR: Period "${periodId}" not found in FY "${fiscalYearId}" during update.`);
          setActionFeedback({ title: "Critical Error", description: `Period ${periodId} not found in ${fiscalYearId}. Cannot perform action.`, variant: "destructive", type: 'error' });
          return prevYears; 
      }
      
      let periodToUpdate: DisplayPeriod = targetFiscalYear.periods[targetPeriodIndex];

      let mainActionResult: { success: boolean; message?: string; newStatus?: PeriodStatus } = { success: false, message: "Action not processed." };
      let finalToastMessage = "";

      if (subledgerName) { 
          mainActionResult = performSubledgerAction(targetFiscalYear, periodToUpdate, subledgerName, action, !!periodToUpdate.isAdhoc);
          if (mainActionResult.success && mainActionResult.newStatus) {
              finalToastMessage = `${subledgerName} for period "${periodName}" status changed to ${mainActionResult.newStatus}.${mainActionResult.message || ""}`;
          }
      } else { 
          const effectiveSubledgerForPeriodAction = 'General Ledger'; 
          
          if (action === 'Close') {
              mainActionResult = performSubledgerAction(targetFiscalYear, periodToUpdate, effectiveSubledgerForPeriodAction, 'Close', false);
              if (mainActionResult.success) finalToastMessage = `Period "${periodName}" closed (GL set to ${periodToUpdate.subledgerStatuses['General Ledger']}).${mainActionResult.message || ""}`;
          } else if (action === 'Hard Close') {
              let allHardClosedSuccessfully = true;
              const subledgersToHardClose: SubledgerName[] = ['General Ledger', 'Accounts Payable', 'Accounts Receivable'];
              
              for (const sl of subledgersToHardClose) {
                  if (periodToUpdate.subledgerStatuses[sl] !== 'Hard Closed') {
                      const res = performSubledgerAction(targetFiscalYear, periodToUpdate, sl, 'Hard Close', false);
                      if (!res.success) {
                          allHardClosedSuccessfully = false;
                          mainActionResult = { success: false, message: res.message || `Failed to hard close ${sl} for period ${periodName}.`};
                          break;
                      }
                  }
              }
              if (allHardClosedSuccessfully) {
                   mainActionResult = { success: true };
                   finalToastMessage = `Period "${periodName}" hard closed (all subledgers attempted).`;
              }
          } else if (action === 'Reopen') {
              mainActionResult = performSubledgerAction(targetFiscalYear, periodToUpdate, effectiveSubledgerForPeriodAction, 'Reopen', false);
              if (mainActionResult.success) finalToastMessage = `Period "${periodName}" reopened (GL set to Open).${mainActionResult.message || ""}`;
          } else if (action === 'Open') { 
              mainActionResult = performSubledgerAction(targetFiscalYear, periodToUpdate, effectiveSubledgerForPeriodAction, 'Open', false);
              if (mainActionResult.success) finalToastMessage = `Period "${periodName}" opened (GL, AP, AR set to Open).${mainActionResult.message || ""}`;
          }
      }

      if (mainActionResult.success) {
          setActionFeedback({ title: "Success", description: finalToastMessage || `Action "${action}" on "${periodName}" successful.`, type: 'success' });
          updatedYears[targetFiscalYearIndex].periods[targetPeriodIndex] = periodToUpdate;
          return updatedYears;
      } else {
          setActionFeedback({ title: "Action Failed", description: mainActionResult.message || `Could not perform '${action}' on ${subledgerName || 'period'} "${periodName}".`, variant: "destructive", duration: 7000, type: 'error' });
          return prevYears; 
      }
    });
    setActionDialogState({ isOpen: false, periodId: null, periodName: null, subledgerName: null, currentStatus: null, fiscalYearId: null, availableActions: [], isAdhocPeriod: false });
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
              Based on your configuration. Expand fiscal years, then periods, to view and manage subledger statuses.
              ADJ periods are for year-end adjustments and only manage General Ledger status.
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
                      <AccordionContent className="pl-2 sm:pl-4 pt-2">
                        <Accordion type="multiple" className="w-full space-y-2">
                            {fy.periods.map(period => {
                                const overallPeriodStatus = getOverallPeriodStatus(period);
                                const { Icon: PeriodOverallIcon, colorClass: periodOverallColorClass, title: periodOverallTitle } = getStatusIconAndColor(overallPeriodStatus);
                                return (
                                <AccordionItem value={period.id} key={period.id} className="border rounded-md shadow-sm bg-card hover:shadow-md transition-shadow">
                                    <AccordionTrigger className="p-3 hover:no-underline">
                                        <div className="flex justify-between items-center w-full">
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 text-left">
                                                <span 
                                                    className="text-sm font-medium text-primary/90 cursor-pointer hover:underline"
                                                    onClick={(e) => { e.stopPropagation(); handleOverallPeriodClick(period, fy.id); }}
                                                    title={`Manage Period: ${period.name}`}
                                                >
                                                    {period.name}
                                                </span>
                                                <span className="text-xs text-muted-foreground mt-0.5 sm:mt-0">
                                                {period.startDate && period.endDate ? (
                                                    <>(<FormattedDateTime date={period.startDate} formatString="MMM d" /> - <FormattedDateTime date={period.endDate} formatString="MMM d, yyyy" />)</>
                                                ) : (
                                                    period.isAdhoc ? <>(Adjustment Period)</> : <>(No Date Range)</>
                                                )}
                                                </span>
                                            </div>
                                            <PeriodOverallIcon className={`h-5 w-5 shrink-0 mr-3 ${periodOverallColorClass}`} title={`Overall Period Status: ${periodOverallTitle}`} />
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pt-0 pb-3 px-3">
                                      {period.isAdhoc ? (
                                        <div className="space-y-1.5 pl-3 border-l-2 border-border ml-1 pt-1">
                                            <p className="text-xs text-muted-foreground pb-1">
                                                This is an Adjustment Period. Its General Ledger can be opened for year-end adjustments once all regular periods are closed.
                                            </p>
                                            {(['General Ledger'] as SubledgerName[]).map(subledger => { 
                                                const subStatus = period.subledgerStatuses[subledger];
                                                if (subStatus === undefined) return null;
                                                const { Icon: SubIcon, colorClass: subColorClass, title: subTitle } = getStatusIconAndColor(subStatus);
                                                return (
                                                <div key={subledger} className="flex justify-between items-center text-xs py-0.5">
                                                    <button 
                                                        onClick={() => handleSubledgerStatusClick(period, fy.id, subledger)}
                                                        className={` ${subStatus !== 'Hard Closed' ? 'text-muted-foreground hover:text-accent-foreground cursor-pointer' : 'text-muted-foreground/70 cursor-default'}`}
                                                        disabled={subStatus === 'Hard Closed'}
                                                        title={subStatus !== 'Hard Closed' ? `Manage ${subledger} status for ADJ period` : `${subledger} status is ${subTitle}`}
                                                    >
                                                    {subledger}
                                                    </button>
                                                    <SubIcon className={`h-4 w-4 shrink-0 ${subColorClass}`} title={subTitle}/>
                                                </div>
                                                );
                                            })}
                                        </div>
                                      ) : (
                                        <div className="space-y-1.5 pl-3 border-l-2 border-border ml-1 pt-1">
                                        {subledgerNames.map(subledger => {
                                            const subStatus = period.subledgerStatuses[subledger];
                                            if (subStatus === undefined) return null; 
                                            const { Icon: SubIcon, colorClass: subColorClass, title: subTitle } = getStatusIconAndColor(subStatus);
                                            
                                            return (
                                            <div key={subledger} className="flex justify-between items-center text-xs py-0.5">
                                                <button 
                                                    onClick={() => handleSubledgerStatusClick(period, fy.id, subledger)}
                                                    className={` ${subStatus !== 'Hard Closed' ? 'text-muted-foreground hover:text-accent-foreground cursor-pointer' : 'text-muted-foreground/70 cursor-default'}`}
                                                    disabled={subStatus === 'Hard Closed'}
                                                    title={subStatus !== 'Hard Closed' ? `Manage ${subledger} status` : `${subledger} status is ${subTitle}`}
                                                >
                                                {subledger}
                                                </button>
                                                <SubIcon className={`h-4 w-4 shrink-0 ${subColorClass}`} title={subTitle}/>
                                            </div>
                                            );
                                        })}
                                        </div>
                                      )}
                                    </AccordionContent>
                                </AccordionItem>
                                )
                            })}
                        </Accordion>
                        {fy.periods.length === 0 && <p className="text-sm text-muted-foreground p-2">No periods generated for this fiscal year.</p>}
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
              Manage Status: {actionDialogState.subledgerName ? `${actionDialogState.subledgerName} for ` : ''}
              {actionDialogState.periodName}
              {actionDialogState.isAdhocPeriod && !actionDialogState.subledgerName ? ' (ADJ Period GL)' : ''}
            </DialogTitle>
            <DialogDescription>
              Current Status: <span className="font-semibold">{actionDialogState.currentStatus}</span>. Select an action.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {actionDialogState.availableActions.map(action => {
              let actionTargetText = "";
              if (actionDialogState.subledgerName) {
                  actionTargetText = actionDialogState.subledgerName;
              } else if (actionDialogState.isAdhocPeriod) {
                  // For ADJ periods, overall actions target its GL
                  actionTargetText = "ADJ Period GL"; 
              } else {
                  actionTargetText = "Period"; // For regular period overall actions
              }
              const buttonText = `${action} ${actionTargetText}`;
              
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
                <p className="text-sm text-muted-foreground text-center">No actions available for this {actionDialogState.subledgerName || (actionDialogState.isAdhocPeriod ? 'ADJ Period GL' : 'period')} in its current state or due to other period statuses.</p>
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
    

    

    