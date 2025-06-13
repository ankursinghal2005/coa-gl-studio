
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
import { useToast } from "@/hooks/use-toast";
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

const exampleCalendarConfig: FiscalCalendarFormValues = {
  startMonth: 'January',
  startYear: 2025,
  periodFrequency: 'Monthly' as 'Monthly' | '4-4-5',
};

const defaultFormValues: FiscalCalendarFormValues = exampleCalendarConfig;

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
  status: PeriodStatus; // Overall status of the fiscal year, can be derived
  periods: DisplayPeriod[];
}

interface ActionDialogState {
  isOpen: boolean;
  periodId: string | null;
  periodName: string | null;
  subledgerName?: SubledgerName;
  currentStatus: PeriodStatus | null;
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
    } else if (config.periodFrequency === '4-4-5') { // Quarterly (4 periods)
      fyActualEndDate = endOfMonth(addMonths(fyStartDate, 11)); // Standard 12-month year
      fiscalYearLabel = `FY${getYear(fyActualEndDate)}`;

      for (let q = 0; q < 4; q++) {
        const quarterStartMonthOffset = q * 3;
        const periodStart = startOfMonth(addMonths(fyStartDate, quarterStartMonthOffset));
        const periodEnd = endOfMonth(addMonths(periodStart, 2));
        
        periods.push({
          id: `${fiscalYearLabel}-Q${q + 1}`,
          name: `Q${q + 1}-${fiscalYearLabel}`,
          startDate: periodStart,
          endDate: periodEnd,
          subledgerStatuses: getDefaultSubledgerStatuses(periodStart, periodEnd),
          isAdhoc: false,
        });
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

    let fyStatus: PeriodStatus = 'Open';
    if (periods.length > 0) {
        const allRegularPeriodsClosed = periods.filter(p => !p.isAdhoc).every(p => 
            Object.values(p.subledgerStatuses).every(s => s === 'Closed' || s === 'Hard Closed')
        );
        const anyRegularPeriodOpen = periods.filter(p => !p.isAdhoc).some(p => 
            Object.values(p.subledgerStatuses).some(s => s === 'Open')
        );

        if (allRegularPeriodsClosed) fyStatus = "Closed";
        else if (anyRegularPeriodOpen) fyStatus = "Open";
        else fyStatus = "Future";
    }
    if (today > fyActualEndDate) fyStatus = "Closed";
    else if (today < fyStartDate) fyStatus = "Future";


    yearsData.push({
      id: fiscalYearLabel,
      name: fiscalYearLabel,
      startDate: fyStartDate,
      endDate: fyActualEndDate,
      status: fyStatus,
      periods: periods,
    });
  }
  return yearsData;
};


