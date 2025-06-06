
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from "date-fns";
import { useSearchParams } from 'next/navigation'; 
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
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { PlusCircle, ListFilter, CheckCircle, XCircle, ChevronsUpDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription as CardDesc } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useSegments } from '@/contexts/SegmentsContext';
import type { Segment, SegmentCode, CustomFieldDefinition } from '@/lib/segment-types';
import { mockSegmentCodesData } from '@/lib/segment-types';
import { useHierarchies } from '@/contexts/HierarchiesContext';
import type { HierarchyNode, HierarchySet, SegmentHierarchyInSet } from '@/lib/hierarchy-types';
import { useToast } from "@/hooks/use-toast"


const submoduleOptions = [
  'General Ledger', 
  'Accounts Payable', 
  'Accounts Receivables', 
  'Cash Receipts', 
  'Payroll'
] as const;

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
  allowedSubmodules: z.array(z.string()).optional(),
  customFieldValues: z.record(z.string(), z.any().optional()).optional(),
  defaultParentCode: z.string().optional(), // New field
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
  allowedSubmodules: [...submoduleOptions], 
  customFieldValues: {},
  defaultParentCode: '', // New field
};

// Helper: Checks if a segment code (by its ID) exists anywhere in a tree of HierarchyNodes
const codeExistsInSegmentHierarchy = (nodes: HierarchyNode[], segmentCodeId: string): boolean => {
  for (const node of nodes) {
    if (node.segmentCode.id === segmentCodeId) return true;
    if (node.children && codeExistsInSegmentHierarchy(node.children, segmentCodeId)) {
      return true;
    }
  }
  return false;
};

// Helper: Finds a HierarchyNode by its segmentCode.id
const findNodeBySegmentCodeIdRecursive = (nodes: HierarchyNode[], segmentCodeId: string): HierarchyNode | null => {
  for (const node of nodes) {
    if (node.segmentCode.id === segmentCodeId) return node;
    if (node.children) {
      const found = findNodeBySegmentCodeIdRecursive(node.children, segmentCodeId);
      if (found) return found;
    }
  }
  return null;
};


