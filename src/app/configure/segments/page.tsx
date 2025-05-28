
'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
  separator?: string;
  order?: number;
  isCustom: boolean;
  isMandatoryForCoding: boolean;
}

const initialSegmentsData: Segment[] = [
  { id: 'fund', displayName: 'Fund', segmentType: 'Fund', isActive: true, isCore: true, isCustom: false, isMandatoryForCoding: true, order: 1 },
  { id: 'object', displayName: 'Object', segmentType: 'Object', isActive: true, isCore: true, isCustom: false, isMandatoryForCoding: true, order: 2 },
  { id: 'department', displayName: 'Department', segmentType: 'Department', isActive: true, isCore: true, isCustom: false, isMandatoryForCoding: true, order: 3 },
  { id: 'project', displayName: 'Project', segmentType: 'Project', isActive: true, isCore: false, isCustom: false, isMandatoryForCoding: false, order: 4 },
  { id: 'grant', displayName: 'Grant', segmentType: 'Grant', isActive: true, isCore: false, isCustom: false, isMandatoryForCoding: false, order: 5 },
  { id: 'function', displayName: 'Function', segmentType: 'Function', isActive: true, isCore: false, isCustom: false, isMandatoryForCoding: false, order: 6 },
  { id: 'location', displayName: 'Location', segmentType: 'Location', isActive: true, isCore: false, isCustom: false, isMandatoryForCoding: false, order: 7 },
  { id: 'program', displayName: 'Program', segmentType: 'Program', isActive: true, isCore: false, isCustom: false, isMandatoryForCoding: false, order: 8 },
];

const customSegmentSchema = z.object({
  displayName: z.string().min(1, { message: 'Display Name is required.' }),
  segmentType: z.string().min(1, { message: 'Segment Type is required.' }),
  regex: z.string().optional(),
  defaultCode: z.string().optional(),
  separator: z.string().optional(),
  order: z.coerce.number().int().positive({ message: 'Order must be a positive integer.' }),
  isMandatoryForCoding: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

type CustomSegmentFormValues = z.infer<typeof customSegmentSchema>;

export default function SegmentsPage() {
  const [segments, setSegments] = useState<Segment[]>(initialSegmentsData);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<CustomSegmentFormValues>({
    resolver: zodResolver(customSegmentSchema),
    defaultValues: {
      displayName: '',
      segmentType: '',
      regex: '',
      defaultCode: '',
      separator: '-',
      order: segments.length + 1,
      isMandatoryForCoding: false,
      isActive: true,
    },
  });

  const handleToggleChange = (segmentId: string) => {
    setSegments(prevSegments =>
      prevSegments.map(segment =>
        segment.id === segmentId ? { ...segment, isActive: !segment.isActive } : segment
      )
    );
  };

  const onSubmit = (values: CustomSegmentFormValues) => {
    const newSegment: Segment = {
      ...values,
      id: crypto.randomUUID(), // Generate a unique ID
      isCore: false, // Custom segments are not core
      isCustom: true, // This is a custom segment
    };
    setSegments(prevSegments => [...prevSegments, newSegment]);
    form.reset();
    setIsDialogOpen(false);
  };

  const breadcrumbItems = [
    { label: 'COA Configuration', href: '/' },
    { label: 'Segments' }
  ];

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
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-5 w-5" />
                Add Custom Segment
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Add Custom Segment</DialogTitle>
                <DialogDescription>
                  Fill in the details for your new custom segment. Click save when you're done.
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
                          <Input placeholder="e.g., Region" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="segmentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Segment Type</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., REGION_TYPE" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="regex"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>RegEx Pattern</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., ^[A-Z0-9]{3}$" {...field} />
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
                            <Input placeholder="e.g., 000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="separator"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Separator</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., -" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="order"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Order</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="e.g., 9" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

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
                        checked={true}
                        disabled={true}
                        aria-readonly
                      />
                    </FormItem>


                  <DialogFooter className="pt-4">
                    <DialogClose asChild>
                      <Button type="button" variant="outline" onClick={() => form.reset()}>Cancel</Button>
                    </DialogClose>
                    <Button type="submit">Save</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

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
                        onClick={() => console.log(`Clicked on ${segment.displayName}`)} // Placeholder action
                      >
                        {segment.displayName}
                      </span>
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

    