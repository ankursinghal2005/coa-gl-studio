
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { useSegments } from '@/contexts/SegmentsContext';
import type { Segment } from '@/lib/segment-types';

const hierarchyBuilderFormSchema = z.object({
  hierarchyName: z.string().min(1, { message: 'Hierarchy Name is required.' }),
  status: z.enum(['Active', 'Inactive', 'Deprecated'], {
    required_error: 'Status is required.',
  }),
  description: z.string().optional(),
});

type HierarchyBuilderFormValues = z.infer<typeof hierarchyBuilderFormSchema>;

export default function HierarchyBuildPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getSegmentById } = useSegments();

  const [selectedSegment, setSelectedSegment] = useState<Segment | null>(null);

  const segmentId = searchParams.get('segmentId');

  useEffect(() => {
    if (segmentId) {
      const segment = getSegmentById(segmentId);
      if (segment) {
        setSelectedSegment(segment);
      } else {
        // Handle invalid segmentId, maybe redirect or show error
        router.push('/configure/hierarchies');
      }
    } else {
      // Handle missing segmentId
      router.push('/configure/hierarchies');
    }
  }, [segmentId, getSegmentById, router]);

  const form = useForm<HierarchyBuilderFormValues>({
    resolver: zodResolver(hierarchyBuilderFormSchema),
    defaultValues: {
      hierarchyName: '',
      status: 'Active',
      description: '',
    },
  });

  const onSubmit = (values: HierarchyBuilderFormValues) => {
    console.log('Form Submitted:', values);
    // Placeholder: Actual save logic will be implemented later
    alert(`Hierarchy "${values.hierarchyName}" save action placeholder. See console for data.`);
    if (segmentId) {
        router.push(`/configure/hierarchies?segmentId=${segmentId}`);
    } else {
        router.push('/configure/hierarchies');
    }
  };
  
  const handleCancel = () => {
    if (segmentId) {
        router.push(`/configure/hierarchies?segmentId=${segmentId}`);
    } else {
        router.push('/configure/hierarchies');
    }
  };

  const handleReset = () => {
    form.reset();
    alert('Reset Hierarchy action placeholder.');
  };

  if (!selectedSegment) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading segment information...</p>
      </div>
    );
  }

  const breadcrumbItems = [
    { label: 'COA Configuration', href: '/' },
    { label: 'Hierarchies', href: `/configure/hierarchies?segmentId=${selectedSegment.id}` },
    { label: 'Build Hierarchy' },
  ];

  return (
    <div className="flex flex-col min-h-screen p-4 sm:p-6 lg:p-8 bg-background">
      <Breadcrumbs items={breadcrumbItems} />
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-primary">
          Create Hierarchy for: {selectedSegment.displayName}
        </h1>
      </header>

      {/* Top Section - Form Inputs */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Hierarchy Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="hierarchyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hierarchy Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Main Reporting Hierarchy" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Inactive">Inactive</SelectItem>
                          <SelectItem value="Deprecated">Deprecated</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormItem>
                    <FormLabel>Segment</FormLabel>
                    <Input value={selectedSegment.displayName} disabled />
                  </FormItem>
              </div>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Optional: Describe the purpose of this hierarchy"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* The Save button for the form is now part of the bottom action buttons */}
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Bottom Action Buttons */}
      <div className="mt-8 flex justify-end space-x-3">
        <Button type="button" variant="outline" onClick={handleCancel}>
          Cancel
        </Button>
        <Button type="button" variant="ghost" onClick={handleReset}>
          Reset Hierarchy
        </Button>
        <Button type="button" onClick={form.handleSubmit(onSubmit)}>
          Save Hierarchy
        </Button>
      </div>
    </div>
  );
}
