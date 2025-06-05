
'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link'; // Added for navigation
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
  FormDescription
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { PlusCircle, Edit3, Trash2, Workflow } from 'lucide-react';
import { useSegments } from '@/contexts/SegmentsContext';
import { useHierarchies } from '@/contexts/HierarchiesContext';
import type { SegmentHierarchyInSet, HierarchySet } from '@/lib/hierarchy-types';
import { DatePicker } from '@/components/ui/date-picker';


const hierarchySetFormSchema = z.object({
  name: z.string().min(1, { message: 'Hierarchy Set Name is required.' }),
  status: z.enum(['Active', 'Inactive', 'Deprecated'] as [HierarchySet['status'], ...Array<HierarchySet['status']>], {
    required_error: 'Status is required.',
  }),
  description: z.string().optional(),
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

type HierarchySetFormValues = z.infer<typeof hierarchySetFormSchema>;


export default function HierarchySetBuildPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { segments: allGlobalSegments, getSegmentById } = useSegments();
  const { addHierarchySet, updateHierarchySet, getHierarchySetById } = useHierarchies();
  
  const hierarchySetIdQueryParam = searchParams.get('hierarchySetId');
  const [currentHierarchySetId, setCurrentHierarchySetId] = useState<string | null>(hierarchySetIdQueryParam);
  const [isEditMode, setIsEditMode] = useState<boolean>(!!hierarchySetIdQueryParam);

  const [segmentHierarchiesInSet, setSegmentHierarchiesInSet] = useState<SegmentHierarchyInSet[]>([]);
  const [segmentToAdd, setSegmentToAdd] = useState<string>('');
  
  const form = useForm<HierarchySetFormValues>({
    resolver: zodResolver(hierarchySetFormSchema),
    defaultValues: {
      name: '',
      status: 'Active',
      description: '',
      validFrom: new Date(),
      validTo: undefined,
    },
  });

  useEffect(() => {
    if (hierarchySetIdQueryParam) {
      const existingSet = getHierarchySetById(hierarchySetIdQueryParam);
      if (existingSet) {
        form.reset({
          name: existingSet.name,
          status: existingSet.status,
          description: existingSet.description || '',
          validFrom: new Date(existingSet.validFrom),
          validTo: existingSet.validTo ? new Date(existingSet.validTo) : undefined,
        });
        setSegmentHierarchiesInSet(existingSet.segmentHierarchies.map(sh => ({...sh, treeNodes: [...(sh.treeNodes || [])]})));
        setCurrentHierarchySetId(existingSet.id);
        setIsEditMode(true);
      } else {
        alert("Hierarchy Set not found. Starting new set.");
        router.replace('/configure/hierarchies/build');
        setIsEditMode(false);
        setCurrentHierarchySetId(null);
        form.reset();
        setSegmentHierarchiesInSet([]);
      }
    } else {
      setIsEditMode(false);
      setCurrentHierarchySetId(null);
      form.reset();
      setSegmentHierarchiesInSet([]);
    }
  }, [hierarchySetIdQueryParam, getHierarchySetById, form, router]);

  const onSubmit = (values: HierarchySetFormValues) => {
    if (segmentHierarchiesInSet.length === 0) {
      alert("Please add and define at least one segment hierarchy for this set.");
      return;
    }

    const hierarchySetData: HierarchySet = {
      id: currentHierarchySetId || crypto.randomUUID(),
      name: values.name,
      status: values.status,
      description: values.description,
      validFrom: values.validFrom,
      validTo: values.validTo,
      segmentHierarchies: segmentHierarchiesInSet, // This now holds the latest tree structures
      lastModifiedDate: new Date(),
      lastModifiedBy: "Current User", 
    };

    if (isEditMode && currentHierarchySetId) {
      updateHierarchySet(hierarchySetData);
      alert(`Hierarchy Set "${values.name}" updated successfully!`);
    } else {
      addHierarchySet(hierarchySetData);
      alert(`Hierarchy Set "${values.name}" saved successfully!`);
    }
    router.push('/configure/hierarchies');
  };

  const handleCancel = () => {
    router.push('/configure/hierarchies');
  };
  
  const handleAddSegmentToSet = () => {
    if (!segmentToAdd) {
      alert("Please select a segment to add.");
      return;
    }
    if (segmentHierarchiesInSet.find(sh => sh.segmentId === segmentToAdd)) {
      alert("This segment is already part of the hierarchy set.");
      return;
    }
    const newSegmentHierarchy: SegmentHierarchyInSet = {
      id: crypto.randomUUID(), // Unique ID for this segment's presence in *this* set
      segmentId: segmentToAdd,
      treeNodes: [], // Start with an empty tree
    };
    setSegmentHierarchiesInSet(prev => [...prev, newSegmentHierarchy]);
    setSegmentToAdd(''); 
  };

  const handleRemoveSegmentFromSet = (segmentHierarchyIdToRemove: string) => {
    if (window.confirm("Are you sure you want to remove this segment's hierarchy from the set? Its tree structure will be lost from this set.")) {
        setSegmentHierarchiesInSet(prev => prev.filter(sh => sh.id !== segmentHierarchyIdToRemove));
    }
  };

  const breadcrumbItems = [
    { label: 'COA Configuration', href: '/' },
    { label: 'Hierarchy Sets', href: '/configure/hierarchies' },
    { label: isEditMode ? `Edit Set: ${form.getValues('name') || 'Loading...'}` : 'Create Hierarchy Set' },
  ];

  const availableSegmentsForAdding = allGlobalSegments.filter(
    seg => !segmentHierarchiesInSet.some(sh => sh.segmentId === seg.id)
  );

  return (
    <div className="w-full max-w-5xl mx-auto"> {/* Adjusted max-width based on content */}
      <Breadcrumbs items={breadcrumbItems} />
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-primary flex items-center">
           <Workflow className="mr-3 h-7 w-7" />
          {isEditMode ? 'Edit Hierarchy Set' : 'Create New Hierarchy Set'}
        </h1>
      </header>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Hierarchy Set Details</CardTitle>
              <CardDescription>Define the general properties for this collection of hierarchies.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Set Name *</FormLabel>
                    <FormControl><Input placeholder="e.g., GASB Reporting Structure, FY25 Budget Rollup" {...field} /></FormControl>
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
                    <FormControl><Textarea placeholder="Optional: Purpose of this hierarchy set" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Status *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl>
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
                <FormField
                  control={form.control}
                  name="validFrom"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Valid From *</FormLabel>
                      <DatePicker value={field.value} onValueChange={field.onChange} placeholder="Select start date" />
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
                        placeholder="Optional: Select end date" 
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Segment Hierarchies in this Set</CardTitle>
              <CardDescription>Define or edit the tree structure for each segment included in this Hierarchy Set.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 p-4 border rounded-md bg-muted/30">
                <Label htmlFor="segmentToAdd">Add Segment to this Set</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Select value={segmentToAdd} onValueChange={setSegmentToAdd}>
                    <SelectTrigger id="segmentToAdd" className="flex-grow">
                      <SelectValue placeholder="Select a segment..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSegmentsForAdding.length > 0 ? (
                        availableSegmentsForAdding.map(seg => (
                          <SelectItem key={seg.id} value={seg.id}>{seg.displayName}</SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>All segments already added or no segments available.</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <Button type="button" onClick={handleAddSegmentToSet} disabled={!segmentToAdd || segmentToAdd === 'none'}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Segment
                  </Button>
                </div>
                 {availableSegmentsForAdding.length === 0 && segmentHierarchiesInSet.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">All available segments have been added to this set.</p>
                )}
              </div>

              {segmentHierarchiesInSet.length === 0 ? (
                <p className="text-center text-muted-foreground py-6">No segment hierarchies defined for this set yet. Add a segment above to begin.</p>
              ) : (
                <div className="space-y-4">
                  {segmentHierarchiesInSet.map((sh) => {
                    const segmentDetails = getSegmentById(sh.segmentId);
                    const treeNodeCount = sh.treeNodes?.length || 0; 
                    return (
                      <Card key={sh.id} className="shadow">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                          <CardTitle className="text-xl">{segmentDetails?.displayName || 'Unknown Segment'}</CardTitle>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              asChild // Use asChild to make the Button a Link
                            >
                              <Link href={`/configure/hierarchies/build-segment-tree?hierarchySetId=${currentHierarchySetId}&segmentHierarchyId=${sh.id}`}>
                                <Edit3 className="mr-2 h-4 w-4" /> Edit Tree
                              </Link>
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleRemoveSegmentFromSet(sh.id)}>
                              <Trash2 className="mr-2 h-4 w-4" /> Remove
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            {sh.description || `Hierarchy for ${segmentDetails?.displayName || 'this segment'}.`}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {treeNodeCount > 0 ? `${treeNodeCount} root node(s) defined.` : 'No tree structure defined yet.'}
                          </p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="mt-8 flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={handleCancel}>Cancel</Button>
            <Button type="submit">
              {isEditMode ? 'Update Hierarchy Set' : 'Save Hierarchy Set'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

    