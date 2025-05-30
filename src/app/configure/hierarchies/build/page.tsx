
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { useSegments } from '@/contexts/SegmentsContext';
import type { Segment } from '@/lib/segment-types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Folder, FileText } from 'lucide-react'; // Icons for tree preview

// Simplified SegmentCode interface for mock data in this builder
interface BuilderSegmentCode {
  id: string;
  code: string;
  description: string;
  summaryIndicator: boolean;
}

const hierarchyBuilderFormSchema = z.object({
  hierarchyName: z.string().min(1, { message: 'Hierarchy Name is required.' }),
  status: z.enum(['Active', 'Inactive', 'Deprecated'], {
    required_error: 'Status is required.',
  }),
  description: z.string().optional(),
});

type HierarchyBuilderFormValues = z.infer<typeof hierarchyBuilderFormSchema>;

// Mock data for segment codes, to be replaced with actual data fetching/context later
const mockSegmentCodes: Record<string, BuilderSegmentCode[]> = {
  fund: [
    { id: 'fsc1', code: '100', description: 'General Fund', summaryIndicator: true },
    { id: 'fsc2', code: '110', description: 'Restricted Revenue', summaryIndicator: true },
    { id: 'fsc3', code: '111', description: 'Federal Grants', summaryIndicator: false },
    { id: 'fsc4', code: '112', description: 'State Grants', summaryIndicator: false },
    { id: 'fsc5', code: '120', description: 'Operating Expenditures', summaryIndicator: false },
    { id: 'fsc6', code: '200', description: 'Enterprise Fund', summaryIndicator: true },
    { id: 'fsc7', code: '210', description: 'Water Utility', summaryIndicator: false },
  ],
  department: [
    { id: 'dsc1', code: 'FIN', description: 'Finance Department', summaryIndicator: true },
    { id: 'dsc2', code: 'IT', description: 'IT Department', summaryIndicator: true },
    { id: 'dsc3', code: 'HR', description: 'Human Resources', summaryIndicator: false },
  ],
};


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
    // Placeholder: Reset tree structure state here in the future
    alert('Reset Hierarchy action placeholder.');
  };

  const availableCodesForSegment = useMemo(() => {
    if (selectedSegment && mockSegmentCodes[selectedSegment.id]) {
      return mockSegmentCodes[selectedSegment.id];
    }
    return [];
  }, [selectedSegment]);

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
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Main Content Area - Three Panels */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden">
        {/* Left Panel - Segment Code Pool */}
        <Card className="lg:col-span-3 flex flex-col">
          <CardHeader>
            <CardTitle>Available Codes for {selectedSegment.displayName}</CardTitle>
            <CardDescription>Drag codes to the tree or use assignment tools.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full">
              <div className="p-6">
                {availableCodesForSegment.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-center">Summary</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {availableCodesForSegment.map((code) => (
                        <TableRow key={code.id}>
                          <TableCell className="font-medium">{code.code}</TableCell>
                          <TableCell>{code.description}</TableCell>
                          <TableCell className="text-center">{code.summaryIndicator ? 'Yes' : 'No'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    No codes found for this segment, or data is not yet loaded.
                    (Filter/search to be implemented)
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Center Panel - Assignment Tools */}
        <Card className="lg:col-span-4 flex flex-col">
          <CardHeader>
            <CardTitle>Assignment Tools</CardTitle>
             <CardDescription>Select a node in the Tree Preview (right panel) to manage its children.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center text-center p-4">
            <p className="text-muted-foreground mb-2">
              Based on your selection in the tree, tools to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground text-sm mb-4">
              <li>Assign codes from the 'Available Codes' pool</li>
              <li>Create virtual (grouping) nodes</li>
              <li>Remove child nodes</li>
            </ul>
            <p className="text-muted-foreground text-sm">
              ...will appear here.
            </p>
            <p className="text-xs text-muted-foreground/80 mt-auto">
              (This section is a placeholder for future interactive components. Node selection and assignment are not yet active.)
            </p>
          </CardContent>
        </Card>

        {/* Right Panel - Live Tree Preview */}
        <Card className="lg:col-span-5 flex flex-col">
          <CardHeader>
            <CardTitle>Live Tree Preview</CardTitle>
            <CardDescription>View the hierarchy structure as you build it.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full">
                <div className="p-4 text-sm text-muted-foreground">
                    <p className="mb-2">
                        (This is a placeholder for the interactive tree. Node interaction, drag & drop, and dynamic updates are planned for a future step.)
                    </p>
                    <p className="italic text-xs mb-4">
                        Conceptual: Clicking a node here would select it, and its details/children would be manageable in the 'Assignment Tools' panel.
                    </p>
                    <p className="mb-2 font-medium">Example Static Tree Structure:</p>
                    <div className="space-y-1 font-mono">
                        <div className="flex items-center">
                            <Folder className="w-4 h-4 mr-2 text-primary" />
                            <span className="font-semibold">100 (summary)</span>
                        </div>
                        <div className="ml-6 space-y-1">
                            <div className="flex items-center">
                                <Folder className="w-4 h-4 mr-2 text-primary" />
                                <span className="font-semibold">110 (summary)</span>
                            </div>
                            <div className="ml-6 space-y-1">
                                <div className="flex items-center">
                                    <FileText className="w-4 h-4 mr-2 text-accent" />
                                    <span>111 (detail, postable)</span>
                                </div>
                                <div className="flex items-center">
                                    <FileText className="w-4 h-4 mr-2 text-accent" />
                                    <span>112 (detail, postable)</span>
                                </div>
                            </div>
                            <div className="flex items-center mt-1">
                                <FileText className="w-4 h-4 mr-2 text-accent" />
                                <span>120 (detail, postable)</span>
                            </div>
                        </div>
                    </div>
                </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

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

