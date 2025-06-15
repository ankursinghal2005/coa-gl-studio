'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarIcon } from '@radix-ui/react-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useToast } from '@/components/ui/use-toast';

const FormSchema = z.object({
  fiscalYear: z.number().int().positive({
    message: 'Fiscal year must be a positive integer.',
  }),
  startDate: z.date({
    required_error: 'A start date is required.',
  }),
  endDate: z.date({
    required_error: 'An end date is required.',
  }),
});

export default function FiscalPeriodsPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    setIsSubmitting(true);

    // In a real application, you would send a request to your backend
    // to open the new fiscal period.
    // For this example, we'll simulate a successful API call.
    console.log('Attempting to open new fiscal period:', data);

    // Simulate a successful API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // --- MODIFICATION STARTS HERE ---
    // Removed the check for previous period status.
    // The application now allows opening a new period regardless of the previous period's state.
    // --- MODIFICATION ENDS HERE ---

    toast({
      title: 'Success!',
      description: `Fiscal period ${data.fiscalYear} opened successfully.`,
    });

    setIsSubmitting(false);
    // Optionally, redirect or refresh the list of fiscal periods
    // router.refresh();
  }

  return (
    <section>
      <h1 className="text-2xl font-semibold">Manage Fiscal Periods</h1>

      <div className="mt-6">
        <h2 className="text-xl font-medium">Open New Fiscal Period</h2>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="mt-4 space-y-6"
          >
            <FormField
              control={form.control}
              name="fiscalYear"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fiscal Year</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g., 2025"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>Enter the new fiscal year.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Start Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'w-[240px] pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground',
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP')
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date('1900-01-01')
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    The start date of the new fiscal period.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>End Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'w-[240px] pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground',
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP')
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date('1900-01-01')
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    The end date of the new fiscal period.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Opening...' : 'Open Fiscal Period'}
            </Button>
          </form>
        </Form>
      </div>

      {/* Add a section to list existing fiscal periods here in a real application */}
      <div className="mt-8">
        <h2 className="text-xl font-medium">Existing Fiscal Periods</h2>
        <p className="mt-2 text-gray-600">
          (List of existing fiscal periods would be displayed here in a real
          application, along with options to view details, close periods, etc.)
        </p>
      </div>
    </section>
  );
}