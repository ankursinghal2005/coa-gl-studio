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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { GripVertical } from 'lucide-react'; // For drag handle icon
import { useSegments } from '@/contexts/SegmentsContext';
import type { Segment } from '@/lib/segment-types';

// Mock Segment Code interface (simplified for this page)
interface SegmentCode {
  id: string;
  code: string;
  description: string;
  summaryIndicator: boolean;
}

// Mock data for segment codes, specific to this builder page for demonstration
// This would ideally come from a shared context or be fetched for the selectedSegment
const mockSegmentCodesForBuilder: Record<string, SegmentCode[]> = {
  'fund': [
    { id: 'f-100', code: '100', description: 'General Fund', summaryIndicator: true },
    { id: 'f-110', code: '110', description: 'Restricted Fund', summaryIndicator: true },
    { id: 'f-111', code: '111', description: 'Grant A Revenue', summaryIndicator: false },
    { id: 'f-112', code: '112', description: 'Grant B Revenue', summaryIndicator: false },
    { id: 'f-120', code: '120', description: 'Donation Revenue', summaryIndicator: false },
    { id: 'f-200', code: '200', description: 'Capital Projects Fund', summaryIndicator: true },
    { id: 'f-201', code: '201', description: 'Building Project', summaryIndicator: false },
  ],
  'department': [
    { id: 'd-FIN', code: 'FIN', description: 'Finance Department', summaryIndicator: true },
    { id: 'd-HR', code: 'HR', description: 'Human Resources', summaryIndicator: true },
    { id: 'd-FIN-ACC', code: 'FIN-ACC', description: 'Accounting', summaryIndicator: false },
    { id: 'd-FIN-BUD', code: 'FIN-BUD', description: 'Budgeting', summaryIndicator: false },
    { id: 'd-IT', code: 'IT', description: 'IT Department', summaryIndicator: false },
  ],
  'object': [
    { id: 'o-5000', code: '5000', description: 'Salaries & Wages', summaryIndicator: true },
    { id: 'o-5100', code: '5100', description: 'Full-time Salaries', summaryIndicator: false },
    { id: 'o-5200', code: '5200', description: 'Part-time Salaries', summaryIndicator: false },
    { id: 'o-6000', code: '6000', description: 'Operating Expenses', summaryIndicator: true },
    { id: 'o-6100', code: '6100', description: 'Office Supplies', summaryIndicator: false },
  ]
};


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
  const [availableSummaryCodes, setAvailableSummaryCodes] = useState<SegmentCode[]>([]);
  const [availableDetailCodes, setAvailableDetailCodes] = useState<SegmentCode[]>([]);

  const segmentId = searchParams.get('segmentId');

  useEffect(() => {
    if (segmentId) {
      const segment = getSegmentById(segmentId);
      if (segment) {
        setSelectedSegment(segment);
        const codes = mockSegmentCodesForBuilder[segment.id] || [];
        setAvailableSummaryCodes(codes.filter(c => c.summaryIndicator));
        setAvailableDetailCodes(codes.filter(c => !c.summaryIndicator));
      } else {
        router.push('/configure/hierarchies');
      }
    } else {
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
    console.log('Hierarchy Form Submitted:', values);
    alert(`Hierarchy "${values.hierarchyName}" save action placeholder. Tree building logic not yet implemented. See console for data.`);
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
    // Future: Reset tree structure as well
    alert('Reset Hierarchy action placeholder.');
  };

  const handleDragStart = (event: React.DragEvent<HTMLDivElement>, code: SegmentCode) => {
    event.dataTransfer.setData('application/json', JSON.stringify(code));
    event.dataTransfer.effectAllowed = 'move';
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
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Main Content Area - Three Panel Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[500px]">
        {/* Left Panel - Segment Code Pool */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Available Codes for {selectedSegment.displayName}</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col overflow-hidden p-0">
            <div className="p-4 border-b">
              <Input placeholder="Search codes..." disabled />
            </div>
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-4">
                <h4 className="text-md font-semibold mb-2 text-muted-foreground">Summary Codes (Parents)</h4>
              </div>
              <ScrollArea className="flex-1 px-4 pb-4">
                {availableSummaryCodes.length > 0 ? (
                  availableSummaryCodes.map(code => (
                    <div
                      key={code.id}
                      draggable="true"
                      onDragStart={(e) => handleDragStart(e, code)}
                      className="flex items-center p-2 mb-1 border rounded-md hover:bg-accent cursor-grab"
                    >
                      <GripVertical className="h-4 w-4 mr-2 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{code.code}</div>
                        <div className="text-xs text-muted-foreground">{code.description}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No summary codes available for this segment.</p>
                )}
              </ScrollArea>
               <div className="p-4 border-t">
                <h4 className="text-md font-semibold mb-2 text-muted-foreground">Detail Codes (Children)</h4>
              </div>
              <ScrollArea className="flex-1 px-4 pb-4">
                 {availableDetailCodes.length > 0 ? (
                  availableDetailCodes.map(code => (
                    <div
                      key={code.id}
                      draggable="true"
                      onDragStart={(e) => handleDragStart(e, code)}
                      className="flex items-center p-2 mb-1 border rounded-md hover:bg-accent cursor-grab"
                    >
                      <GripVertical className="h-4 w-4 mr-2 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{code.code}</div>
                        <div className="text-xs text-muted-foreground">{code.description}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No detail codes available for this segment.</p>
                )}
              </ScrollArea>
            </div>
          </CardContent>
        </Card>

        {/* Center Panel - Assignment Tools */}
        <Card className="lg:col-span-2 flex flex-col"> {/* Combined Center and Right for now */}
          <CardHeader>
            <CardTitle>Hierarchy Structure</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex items-center justify-center p-6">
            <div className="text-center text-muted-foreground">
              <p className="text-lg mb-2">Drag codes from the left panel here to build your hierarchy.</p>
              <p className="text-sm">(Full interactive tree builder and assignment tools will be implemented in a future step.)</p>
              <div className="mt-4 p-4 border border-dashed rounded-md text-left bg-muted/50">
                <p className="font-mono text-xs">Example Structure (Static):</p>
                <pre className="text-xs">
{`  100 (Summary)
  └── 110 (Summary)
      ├── 111 (Detail)
      └── 112 (Detail)
  └── 120 (Detail)`}
                </pre>
              </div>
            </div>
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