export default function FiscalPeriodsPage() {
  const [isConfigureDialogOpen, setIsConfigureDialogOpen] = useState(false);
  const [configuredCalendar, setConfiguredCalendar] = useState<FiscalCalendarFormValues>(exampleCalendarConfig);
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

  const handleSubledgerStatusClick = (period: DisplayPeriod, fiscalYearId: string, subledger: SubledgerName) => {
    const currentSubledgerStatus = period.subledgerStatuses[subledger];

    if (currentSubledgerStatus === 'Hard Closed') {
      toast({ title: "Action Denied", description: `${subledger} for period "${period.name}" is Hard Closed and cannot be modified.`, variant: "destructive" });
      return;
    }

    let actions: PeriodAction[] = [];
    
    if (period.isAdhoc && subledger === 'General Ledger') { 
        const fy = generatedFiscalYears.find(f => f.id === fiscalYearId);
        const allRegularGLClosedOrHardClosed = fy?.periods.filter(p => !p.isAdhoc).every(p => 
            p.subledgerStatuses['General Ledger'] === 'Closed' || p.subledgerStatuses['General Ledger'] === 'Hard Closed'
        );
        if (currentSubledgerStatus === 'Adjustment' || currentSubledgerStatus === 'Future' || currentSubledgerStatus === 'Closed') {
            if (allRegularGLClosedOrHardClosed) actions.push('Open');
        } else if (currentSubledgerStatus === 'Open') {
            actions.push('Close');
            actions.push('Hard Close');
        }
    } else if (period.isAdhoc) {
        actions = []; 
    } else {
      switch (currentSubledgerStatus) {
        case 'Open':
          actions = ['Close', 'Hard Close'];
          break;
        case 'Closed':
          actions = ['Reopen', 'Hard Close'];
          break;
        case 'Future':
          const fy = generatedFiscalYears.find(f => f.id === fiscalYearId);
          const periodIndex = fy?.periods.findIndex(p => p.id === period.id) ?? -1;
          if (fy && periodIndex > 0) {
            const previousPeriod = fy.periods[periodIndex - 1];
            if (!previousPeriod.isAdhoc && (previousPeriod.subledgerStatuses[subledger] === 'Closed' || previousPeriod.subledgerStatuses[subledger] === 'Hard Closed')) {
              actions.push('Open');
            } else if (previousPeriod.isAdhoc && subledger === 'General Ledger') {
                if(previousPeriod.subledgerStatuses['General Ledger'] === 'Closed' || previousPeriod.subledgerStatuses['General Ledger'] === 'Hard Closed') {
                    actions.push('Open');
                }
            } else if (subledger !== 'General Ledger') {
                 actions.push('Open');
            }
          } else if (periodIndex === 0) {
             actions.push('Open');
          }
          break;
      }
    }
    
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
  
  const handlePerformAction = (action: PeriodAction) => {
    const { periodId, periodName, fiscalYearId, subledgerName, currentStatus } = actionDialogState;
    if (!periodId || !fiscalYearId || !subledgerName || !currentStatus) {
        toast({title:"Error", description: "Action details missing for subledger operation.", variant: "destructive"});
        return;
    }

    const targetFiscalYear = generatedFiscalYears.find(fy => fy.id === fiscalYearId);
    if (!targetFiscalYear) {
        toast({title:"Error", description: `Fiscal year "${fiscalYearId}" not found for subledger operation.`, variant: "destructive"});
        return;
    }

    const targetPeriodIndex = targetFiscalYear.periods.findIndex(p => p.id === periodId);
    if (targetPeriodIndex === -1) {
        toast({title:"Error", description: `Period "${periodId}" not found for subledger operation.`, variant: "destructive"});
        return;
    }
    
    const targetPeriod = targetFiscalYear.periods[targetPeriodIndex];

    // Rule: Closing General Ledger
    if (action === 'Close' && !targetPeriod.isAdhoc && subledgerName === 'General Ledger') {
      if (targetPeriodIndex > 0) {
        const previousPeriod = targetFiscalYear.periods[targetPeriodIndex - 1];
        if (!previousPeriod.isAdhoc && previousPeriod.subledgerStatuses[subledgerName] !== 'Closed' && previousPeriod.subledgerStatuses[subledgerName] !== 'Hard Closed') {
          toast({ title: "Action Denied", description: `Cannot perform '${action}' on ${subledgerName} for period "${periodName}". Rule: ${subledgerName} in the previous regular period ("${previousPeriod.name}") must be 'Closed' or 'Hard Closed' first.`, variant: "destructive", duration: 8000 });
          return;
        }
      }
    }
    
    // Rule: Opening General Ledger for ADJ period
    if (action === 'Open' && targetPeriod.isAdhoc && subledgerName === 'General Ledger') {
        const allRegularGLClosed = targetFiscalYear.periods.filter(p => !p.isAdhoc).every(p => 
            p.subledgerStatuses['General Ledger'] === 'Closed' || p.subledgerStatuses['General Ledger'] === 'Hard Closed'
        );
        if (!allRegularGLClosed) {
            toast({ title: "Action Denied", description: `Cannot perform '${action}' on ${subledgerName} for ADJ period "${periodName}". Rule: ${subledgerName} for all regular periods in ${targetFiscalYear.name} must be 'Closed' or 'Hard Closed' first.`, variant: "destructive", duration: 10000 });
            return;
        }
    }
    
    // Rule: Opening General Ledger for a future regular period
    if (action === 'Open' && !targetPeriod.isAdhoc && currentStatus === 'Future' && subledgerName === 'General Ledger') {
        if (targetPeriodIndex > 0) {
            const previousPeriod = targetFiscalYear.periods[targetPeriodIndex - 1];
            if (!previousPeriod.isAdhoc && previousPeriod.subledgerStatuses[subledgerName] !== 'Closed' && previousPeriod.subledgerStatuses[subledgerName] !== 'Hard Closed') {
                 toast({ title: "Action Denied", description: `Cannot perform '${action}' on ${subledgerName} for future period "${periodName}". Rule: ${subledgerName} in the previous regular period ("${previousPeriod.name}") must be 'Closed' or 'Hard Closed' first.`, variant: "destructive", duration: 10000 });
                 return;
            }
        }
    }

    if (window.confirm(`Are you sure you want to ${action.toLowerCase()} ${subledgerName} for period "${periodName}"?`)) {
      setGeneratedFiscalYears(prevYears =>
        prevYears.map(fy => {
          if (fy.id === fiscalYearId) {
            return {
              ...fy,
              periods: fy.periods.map(p => {
                if (p.id === periodId) {
                  const newSubledgerStatuses = { ...p.subledgerStatuses };
                  let newStatusForSubledger: PeriodStatus = newSubledgerStatuses[subledgerName];
                  switch (action) {
                    case 'Open': newStatusForSubledger = 'Open'; break;
                    case 'Close': newStatusForSubledger = 'Closed'; break;
                    case 'Hard Close': newStatusForSubledger = 'Hard Closed'; break;
                    case 'Reopen': newStatusForSubledger = 'Open'; break;
                  }
                  newSubledgerStatuses[subledgerName] = newStatusForSubledger;
                  return { ...p, subledgerStatuses: newSubledgerStatuses };
                }
                return p;
              }),
            };
          }
          return fy;
        })
      );
      toast({ title: "Success", description: `${subledgerName} for period "${periodName}" status changed to ${action === 'Reopen' ? 'Open' : action}.` });
      setActionDialogState({ isOpen: false, periodId: null, periodName: null, subledgerName: undefined, currentStatus: null, fiscalYearId: null, availableActions: [] });
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
                  const { Icon: FyIcon, colorClass: fyColorClass, title: fyTitle } = getStatusIconAndColor(fy.status);
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
                                     <span className="text-sm font-medium text-primary/90">
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
            <DialogTitle>Manage Status: {actionDialogState.subledgerName} for {actionDialogState.periodName}</DialogTitle>
            <DialogDescription>
              Current Status: <span className="font-semibold">{actionDialogState.currentStatus}</span>. Select an action.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {actionDialogState.availableActions.map(action => (
              <Button
                key={action}
                onClick={() => handlePerformAction(action)}
                className="w-full"
                variant={action === 'Hard Close' || action === 'Close' ? 'destructive' : (action === 'Reopen' ? 'outline' : 'default')}
              >
                {action} {actionDialogState.subledgerName}
              </Button>
            ))}
            {actionDialogState.availableActions.length === 0 && (
                <p className="text-sm text-muted-foreground text-center">No actions available for this subledger in its current state or due to other period statuses.</p>
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
