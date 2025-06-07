
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
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
import { Checkbox } from '@/components/ui/checkbox';
import { PlusCircle, GripVertical, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription as CardDescriptionComponent } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Label } from '@/components/ui/label';
import { useSegments } from '@/contexts/SegmentsContext';
import type { Segment, CustomFieldDefinition } from '@/lib/segment-types';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';


const customFieldSchema = z.object({
  id: z.string().optional(), 
  label: z.string().min(1, { message: "Label is required" }),
  type: z.enum(['Text', 'Number', 'Date', 'Boolean', 'Dropdown'], { required_error: "Type is required" }),
  required: z.boolean().default(false),
  dropdownOptions: z.array(
    z.string().min(1, { message: "Dropdown option cannot be empty." })
  ).optional(),
}).refine(data => {
  if (data.type === 'Dropdown') {
    return Array.isArray(data.dropdownOptions) && data.dropdownOptions.length > 0 && data.dropdownOptions.every(opt => opt.trim() !== '');
  }
  return true;
}, {
  message: "At least one non-empty dropdown option is required when type is 'Dropdown'.",
  path: ["dropdownOptions"],
});


const baseSegmentSchema = z.object({
  displayName: z.string().min(1, { message: 'Display Name is required.' }),
  segmentType: z.string().optional(),
  dataType: z.enum(['Alphanumeric', 'Numeric', 'Text'], { required_error: "Data Type is required." }),
  maxLength: z.coerce.number({ required_error: "Max Length is required.", invalid_type_error: "Max Length must be a number." }).int().positive({ message: "Max Length must be a positive number." }),
  specialCharsAllowed: z.string(), 
  defaultCode: z.string().optional(),
  separator: z.enum(['-', '|', ',', '.'], { required_error: "Separator is required." }),
  isMandatoryForCoding: z.boolean().default(false),
  isActive: z.boolean().default(true),
  isCustom: z.boolean().default(true),
  isCore: z.boolean().default(false),
  id: z.string().optional(),
  customFields: z.array(customFieldSchema).optional(),
});

export function createSegmentFormSchema(allSegments: Segment[], currentSegmentId?: string) {
  return baseSegmentSchema.superRefine((data, ctx) => {
    const otherSegments = allSegments.filter(segment => segment.id !== currentSegmentId);

    if (data.specialCharsAllowed && data.separator && data.specialCharsAllowed.includes(data.separator)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `The separator character '${data.separator}' cannot also be listed in 'Special Characters Allowed' for this segment.`,
        path: ['separator'],
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `The character '${data.separator}' is this segment's separator and cannot be included here.`,
        path: ['specialCharsAllowed'],
      });
    }

    const allOtherSpecialChars = new Set<string>();
    otherSegments.forEach(segment => {
      if (segment.specialCharsAllowed) {
        for (const char of segment.specialCharsAllowed) {
          allOtherSpecialChars.add(char);
        }
      }
    });

    const allOtherSeparators = new Set<string>();
    otherSegments.forEach(segment => {
      if (segment.separator) {
        allOtherSeparators.add(segment.separator);
      }
    });

    if (data.specialCharsAllowed) {
      for (const char of data.specialCharsAllowed) {
        if (allOtherSeparators.has(char)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `The character '${char}' is used as a separator in another segment and cannot be an allowed special character.`,
            path: ['specialCharsAllowed'],
          });
        }
      }
    }

    if (data.separator) {
      if (allOtherSpecialChars.has(data.separator)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `The separator '${data.separator}' is listed as an allowed special character in another segment. Please choose a different separator or remove it from the other segment's special characters.`,
          path: ['separator'],
        });
      }
    }
  });
}


type SegmentFormValues = z.infer<typeof baseSegmentSchema>; 

const defaultFormValues: Omit<SegmentFormValues, 'id' | 'segmentType' | 'isCore'> = {
  displayName: '',
  dataType: 'Alphanumeric',
  maxLength: 10,
  specialCharsAllowed: '',
  defaultCode: '',
  separator: '-',
  isMandatoryForCoding: false,
  isActive: true,
  isCustom: true,
  customFields: [],
};

