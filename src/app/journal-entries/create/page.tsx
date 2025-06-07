
'use client';

import React, { useEffect, useMemo } from 'react';
import { useForm, Controller, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription as FormDescUI } from '@/components/ui/form';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { fiscalYears, additionalPeriods, workflowRules, jeSources, type JournalEntrySource, NONE_ADDITIONAL_PERIOD_VALUE, NONE_WORKFLOW_RULE_VALUE, type JournalEntryLine, type FullJournalEntryFormData } from '@/lib/journal-entry-types';
import { mockSegmentCodesData } from '@/lib/segment-types';
import { useSegments } from '@/contexts/SegmentsContext';
import { AccountCodeBuilder } from '@/components/ui/AccountCodeBuilder';
import { FormattedCurrency } from '@/components/ui/FormattedCurrency';
import { Info, PlusCircle, Trash2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

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

const journalEntryLineSchema = z.object({
  // id is managed by useFieldArray, no need to validate here unless specific format is required
  accountCodeSelections: z.record(z.string().optional()),
  accountCodeDisplay: z.string().min(1, "Account code is required."),
  description: z.string().optional(),
  debit: z.coerce.number().min(0).optional(),
  credit: z.coerce.number().min(0).optional(),
}).refine(data => (data.debit || 0) > 0 || (data.credit || 0) > 0, {
  message: "Either Debit or Credit must be greater than 0.",
  path: ["debit"],
}).refine(data => !( (data.debit || 0) > 0 && (data.credit || 0) > 0), {
  message: "Cannot enter values for both Debit and Credit in a single line.",
  path: ["credit"],
});

const journalEntryFormSchema = z.object({
  controls: journalEntryControlsSchema,
  lines: z.array(journalEntryLineSchema).min(1, "At least one journal entry line is required."),
}).refine(data => {
  const totalDebits = data.lines.reduce((sum, line) => sum + (line.debit || 0), 0);
  const totalCredits = data.lines.reduce((sum, line) => sum + (line.credit || 0), 0);
  // Use a small epsilon for float comparison
  return Math.abs(totalDebits - totalCredits) < 0.001;
}, {
  message: "Total debits must equal total credits.",
  path: ["lines"],
});

type JournalEntryFormValues = z.infer<typeof journalEntryFormSchema>;

// Default values for a single line, ID will be assigned by useFieldArray
const defaultLineValues: Omit<JournalEntryLine, 'id'> = {
  accountCodeSelections: {},
  accountCodeDisplay: '',
  description: '',
  debit: undefined,
  credit: undefined,
};

export default function CreateJournalEntryPage() {
  const router = useRouter();
  const { segments } = useSegments();
  const activeSegments = useMemo(() => segments.filter(s => s.isActive).sort((a,b) => segments.indexOf(a) - segments.indexOf(b)), [segments]);

  const form = useForm<JournalEntryFormValues>({
    resolver: zodResolver(journalEntryFormSchema),
    defaultValues: {
      controls: {
        fiscalYear: fiscalYears.length > 0 ? fiscalYears[0] : '',
        journalEntryNumber: '0', 
        journalEntryDate: new Date(),
        additionalPeriod: undefined, // Let placeholder show
        source: 'GL',
        workflowRule: undefined, // Let placeholder show
        description: '',
        comment: '',
      },
      lines: [{ ...defaultLineValues }], // useFieldArray will assign stable IDs
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lines",
  });

  const watchedLines = useWatch({ control: form.control, name: "lines" });

  const totals = useMemo(() => {
    let debits = 0;
    let credits = 0;
    (watchedLines || []).forEach(line => {
      debits += line.debit || 0;
      credits += line.credit || 0;
    });
    return { debits, credits, balance: debits - credits };
  }, [watchedLines]);


  const onSubmit = (values: JournalEntryFormValues) => {
    const submissionData: FullJournalEntryFormData = {
      controls: {
        ...values.controls,
        additionalPeriod: values.controls.additionalPeriod === NONE_ADDITIONAL_PERIOD_VALUE ? undefined : values.controls.additionalPeriod,
        workflowRule: values.controls.workflowRule === NONE_WORKFLOW_RULE_VALUE ? undefined : values.controls.workflowRule,
      },
      lines: values.lines.map(line => ({
        ...line,
        // id is already managed by useFieldArray (fields[index].id)
        id: (line as any).id, // Keep the ID from useFieldArray
        debit: line.debit || 0, 
        credit: line.credit || 0,
      })),
    };
    console.log('Journal Entry Submitted:', submissionData);
    alert('Journal Entry saved (see console). Navigation/further steps not yet implemented.');
  };

  const breadcrumbItems = [
    { label: 'General Ledger', href: '/' },
    { label: 'Work with Journal Entries', href: '/journal-entries' },
    { label: 'Create New Journal Entry' },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto">
      <Breadcrumbs items={breadcrumbItems} />
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-primary">
          Create New Journal Entry
        </h1>
      </header>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Journal Entry Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="controls.fiscalYear"
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
                  name="controls.journalEntryNumber"
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
                              <p className="text-xs">Can be system-generated or manually entered based on configuration.</p>
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
                  name="controls.journalEntryDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Journal Entry Date *</FormLabel>
                       <Controller
                        control={form.control}
                        name="controls.journalEntryDate"
                        render={({ field: { onChange, value } }) => (
                          <DatePicker
                            value={value}
                            onValueChange={onChange}
                            placeholder="Select JE Date"
                          />
                        )}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="controls.additionalPeriod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Period</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Additional Period" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={NONE_ADDITIONAL_PERIOD_VALUE}>None</SelectItem>
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
                  name="controls.source"
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
                      <FormDescUI className="text-xs">Source is typically 'GL' for manual entries.</FormDescUI>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="controls.workflowRule"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Workflow Rule</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Workflow Rule" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                           <SelectItem value={NONE_WORKFLOW_RULE_VALUE}>None (or System Default)</SelectItem>
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
                name="controls.description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Overall Description *</FormLabel>
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
                name="controls.comment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Overall Comment</FormLabel>
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

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Journal Entry Lines</CardTitle>
                <CardDescription>Add account distribution lines for this journal entry.</CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => append({ ...defaultLineValues })} // ID will be auto-generated by useFieldArray
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Add Line
              </Button>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[500px] w-full">
                <div className="space-y-6 pr-3">
                  {fields.map((lineField, index) => (
                    <Card key={lineField.id} className="p-4 relative shadow-sm bg-muted/30">
                       <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 h-7 w-7 text-destructive hover:text-destructive/80"
                          onClick={() => remove(index)}
                          disabled={fields.length <= 1}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Remove line</span>
                        </Button>
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name={`lines.${index}.accountCodeSelections`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Account Code *</FormLabel>
                              <AccountCodeBuilder
                                value={field.value}
                                onChange={(newSelections, displayString) => {
                                  field.onChange(newSelections);
                                  form.setValue(`lines.${index}.accountCodeDisplay`, displayString, { shouldValidate: true });
                                }}
                                activeSegments={activeSegments}
                                allSegmentCodes={mockSegmentCodesData}
                                lineId={lineField.id} // Pass stable ID from useFieldArray
                              />
                              <FormMessage>{form.formState.errors.lines?.[index]?.accountCodeDisplay?.message}</FormMessage>
                            </FormItem>
                          )}
                        />
                         <FormField
                            control={form.control}
                            name={`lines.${index}.description`}
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Line Description</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="Optional line item description" value={field.value ?? ''}/>
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                         />
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name={`lines.${index}.debit`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Debit</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} placeholder="0.00" step="0.01"
                                   onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                                   value={field.value ?? ''}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`lines.${index}.credit`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Credit</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} placeholder="0.00" step="0.01"
                                   onChange={e => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                                   value={field.value ?? ''}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
              {form.formState.errors.lines && typeof form.formState.errors.lines.message === 'string' && (
                <p className="text-sm font-medium text-destructive mt-2">{form.formState.errors.lines.message}</p>
              )}
            </CardContent>
            <CardFooter className="mt-4 flex justify-end space-x-6 bg-slate-50 p-4 rounded-b-lg border-t">
                <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total Debits</p>
                    <p className="text-lg font-semibold"><FormattedCurrency value={totals.debits} currency="USD" /></p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total Credits</p>
                    <p className="text-lg font-semibold"><FormattedCurrency value={totals.credits} currency="USD" /></p>
                </div>
                <div className={cn("text-right", Math.abs(totals.balance) > 0.001 ? "text-destructive" : "text-green-600")}>
                    <p className="text-sm">Balance</p>
                    <p className="text-lg font-semibold"><FormattedCurrency value={totals.balance} currency="USD" /></p>
                </div>
            </CardFooter>
          </Card>

          <div className="flex justify-end space-x-3 mt-8">
            <Button type="button" variant="outline" onClick={() => router.push('/journal-entries')}>
              Cancel
            </Button>
            <Button type="submit">
              Save Journal Entry
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
