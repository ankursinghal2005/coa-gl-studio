
'use client';

import React, { useState, useEffect } from 'react';
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

const initialSegmentsData: Segment[] = [
  { id: 'fund', displayName: 'Fund', segmentType: 'Fund', isActive: true, isCore: true, isCustom: false, isMandatoryForCoding: true, separator: '-', regex: undefined, defaultCode: undefined, validFrom: undefined, validTo: undefined },
  { id: 'object', displayName: 'Object', segmentType: 'Object', isActive: true, isCore: true, isCustom: false, isMandatoryForCoding: true, separator: '-', regex: undefined, defaultCode: undefined, validFrom: undefined, validTo: undefined },
  { id: 'department', displayName: 'Department', segmentType: 'Department', isActive: true, isCore: true, isCustom: false, isMandatoryForCoding: true, separator: '-', regex: undefined, defaultCode: undefined, validFrom: undefined, validTo: undefined },
  { id: 'project', displayName: 'Project', segmentType: 'Project', isActive: true, isCore: false, isCustom: false, isMandatoryForCoding: false, separator: '-', regex: undefined, defaultCode: undefined, validFrom: undefined, validTo: undefined },
  { id: 'grant', displayName: 'Grant', segmentType: 'Grant', isActive: true, isCore: false, isCustom: false, isMandatoryForCoding: false, separator: '-', regex: undefined, defaultCode: undefined, validFrom: undefined, validTo: undefined },
  { id: 'function', displayName: 'Function', segmentType: 'Function', isActive: true, isCore: false, isCustom: false, isMandatoryForCoding: false, separator: '-', regex: undefined, defaultCode: undefined, validFrom: undefined, validTo: undefined },
  { id: 'location', displayName: 'Location', segmentType: 'Location', isActive: true, isCore: false, isCustom: false, isMandatoryForCoding: false, separator: '-', regex: undefined, defaultCode: undefined, validFrom: undefined, validTo: undefined },
  { id: 'program', displayName: 'Program', segmentType: 'Program', isActive: true, isCore: false, isCustom: false, isMandatoryForCoding: false, separator: '-', regex: undefined, defaultCode: undefined, validFrom: undefined, validTo: undefined },
];