export default function SegmentsPage() {
  const { segments, addSegment, updateSegment, toggleSegmentStatus, setOrderedSegments } = useSegments();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<'add' | 'view' | 'edit'>('add');
  const [currentSegmentData, setCurrentSegmentData] = useState<Segment | null>(null);
  
  const [draggedSegmentId, setDraggedSegmentId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [isClientMounted, setIsClientMounted] = useState(false);

  useEffect(() => {
    setIsClientMounted(true);
  }, []);

  const dynamicSegmentFormSchema = useMemo(() => {
    return createSegmentFormSchema(segments, currentSegmentData?.id);
  }, [segments, currentSegmentData?.id]);

  const form = useForm<SegmentFormValues>({
    resolver: zodResolver(dynamicSegmentFormSchema),
    defaultValues: {
      ...defaultFormValues,
      isCore: false, 
      customFields: [],
    },
  });
  
  useEffect(() => {
    form.reset(undefined, { keepValues: true }); 
  }, [dynamicSegmentFormSchema, form]);


  const { fields: customFormFields, append: appendCustomField, remove: removeCustomField } = useFieldArray({
    control: form.control,
    name: "customFields",
  });


  useEffect(() => {
    if (isSheetOpen) {
      if (sheetMode === 'add') {
        form.reset({
          ...defaultFormValues,
          isCore: false, 
          id: undefined, 
          segmentType: '', 
          customFields: [],
        });
        setCurrentSegmentData(null);
      } else if ((sheetMode === 'view' || sheetMode === 'edit') && currentSegmentData) {
        form.reset({
          ...currentSegmentData,
          customFields: currentSegmentData.customFields?.map(cf => ({
            ...cf,
            dropdownOptions: cf.dropdownOptions || (cf.type === 'Dropdown' ? [''] : [])
          })) || [],
        });
      }
    } else {
      form.reset({
        ...defaultFormValues,
        isCore: false,
        id: undefined,
        segmentType: '',
        customFields: [],
      });
      setCurrentSegmentData(null);
      setSheetMode('add');
    }
  }, [isSheetOpen, sheetMode, currentSegmentData, form]);


  const handleToggleChange = (segmentId: string) => {
    toggleSegmentStatus(segmentId);
  };

  const handleAddSegmentClick = () => {
    setSheetMode('add');
    setCurrentSegmentData(null); 
    form.reset({ 
        ...defaultFormValues,
        isCore: false, 
        id: undefined,
        segmentType: '',
        customFields: [],
    });
    setIsSheetOpen(true);
  };

  const handleViewSegmentClick = (segment: Segment) => {
    setSheetMode('view');
    setCurrentSegmentData(segment);
    setIsSheetOpen(true);
  };

  const handleEditSegmentClick = () => {
    if (currentSegmentData) {
      setSheetMode('edit');
    }
  };

  const onSubmit = (values: SegmentFormValues) => {
    const dataToSave = {
      ...values,
      customFields: values.customFields?.map(cf => ({ 
        ...cf, 
        id: cf.id || crypto.randomUUID(),
        dropdownOptions: cf.type === 'Dropdown' ? (cf.dropdownOptions || []) : undefined,
      })) || [],
    };

    if (sheetMode === 'add') {
      const newSegment: Segment = {
        id: crypto.randomUUID(),
        isCore: false, 
        isCustom: true,
        displayName: dataToSave.displayName,
        segmentType: dataToSave.displayName, 
        dataType: dataToSave.dataType,
        maxLength: dataToSave.maxLength,
        specialCharsAllowed: dataToSave.specialCharsAllowed,
        defaultCode: dataToSave.defaultCode,
        separator: dataToSave.separator,
        isMandatoryForCoding: dataToSave.isMandatoryForCoding,
        isActive: dataToSave.isActive,
        customFields: dataToSave.customFields,
      };
      addSegment(newSegment);
    } else if (sheetMode === 'edit' && currentSegmentData) {
      const updatedSegment: Segment = {
        ...currentSegmentData, 
        displayName: dataToSave.displayName, 
        segmentType: currentSegmentData.segmentType, 
        dataType: dataToSave.dataType,
        maxLength: dataToSave.maxLength,
        specialCharsAllowed: dataToSave.specialCharsAllowed,
        defaultCode: dataToSave.defaultCode,
        separator: dataToSave.separator,
        isMandatoryForCoding: dataToSave.isMandatoryForCoding,
        isActive: dataToSave.isActive,
        customFields: dataToSave.customFields,
      };
      updateSegment(updatedSegment);
      setCurrentSegmentData(updatedSegment); 
      setSheetMode('view'); 
      return; 
    }
    
    setIsSheetOpen(false);
  };

  const breadcrumbItems = [
    { label: 'COA Configuration', href: '/' },
    { label: 'Segments' }
  ];
  
  const isFieldDisabled = (isCoreSegment: boolean | undefined, fieldName?: keyof SegmentFormValues | `customFields.${number}.${keyof CustomFieldDefinition}` | `customFields.${number}.dropdownOptions.${number}` | `customFields.${number}.dropdownOptions`) => {
    if (sheetMode === 'view') return true;

    if (sheetMode === 'edit') {
      if (fieldName === 'displayName') return false; 
      if (isCoreSegment && typeof fieldName === 'string' && !fieldName.startsWith('customFields')) return true; 
      if (fieldName === 'segmentType') return true; 
    }
    return false; 
  };
  
  const isActiveSwitchDisabled = () => {
    if (sheetMode === 'view') return true;
    if (currentSegmentData?.isCore && sheetMode === 'edit') return true; 
    return false;
  };

  const handleDragStart = (e: React.DragEvent<HTMLTableRowElement>, segmentId: string) => {
    setDraggedSegmentId(segmentId);
    e.dataTransfer.setData('text/plain', segmentId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDraggedSegmentId(null);
    setDropTargetId(null);
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLTableRowElement>, hoverSegmentId: string) => {
    e.preventDefault();
    if (hoverSegmentId !== draggedSegmentId) {
      setDropTargetId(hoverSegmentId);
    } else if (dropTargetId !== null) {
      setDropTargetId(null);
    }
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent<HTMLTableRowElement>, droppedOnSegmentId: string) => {
    e.preventDefault();
    const currentDraggedId = draggedSegmentId;

    if (!currentDraggedId || currentDraggedId === droppedOnSegmentId) {
      setDraggedSegmentId(null);
      setDropTargetId(null);
      return;
    }
    
    const reorderedSegments = [...segments];
    const draggedItemIndex = reorderedSegments.findIndex(s => s.id === currentDraggedId);
    const droppedOnItemIndex = reorderedSegments.findIndex(s => s.id === droppedOnSegmentId);

    if (draggedItemIndex === -1 || droppedOnItemIndex === -1) {
      setDraggedSegmentId(null);
      setDropTargetId(null);
      return; 
    }
    
    const [draggedItem] = reorderedSegments.splice(draggedItemIndex, 1);
    reorderedSegments.splice(droppedOnItemIndex, 0, draggedItem);
    
    setOrderedSegments(reorderedSegments);
    setDraggedSegmentId(null);
    setDropTargetId(null);
  };

  const accountCodePreviewStructure = useMemo(() => {
    if (!isClientMounted || !segments || segments.length === 0) {
      return [];
    }
    const activeSegments = segments.filter(segment => segment.isActive);
    
    return activeSegments.map((segment, index) => {
      const codePart = segment.defaultCode || "X".repeat(segment.maxLength > 0 ? Math.min(segment.maxLength, 4) : 4);
      return {
        id: segment.id,
        codePart: codePart,
        displayName: segment.displayName,
        separator: index < activeSegments.length - 1 ? segment.separator : null,
      };
    });
  }, [segments, isClientMounted]);


  return (
    <div className="w-full max-w-4xl mx-auto">
        <Breadcrumbs items={breadcrumbItems} />
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-primary">Manage Segments</h1>
          <p className="text-md text-muted-foreground mt-2">
            Configure the building blocks of your chart of accounts. Define core and standard segments. Drag segments to reorder.
          </p>
        </header>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Account Code String Preview</CardTitle>
             <CardDescriptionComponent>
                This is an example of how your account code string will look based on the current segment order and separators. 
                The example uses the segment's default code if defined, or "XXXX" as a placeholder. Only active segments are shown.
             </CardDescriptionComponent>
          </CardHeader>
          <CardContent>
            <div className="p-3 bg-muted rounded-md flex flex-wrap items-start justify-center min-h-[70px]">
            {!isClientMounted ? (
                <p className="text-center font-mono text-lg tracking-wider text-muted-foreground self-center">
                  Loading preview...
                </p>
              ) : accountCodePreviewStructure.length > 0 ? (
                accountCodePreviewStructure.map((item) => (
                  <React.Fragment key={item.id}>
                    <div className="flex flex-col items-center text-center px-1 py-1">
                      <span className="font-mono text-lg tracking-wider text-foreground">
                        {item.codePart}
                      </span>
                      <span className="text-xs text-muted-foreground mt-0.5">
                        {item.displayName}
                      </span>
                    </div>
                    {item.separator && (
                      <div className="flex flex-col items-center text-center px-1 py-1">
                        <span className="font-mono text-lg tracking-wider text-foreground">
                          {item.separator}
                        </span>
                        <span className="text-xs text-muted-foreground mt-0.5 invisible">
                          X
                        </span>
                      </div>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <p className="text-center font-mono text-lg tracking-wider text-muted-foreground self-center">
                  No active segments configured yet. Add or activate segments to see the preview.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="mb-6 flex justify-end">
          <Sheet open={isSheetOpen} onOpenChange={(isOpen) => {
            setIsSheetOpen(isOpen);
            if (!isOpen) {
              setSheetMode('add'); 
            }
          }}>
            <SheetTrigger asChild>
              <Button onClick={handleAddSegmentClick}>
                <PlusCircle className="mr-2 h-5 w-5" />
                Add Custom Segment
              </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-xl w-full flex flex-col">
              <SheetHeader>
                <SheetTitle>
                  {sheetMode === 'add' && 'Add Custom Segment'}
                  {sheetMode === 'view' && `View Segment: ${currentSegmentData?.displayName || ''}`}
                  {sheetMode === 'edit' && `Edit Segment: ${currentSegmentData?.displayName || ''}`}
                </SheetTitle>
                <SheetDescription>
                  {sheetMode === 'add' && "Fill in the details for your new custom segment."}
                  {sheetMode === 'view' && "Viewing details for the selected segment."}
                  {sheetMode === 'edit' && "Modify the details of the segment."}
                </SheetDescription>
              </SheetHeader>
              <ScrollArea className="flex-1 min-h-0">
                <div className="p-4">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="displayName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Display Name *</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={isFieldDisabled(currentSegmentData?.isCore, 'displayName')} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {(sheetMode === 'view' || sheetMode === 'edit') && currentSegmentData && (
                        <FormField
                          control={form.control}
                          name="segmentType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Segment Type</FormLabel>
                              <FormControl>
                                <Input {...field} value={currentSegmentData.segmentType} disabled />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      <FormField
                        control={form.control}
                        name="dataType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data Type *</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              value={field.value}
                              disabled={isFieldDisabled(currentSegmentData?.isCore, 'dataType')}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a data type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Alphanumeric">Alphanumeric</SelectItem>
                                <SelectItem value="Numeric">Numeric</SelectItem>
                                <SelectItem value="Text">Text</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="maxLength"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Maximum Character Length *</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} onChange={event => field.onChange(+event.target.value)} disabled={isFieldDisabled(currentSegmentData?.isCore, 'maxLength')} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="specialCharsAllowed"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Special Characters Allowed</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value ?? ''} placeholder="e.g., -_ (empty for none)" disabled={isFieldDisabled(currentSegmentData?.isCore, 'specialCharsAllowed')} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="defaultCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Default Code</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value ?? ''} disabled={isFieldDisabled(currentSegmentData?.isCore, 'defaultCode')} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                          control={form.control}
                          name="separator"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Separator *</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                value={field.value ?? '-'} 
                                disabled={isFieldDisabled(currentSegmentData?.isCore, 'separator')}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a separator" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="-">- (Hyphen)</SelectItem>
                                  <SelectItem value="|">| (Pipe)</SelectItem>
                                  <SelectItem value=",">, (Comma)</SelectItem>
                                  <SelectItem value=".">. (Period)</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                      <div className="space-y-2 pt-2">
                        <FormField
                            control={form.control}
                            name="isMandatoryForCoding"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-2 shadow-sm">
                                <div className="space-y-0.5">
                                  <FormLabel>Mandatory for Coding *</FormLabel>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    disabled={isFieldDisabled(currentSegmentData?.isCore, 'isMandatoryForCoding')}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="isActive"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-2 shadow-sm">
                                <div className="space-y-0.5">
                                  <FormLabel>Active *</FormLabel>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    disabled={isActiveSwitchDisabled()}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                      </div>
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-2 shadow-sm bg-muted/50">
                          <div className="space-y-0.5">
                            <Label className="text-sm font-medium text-muted-foreground">Custom Segment</Label>
                          </div>
                          <Switch
                            checked={sheetMode === 'add' ? true : (currentSegmentData?.isCustom ?? false)}
                            disabled={true}
                            aria-readonly
                          />
                        </FormItem>

                      <Card className="mt-6">
                        <CardHeader>
                          <CardTitle>Custom Fields for Segment Codes</CardTitle>
                          <CardDescriptionComponent>
                            Define additional data fields specific to codes of this segment. These fields will appear when adding/editing codes for this segment.
                          </CardDescriptionComponent>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {customFormFields.map((item, index) => {
                            const currentFieldType = form.watch(`customFields.${index}.type`);
                            const dropdownOptionsPath = `customFields.${index}.dropdownOptions` as const;
                            const watchedDropdownOptions = form.watch(dropdownOptionsPath);

                            return (
                              <Card key={item.id} className="p-4 space-y-3 bg-muted/20 shadow-sm relative">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="absolute top-2 right-2 h-6 w-6 text-destructive hover:text-destructive-foreground hover:bg-destructive/80"
                                  onClick={() => !isFieldDisabled(undefined) && removeCustomField(index)}
                                  disabled={isFieldDisabled(undefined)}
                                  aria-label="Remove custom field"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                                <FormField
                                  control={form.control}
                                  name={`customFields.${index}.label`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Field Label *</FormLabel>
                                      <FormControl>
                                        <Input {...field} placeholder="e.g., Account Type" disabled={isFieldDisabled(undefined)} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <FormField
                                    control={form.control}
                                    name={`customFields.${index}.type`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Field Type *</FormLabel>
                                        <Select 
                                          onValueChange={(value) => {
                                            field.onChange(value);
                                            if (value === 'Dropdown') {
                                              const currentOpts = form.getValues(dropdownOptionsPath);
                                              if (!Array.isArray(currentOpts) || currentOpts.length === 0) {
                                                form.setValue(dropdownOptionsPath, [''], { shouldValidate: true });
                                              }
                                            } else {
                                              form.setValue(dropdownOptionsPath, undefined, { shouldValidate: true }); 
                                            }
                                          }} 
                                          value={field.value} 
                                          disabled={isFieldDisabled(undefined)}
                                        >
                                          <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                            <SelectItem value="Text">Text</SelectItem>
                                            <SelectItem value="Number">Number</SelectItem>
                                            <SelectItem value="Date">Date</SelectItem>
                                            <SelectItem value="Boolean">Boolean (Yes/No)</SelectItem>
                                            <SelectItem value="Dropdown">Dropdown</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={form.control}
                                    name={`customFields.${index}.required`}
                                    render={({ field }) => (
                                      <FormItem className="flex flex-row items-center justify-start space-x-2 rounded-lg border p-3 shadow-sm h-10 mt-auto">
                                        <FormControl>
                                          <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            disabled={isFieldDisabled(undefined)}
                                            id={`customFields.${index}.required`}
                                          />
                                        </FormControl>
                                        <FormLabel htmlFor={`customFields.${index}.required`} className="text-sm font-normal cursor-pointer">
                                          Required
                                        </FormLabel>
                                      </FormItem>
                                    )}
                                  />
                                </div>
                                {currentFieldType === 'Dropdown' && (
                                  <div className="space-y-2">
                                    <Label>Dropdown Options *</Label>
                                    {(watchedDropdownOptions || []).map((_, optionIndex) => (
                                      <div key={optionIndex} className="flex items-center space-x-2">
                                        <FormField
                                          control={form.control}
                                          name={`${dropdownOptionsPath}.${optionIndex}`}
                                          render={({ field }) => (
                                            <FormItem className="flex-grow">
                                              <FormControl>
                                                <Input
                                                  {...field}
                                                  placeholder={`Option ${optionIndex + 1}`}
                                                  disabled={isFieldDisabled(undefined)}
                                                />
                                              </FormControl>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => {
                                            const currentOpts = form.getValues(dropdownOptionsPath) || [];
                                            if (currentOpts.length > 1) { 
                                              const newOptions = currentOpts.filter((_, i) => i !== optionIndex);
                                              form.setValue(dropdownOptionsPath, newOptions, { shouldValidate: true, shouldDirty: true });
                                            }
                                          }}
                                          disabled={isFieldDisabled(undefined) || (watchedDropdownOptions || []).length <= 1}
                                          className="text-destructive hover:text-destructive-foreground hover:bg-destructive/80 flex-shrink-0"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    ))}
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        const currentOpts = form.getValues(dropdownOptionsPath) || [];
                                        form.setValue(dropdownOptionsPath, [...currentOpts, ''], { shouldValidate: false, shouldDirty: true, shouldTouch: true });
                                      }}
                                      disabled={isFieldDisabled(undefined)}
                                      className="mt-1"
                                    >
                                      <PlusCircle className="mr-2 h-4 w-4" /> Add Option
                                    </Button>
                                    <FormField
                                        control={form.control}
                                        name={dropdownOptionsPath} 
                                        render={() => <FormMessage />} 
                                      />
                                    <CardDescriptionComponent className="text-xs mt-1">
                                      Define the choices that will appear in the dropdown for this custom field. Each option must be non-empty.
                                    </CardDescriptionComponent>
                                  </div>
                                )}
                              </Card>
                            );
                          })}
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => !isFieldDisabled(undefined) && appendCustomField({ id: crypto.randomUUID(), label: '', type: 'Text', required: false, dropdownOptions: [] })}
                            disabled={isFieldDisabled(undefined)}
                          >
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Custom Field
                          </Button>
                        </CardContent>
                      </Card>
                    </form>
                  </Form>
                </div>
              </ScrollArea>
              <SheetFooter className="pt-4 mt-auto">
                {sheetMode === 'add' && (
                  <>
                    <SheetClose asChild>
                      <Button type="button" variant="outline">Cancel</Button>
                    </SheetClose>
                    <Button type="submit" onClick={form.handleSubmit(onSubmit)}>Save</Button>
                  </>
                )}
                {sheetMode === 'view' && currentSegmentData && (
                  <>
                    <SheetClose asChild>
                      <Button type="button" variant="outline">Close</Button>
                    </SheetClose>
                    {currentSegmentData && <Button type="button" onClick={handleEditSegmentClick}>Edit</Button>}
                  </>
                )}
                {sheetMode === 'edit' && (
                  <>
                      <Button type="button" variant="outline" onClick={() => { 
                        setSheetMode('view'); 
                        if(currentSegmentData) {
                          form.reset({ 
                              ...currentSegmentData,
                              customFields: currentSegmentData.customFields?.map(cf => ({
                                ...cf,
                                dropdownOptions: cf.dropdownOptions || (cf.type === 'Dropdown' ? [''] : [])
                              })) || [],
                          }); 
                        }
                      }}>Cancel</Button>
                      <Button type="submit" onClick={form.handleSubmit(onSubmit)}>Save Changes</Button>
                  </>
                )}
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Configured Segments</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px] text-center">Order</TableHead>
                  <TableHead className="w-[250px] sm:w-[300px]">Display Name</TableHead>
                  <TableHead>Segment Type</TableHead>
                  <TableHead className="text-right w-[150px] sm:w-[180px]">Status</TableHead>
                  <TableHead className="text-center w-[150px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {segments.map((segment) => (
                  <TableRow 
                    key={segment.id}
                    draggable={true} 
                    onDragStart={(e) => handleDragStart(e, segment.id)}
                    onDragEnd={handleDragEnd} 
                    onDragOver={(e) => handleDragOver(e, segment.id)} 
                    onDrop={(e) => handleDrop(e, segment.id)}
                    className={cn(
                      "cursor-grab active:cursor-grabbing transition-all duration-150 ease-in-out",
                      draggedSegmentId === segment.id && "opacity-50 shadow-2xl ring-2 ring-primary z-10 relative",
                      dropTargetId === segment.id && draggedSegmentId !== segment.id && "outline outline-2 outline-accent outline-offset-[-2px]"
                    )}
                  >
                    <TableCell className="text-center">
                        <GripVertical className="inline-block h-5 w-5 text-muted-foreground" />
                    </TableCell>
                    <TableCell className="font-medium">
                      <button
                        className="text-primary hover:underline cursor-pointer bg-transparent border-none p-0"
                        onClick={() => handleViewSegmentClick(segment)}
                      >
                        {segment.displayName}
                      </button>
                       {segment.isCore && <span className="ml-2 text-xs text-muted-foreground">(Core)</span>}
                    </TableCell>
                    <TableCell>{segment.segmentType}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <span className={`text-sm ${segment.isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {segment.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <Switch
                          id={`status-toggle-${segment.id}`}
                          checked={segment.isActive}
                          onCheckedChange={() => handleToggleChange(segment.id)}
                          disabled={segment.isCore && sheetMode === 'edit'}
                          aria-label={`Toggle status for ${segment.displayName}`}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Link href={`/configure/segment-codes?segmentId=${segment.id}`} passHref>
                        <Button variant="outline" size="sm">
                          View Codes
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
             {segments.length === 0 && (
              <p className="py-8 text-center text-muted-foreground">
                No segments configured. Click "Add Custom Segment" to get started.
              </p>
            )}
          </CardContent>
        </Card>
    </div>
  );
}
