
'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from "date-fns";
import Link from 'next/link'; // Added Link import
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { PlusCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Label } from '@/components/ui/label';
import { useSegments } from '@/contexts/SegmentsContext';
import type { Segment } from '@/lib/segment-types';

const segmentFormSchema = z.object({
  displayName: z.string().min(1, { message: 'Display Name is required.' }),
  segmentType: z.string().optional(),
  regex: z.string().optional(),
  defaultCode: z.string().optional(),
  separator: z.enum(['-', '|', ',', '.']).optional().default('-'),
  isMandatoryForCoding: z.boolean().default(false),
  isActive: z.boolean().default(true),
  validFrom: z.date().optional(),
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

const defaultFormValues: SegmentFormValues = {
  displayName: '',
  segmentType: '',
  regex: '',
  defaultCode: '',
  separator: '-',
  isMandatoryForCoding: false,
  isActive: true,
  validFrom: undefined,
  validTo: undefined,
  isCustom: true,
  isCore: false,
};

export default function SegmentsPage() {
  const { segments, addSegment, updateSegment, toggleSegmentStatus } = useSegments();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'view' | 'edit'>('add');
  const [currentSegmentData, setCurrentSegmentData] = useState<Segment | null>(null);

  const form = useForm<SegmentFormValues>({
    resolver: zodResolver(segmentFormSchema),
    defaultValues: defaultFormValues,
  });

  useEffect(() => {
    if (isDialogOpen) {
      if (dialogMode === 'add') {
        form.reset(defaultFormValues);
        setCurrentSegmentData(null);
      } else if ((dialogMode === 'view' || dialogMode === 'edit') && currentSegmentData) {
        form.reset({
          ...currentSegmentData,
          validFrom: currentSegmentData.validFrom ? new Date(currentSegmentData.validFrom) : undefined,
          validTo: currentSegmentData.validTo ? new Date(currentSegmentData.validTo) : undefined,
        });
      }
    } else {
      form.reset(defaultFormValues);
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
    setIsDialogOpen(true);
  };

  const handleViewSegmentClick = (segment: Segment) => {
    setDialogMode('view');
    setCurrentSegmentData(segment);
    setIsDialogOpen(true);
  };

  const handleEditSegmentClick = () => {
    if (currentSegmentData && currentSegmentData.isCustom && !currentSegmentData.isCore) {
      setDialogMode('edit');
    }
  };

  const onSubmit = (values: SegmentFormValues) => {
    if (dialogMode === 'add') {
      const newSegment: Segment = {
        id: crypto.randomUUID(),
        segmentType: values.displayName,
        isCore: false,
        isCustom: true,
        displayName: values.displayName,
        regex: values.regex,
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
        ...values,
        segmentType: currentSegmentData.segmentType,
      };
      updateSegment(updatedSegment);
      setCurrentSegmentData(updatedSegment);
      setDialogMode('view');
      return; // Return early to prevent closing dialog if it was an edit
    }
    
    setIsDialogOpen(false);
  };

  const breadcrumbItems = [
    { label: 'COA Configuration', href: '/' },
    { label: 'Segments' }
  ];
  
  const isFieldDisabled = (isCoreSegment: boolean | undefined, isCustomSegment: boolean | undefined) => {
    if (dialogMode === 'view') return true;
    if (dialogMode === 'edit') {
      return isCoreSegment;
    }
    return false;
  };
  
  const isActiveSwitchDisabled = () => {
    if (dialogMode === 'view') return true;
    if (currentSegmentData?.isCore) return true; 
    return false;
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen p-4 py-8 sm:p-8 bg-background">
      <div className="w-full max-w-4xl">
        <Breadcrumbs items={breadcrumbItems} />
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-primary">Manage Segments</h1>
          <p className="text-md text-muted-foreground mt-2">
            Configure the building blocks of your chart of accounts. Define core and standard segments.
          </p>
        </header>

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
                {dialogMode === 'edit' && `Edit Custom Segment: ${currentSegmentData?.displayName || ''}`}
              </DialogTitle>
              <DialogDescription>
                {dialogMode === 'add' && "Fill in the details for your new custom segment."}
                {dialogMode === 'view' && "Viewing details for the selected segment."}
                {dialogMode === 'edit' && "Modify the details of your custom segment."}
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
                        <Input {...field} disabled={isFieldDisabled(currentSegmentData?.isCore, currentSegmentData?.isCustom) || (dialogMode==='edit' && currentSegmentData?.isCore) || (dialogMode==='edit' && !currentSegmentData?.isCustom)} />
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
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="regex"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>RegEx Pattern</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value ?? ''} disabled={isFieldDisabled(currentSegmentData?.isCore, currentSegmentData?.isCustom)} />
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
                          <Input {...field} value={field.value ?? ''} disabled={isFieldDisabled(currentSegmentData?.isCore, currentSegmentData?.isCustom)} />
                        </FormControl>
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
                        <FormLabel>Valid From</FormLabel>
                        <DatePicker
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Select start date"
                          disabled={isFieldDisabled(currentSegmentData?.isCore, currentSegmentData?.isCustom) || (currentSegmentData?.isCore && dialogMode === 'edit')}
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
                          disabled={isFieldDisabled(currentSegmentData?.isCore, currentSegmentData?.isCustom) || (currentSegmentData?.isCore && dialogMode === 'edit')}
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
                        <FormLabel>Separator</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value ?? '-'}
                          disabled={isFieldDisabled(currentSegmentData?.isCore, currentSegmentData?.isCustom)}
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
                            <FormLabel>Mandatory for Coding</FormLabel>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={isFieldDisabled(currentSegmentData?.isCore, currentSegmentData?.isCustom)}
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
                            <FormLabel>Active</FormLabel>
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
                  {dialogMode === 'view' && (
                    <>
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Close</Button>
                      {currentSegmentData?.isCustom && !currentSegmentData.isCore && (
                        <Button type="button" onClick={handleEditSegmentClick}>Edit</Button>
                      )}
                    </>
                  )}
                  {dialogMode === 'edit' && (
                     <>
                        <Button type="button" variant="outline" onClick={() => { 
                          setDialogMode('view'); 
                          if(currentSegmentData) {
                            form.reset({ 
                                ...currentSegmentData,
                                validFrom: currentSegmentData.validFrom ? new Date(currentSegmentData.validFrom) : undefined,
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
                  <TableHead className="w-[250px] sm:w-[300px]">Display Name</TableHead>
                  <TableHead>Segment Type</TableHead>
                  <TableHead className="text-right w-[150px] sm:w-[180px]">Status</TableHead>
                  <TableHead className="text-center w-[150px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {segments.map(segment => (
                  <TableRow key={segment.id}>
                    <TableCell className="font-medium">
                      <span
                        className="text-primary hover:underline cursor-pointer"
                        onClick={() => handleViewSegmentClick(segment)}
                      >
                        {segment.displayName}
                      </span>
                      {(segment.validFrom || segment.validTo) && (
                        <p className="text-xs text-muted-foreground">
                          {segment.validFrom && format(new Date(segment.validFrom), "MMM d, yyyy")}
                          {segment.validFrom && segment.validTo && " - "}
                          {segment.validTo && format(new Date(segment.validTo), "MMM d, yyyy")}
                        </p>
                      )}
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
