
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
import { GripVertical } from 'lucide-react'; 
import { useSegments } from '@/contexts/SegmentsContext';
import type { Segment } from '@/lib/segment-types';

// Mock Segment Code interface (simplified for this page)
interface SegmentCode {
  id: string;
  code: string;
  description: string;
  summaryIndicator: boolean;
}

// Updated mock data for segment codes, specific to this builder page
const mockSegmentCodesForBuilder: Record<string, SegmentCode[]> = {
  'fund': [
    { id: 'fb-f-100', code: '100', description: 'General Fund', summaryIndicator: true },
    { id: 'fb-f-101', code: '101', description: 'Governmental Operating Fund', summaryIndicator: false },
    { id: 'fb-f-102', code: '102', description: 'Enterprise Parking Fund', summaryIndicator: false },
    { id: 'fb-f-103', code: '103', description: 'Special Revenue Fund - Grants', summaryIndicator: false },
    { id: 'fb-f-104', code: '104', description: 'Capital Projects Fund - Infrastructure', summaryIndicator: false },
    { id: 'fb-f-105', code: '105', description: 'Debt Service Fund - Bonds', summaryIndicator: false },
    { id: 'fb-f-106', code: '106', description: 'Internal Service Fund - IT', summaryIndicator: false },
    { id: 'fb-f-107', code: '107', description: 'Trust Fund - Pension', summaryIndicator: false },
    { id: 'fb-f-108', code: '108', description: 'Agency Fund - Payroll Deductions', summaryIndicator: false },
    { id: 'fb-f-109', code: '109', description: 'Permanent Fund - Library Endowment', summaryIndicator: false },
    { id: 'fb-f-200', code: '200', description: 'Grants & Donations Fund', summaryIndicator: true },
    { id: 'fb-f-210', code: '210', description: 'Federal Grant A', summaryIndicator: false },
    { id: 'fb-f-220', code: '220', description: 'State Grant B', summaryIndicator: false },
    { id: 'fb-f-230', code: '230', description: 'Private Donation C', summaryIndicator: false },
    { id: 'fb-f-300', code: '300', description: 'Capital Outlay Fund', summaryIndicator: true },
    { id: 'fb-f-301', code: '301', description: 'Building Project Z (Detail)', summaryIndicator: false },
    { id: 'fb-f-310', code: '310', description: 'Equipment Purchase X', summaryIndicator: false },
    { id: 'fb-f-320', code: '320', description: 'Infrastructure Upgrade Y', summaryIndicator: false },
  ],
  'department': [
    { id: 'fb-d-FIN', code: 'FIN', description: 'Finance Department (Summary)', summaryIndicator: true },
    { id: 'fb-d-HR', code: 'HR', description: 'Human Resources (Summary)', summaryIndicator: true },
    { id: 'fb-d-FIN-ACC', code: 'FIN-ACC', description: 'Accounting (Detail)', summaryIndicator: false },
    { id: 'fb-d-FIN-BUD', code: 'FIN-BUD', description: 'Budgeting (Detail)', summaryIndicator: false },
    { id: 'fb-d-IT', code: 'IT', description: 'IT Department (Detail)', summaryIndicator: false },
    { id: 'fb-d-PD', code: 'PD', description: 'Police Department', summaryIndicator: false },
    { id: 'fb-d-FD', code: 'FD', description: 'Fire Department', summaryIndicator: false },
    { id: 'fb-d-PW', code: 'PW', description: 'Public Works', summaryIndicator: false },
  ],
  'object': [
    { id: 'fb-o-5000', code: '5000', description: 'Salaries & Wages (Summary)', summaryIndicator: true },
    { id: 'fb-o-5100', code: '5100', description: 'Full-time Salaries (Detail)', summaryIndicator: false },
    { id: 'fb-o-5200', code: '5200', description: 'Part-time Salaries (Detail)', summaryIndicator: false },
    { id: 'fb-o-6000', code: '6000', description: 'Operating Expenses (Summary)', summaryIndicator: true },
    { id: 'fb-o-6100', code: '6100', description: 'Office Supplies (Detail)', summaryIndicator: false },
    { id: 'fb-o-6200', code: '6200', description: 'Utilities (Detail)', summaryIndicator: false },
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
  const [searchTerm, setSearchTerm] = useState('');

  const segmentId = searchParams.get('segmentId');

  useEffect(() => {
    if (segmentId) {
      const segment = getSegmentById(segmentId);
      if (segment) {
        setSelectedSegment(segment);
        const allCodesForSegment = mockSegmentCodesForBuilder[segment.id] || [];
        
        const filteredCodes = searchTerm
          ? allCodesForSegment.filter(
              (code) =>
                code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                code.description.toLowerCase().includes(searchTerm.toLowerCase())
            )
          : allCodesForSegment;

        setAvailableSummaryCodes(filteredCodes.filter(c => c.summaryIndicator));
        setAvailableDetailCodes(filteredCodes.filter(c => !c.summaryIndicator));
      } else {
        // Segment ID is invalid or segment not found, redirect
        router.push('/configure/hierarchies');
      }
    } else {
      // No segment ID provided, redirect
      router.push('/configure/hierarchies');
    }
  }, [segmentId, getSegmentById, router, searchTerm]);

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
    setSearchTerm('');
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
              <Input 
                placeholder="Search codes..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
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
                  <p className="text-sm text-muted-foreground">
                    {searchTerm ? 'No matching summary codes found.' : 'No summary codes available for this segment.'}
                  </p>
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
                  <p className="text-sm text-muted-foreground">
                     {searchTerm ? 'No matching detail codes found.' : 'No detail codes available for this segment.'}
                  </p>
                )}
              </ScrollArea>
            </div>
          </CardContent>
        </Card>

        {/* Center Panel - Assignment Tools & Right Panel - Live Tree Preview (Combined) */}
        <Card className="lg:col-span-2 flex flex-col"> 
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
