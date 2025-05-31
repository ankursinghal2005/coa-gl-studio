
'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label'; // Direct import for non-form use
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlusCircle, Trash2 } from 'lucide-react';
import { useSegments } from '@/contexts/SegmentsContext';
import { useCombinationRules } from '@/contexts/CombinationRulesContext';
import type { CombinationRule, CombinationRuleMappingEntry, CombinationRuleCriterion } from '@/lib/combination-rule-types';
import type { Segment } from '@/lib/segment-types';


const combinationRuleFormSchema = z.object({
  name: z.string().min(1, { message: 'Rule Name is required.' }),
  status: z.enum(['Active', 'Inactive'], {
    required_error: 'Status is required.',
  }),
  description: z.string().optional(),
  segmentAId: z.string().min(1, { message: 'Segment A is required.' }),
  segmentBId: z.string().min(1, { message: 'Segment B is required.' }),
  // mappingEntries will be handled separately for now, not directly in the Zod schema for the main form
}).refine(data => data.segmentAId !== data.segmentBId, {
  message: "Segment A and Segment B must be different.",
  path: ["segmentBId"], // Attach error to segmentBId for convenience
});

type CombinationRuleFormValues = z.infer<typeof combinationRuleFormSchema>;

export default function CombinationRuleBuildPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { segments } = useSegments();
  const { addCombinationRule, updateCombinationRule, getCombinationRuleById } = useCombinationRules();

  const ruleIdQueryParam = searchParams.get('ruleId');
  const [currentRuleId, setCurrentRuleId] = useState<string | null>(ruleIdQueryParam);
  const [isEditMode, setIsEditMode] = useState<boolean>(!!ruleIdQueryParam);
  
  // State for managing mapping entries (to be expanded later)
  const [mappingEntries, setMappingEntries] = useState<CombinationRuleMappingEntry[]>([]);


  const form = useForm<CombinationRuleFormValues>({
    resolver: zodResolver(combinationRuleFormSchema),
    defaultValues: {
      name: '',
      status: 'Active',
      description: '',
      segmentAId: '',
      segmentBId: '',
    },
  });

  useEffect(() => {
    if (ruleIdQueryParam) {
      const existingRule = getCombinationRuleById(ruleIdQueryParam);
      if (existingRule) {
        form.reset({
          name: existingRule.name,
          status: existingRule.status,
          description: existingRule.description || '',
          segmentAId: existingRule.segmentAId,
          segmentBId: existingRule.segmentBId,
        });
        setMappingEntries(existingRule.mappingEntries || []);
        setCurrentRuleId(existingRule.id);
        setIsEditMode(true);
      } else {
        alert("Combination Rule not found. Starting new rule.");
        router.replace('/configure/combination-rules/build');
        setIsEditMode(false);
        setCurrentRuleId(null);
        form.reset();
        setMappingEntries([]);
      }
    } else {
        setIsEditMode(false);
        setCurrentRuleId(null);
        // form.reset(); // form has default values
        setMappingEntries([]);
    }
  }, [ruleIdQueryParam, getCombinationRuleById, form, router]);

  const onSubmit = (values: CombinationRuleFormValues) => {
    const ruleData = {
      name: values.name,
      status: values.status,
      description: values.description,
      segmentAId: values.segmentAId,
      segmentBId: values.segmentBId,
      mappingEntries: mappingEntries, // Use current state for mappingEntries
      lastModifiedDate: new Date(),
      lastModifiedBy: "Current User", // Placeholder
    };

    if (isEditMode && currentRuleId) {
      updateCombinationRule({ ...ruleData, id: currentRuleId });
      alert(`Combination Rule "${values.name}" updated successfully!`);
    } else {
      const newId = crypto.randomUUID();
      addCombinationRule({ ...ruleData, id: newId });
      alert(`Combination Rule "${values.name}" saved successfully!`);
    }
    router.push('/configure/combination-rules');
  };

  const handleCancel = () => {
    router.push('/configure/combination-rules');
  };
  
  const segmentAValue = form.watch("segmentAId");
  const segmentBValue = form.watch("segmentBId");

  const availableSegmentsForA = segments;
  const availableSegmentsForB = segments.filter(s => s.id !== segmentAValue);
  // const availableSegmentsForA = segments.filter(s => s.id !== segmentBValue);


  const breadcrumbItems = [
    { label: 'COA Configuration', href: '/' },
    { label: 'Combination Rules', href: '/configure/combination-rules' },
    { label: isEditMode ? 'Edit Combination Rule' : 'Create Combination Rule' },
  ];

  // Placeholder for adding/managing mapping entries
  const handleAddMappingEntry = () => {
    // This will be expanded later to open a modal or inline form
    // For now, it's a placeholder
    const newEntry: CombinationRuleMappingEntry = {
        id: crypto.randomUUID(),
        // Placeholder criteria
        segmentACriterion: { type: 'CODE', codeValue: 'TEMP_A_CODE' },
        segmentBCriterion: { type: 'CODE', codeValue: 'TEMP_B_CODE' },
    };
    setMappingEntries(prev => [...prev, newEntry]);
    alert("Add mapping entry UI is not fully implemented yet. A placeholder entry was added.");
  };

  const handleRemoveMappingEntry = (entryId: string) => {
    setMappingEntries(prev => prev.filter(entry => entry.id !== entryId));
  };


  return (
    <div className="flex flex-col min-h-screen p-4 sm:p-6 lg:p-8 bg-background">
      <Breadcrumbs items={breadcrumbItems} />
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-primary">
          {isEditMode ? 'Edit Combination Rule' : 'Create New Combination Rule'}
        </h1>
      </header>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Rule Details</CardTitle>
              <CardDescription>Define the name, status, and segments for this rule.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rule Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Fund/Object Core Spending" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="segmentAId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Segment A *</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                          if (value === form.getValues("segmentBId")) {
                            form.setValue("segmentBId", ""); // Clear B if same as A
                          }
                        }} 
                        value={field.value}
                        disabled={isEditMode} // Segments cannot be changed in edit mode for simplicity
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Segment A" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableSegmentsForA.map(segment => (
                            <SelectItem key={segment.id} value={segment.id} disabled={segment.id === segmentBValue}>
                              {segment.displayName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="segmentBId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Segment B *</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                        disabled={isEditMode || !segmentAValue}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={!segmentAValue ? "Select Segment A first" : "Select Segment B"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableSegmentsForB.map(segment => (
                            <SelectItem key={segment.id} value={segment.id}>
                              {segment.displayName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
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
                      <Textarea
                        placeholder="Optional: Describe the purpose and logic of this rule"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Define Valid Combinations</CardTitle>
              <CardDescription>
                Specify which codes (or ranges/hierarchy nodes) from Segment A are valid with which codes from Segment B.
                Full UI for detailed mapping definition will be implemented in a future step.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Button type="button" variant="outline" onClick={handleAddMappingEntry} disabled={!segmentAValue || !segmentBValue}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Mapping Entry (Placeholder)
                </Button>
              </div>
              {(!segmentAValue || !segmentBValue) && (
                <p className="text-sm text-muted-foreground">Please select Segment A and Segment B to start adding mapping entries.</p>
              )}
              <ScrollArea className="h-auto max-h-96 border rounded-md p-4">
                {mappingEntries.length === 0 && segmentAValue && segmentBValue && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No mapping entries defined yet. Click "Add Mapping Entry" to start.
                  </p>
                )}
                <div className="space-y-3">
                {mappingEntries.map(entry => (
                  <div key={entry.id} className="flex items-center justify-between p-3 border rounded-md bg-muted/50">
                    <div>
                      <p className="text-sm font-medium">
                        Segment A Criterion: {JSON.stringify(entry.segmentACriterion)}
                      </p>
                      <p className="text-sm font-medium">
                        Segment B Criterion: {JSON.stringify(entry.segmentBCriterion)}
                      </p>
                    </div>
                    <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleRemoveMappingEntry(entry.id)}
                        className="text-destructive hover:text-destructive/80"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit">
              {isEditMode ? 'Update Rule' : 'Save Rule'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
