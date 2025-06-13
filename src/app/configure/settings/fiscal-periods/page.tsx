
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
import { CalendarCog, CalendarDays, CheckCircle2, XCircle, Clock, AlertTriangle, Lock } from 'lucide-react';
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


interface DisplayPeriod {
  id: string;
  name: string;
  startDate?: Date;
  endDate?: Date;
  status: PeriodStatus;
  isAdhoc?: boolean; // True for ADJ periods
}

interface DisplayFiscalYear {
  id: string; // e.g., FY2025
  name: string;
  startDate: Date;
  endDate: Date;
  status: PeriodStatus; // Status of the fiscal year itself
  periods: DisplayPeriod[];
}

interface ActionDialogState {
  isOpen: boolean;
  periodId: string | null;
  periodName: string | null;
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

  for (let i = 0; i < 3; i++) { // Generate for 3 fiscal years
    const currentFYStartCalendarYear = config.startYear + i;
    let fyStartDate = new Date(currentFYStartCalendarYear, startMonthIndex, 1);
    fyStartDate.setHours(0,0,0,0);

    const periods: DisplayPeriod[] = [];
    let fyActualEndDate: Date; // Actual end date of regular periods for FY status
    let fiscalYearLabel: string;

    if (config.periodFrequency === 'Monthly') {
      fyActualEndDate = endOfMonth(addMonths(fyStartDate, 11));
      fiscalYearLabel = `FY${getYear(fyActualEndDate)}`;

      for (let m = 0; m < 12; m++) {
        const periodStart = startOfMonth(addMonths(fyStartDate, m));
        const periodEnd = endOfMonth(periodStart);
        let status: PeriodStatus = 'Open';
        if (today > periodEnd) status = "Closed";
        else if (today < periodStart) status = "Future";

        periods.push({
          id: `${fiscalYearLabel}-P${m + 1}`,
          name: `${format(periodStart, 'MMM').toUpperCase()}-${fiscalYearLabel}`,
          startDate: periodStart,
          endDate: periodEnd,
          status: status,
          isAdhoc: false,
        });
      }
    } else if (config.periodFrequency === '4-4-5') { // Now "Quarterly"
      fyActualEndDate = endOfMonth(addMonths(fyStartDate, 11)); // Standard 12-month fiscal year
      fiscalYearLabel = `FY${getYear(fyActualEndDate)}`;

      for (let q = 0; q < 4; q++) { // 4 Quarters
        const quarterStartMonthOffset = q * 3;
        const periodStart = startOfMonth(addMonths(fyStartDate, quarterStartMonthOffset));
        const periodEnd = endOfMonth(addMonths(periodStart, 2)); // Each quarter is 3 months

        let status: PeriodStatus = 'Open';
        if (today > periodEnd) status = "Closed";
        else if (today < periodStart) status = "Future";

        periods.push({
          id: `${fiscalYearLabel}-Q${q + 1}`,
          name: `Q${q + 1}-${fiscalYearLabel}`,
          startDate: periodStart,
          endDate: periodEnd,
          status: status,
          isAdhoc: false,
        });
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
      status: 'Future', // Default ADJ status to Future
      isAdhoc: true,
    };
    periods.push(adjPeriod);

    let fyStatus: PeriodStatus = 'Open';
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

  const handlePeriodClick = (period: DisplayPeriod, fiscalYearId: string) => {
    if (period.status === 'Hard Closed') {
      toast({ title: "Action Denied", description: `Period "${period.name}" is Hard Closed and cannot be modified.`, variant: "destructive" });
      return;
    }

    let actions: PeriodAction[] = [];
    if (period.isAdhoc) { // ADJ Period
      if (period.status === 'Future' || period.status === 'Closed') {
        // Check if all other regular periods in its FY are closed or hard-closed
        const fy = generatedFiscalYears.find(f => f.id === fiscalYearId);
        const allRegularClosed = fy?.periods.filter(p => !p.isAdhoc).every(p => p.status === 'Closed' || p.status === 'Hard Closed');
        if (allRegularClosed) actions.push('Open');
      } else if (period.status === 'Open') {
        actions.push('Close');
        actions.push('Hard Close');
      }
    } else { // Regular Period
      switch (period.status) {
        case 'Open':
          actions = ['Close', 'Hard Close'];
          break;
        case 'Closed':
          actions = ['Reopen', 'Hard Close'];
          break;
        case 'Future':
          actions = ['Open']; // Assuming future periods can be opened directly
          break;
      }
    }
    
    setActionDialogState({
      isOpen: true,
      periodId: period.id,
      periodName: period.name,
      currentStatus: period.status,
      fiscalYearId: fiscalYearId,
      availableActions: actions,
    });
  };

  const handlePerformAction = (action: PeriodAction) => {
    const { periodId, periodName, fiscalYearId } = actionDialogState;
    if (!periodId || !fiscalYearId) return;

    const targetFiscalYear = generatedFiscalYears.find(fy => fy.id === fiscalYearId);
    if (!targetFiscalYear) return;

    const targetPeriodIndex = targetFiscalYear.periods.findIndex(p => p.id === periodId);
    if (targetPeriodIndex === -1) return;
    
    const targetPeriod = targetFiscalYear.periods[targetPeriodIndex];

    // Rule: "Close" action requires previous period to be Closed or Hard Closed
    if (action === 'Close' && !targetPeriod.isAdhoc) {
      if (targetPeriodIndex > 0) {
        const previousPeriod = targetFiscalYear.periods[targetPeriodIndex - 1];
        if (previousPeriod.status !== 'Closed' && previousPeriod.status !== 'Hard Closed') {
          toast({ title: "Action Denied", description: `Cannot close "${periodName}". Previous period "${previousPeriod.name}" must be Closed or Hard Closed first.`, variant: "destructive" });
          return;
        }
      }
    }

    // Rule: "Open" ADJ period requires all other regular periods in its FY to be Closed or Hard Closed
    if (action === 'Open' && targetPeriod.isAdhoc) {
        const allRegularClosed = targetFiscalYear.periods.filter(p => !p.isAdhoc).every(p => p.status === 'Closed' || p.status === 'Hard Closed');
        if (!allRegularClosed) {
            toast({ title: "Action Denied", description: `Cannot open ADJ period "${periodName}". All regular periods in ${targetFiscalYear.name} must be Closed or Hard Closed first.`, variant: "destructive" });
            return;
        }
    }


    if (window.confirm(`Are you sure you want to ${action.toLowerCase()} period "${periodName}"?`)) {
      setGeneratedFiscalYears(prevYears =>
        prevYears.map(fy => {
          if (fy.id === fiscalYearId) {
            return {
              ...fy,
              periods: fy.periods.map(p => {
                if (p.id === periodId) {
                  let newStatus: PeriodStatus = p.status;
                  switch (action) {
                    case 'Open': newStatus = 'Open'; break;
                    case 'Close': newStatus = 'Closed'; break;
                    case 'Hard Close': newStatus = 'Hard Closed'; break;
                    case 'Reopen': newStatus = 'Open'; break;
                  }
                  return { ...p, status: newStatus };
                }
                return p;
              }),
            };
          }
          return fy;
        })
      );
      toast({ title: "Success", description: `Period "${periodName}" status changed to ${action === 'Reopen' ? 'Open' : action}.` });
      setActionDialogState({ isOpen: false, periodId: null, periodName: null, currentStatus: null, fiscalYearId: null, availableActions: [] });
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
          Define and manage your organization's fiscal years and accounting periods.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Accounting Calendar Definition</CardTitle>
          <CardDesc>
            {configuredCalendar
              ? 'View or edit your current accounting calendar configuration.'
              : 'Configure the start date and period frequency for your primary accounting calendar.'}
          </CardDesc>
        </CardHeader>
        <CardContent className="flex flex-col items-start space-y-4">
          {configuredCalendar ? (
            <div className="space-y-3 p-4 border rounded-md bg-muted/50 w-full">
              <h3 className="text-lg font-semibold text-primary">Current Configuration:</h3>
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
            <>
              <p className="text-sm text-muted-foreground">
                Currently, no accounting calendar is defined. Click below to set it up.
              </p>
              <Button onClick={() => handleOpenConfigDialog('create')}>
                Configure Accounting Calendar
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {configuredCalendar && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <CalendarDays className="mr-2 h-6 w-6 text-primary" />
              Generated Fiscal Calendar (Next 3 Years)
            </CardTitle>
            <CardDesc>
              Based on your configuration. Click on a fiscal year to expand its periods. Includes an Adjustment (ADJ) period for each year. Click a period name to manage its status.
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
                        <div className="space-y-2 pl-4 pt-2">
                          {fy.periods.map(period => {
                             const { Icon: PeriodIcon, colorClass: periodColorClass, title: periodTitle } = getStatusIconAndColor(period.status);
                            return (
                            <div key={period.id} className="flex justify-between items-center p-2 border-b border-dashed last:border-b-0">
                               <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
                                 <button
                                    onClick={() => handlePeriodClick(period, fy.id)}
                                    className="text-sm text-primary/90 hover:underline text-left disabled:text-muted-foreground disabled:no-underline disabled:cursor-not-allowed"
                                    disabled={period.status === 'Hard Closed'}
                                  >
                                    {period.name}
                                  </button>
                                   <span className="text-xs text-muted-foreground mt-0.5 sm:mt-0">
                                      {period.startDate && period.endDate ? (
                                        <>(<FormattedDateTime date={period.startDate} formatString="MMM d" /> - <FormattedDateTime date={period.endDate} formatString="MMM d, yyyy" />)</>
                                      ) : (
                                        <>(No Date Range)</>
                                      )}
                                    </span>
                              </div>
                              <PeriodIcon className={`h-5 w-5 shrink-0 ${periodColorClass}`} title={periodTitle} />
                            </div>
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

      {/* Period Action Dialog */}
      <Dialog open={actionDialogState.isOpen} onOpenChange={(isOpen) => setActionDialogState(prev => ({ ...prev, isOpen }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Period: {actionDialogState.periodName}</DialogTitle>
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
                {action} Period
              </Button>
            ))}
            {actionDialogState.availableActions.length === 0 && (
                <p className="text-sm text-muted-foreground text-center">No actions available for this period in its current state or due to other period statuses.</p>
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

