
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { PlusCircle, GripVertical } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription as CardDescriptionComponent } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Label } from '@/components/ui/label';
import { useSegments } from '@/contexts/SegmentsContext';
import type { Segment } from '@/lib/segment-types';
import { cn } from '@/lib/utils';


const segmentFormSchema = z.object({
  displayName: z.string().min(1, { message: 'Display Name is required.' }),
  segmentType: z.string().optional(),
  dataType: z.enum(['Alphanumeric', 'Numeric', 'Text'], { required_error: "Data Type is required." }),
  maxLength: z.coerce.number({ required_error: "Max Length is required.", invalid_type_error: "Max Length must be a number." }).int().positive({ message: "Max Length must be a positive number." }),
  specialCharsAllowed: z.string({required_error: "Special Characters Allowed is required."}).refine(value => value !== null, { message: "Special Characters Allowed cannot be null." }),
  defaultCode: z.string().optional(),
  separator: z.enum(['-', '|', ',', '.'], { required_error: "Separator is required." }),
  isMandatoryForCoding: z.boolean().default(false),
  isActive: z.boolean().default(true),
  validFrom: z.date({ required_error: "Valid From date is required." }),
  validTo: z.date().optional(),
  isCustom: z.boolean().default(true),
  isCore: z.boolean().default(false),
  id: z.string().optional(),
}).refine(data => {
  if (data.validFrom && data.validTo) {
    return data.validTo >= data.validFrom;
  }
  return true;
}, {
  message: "Valid To date must be after or the same as Valid From date.",
  path: ["validTo"],
});

type SegmentFormValues = z.infer<typeof segmentFormSchema>;

const defaultFormValues: Omit<SegmentFormValues, 'id' | 'segmentType' | 'isCore'> = {
  displayName: '',
  dataType: 'Alphanumeric',
  maxLength: 10,
  specialCharsAllowed: '',
  defaultCode: '',
  separator: '-',
  isMandatoryForCoding: false,
  isActive: true,
  validFrom: new Date(),
  validTo: undefined,
  isCustom: true,
};

