
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from "date-fns";
import { useSearchParams } from 'next/navigation'; // Added import
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
import { PlusCircle, ListFilter, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useSegments } from '@/contexts/SegmentsContext';
import type { Segment } from '@/lib/segment-types';

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
  validFrom: Date;
  validTo?: Date;
  availableForTransactionCoding: boolean;
  availableForBudgeting: boolean;
}

const segmentCodeFormSchema = z.object({
  id: z.string().optional(),
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
  availableForTransactionCoding: z.boolean().default(false),
  availableForBudgeting: z.boolean().default(false),
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
  availableForTransactionCoding: false,
  availableForBudgeting: false,
};


export default function SegmentCodesPage() {
  const { segments: allAvailableSegments } = useSegments();
  const searchParams = useSearchParams();
  
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);

  const [segmentCodesData, setSegmentCodesData] = useState<Record<string, SegmentCode[]>>(() => {
    const data: Record<string, SegmentCode[]> = {};
    allAvailableSegments.forEach(segment => {
      data[segment.id] = []; 
    });
    if (data['fund']) {
      data['fund'] = [
        { id: 'fund-code-100', code: '100', description: 'General Fund', summaryIndicator: true, isActive: true, validFrom: new Date(2023, 0, 1), availableForTransactionCoding: false, availableForBudgeting: true, external1: "GF-001" },
        { id: 'fund-code-101', code: '101', description: 'Special Revenue Fund A', summaryIndicator: false, isActive: true, validFrom: new Date(2023, 0, 1), availableForTransactionCoding: true, availableForBudgeting: true, external1: "SRFA-001" },
        { id: 'fund-code-102', code: '102', description: 'Capital Projects Fund B', summaryIndicator: false, isActive: true, validFrom: new Date(2023, 0, 1), availableForTransactionCoding: true, availableForBudgeting: true, external1: "CPFB-001" },
        { id: 'fund-code-103', code: '103', description: 'Debt Service Fund C', summaryIndicator: false, isActive: true, validFrom: new Date(2023, 0, 1), availableForTransactionCoding: true, availableForBudgeting: true, external1: "DSFC-001" },
        { id: 'fund-code-200', code: '200', description: 'Grant Fund', summaryIndicator: true, isActive: true, validFrom: new Date(2023, 6, 1), validTo: new Date(2024, 11, 31), availableForTransactionCoding: false, availableForBudgeting: true, external2: "Summary" },
        { id: 'fund-code-201', code: '201', description: 'Special Revenue Fund D', summaryIndicator: false, isActive: true, validFrom: new Date(2023, 0, 1), availableForTransactionCoding: true, availableForBudgeting: true, external1: "SRFD-001" },
        { id: 'fund-code-202', code: '202', description: 'Capital Projects Fund E', summaryIndicator: false, isActive: true, validFrom: new Date(2023, 0, 1), availableForTransactionCoding: true, availableForBudgeting: true, external1: "CPFE-001" },
        { id: 'fund-code-203', code: '203', description: 'Debt Service Fund F', summaryIndicator: false, isActive: true, validFrom: new Date(2023, 0, 1), availableForTransactionCoding: true, availableForBudgeting: true, external1: "DSFF-001" },
      ];
    }
    if (data['object']) {
       data['object'] = [
        { id: 'object-code-1', code: '51000', description: 'Salaries & Wages', isActive: true, validFrom: new Date(2023, 0, 1), summaryIndicator: false, external4: "DeptXYZ", availableForTransactionCoding: true, availableForBudgeting: true },
        { id: 'object-code-2', code: '52000', description: 'Office Supplies', isActive: false, validFrom: new Date(2022, 5, 1), validTo: new Date(2023, 4, 30), summaryIndicator: false, availableForTransactionCoding: false, availableForBudgeting: false },
      ];
    }
    return data;
  });

  const [isCodeFormOpen, setIsCodeFormOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'view' | 'edit'>('add');
  const [currentEditingCode, setCurrentEditingCode] = useState<SegmentCode | null>(null);

  const form = useForm<SegmentCodeFormValues>({
    resolver: zodResolver(segmentCodeFormSchema),
    defaultValues: defaultCodeFormValues,
  });

  useEffect(() => {
    const querySegmentId = searchParams.get('segmentId');
    if (querySegmentId && allAvailableSegments.some(s => s.id === querySegmentId)) {
      if (selectedSegmentId !== querySegmentId) {
        setSelectedSegmentId(querySegmentId);
      }
    } else if (!selectedSegmentId && allAvailableSegments.length > 0) {
      setSelectedSegmentId(allAvailableSegments[0].id);
    } else if (selectedSegmentId && !allAvailableSegments.some(s => s.id === selectedSegmentId)) {
      setSelectedSegmentId(allAvailableSegments.length > 0 ? allAvailableSegments[0].id : null);
    }
  }, [searchParams, allAvailableSegments, selectedSegmentId, setSelectedSegmentId]);

  useEffect(() => {
    if (isCodeFormOpen) {
      if (dialogMode === 'add') {
        form.reset(defaultCodeFormValues);
        setCurrentEditingCode(null);
      } else if ((dialogMode === 'view' || dialogMode === 'edit') && currentEditingCode) {
        form.reset({
          ...currentEditingCode,
          validFrom: currentEditingCode.validFrom ? new Date(currentEditingCode.validFrom) : new Date(),
          validTo: currentEditingCode.validTo ? new Date(currentEditingCode.validTo) : undefined,
        });
      }
    } else {
      form.reset(defaultCodeFormValues);
      setCurrentEditingCode(null);
      setDialogMode('add');
    }
  }, [isCodeFormOpen, dialogMode, currentEditingCode, form]);


  const selectedSegment = useMemo(() => {
    return allAvailableSegments.find(s => s.id === selectedSegmentId);
  }, [allAvailableSegments, selectedSegmentId]);

  const currentSegmentCodes = useMemo(() => {
    if (!selectedSegmentId || !segmentCodesData[selectedSegmentId]) {
      return [];
    }
    return segmentCodesData[selectedSegmentId];
  }, [selectedSegmentId, segmentCodesData]);

  const handleSaveCodeSubmit = (values: SegmentCodeFormValues) => {
    if (!selectedSegmentId) return;

    if (dialogMode === 'add') {
      const newCode: SegmentCode = {
        id: crypto.randomUUID(),
        ...values,
      };
      setSegmentCodesData(prev => ({
        ...prev,
        [selectedSegmentId]: [...(prev[selectedSegmentId] || []), newCode],
      }));
    } else if (dialogMode === 'edit' && currentEditingCode) {
      const updatedCode = { ...currentEditingCode, ...values };
      setSegmentCodesData(prev => ({
        ...prev,
        [selectedSegmentId]: (prev[selectedSegmentId] || []).map(code =>
          code.id === currentEditingCode.id ? updatedCode : code
        ),
      }));
      setCurrentEditingCode(updatedCode); 
      setDialogMode('view'); 
      return;
    }
    setIsCodeFormOpen(false);
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

  const handleOpenAddCodeDialog = () => {
    setDialogMode('add');
    setCurrentEditingCode(null); 
    setIsCodeFormOpen(true);
  };

  const handleViewCode = (code: SegmentCode) => {
    setDialogMode('view');
    setCurrentEditingCode(code);
    setIsCodeFormOpen(true);
  };

  const handleEditCodeFromDialog = () => { 
    if (currentEditingCode) {
      setDialogMode('edit');
    }
  };

   const handleDialogClose = (isOpen: boolean) => {
    if (!isOpen) {
      setIsCodeFormOpen(false); 
    } else {
      setIsCodeFormOpen(true);
    }
  };

  const breadcrumbItems = [
    { label: 'COA Configuration', href: '/' },
    { label: 'Segment Codes' }
  ];

  const isFieldDisabled = dialogMode === 'view';

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="p-4 sm:p-8">
         <Breadcrumbs items={breadcrumbItems} />
      </div>
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-1/4 min-w-[200px] max-w-[300px] border-r bg-card p-4 space-y-2 overflow-y-auto">
          <h2 className="text-lg font-semibold mb-3 text-primary flex items-center">
            <ListFilter className="mr-2 h-5 w-5" /> Segments
          </h2>
          <ScrollArea className="h-[calc(100%-3rem)]">
            {allAvailableSegments.map(segment => (
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
                <Dialog open={isCodeFormOpen} onOpenChange={handleDialogClose}>
                  <DialogTrigger asChild>
                    <Button onClick={handleOpenAddCodeDialog}>
                      <PlusCircle className="mr-2 h-5 w-5" />
                      Add Code
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-2xl md:max-w-3xl max-h-[80vh]">
                    <DialogHeader>
                      <DialogTitle>
                        {dialogMode === 'add' && `Add New Code for ${selectedSegment.displayName}`}
                        {dialogMode === 'view' && `View Code: ${currentEditingCode?.code} for ${selectedSegment.displayName}`}
                        {dialogMode === 'edit' && `Edit Code: ${currentEditingCode?.code} for ${selectedSegment.displayName}`}
                      </DialogTitle>
                      <DialogDescription>
                        {dialogMode === 'add' && "Fill in the details for the new segment code."}
                        {dialogMode === 'view' && "Viewing details for the selected segment code."}
                        {dialogMode === 'edit' && "Modify the details of the segment code."}
                      </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="pr-6 max-h-[calc(80vh-150px)]">
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(handleSaveCodeSubmit)} className="space-y-4 py-4">
                        <FormField
                          control={form.control}
                          name="code"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Segment Code *</FormLabel>
                              <FormControl>
                                <Input {...field} disabled={isFieldDisabled || dialogMode === 'edit'} />
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
                                <Textarea {...field} disabled={isFieldDisabled} />
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
                                <FormControl><Input {...field} value={field.value ?? ''} disabled={isFieldDisabled} /></FormControl>
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
                                <FormControl><Input {...field} value={field.value ?? ''} disabled={isFieldDisabled} /></FormControl>
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
                                <FormControl><Input {...field} value={field.value ?? ''} disabled={isFieldDisabled} /></FormControl>
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
                                <FormControl><Input {...field} value={field.value ?? ''} disabled={isFieldDisabled} /></FormControl>
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
                                <FormControl><Input {...field} value={field.value ?? ''} disabled={isFieldDisabled} /></FormControl>
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
                                  disabled={isFieldDisabled}
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
                                  disabled={isFieldDisabled}
                                  disableDates={(date) => {
                                    const validFrom = form.getValues("validFrom");
                                    return validFrom instanceof Date ? date < validFrom : false;
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
                            name="availableForTransactionCoding"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                <FormLabel>Available for Transaction Coding</FormLabel>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    disabled={isFieldDisabled}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="availableForBudgeting"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                <FormLabel>Available for Budgeting</FormLabel>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    disabled={isFieldDisabled}
                                  />
                                </FormControl>
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
                                    disabled={isFieldDisabled}
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
                                    disabled={isFieldDisabled}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        <DialogFooter className="pt-4">
                          {dialogMode === 'add' && (
                            <>
                              <Button type="button" variant="outline" onClick={() => setIsCodeFormOpen(false)}>Cancel</Button>
                              <Button type="submit">Save Code</Button>
                            </>
                          )}
                          {dialogMode === 'view' && currentEditingCode && (
                            <>
                              <Button type="button" variant="outline" onClick={() => setIsCodeFormOpen(false)}>Close</Button>
                              <Button type="button" onClick={handleEditCodeFromDialog}>Edit</Button>
                            </>
                          )}
                          {dialogMode === 'edit' && currentEditingCode && (
                            <>
                              <Button type="button" variant="outline" onClick={() => {
                                setDialogMode('view');
                                if(currentEditingCode) form.reset({
                                  ...currentEditingCode,
                                  validFrom: currentEditingCode.validFrom ? new Date(currentEditingCode.validFrom) : new Date(),
                                  validTo: currentEditingCode.validTo ? new Date(currentEditingCode.validTo) : undefined,
                                });
                              }}>Cancel</Button>
                              <Button type="submit">Save Changes</Button>
                            </>
                          )}
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
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentSegmentCodes.map(code => (
                          <TableRow key={code.id}>
                            <TableCell className="font-medium">
                              <span onClick={() => handleViewCode(code)} className="cursor-pointer text-primary hover:underline">
                                {code.code}
                              </span>
                            </TableCell>
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
               {allAvailableSegments.length > 0 ?
                <p className="text-xl text-muted-foreground">Please select a segment from the left panel.</p>
                :
                <p className="text-xl text-muted-foreground">No segments configured. Please add segments in 'Manage Segments' first.</p>
              }
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

