
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
import { CalendarCog, CalendarDays, CheckCircle2, XCircle, Clock } from 'lucide-react';
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

interface DisplayPeriod {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  status: 'Open' | 'Closed' | 'Future';
}

interface DisplayFiscalYear {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  status: 'Open' | 'Closed' | 'Future';
  periods: DisplayPeriod[];
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
    const fyStartDate = new Date(currentFYStartCalendarYear, startMonthIndex, 1);
    fyStartDate.setHours(0,0,0,0);

    const periods: DisplayPeriod[] = [];
    let fyEndDate: Date;
    let fiscalYearLabel: string;

    if (config.periodFrequency === 'Monthly') {
      fyEndDate = endOfMonth(addMonths(fyStartDate, 11)); // 12 months total
      fiscalYearLabel = `FY${getYear(fyEndDate)}`;

      for (let m = 0; m < 12; m++) {
        const periodStart = startOfMonth(addMonths(fyStartDate, m));
        const periodEnd = endOfMonth(periodStart);
        let status: DisplayPeriod['status'] = 'Open';
        if (today > periodEnd) status = "Closed";
        else if (today < periodStart) status = "Future";

        periods.push({
          id: `${fiscalYearLabel}-P${m + 1}`,
          name: `${format(periodStart, 'MMM').toUpperCase()}-${fiscalYearLabel}`,
          startDate: periodStart,
          endDate: periodEnd,
          status: status,
        });
      }
    } else { 
      let currentPeriodStartDate = new Date(fyStartDate);
      
      let calculatedFyEndYear = currentFYStartCalendarYear;
      if (startMonthIndex > 0) { // If FY starts in Feb or later, it ends in the next calendar year for a 12-month or 13-month cycle
        calculatedFyEndYear +=1;
      }
      
      // For a 13 "period" 4-4-5 year, the fiscal year often ends 1 year from its start date plus one week if 53-week years are handled,
      // or it just covers 13 nominal 4-week "months". Here, we'll model it as 3 quarters of 3 * 4-week "months"
      // and 1 quarter of 4 * 4-week "months", roughly mapping to a 13 "month" concept where each "month" is ~4 weeks.
      // More simply, the fiscal year label should be consistent with the year it primarily falls in or ends in.
      // If it starts Jan 2025, 13 "months" will end in Jan 2026. So the label would be FY2026.
      // If it starts July 2025, 13 "months" will end in July 2026. Label FY2026.
      // The logic below approximates this.
      
      // Determine the calendar year the fiscal year predominantly ends in.
      // A 13-period structure from Jan 2025 would end in Jan 2026.
      // A 13-period structure from Jul 2025 would end in Jul 2026.
      let tempEndDateForLabel = addMonths(fyStartDate, 12); // Approximate end for labeling
      fiscalYearLabel = `FY${getYear(tempEndDateForLabel)}`;


      let cumulativeEndDate = fyStartDate;
      const quarterDurationsInPeriods = [3, 3, 3, 4]; // Q1, Q2, Q3 have 3 "periods", Q4 has 4 "periods" (total 13)

      for (let q = 0; q < 4; q++) { // 4 Quarters
        const numPeriodsInQuarter = quarterDurationsInPeriods[q];
        const quarterStartDate = new Date(cumulativeEndDate);
        
        // Simulate periods within quarter. For 4-4-5, these aren't standard calendar months.
        // We'll just use the quarter start/end.
        // Each "period" in 4-4-5 is typically 4 or 5 weeks.
        // A quarter is 13 weeks. (4+4+5 or other combination).
        // The actual end date for 4-4-5 is often 364 days (52 weeks) or 371 days (53 weeks).
        // For simplicity, we'll base quarter end dates by adding nominal months.
        // Q1: 3 nominal months, Q2: 3 nominal months, Q3: 3 nominal months, Q4: 4 nominal months.
        
        let quarterEndDateCalc = new Date(quarterStartDate);
        if (q === 0 || q === 1) { // First two quarters are 3 "periods" (approx 3 months)
            quarterEndDateCalc = endOfMonth(addMonths(quarterStartDate, 2)); // 3 full "months"
        } else if (q === 2) { // Third quarter is 3 "periods"
             quarterEndDateCalc = endOfMonth(addMonths(quarterStartDate, 2)); 
        } else { // Fourth quarter is 4 "periods"
            quarterEndDateCalc = endOfMonth(addMonths(quarterStartDate, 3));
        }
        
        cumulativeEndDate = addDays(quarterEndDateCalc, 1); // Start of next quarter

        let status: DisplayPeriod['status'] = 'Open';
        if (today > quarterEndDateCalc) status = "Closed";
        else if (today < quarterStartDate) status = "Future";
        
        periods.push({
          id: `${fiscalYearLabel}-Q${q + 1}`,
          name: `Q${q + 1}-${fiscalYearLabel}`,
          startDate: quarterStartDate,
          endDate: quarterEndDateCalc,
          status: status,
        });
      }
      fyEndDate = periods[periods.length - 1].endDate;
    }