export default function SegmentsPage() {
  const { segments, addSegment, updateSegment, toggleSegmentStatus, setOrderedSegments } = useSegments();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'view' | 'edit'>('add');
  const [currentSegmentData, setCurrentSegmentData] = useState<Segment | null>(null);
  
  const [draggedSegmentId, setDraggedSegmentId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [isClientMounted, setIsClientMounted] = useState(false);

  useEffect(() => {
    setIsClientMounted(true);
  }, []);


  const form = useForm<SegmentFormValues>({
    resolver: zodResolver(segmentFormSchema),
    defaultValues: {
      ...defaultFormValues,
      isCore: false, 
    },
  });

  useEffect(() => {
    if (isDialogOpen) {
      if (dialogMode === 'add') {
        form.reset({
          ...defaultFormValues,
          isCore: false, 
          id: undefined, 
          segmentType: '', 
        });
        setCurrentSegmentData(null);
      } else if ((dialogMode === 'view' || dialogMode === 'edit') && currentSegmentData) {
        form.reset({
          ...currentSegmentData,
          validFrom: currentSegmentData.validFrom ? new Date(currentSegmentData.validFrom) : new Date(),
          validTo: currentSegmentData.validTo ? new Date(currentSegmentData.validTo) : undefined,
        });
      }
    } else {
      form.reset({
        ...defaultFormValues,
        isCore: false,
        id: undefined,
        segmentType: '',
      });
      setCurrentSegmentData(null);
      setDialogMode('add');
    }
  }, [isDialogOpen, dialogMode, currentSegmentData, form]);


  const handleToggleChange = (segmentId: string) => {
    toggleSegmentStatus(segmentId);
  };

  const handleAddSegmentClick = () => {
    setDialogMode('add');
    setCurrentSegmentData(null); 
    form.reset({ 
        ...defaultFormValues,
        isCore: false, 
        id: undefined,
        segmentType: '' 
    });
    setIsDialogOpen(true);
  };

  const handleViewSegmentClick = (segment: Segment) => {
    setDialogMode('view');
    setCurrentSegmentData(segment);
    setIsDialogOpen(true);
  };

  const handleEditSegmentClick = () => {
    if (currentSegmentData) {
      setDialogMode('edit');
    }
  };

  const onSubmit = (values: SegmentFormValues) => {
    if (dialogMode === 'add') {
      const newSegment: Segment = {
        id: crypto.randomUUID(),
        isCore: false, 
        isCustom: true,
        displayName: values.displayName,
        segmentType: values.displayName, 
        dataType: values.dataType,
        maxLength: values.maxLength,
        specialCharsAllowed: values.specialCharsAllowed,
        defaultCode: values.defaultCode,
        separator: values.separator,
        isMandatoryForCoding: values.isMandatoryForCoding,
        isActive: values.isActive,
        validFrom: values.validFrom,
        validTo: values.validTo,
      };
      addSegment(newSegment);
    } else if (dialogMode === 'edit' && currentSegmentData) {
      const updatedSegment: Segment = {
        ...currentSegmentData, 
        displayName: values.displayName, 
        dataType: values.dataType,
        maxLength: values.maxLength,
        specialCharsAllowed: values.specialCharsAllowed,
        defaultCode: values.defaultCode,
        separator: values.separator,
        isMandatoryForCoding: values.isMandatoryForCoding,
        isActive: values.isActive,
        validFrom: values.validFrom,
        validTo: values.validTo,
      };
      updateSegment(updatedSegment);
      setCurrentSegmentData(updatedSegment); 
      setDialogMode('view'); 
      return; 
    }
    
    setIsDialogOpen(false);
  };

  const breadcrumbItems = [
    { label: 'COA Configuration', href: '/' },
    { label: 'Segments' }
  ];
  
  const isFieldDisabled = (isCoreSegment: boolean | undefined, fieldName?: keyof SegmentFormValues) => {
    if (dialogMode === 'view') return true;

    if (dialogMode === 'edit') {
      if (fieldName === 'displayName') return false; 
      if (isCoreSegment) return true; 
      if (fieldName === 'segmentType') return true; 
    }
    return false; 
  };
  
  const isActiveSwitchDisabled = () => {
    if (dialogMode === 'view') return true;
    if (currentSegmentData?.isCore && dialogMode === 'edit') return true; 
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
    <div className="flex flex-col items-center justify-start min-h-screen p-4 py-8 sm:p-8 bg-background">
      <div className="w-full max-w-4xl">
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
          <Button onClick={handleAddSegmentClick}>
            <PlusCircle className="mr-2 h-5 w-5" />
            Add Custom Segment
          </Button>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(isOpen) => {
          setIsDialogOpen(isOpen);
          if (!isOpen) {
            setDialogMode('add'); 
          }
        }}>
          <DialogContent className="sm:max-w-xl md:max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {dialogMode === 'add' && 'Add Custom Segment'}
                {dialogMode === 'view' && `View Segment: ${currentSegmentData?.displayName || ''}`}
                {dialogMode === 'edit' && `Edit Segment: ${currentSegmentData?.displayName || ''}`}
              </DialogTitle>
              <DialogDescription>
                {dialogMode === 'add' && "Fill in the details for your new custom segment."}
                {dialogMode === 'view' && "Viewing details for the selected segment."}
                {dialogMode === 'edit' && "Modify the details of the segment."}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[65vh] overflow-y-auto pr-2">
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
                
                {(dialogMode === 'view' || dialogMode === 'edit') && currentSegmentData && (
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
                      <FormLabel>Special Characters Allowed *</FormLabel>
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
                          placeholder="Select start date"
                          disabled={isFieldDisabled(currentSegmentData?.isCore, 'validFrom')}
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
                          placeholder="Select end date"
                          disabled={isFieldDisabled(currentSegmentData?.isCore, 'validTo')}
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
                      checked={dialogMode === 'add' ? true : (currentSegmentData?.isCustom ?? false)}
                      disabled={true}
                      aria-readonly
                    />
                  </FormItem>
                  
                <DialogFooter className="pt-4">
                  {dialogMode === 'add' && (
                    <>
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                      <Button type="submit">Save</Button>
                    </>
                  )}
                  {dialogMode === 'view' && currentSegmentData && (
                    <>
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Close</Button>
                      {currentSegmentData && <Button type="button" onClick={handleEditSegmentClick}>Edit</Button>}
                    </>
                  )}
                  {dialogMode === 'edit' && (
                     <>
                        <Button type="button" variant="outline" onClick={() => { 
                          setDialogMode('view'); 
                          if(currentSegmentData) {
                            form.reset({ 
                                ...currentSegmentData,
                                validFrom: currentSegmentData.validFrom ? new Date(currentSegmentData.validFrom) : new Date(),
                                validTo: currentSegmentData.validTo ? new Date(currentSegmentData.validTo) : undefined,
                            }); 
                          }
                        }}>Cancel</Button>
                        <Button type="submit">Save Changes</Button>
                     </>
                  )}
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

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
                      <span
                        className="text-primary hover:underline cursor-pointer"
                        onClick={() => handleViewSegmentClick(segment)}
                      >
                        {segment.displayName}
                      </span>
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
                          disabled={segment.isCore}
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
    </div>
  );
}

