
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
import { PlusCircle, FilePenLine, Trash2, ListFilter, CheckCircle, XCircle } from 'lucide-react';
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
  external1?: string;
  external2?: string;
  external3?: string;
  external4?: string;
  external5?: string;
  summaryIndicator: boolean;
  isActive: boolean;
  validFrom: Date; // Changed from effectiveDate, now required
  validTo?: Date;   // Changed from expirationDate
}

const segmentCodeFormSchema = z.object({
  code: z.string().min(1, { message: 'Segment Code is required.' }),
  description: z.string().min(1, { message: 'Description is required.' }),
  external1: z.string().optional(),
  external2: z.string().optional(),
  external3: z.string().optional(),
  external4: z.string().optional(),
  external5: z.string().optional(),
  summaryIndicator: z.boolean().default(false),
  isActive: z.boolean().default(true),
  validFrom: z.date({ required_error: "Valid From date is required." }),
  validTo: z.date().optional(),
}).refine(data => {
  if (data.validFrom && data.validTo) {
    return data.validTo >= data.validFrom;
  }
  return true;
}, {
  message: "Valid To date must be after or the same as Valid From date.",
  path: ["validTo"],
});

type SegmentCodeFormValues = z.infer<typeof segmentCodeFormSchema>;

const defaultCodeFormValues: SegmentCodeFormValues = {
  code: '',
  description: '',
  external1: '',
  external2: '',
  external3: '',
  external4: '',
  external5: '',
  summaryIndicator: false,
  isActive: true,
  validFrom: new Date(), 
  validTo: undefined,
};