const segmentFormSchema = z.object({
  displayName: z.string().min(1, { message: 'Display Name is required.' }),
  segmentType: z.string().optional(), // Only for display in view mode, derived for new
  regex: z.string().optional(),
  defaultCode: z.string().optional(),
  separator: z.enum(['-', '|', ',', '.']).optional().default('-'),
  isMandatoryForCoding: z.boolean().default(false),
  isActive: z.boolean().default(true),
  validFrom: z.date().optional(),
  validTo: z.date().optional(),
  isCustom: z.boolean().default(true), // For display and internal logic
  isCore: z.boolean().default(false), // For display and internal logic
  id: z.string().optional(), // For existing segments
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
  const [segments, setSegments] = useState<Segment[]>(initialSegmentsData);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'view' | 'edit'>('add');
  const [currentSegmentData, setCurrentSegmentData] = useState<Segment | null>(null);

  const form = useForm<SegmentFormValues>({
    resolver: zodResolver(segmentFormSchema),
    defaultValues: defaultFormValues,
  });

  useEffect(() => {
    if (dialogMode === 'view' && currentSegmentData) {
      form.reset(currentSegmentData);
    } else if (dialogMode === 'add') {
      form.reset(defaultFormValues);
    }
  }, [dialogMode, currentSegmentData, form]);


  const handleToggleChange = (segmentId: string) => {
    setSegments(prevSegments =>
      prevSegments.map(segment =>
        segment.id === segmentId ? { ...segment, isActive: !segment.isActive } : segment
      )
    );
  };

  const handleAddSegmentClick = () => {
    setDialogMode('add');
    setCurrentSegmentData(null);
    form.reset(defaultFormValues);
    setIsDialogOpen(true);
  };

  const handleViewSegmentClick = (segment: Segment) => {
    setDialogMode('view');
    setCurrentSegmentData(segment);
    form.reset(segment); // Populate form for viewing
    setIsDialogOpen(true);
  };

  const onSubmit = (values: SegmentFormValues) => {
    if (dialogMode === 'add') {
      const newSegment: Segment = {
        id: crypto.randomUUID(),
        segmentType: values.displayName, // Segment Type derived from Display Name
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
      setSegments(prevSegments => [...prevSegments, newSegment].sort((a, b) => {
        if (a.isCore && !b.isCore) return -1;
        if (!a.isCore && b.isCore) return 1;
        const indexOfA = initialSegmentsData.findIndex(s => s.id === a.id);
        const indexOfB = initialSegmentsData.findIndex(s => s.id === b.id);

        if (indexOfA !== -1 && indexOfB !== -1) {
          return indexOfA - indexOfB;
        }
        if (indexOfA !== -1) return -1;
        if (indexOfB !== -1) return 1;
        return 0;
      }));
    }
    // Later: handle 'edit' mode submission
    form.reset(defaultFormValues);
    setIsDialogOpen(false);
  };

  const breadcrumbItems = [
    { label: 'COA Configuration', href: '/' },
    { label: 'Segments' }
  ];
  
  const isViewMode = dialogMode === 'view';

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
            form.reset(defaultFormValues); // Reset form when dialog is closed for any reason
            setCurrentSegmentData(null);
          }
        }}>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>
                {dialogMode === 'add' && 'Add Custom Segment'}
                {dialogMode === 'view' && `View Segment: ${currentSegmentData?.displayName || ''}`}
                {/* Later: {dialogMode === 'edit' && 'Edit Custom Segment'} */}
              </DialogTitle>
              <DialogDescription>
                {dialogMode === 'add' && "Fill in the details for your new custom segment. Click save when you're done."}
                {dialogMode === 'view' && "Viewing details for the selected segment."}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Name</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isViewMode && (currentSegmentData?.isCore || !currentSegmentData?.isCustom)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {(isViewMode || dialogMode === 'edit') && (
                   <FormField
                    control={form.control}
                    name="segmentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Segment Type</FormLabel>
                        <FormControl>
                          <Input {...field} disabled />
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
                          <Input {...field} value={field.value ?? ''} disabled={isViewMode && (currentSegmentData?.isCore || !currentSegmentData?.isCustom)} />
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
                          <Input {...field} value={field.value ?? ''} disabled={isViewMode && (currentSegmentData?.isCore || !currentSegmentData?.isCustom)} />
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
                          disabled={isViewMode && (currentSegmentData?.isCore || !currentSegmentData?.isCustom)}
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
                          disabled={(date) => {
                            if (isViewMode && (currentSegmentData?.isCore || !currentSegmentData?.isCustom)) return true;
                            return form.getValues("validFrom") ? date < form.getValues("validFrom")! : false;
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
                          value={field.value} 
                          disabled={isViewMode && (currentSegmentData?.isCore || !currentSegmentData?.isCustom)}
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

                <div className="space-y-3 pt-2">
                   <FormField
                      control={form.control}
                      name="isMandatoryForCoding"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>Mandatory for Coding</FormLabel>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={isViewMode && (currentSegmentData?.isCore || !currentSegmentData?.isCustom)}
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
                          <div className="space-y-0.5">
                            <FormLabel>Active</FormLabel>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={isViewMode && currentSegmentData?.isCore} // Core segments' active status is fixed
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                </div>
                 <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-muted/50">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium text-muted-foreground">Custom Segment</Label>
                    </div>
                    <Switch
                      checked={dialogMode === 'add' || (currentSegmentData?.isCustom ?? false)}
                      disabled={true}
                      aria-readonly
                    />
                  </FormItem>
                  {isViewMode && currentSegmentData?.isCore && (
                     <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-muted/50">
                        <div className="space-y-0.5">
                          <Label className="text-sm font-medium text-muted-foreground">Core Segment</Label>
                        </div>
                        <Switch
                          checked={currentSegmentData.isCore}
                          disabled={true}
                          aria-readonly
                        />
                      </FormItem>
                  )}


                <DialogFooter className="pt-4">
                  {dialogMode === 'add' && (
                    <>
                      <DialogClose asChild>
                        <Button type="button" variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button type="submit">Save</Button>
                    </>
                  )}
                  {dialogMode === 'view' && (
                    <DialogClose asChild>
                      <Button type="button" variant="outline">Close</Button>
                    </DialogClose>
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
                  <TableHead className="w-[300px] sm:w-[350px]">Display Name</TableHead>
                  <TableHead>Segment Type</TableHead>
                  <TableHead className="text-right w-[150px] sm:w-[180px]">Status</TableHead>
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
                          {segment.validFrom && format(segment.validFrom, "MMM d, yyyy")}
                          {segment.validFrom && segment.validTo && " - "}
                          {segment.validTo && format(segment.validTo, "MMM d, yyyy")}
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