export default function SegmentCodesPage() {
  const { segments: allAvailableSegments } = useSegments();
  const { addHierarchySet, updateHierarchySet, getHierarchySetById } = useHierarchies();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const querySegmentIdParam = searchParams.get('segmentId');
  
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);

  const [segmentCodesData, setSegmentCodesData] = useState<Record<string, SegmentCode[]>>(() => {
    const initialData: Record<string, SegmentCode[]> = {};
    for (const segmentKey in mockSegmentCodesData) {
      initialData[segmentKey] = mockSegmentCodesData[segmentKey].map(code => ({...code}));
    }
    allAvailableSegments.forEach(segment => {
      if (!initialData[segment.id]) {
        initialData[segment.id] = [];
      }
    });
    return initialData;
  });

  const [isCodeFormOpen, setIsCodeFormOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'view' | 'edit'>('add');
  const [currentEditingCode, setCurrentEditingCode] = useState<SegmentCode | null>(null);

  const form = useForm<SegmentCodeFormValues>({
    resolver: zodResolver(segmentCodeFormSchema),
    defaultValues: defaultCodeFormValues,
  });
  

  useEffect(() => {
    setSelectedSegmentId(currentSelectedId => {
      if (querySegmentIdParam && allAvailableSegments.some(s => s.id === querySegmentIdParam)) {
        if (currentSelectedId !== querySegmentIdParam) {
          return querySegmentIdParam;
        }
        return currentSelectedId;
      }
      if (currentSelectedId && allAvailableSegments.some(s => s.id === currentSelectedId)) {
        return currentSelectedId;
      }
      if (allAvailableSegments.length > 0) {
        return allAvailableSegments[0].id;
      }
      return null;
    });
  }, [querySegmentIdParam, allAvailableSegments]);

  useEffect(() => {
    if (isCodeFormOpen) {
      if (dialogMode === 'add') {
        form.reset({...defaultCodeFormValues, customFieldValues: {}, defaultParentCode: ''});
        setCurrentEditingCode(null);
      } else if ((dialogMode === 'view' || dialogMode === 'edit') && currentEditingCode) {
        form.reset({
          ...currentEditingCode,
          validFrom: currentEditingCode.validFrom ? new Date(currentEditingCode.validFrom) : new Date(),
          validTo: currentEditingCode.validTo ? new Date(currentEditingCode.validTo) : undefined,
          allowedSubmodules: currentEditingCode.allowedSubmodules || [],
          customFieldValues: currentEditingCode.customFieldValues || {},
          defaultParentCode: currentEditingCode.defaultParentCode || '',
        });
      }
    } else {
      form.reset({...defaultCodeFormValues, customFieldValues: {}, defaultParentCode: ''});
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
    if (!selectedSegmentId || !selectedSegment) {
        toast({ title: "Error", description: "No segment selected.", variant: "destructive" });
        return;
    }

    const dataToSave: SegmentCode = {
      id: values.id || `${selectedSegmentId}-code-${crypto.randomUUID()}`,
      code: values.code,
      description: values.description,
      external1: values.external1,
      external2: values.external2,
      external3: values.external3,
      external4: values.external4,
      external5: values.external5,
      summaryIndicator: values.summaryIndicator,
      isActive: values.isActive,
      validFrom: values.validFrom,
      validTo: values.validTo,
      availableForTransactionCoding: values.availableForTransactionCoding,
      availableForBudgeting: values.availableForBudgeting,
      allowedSubmodules: values.allowedSubmodules || [],
      customFieldValues: values.customFieldValues || {},
      defaultParentCode: values.defaultParentCode?.trim() || undefined,
    };

    // Save the code itself first
    if (dialogMode === 'add') {
      // Check for duplicate code string before adding
      if ((segmentCodesData[selectedSegmentId] || []).some(c => c.code === dataToSave.code)) {
        form.setError("code", { type: "manual", message: "This code already exists for this segment." });
        toast({ title: "Validation Error", description: "This code already exists for this segment.", variant: "destructive" });
        return;
      }
      setSegmentCodesData(prev => ({
        ...prev,
        [selectedSegmentId]: [...(prev[selectedSegmentId] || []), dataToSave],
      }));
      toast({ title: "Success", description: `Code "${dataToSave.code}" added successfully.` });
    } else if (dialogMode === 'edit' && currentEditingCode) {
      // Check for duplicate code string if code was changed (ID remains same, code string might change if allowed)
      // For now, assuming 'code' field is disabled in edit mode, so no duplicate check needed here based on string.
      const updatedCode = { ...currentEditingCode, ...dataToSave };
      setSegmentCodesData(prev => ({
        ...prev,
        [selectedSegmentId]: (prev[selectedSegmentId] || []).map(code =>
          code.id === currentEditingCode.id ? updatedCode : code
        ),
      }));
      setCurrentEditingCode(updatedCode);
      toast({ title: "Success", description: `Code "${dataToSave.code}" updated successfully.` });
    }

    // --- Hierarchy Logic ---
    if (dataToSave.defaultParentCode) {
      const DEFAULT_HIERARCHY_SET_ID = 'hset-system-default-code-hierarchy';
      const DEFAULT_HIERARCHY_SET_NAME = "Default Code Structures (System)";
      
      let hierarchySet = getHierarchySetById(DEFAULT_HIERARCHY_SET_ID);
      let createdNewSet = false;

      if (!hierarchySet) {
        hierarchySet = { 
          id: DEFAULT_HIERARCHY_SET_ID, 
          name: DEFAULT_HIERARCHY_SET_NAME, 
          status: 'Active', 
          validFrom: new Date(), 
          segmentHierarchies: [], 
          lastModifiedDate: new Date(), 
          lastModifiedBy: "System" 
        };
        addHierarchySet(hierarchySet);
        createdNewSet = true;
        // Re-fetch or use the one just added. For simplicity, we'll assume addHierarchySet updates the context state
        // that getHierarchySetById will then retrieve. If context updates are batched, direct use might be needed.
         hierarchySet = getHierarchySetById(DEFAULT_HIERARCHY_SET_ID);
         if (!hierarchySet) { // Should not happen if context updates synchronously
            toast({ title: "Hierarchy Error", description: "Failed to create or retrieve default hierarchy set.", variant: "destructive"});
            return;
         }
      }
      
      // Clone hierarchySet for modification to ensure context updates properly
      let hierarchySetToUpdate = JSON.parse(JSON.stringify(hierarchySet)) as HierarchySet;


      const parentSegmentCodeObj = (segmentCodesData[selectedSegmentId] || []).find(sc => sc.code === dataToSave.defaultParentCode);

      if (!parentSegmentCodeObj) {
        toast({ title: "Hierarchy Info", description: `Default parent code "${dataToSave.defaultParentCode}" not found for segment "${selectedSegment.displayName}". Hierarchy not updated.`, variant: "default" });
      } else if (!parentSegmentCodeObj.summaryIndicator) {
        toast({ title: "Hierarchy Info", description: `Default parent code "${dataToSave.defaultParentCode}" must be a summary code. Hierarchy not updated.`, variant: "default" });
      } else {
        let segmentHierarchy = hierarchySetToUpdate.segmentHierarchies.find(sh => sh.segmentId === selectedSegmentId);
        if (!segmentHierarchy) {
          segmentHierarchy = { id: `${DEFAULT_HIERARCHY_SET_ID}-${selectedSegmentId}-sh`, segmentId: selectedSegmentId, treeNodes: [] };
          hierarchySetToUpdate.segmentHierarchies.push(segmentHierarchy);
        }

        if (codeExistsInSegmentHierarchy(segmentHierarchy.treeNodes, dataToSave.id)) {
          toast({ title: "Hierarchy Info", description: `Code "${dataToSave.code}" already exists in the default hierarchy for "${selectedSegment.displayName}". No changes made to hierarchy.`, variant: "default" });
        } else {
          let parentNodeInTree = findNodeBySegmentCodeIdRecursive(segmentHierarchy.treeNodes, parentSegmentCodeObj.id);
          
          if (!parentNodeInTree) { // Parent code exists but not in tree, add it as a root
            parentNodeInTree = { id: crypto.randomUUID(), segmentCode: parentSegmentCodeObj, children: [] };
            segmentHierarchy.treeNodes.push(parentNodeInTree);
          }

          const childHierarchyNode: HierarchyNode = { id: crypto.randomUUID(), segmentCode: dataToSave, children: [] };
          parentNodeInTree.children.push(childHierarchyNode);
          
          updateHierarchySet(hierarchySetToUpdate);
          toast({ title: "Hierarchy Update", description: `Code "${dataToSave.code}" added to default hierarchy under parent "${parentSegmentCodeObj.code}".`, variant: "default" });
        }
      }
    }
    // --- End Hierarchy Logic ---

    if (dialogMode === 'edit') {
        setDialogMode('view'); // Stay in dialog, switch to view mode
    } else {
        setIsCodeFormOpen(false); // Close dialog for 'add' mode
    }
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
    <div className="flex flex-col h-full"> 
      <div className="p-0 md:px-0 lg:px-0"> 
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
                                <Input {...field} disabled={isFieldDisabled || (dialogMode === 'edit' && !!currentEditingCode?.id)} />
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
                         <FormField
                          control={form.control}
                          name="defaultParentCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Default Parent Code (for Hierarchy)</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Enter code of parent (optional)" value={field.value ?? ''} disabled={isFieldDisabled} />
                              </FormControl>
                              <CardDesc className="text-xs text-muted-foreground pt-1">If provided, this code will be added under the specified parent in a system-generated default hierarchy. Parent must be a summary code within this segment.</CardDesc>
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

                        <FormField
                          control={form.control}
                          name="allowedSubmodules"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Allowed Submodules</FormLabel>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild disabled={isFieldDisabled}>
                                  <Button
                                    variant="outline"
                                    className="w-full justify-between"
                                    disabled={isFieldDisabled}
                                  >
                                    <span>
                                      {field.value && field.value.length > 0
                                        ? `${field.value.length} selected`
                                        : "Select submodules"}
                                    </span>
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                                  <DropdownMenuLabel>Allowed Submodules</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  {submoduleOptions.map((option) => (
                                    <DropdownMenuCheckboxItem
                                      key={option}
                                      checked={field.value?.includes(option) ?? false}
                                      onCheckedChange={(checked) => {
                                        const currentSelection = field.value || [];
                                        if (checked) {
                                          field.onChange([...currentSelection, option]);
                                        } else {
                                          field.onChange(currentSelection.filter((item) => item !== option));
                                        }
                                      }}
                                      onSelect={(e) => e.preventDefault()} 
                                      disabled={isFieldDisabled}
                                    >
                                      {option}
                                    </DropdownMenuCheckboxItem>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

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
                        
                        {selectedSegment && selectedSegment.customFields && selectedSegment.customFields.length > 0 && (
                          <Card className="my-4">
                            <CardHeader>
                              <CardTitle className="text-lg">Custom Fields for {selectedSegment.displayName}</CardTitle>
                              <CardDesc>Provide values for segment-specific custom fields.</CardDesc>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              {selectedSegment.customFields.map((customFieldDef) => (
                                <FormField
                                  key={customFieldDef.id}
                                  control={form.control}
                                  name={`customFieldValues.${customFieldDef.id}`}
                                  rules={{ required: customFieldDef.required ? `${customFieldDef.label} is required.` : false }}
                                  render={({ field }) => {
                                    const getInputComponent = () => {
                                      switch (customFieldDef.type) {
                                        case 'Text':
                                          return <Input type="text" {...field} value={field.value ?? ''} disabled={isFieldDisabled} />;
                                        case 'Number':
                                          return (
                                            <Input
                                              type="number"
                                              {...field}
                                              value={field.value ?? ''}
                                              onChange={(e) => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                                              disabled={isFieldDisabled}
                                            />
                                          );
                                        case 'Date':
                                          return (
                                            <DatePicker
                                              value={field.value ? new Date(field.value) : undefined}
                                              onValueChange={field.onChange}
                                              disabled={isFieldDisabled}
                                              placeholder={`Select ${customFieldDef.label}`}
                                            />
                                          );
                                        case 'Boolean':
                                          const switchId = `custom-field-switch-${customFieldDef.id}-${field.name}`;
                                          return (
                                            <div className="flex items-center space-x-2 pt-2">
                                              <Switch
                                                {...field}
                                                checked={field.value ?? false}
                                                onCheckedChange={field.onChange}
                                                disabled={isFieldDisabled}
                                                id={switchId}
                                              />
                                              <label htmlFor={switchId} className="text-sm cursor-pointer">
                                                {field.value ? 'Yes' : 'No'}
                                              </label>
                                            </div>
                                          );
                                        case 'Dropdown':
                                          return (
                                            <Select
                                              onValueChange={field.onChange}
                                              value={field.value ?? ''}
                                              disabled={isFieldDisabled}
                                            >
                                              <SelectTrigger>
                                                <SelectValue placeholder={`Select ${customFieldDef.label}`} />
                                              </SelectTrigger>
                                              <SelectContent>
                                                {(customFieldDef.dropdownOptions || []).map(option => (
                                                  <SelectItem key={option} value={option}>
                                                    {option}
                                                  </SelectItem>
                                                ))}
                                              </SelectContent>
                                            </Select>
                                          );
                                        default:
                                          return null;
                                      }
                                    };

                                    return (
                                      <FormItem>
                                        <FormLabel>{customFieldDef.label}{customFieldDef.required ? ' *' : ''}</FormLabel>
                                        <FormControl>
                                          {getInputComponent()}
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    );
                                  }}
                                />
                              ))}
                            </CardContent>
                          </Card>
                        )}


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
                                  allowedSubmodules: currentEditingCode.allowedSubmodules || [],
                                  customFieldValues: currentEditingCode.customFieldValues || {},
                                  defaultParentCode: currentEditingCode.defaultParentCode || '',
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
                          <TableHead className="min-w-[150px]">Default Parent</TableHead>
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
                            <TableCell>{code.defaultParentCode || 'N/A'}</TableCell>
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