export default function SegmentCodesPage() {
  const [segments] = useState<Segment[]>(allAvailableSegments);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(
    allAvailableSegments.length > 0 ? allAvailableSegments[0].id : null
  );
  const [segmentCodesData, setSegmentCodesData] = useState<Record<string, SegmentCode[]>>({
    'fund': [
      { id: 'fund-code-1', code: '100', description: 'General Fund', isActive: true, validFrom: new Date(2023, 0, 1), summaryIndicator: false, external1: "GF-001" },
      { id: 'fund-code-2', code: '200', description: 'Grant Fund', isActive: true, validTo: new Date(2024, 11, 31), validFrom: new Date(2023, 6, 1), summaryIndicator: true, external2: "GF-002" },
    ],
    'object': [
      { id: 'object-code-1', code: '51000', description: 'Salaries & Wages', isActive: true, validFrom: new Date(2023, 0, 1), summaryIndicator: false },
      { id: 'object-code-2', code: '52000', description: 'Office Supplies', isActive: false, validFrom: new Date(2022, 5, 1), validTo: new Date(2023, 4, 30), summaryIndicator: false },
    ],
    'department': [], 'project': [], 'grant': [], 'function': [], 'location': [], 'program': [],
  });

  const [isAddCodeDialogOpen, setIsAddCodeDialogOpen] = useState(false);

  const form = useForm<SegmentCodeFormValues>({
    resolver: zodResolver(segmentCodeFormSchema),
    defaultValues: defaultCodeFormValues,
  });
  
  useEffect(() => {
    if (isAddCodeDialogOpen) {
      form.reset(defaultCodeFormValues);
    }
  }, [isAddCodeDialogOpen, form]);


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
                  <DialogContent className="sm:max-w-2xl md:max-w-3xl max-h-[80vh]">
                    <DialogHeader>
                      <DialogTitle>Add New Code for {selectedSegment.displayName}</DialogTitle>
                      <DialogDescription>
                        Fill in the details for the new segment code.
                      </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="pr-6 max-h-[calc(80vh-150px)]"> {/* Adjust max-height as needed */}
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(handleAddCodeSubmit)} className="space-y-4 py-4">
                        <FormField
                          control={form.control}
                          name="code"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Segment Code *</FormLabel>
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
                              <FormLabel>Description *</FormLabel>
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
                            name="external1"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>External 1</FormLabel>
                                <FormControl><Input {...field} value={field.value ?? ''} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="external2"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>External 2</FormLabel>
                                <FormControl><Input {...field} value={field.value ?? ''} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="external3"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>External 3</FormLabel>
                                <FormControl><Input {...field} value={field.value ?? ''} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="external4"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>External 4</FormLabel>
                                <FormControl><Input {...field} value={field.value ?? ''} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="external5"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>External 5</FormLabel>
                                <FormControl><Input {...field} value={field.value ?? ''} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="validFrom"
                            render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <FormLabel>Valid From *</FormLabel>
                                <DatePicker
                                  value={field.value}
                                  onValueChange={field.onChange}
                                  placeholder="Select valid from date"
                                />
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="validTo"
                            render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <FormLabel>Valid To</FormLabel>
                                <DatePicker
                                  value={field.value}
                                  onValueChange={field.onChange}
                                  placeholder="Select valid to date"
                                  disableDates={(date) => {
                                    const validFrom = form.getValues("validFrom");
                                    return validFrom ? date < validFrom : false;
                                  }}
                                />
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                          <FormField
                            control={form.control}
                            name="summaryIndicator"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                <FormLabel>Summary Indicator</FormLabel>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
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
                        </div>
                        <DialogFooter className="pt-4">
                          <DialogClose asChild>
                            <Button type="button" variant="outline">Cancel</Button>
                          </DialogClose>
                          <Button type="submit">Save Code</Button>
                        </DialogFooter>
                      </form>
                    </Form>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Codes for {selectedSegment.displayName}</CardTitle>
                </CardHeader>
                <CardContent>
                  {currentSegmentCodes.length > 0 ? (
                    <ScrollArea className="w-full whitespace-nowrap">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[100px]">Code</TableHead>
                          <TableHead className="min-w-[200px]">Description</TableHead>
                          <TableHead className="text-center min-w-[100px]">Summary</TableHead>
                          <TableHead className="text-center min-w-[100px]">Status</TableHead>
                          <TableHead className="min-w-[120px]">External 1</TableHead>
                          <TableHead className="min-w-[120px]">External 2</TableHead>
                          <TableHead className="min-w-[120px]">External 3</TableHead>
                          <TableHead className="min-w-[120px]">External 4</TableHead>
                          <TableHead className="min-w-[120px]">External 5</TableHead>
                          <TableHead className="min-w-[150px]">Valid From</TableHead>
                          <TableHead className="min-w-[150px]">Valid To</TableHead>
                          <TableHead className="text-right min-w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentSegmentCodes.map(code => (
                          <TableRow key={code.id}>
                            <TableCell className="font-medium">{code.code}</TableCell>
                            <TableCell className="whitespace-normal break-words">{code.description}</TableCell>
                            <TableCell className="text-center">
                              {code.summaryIndicator ? <CheckCircle className="h-5 w-5 text-green-500 inline" /> : <XCircle className="h-5 w-5 text-muted-foreground inline" />}
                            </TableCell>
                            <TableCell className="text-center">
                              <Switch
                                checked={code.isActive}
                                onCheckedChange={() => handleCodeStatusToggle(code.id)}
                                aria-label={`Toggle status for code ${code.code}`}
                              />
                            </TableCell>
                            <TableCell>{code.external1 ?? 'N/A'}</TableCell>
                            <TableCell>{code.external2 ?? 'N/A'}</TableCell>
                            <TableCell>{code.external3 ?? 'N/A'}</TableCell>
                            <TableCell>{code.external4 ?? 'N/A'}</TableCell>
                            <TableCell>{code.external5 ?? 'N/A'}</TableCell>
                            <TableCell>
                              {format(code.validFrom, "MMM d, yyyy")}
                            </TableCell>
                            <TableCell>
                              {code.validTo ? format(code.validTo, "MMM d, yyyy") : 'N/A'}
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
                    </ScrollArea>
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