    let fyStatus: DisplayPeriod['status'] = 'Open';
    if (today > fyEndDate) fyStatus = "Closed";
    else if (today < fyStartDate) fyStatus = "Future";

    yearsData.push({
      id: fiscalYearLabel, 
      name: fiscalYearLabel,
      startDate: fyStartDate,
      endDate: fyEndDate,
      status: fyStatus,
      periods: periods,
    });
  }
  return yearsData;
};


export default function FiscalPeriodsPage() {
  const [isConfigureDialogOpen, setIsConfigureDialogOpen] = useState(false);
  const [configuredCalendar, setConfiguredCalendar] = useState<FiscalCalendarFormValues | null>(exampleCalendarConfig);
  const [generatedFiscalYears, setGeneratedFiscalYears] = useState<DisplayFiscalYear[]>([]);
  const { toast } = useToast();

  const form = useForm<FiscalCalendarFormValues>({
    resolver: zodResolver(fiscalCalendarSchema),
    defaultValues: defaultFormValues,
  });

  const onSubmit = (values: FiscalCalendarFormValues) => {
    setConfiguredCalendar(values);
    toast({
      title: "Configuration Saved",
      description: `Calendar configured: Start ${values.startMonth} ${values.startYear}, Frequency: ${values.periodFrequency}.`,
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

  const handleOpenDialog = (mode: 'create' | 'edit') => {
    if (mode === 'edit' && configuredCalendar) {
      form.reset(configuredCalendar);
    } else {
      form.reset(defaultFormValues);
    }
    setIsConfigureDialogOpen(true);
  };

  const handlePeriodClick = (periodName: string, type: 'Fiscal Year' | 'Period') => {
    console.log(`Clicked on ${type}: ${periodName}`);
  };

  const breadcrumbItems = [
    { label: 'COA Configuration', href: '/' },
    { label: 'Settings', href: '/configure/settings' },
    { label: 'Fiscal Period Management' },
  ];

  const getStatusIconAndColor = (status: DisplayPeriod['status']): { Icon: LucideIcon, colorClass: string, title: string } => {
    switch (status) {
      case 'Open':
        return { Icon: CheckCircle2, colorClass: 'text-green-600', title: 'Open' };
      case 'Closed':
        return { Icon: XCircle, colorClass: 'text-red-600', title: 'Closed' };
      case 'Future':
        return { Icon: Clock, colorClass: 'text-yellow-500', title: 'Future' };
      default:
        return { Icon: Clock, colorClass: 'text-muted-foreground', title: 'Unknown' }; 
    }
  };


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
                <span className="font-medium text-muted-foreground">Period Frequency:</span> {configuredCalendar.periodFrequency}
              </p>
              <Button onClick={() => handleOpenDialog('edit')} className="mt-2">
                Edit Configuration
              </Button>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Currently, no accounting calendar is defined. Click below to set it up.
              </p>
              <Button onClick={() => handleOpenDialog('create')}>
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
              Based on your configuration. Click on a fiscal year to expand its periods.
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
                                    onClick={() => handlePeriodClick(period.name, 'Period')}
                                    className="text-sm text-primary/90 hover:underline text-left"
                                  >
                                    {period.name}
                                  </button>
                                  <span className="text-xs text-muted-foreground mt-0.5 sm:mt-0">
                                    (<FormattedDateTime date={period.startDate} formatString="MMM d" /> - <FormattedDateTime date={period.endDate} formatString="MMM d, yyyy" />)
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
              {configuredCalendar && !form.formState.isDirty && form.getValues().startMonth === configuredCalendar.startMonth && form.getValues().startYear === configuredCalendar.startYear && form.getValues().periodFrequency === configuredCalendar.periodFrequency
                ? 'View/Edit Accounting Calendar' 
                : (configuredCalendar ? 'Edit Accounting Calendar' : 'Configure Accounting Calendar')
              }
            </DialogTitle>
            <DialogDescription>
              Set the start date and period frequency. The start day is always the 1st of the month.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-2">
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
                        <SelectItem value="4-4-5">4-4-5 (Quarterly periods, 13-month FY)</SelectItem>
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
    </div>
  );
}
