
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from "date-fns";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { DatePicker } from "@/components/ui/date-picker";
import { PlusCircle, FilePenLine, Trash2, ListFilter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

// Re-using Segment definition from Segments page for consistency
interface Segment {
  id: string;
  displayName: string;
  segmentType: string;
  isActive: boolean;
  isCore: boolean;
  regex?: string;
  defaultCode?: string;
  separator?: '-' | '|' | ',' | '.';
  isCustom: boolean;
  isMandatoryForCoding: boolean;
  validFrom?: Date;
  validTo?: Date;
}

// Data that would typically come from an API or shared state
// For now, we'll use the same initialSegmentsData as in the Segments page.
const allAvailableSegments: Segment[] = [
  { id: 'fund', displayName: 'Fund', segmentType: 'Fund', isActive: true, isCore: true, isCustom: false, isMandatoryForCoding: true, separator: '-', },
  { id: 'object', displayName: 'Object', segmentType: 'Object', isActive: true, isCore: true, isCustom: false, isMandatoryForCoding: true, separator: '-', },
  { id: 'department', displayName: 'Department', segmentType: 'Department', isActive: true, isCore: true, isCustom: false, isMandatoryForCoding: true, separator: '-', },
  { id: 'project', displayName: 'Project', segmentType: 'Project', isActive: true, isCore: false, isCustom: false, isMandatoryForCoding: false, separator: '-', },
  { id: 'grant', displayName: 'Grant', segmentType: 'Grant', isActive: true, isCore: false, isCustom: false, isMandatoryForCoding: false, separator: '-', },
  { id: 'function', displayName: 'Function', segmentType: 'Function', isActive: true, isCore: false, isCustom: false, isMandatoryForCoding: false, separator: '-', },
  { id: 'location', displayName: 'Location', segmentType: 'Location', isActive: true, isCore: false, isCustom: false, isMandatoryForCoding: false, separator: '-', },
  { id: 'program', displayName: 'Program', segmentType: 'Program', isActive: true, isCore: false, isCustom: false, isMandatoryForCoding: false, separator: '-', },
];


interface SegmentCode {
  id: string;
  code: string;
  description: string;
  isActive: boolean;
  effectiveDate?: Date;
  expirationDate?: Date;
}

const segmentCodeFormSchema = z.object({
  code: z.string().min(1, { message: 'Code is required.' }),
  description: z.string().min(1, { message: 'Description is required.' }),
  effectiveDate: z.date().optional(),
  expirationDate: z.date().optional(),
  isActive: z.boolean().default(true),
}).refine(data => {
  if (data.effectiveDate && data.expirationDate) {
    return data.expirationDate >= data.effectiveDate;
  }
  return true;
}, {
  message: "Expiration Date must be after or the same as Effective Date.",
  path: ["expirationDate"],
});

type SegmentCodeFormValues = z.infer<typeof segmentCodeFormSchema>;

const defaultCodeFormValues: SegmentCodeFormValues = {
  code: '',
  description: '',
  effectiveDate: undefined,
  expirationDate: undefined,
  isActive: true,
};

export default function SegmentCodesPage() {
  const [segments] = useState<Segment[]>(allAvailableSegments);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(
    allAvailableSegments.length > 0 ? allAvailableSegments[0].id : null
  );
  const [segmentCodesData, setSegmentCodesData] = useState<Record<string, SegmentCode[]>>({
    'fund': [
      { id: 'fund-code-1', code: '100', description: 'General Fund', isActive: true, effectiveDate: new Date(2023, 0, 1) },
      { id: 'fund-code-2', code: '200', description: 'Grant Fund', isActive: true, expirationDate: new Date(2024, 11, 31) },
    ],
    'object': [
      { id: 'object-code-1', code: '51000', description: 'Salaries & Wages', isActive: true },
      { id: 'object-code-2', code: '52000', description: 'Office Supplies', isActive: false, effectiveDate: new Date(2022, 5, 1), expirationDate: new Date(2023, 4, 30) },
    ],
    // Initialize with empty arrays for other segments to avoid errors
    'department': [], 'project': [], 'grant': [], 'function': [], 'location': [], 'program': [],
  });

  const [isAddCodeDialogOpen, setIsAddCodeDialogOpen] = useState(false);

  const form = useForm<SegmentCodeFormValues>({
    resolver: zodResolver(segmentCodeFormSchema),
    defaultValues: defaultCodeFormValues,
  });

  const selectedSegment = useMemo(() => {
    return segments.find(s => s.id === selectedSegmentId);
  }, [segments, selectedSegmentId]);

  const currentSegmentCodes = useMemo(() => {
    if (!selectedSegmentId || !segmentCodesData[selectedSegmentId]) {
      return [];
    }
    return segmentCodesData[selectedSegmentId];
  }, [selectedSegmentId, segmentCodesData]);

  const handleAddCodeSubmit = (values: SegmentCodeFormValues) => {
    if (!selectedSegmentId) return;

    const newCode: SegmentCode = {
      id: crypto.randomUUID(),
      ...values,
    };

    setSegmentCodesData(prev => ({
      ...prev,
      [selectedSegmentId]: [...(prev[selectedSegmentId] || []), newCode],
    }));
    setIsAddCodeDialogOpen(false);
    form.reset(defaultCodeFormValues);
  };

  const handleCodeStatusToggle = (codeId: string) => {
    if (!selectedSegmentId) return;
    setSegmentCodesData(prev => ({
      ...prev,
      [selectedSegmentId]: (prev[selectedSegmentId] || []).map(code =>
        code.id === codeId ? { ...code, isActive: !code.isActive } : code
      ),
    }));
  };

  const breadcrumbItems = [
    { label: 'COA Configuration', href: '/' },
    { label: 'Segment Codes' }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="p-4 sm:p-8">
         <Breadcrumbs items={breadcrumbItems} />
      </div>
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar for Segment Selection */}
        <aside className="w-1/4 min-w-[200px] max-w-[300px] border-r bg-card p-4 space-y-2 overflow-y-auto">
          <h2 className="text-lg font-semibold mb-3 text-primary flex items-center">
            <ListFilter className="mr-2 h-5 w-5" /> Segments
          </h2>
          <ScrollArea className="h-[calc(100%-3rem)]">
            {segments.map(segment => (
              <Button
                key={segment.id}
                variant={selectedSegmentId === segment.id ? 'secondary' : 'ghost'}
                className={cn(
                  "w-full justify-start text-left mb-1",
                  selectedSegmentId === segment.id && "font-semibold text-primary"
                )}
                onClick={() => setSelectedSegmentId(segment.id)}
              >
                {segment.displayName}
              </Button>
            ))}
          </ScrollArea>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {selectedSegment ? (
            <>
              <header className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-primary">
                  Manage Codes for: {selectedSegment.displayName}
                </h1>
                <p className="text-md text-muted-foreground mt-1">
                  Define and manage codes associated with the selected segment.
                </p>
              </header>

              <div className="mb-6 flex justify-end">
                <Dialog open={isAddCodeDialogOpen} onOpenChange={setIsAddCodeDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => { form.reset(defaultCodeFormValues); setIsAddCodeDialogOpen(true);}}>
                      <PlusCircle className="mr-2 h-5 w-5" />
                      Add Code
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Add New Code for {selectedSegment.displayName}</DialogTitle>
                      <DialogDescription>
                        Fill in the details for the new segment code.
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(handleAddCodeSubmit)} className="space-y-4 py-4">
                        <FormField
                          control={form.control}
                          name="code"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Code</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="effectiveDate"
                            render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <FormLabel>Effective Date</FormLabel>
                                <DatePicker
                                  value={field.value}
                                  onValueChange={field.onChange}
                                  placeholder="Select effective date"
                                />
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="expirationDate"
                            render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <FormLabel>Expiration Date</FormLabel>
                                <DatePicker
                                  value={field.value}
                                  onValueChange={field.onChange}
                                  placeholder="Select expiration date"
                                  disableDates={(date) => {
                                    return form.getValues("effectiveDate") ? date < form.getValues("effectiveDate")! : false;
                                  }}
                                />
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={form.control}
                          name="isActive"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                              <FormLabel>Active</FormLabel>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <DialogFooter className="pt-4">
                          <DialogClose asChild>
                            <Button type="button" variant="outline">Cancel</Button>
                          </DialogClose>
                          <Button type="submit">Save Code</Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Codes for {selectedSegment.displayName}</CardTitle>
                </CardHeader>
                <CardContent>
                  {currentSegmentCodes.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[120px]">Code</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="w-[150px]">Effective</TableHead>
                          <TableHead className="w-[150px]">Expires</TableHead>
                          <TableHead className="text-center w-[100px]">Status</TableHead>
                          <TableHead className="text-right w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentSegmentCodes.map(code => (
                          <TableRow key={code.id}>
                            <TableCell className="font-medium">{code.code}</TableCell>
                            <TableCell>{code.description}</TableCell>
                            <TableCell>
                              {code.effectiveDate ? format(code.effectiveDate, "MMM d, yyyy") : 'N/A'}
                            </TableCell>
                            <TableCell>
                              {code.expirationDate ? format(code.expirationDate, "MMM d, yyyy") : 'N/A'}
                            </TableCell>
                            <TableCell className="text-center">
                              <Switch
                                checked={code.isActive}
                                onCheckedChange={() => handleCodeStatusToggle(code.id)}
                                aria-label={`Toggle status for code ${code.code}`}
                              />
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                              <Button variant="ghost" size="icon" onClick={() => alert(`Edit ${code.code}`)} title="Edit Code">
                                <FilePenLine className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => alert(`Delete ${code.code}`)} title="Delete Code">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      No codes defined for {selectedSegment.displayName}. Click "Add Code" to get started.
                    </p>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <p className="text-xl text-muted-foreground">Please select a segment from the left panel.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
