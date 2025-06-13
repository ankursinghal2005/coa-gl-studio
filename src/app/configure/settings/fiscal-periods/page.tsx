
'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { CalendarCog } from 'lucide-react'; // Using CalendarCog for a more specific icon

const fiscalCalendarSchema = z.object({
  startMonth: z.string().min(1, "Start month is required."),
  startYear: z.coerce
    .number({ invalid_type_error: "Year must be a number." })
    .int()
    .min(1900, "Year must be 1900 or later.")
    .max(2100, "Year must be 2100 or earlier."),
  periodFrequency: z.enum(['Monthly', '4-4-5'] as [string, ...string[]], { // Ensure enum has at least one value for TS
    required_error: "Period frequency is required.",
  }),
});

type FiscalCalendarFormValues = z.infer<typeof fiscalCalendarSchema>;

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function FiscalPeriodsPage() {
  const [isConfigureDialogOpen, setIsConfigureDialogOpen] = useState(false);

  const form = useForm<FiscalCalendarFormValues>({
    resolver: zodResolver(fiscalCalendarSchema),
    defaultValues: {
      startMonth: '',
      startYear: new Date().getFullYear(),
      periodFrequency: undefined, // Let placeholder show
    },
  });

  const onSubmit = (values: FiscalCalendarFormValues) => {
    console.log("Fiscal Calendar Configuration:", values);
    alert(`Calendar configured: Start: ${values.startMonth} ${values.startYear}, Frequency: ${values.periodFrequency}. Actual generation TBD.`);
    setIsConfigureDialogOpen(false);
    form.reset();
  };

  const breadcrumbItems = [
    { label: 'COA Configuration', href: '/' },
    { label: 'Settings', href: '/configure/settings' },
    { label: 'Fiscal Period Management' },
  ];

  return (
    <div className="w-full max-w-3xl mx-auto">
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
            Configure the start date and period frequency for your primary accounting calendar.
            This will be used to generate fiscal periods.
          </CardDesc>
        </CardHeader>
        <CardContent className="flex flex-col items-start space-y-4">
           <p className="text-sm text-muted-foreground">
            Currently, no accounting calendar is defined. Click below to set it up.
            {/* Later, this section will show current calendar details if configured */}
          </p>
          <Button onClick={() => setIsConfigureDialogOpen(true)}>
            Configure Accounting Calendar
          </Button>
        </CardContent>
      </Card>

      {/* Further sections for viewing/managing generated periods will go here */}

      <Dialog open={isConfigureDialogOpen} onOpenChange={setIsConfigureDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Configure Accounting Calendar</DialogTitle>
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select start month" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {months.map((month, index) => (
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
                        <SelectItem value="4-4-5">4-4-5 (Quarterly)</SelectItem>
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
