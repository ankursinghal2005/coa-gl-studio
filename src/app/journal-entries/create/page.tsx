
'use client';

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { fiscalYears, additionalPeriods, workflowRules, jeSources, type JournalEntrySource } from '@/lib/journal-entry-types';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const journalEntryControlsSchema = z.object({
  fiscalYear: z.string().min(1, { message: 'Fiscal Year is required.' }),
  journalEntryNumber: z.string().min(1, {message: "Journal Entry Number is required."}),
  journalEntryDate: z.date({ required_error: 'Journal Entry Date is required.' }),
  additionalPeriod: z.string().optional(),
  source: z.enum(jeSources as [JournalEntrySource, ...JournalEntrySource[]]),
  workflowRule: z.string().optional(),
  description: z.string().min(1, { message: 'Description is required.' }),
  comment: z.string().optional(),
});

type JournalEntryControlsFormValues = z.infer<typeof journalEntryControlsSchema>;

export default function CreateJournalEntryPage() {
  const router = useRouter();

  const form = useForm<JournalEntryControlsFormValues>({
    resolver: zodResolver(journalEntryControlsSchema),
    defaultValues: {
      fiscalYear: fiscalYears.length > 0 ? fiscalYears[0] : '',
      journalEntryNumber: '0',
      journalEntryDate: new Date(),
      additionalPeriod: '',
      source: 'GL',
      workflowRule: '',
      description: '',
      comment: '',
    },
  });

  const onSubmit = (values: JournalEntryControlsFormValues) => {
    console.log('Journal Entry Controls Submitted:', values);
    // For now, just log. Later, this would save to context/backend and navigate
    // to the next step (e.g., adding lines to the JE)
    alert('Journal Entry Controls saved (see console). Next step not yet implemented.');
    // router.push(`/journal-entries/create/${newJeId}/lines`); // Example next step
  };

  const breadcrumbItems = [
    { label: 'General Ledger', href: '/' },
    { label: 'Work with Journal Entries', href: '/journal-entries' },
    { label: 'Create New Journal Entry' },
  ];

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Breadcrumbs items={breadcrumbItems} />
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-primary">
          Create New Journal Entry
        </h1>
      </header>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Journal Entry Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="fiscalYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fiscal Year *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Fiscal Year" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {fiscalYears.map((year) => (
                            <SelectItem key={year} value={year}>
                              {year}
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
                  name="journalEntryNumber"
                  render={({ field }) => (
                    <FormItem>
                       <FormLabel className="flex items-center">
                        Journal Entry Number
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3 w-3 text-muted-foreground ml-1 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">Usually system-generated after submission or based on settings. Can be a reference.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="journalEntryDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Journal Entry Date *</FormLabel>
                      <DatePicker
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Select JE Date"
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="additionalPeriod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Period</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Additional Period" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {additionalPeriods.map((period) => (
                            <SelectItem key={period} value={period}>
                              {period}
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
                  name="source"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Source</FormLabel>
                       <Select onValueChange={field.onChange} value={field.value} disabled>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Source" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {jeSources.map((src) => (
                            <SelectItem key={src} value={src}>
                              {src}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-xs">Source is typically set to GL for manual entries.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="workflowRule"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Workflow Rule</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Workflow Rule" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                           <SelectItem value="">None (or System Default)</SelectItem>
                          {workflowRules.map((rule) => (
                            <SelectItem key={rule} value={rule}>
                              {rule || 'N/A'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter a clear and concise description for this journal entry"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="comment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Comment</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter any additional comments (optional)"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit">
              Next
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
