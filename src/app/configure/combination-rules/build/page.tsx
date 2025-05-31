
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlusCircle, Trash2 } from 'lucide-react';
import { useSegments } from '@/contexts/SegmentsContext';
import { useCombinationRules } from '@/contexts/CombinationRulesContext';
import type { CombinationRule, CombinationRuleMappingEntry, CombinationRuleCriterion, CombinationRuleCriterionType } from '@/lib/combination-rule-types';
import type { Segment } from '@/lib/segment-types';


const combinationRuleFormSchema = z.object({
  name: z.string().min(1, { message: 'Rule Name is required.' }),
  status: z.enum(['Active', 'Inactive'], {
    required_error: 'Status is required.',
  }),
  description: z.string().optional(),
  segmentAId: z.string().min(1, { message: 'Segment A is required.' }),
  segmentBId: z.string().min(1, { message: 'Segment B is required.' }),
}).refine(data => data.segmentAId !== data.segmentBId, {
  message: "Segment A and Segment B must be different.",
  path: ["segmentBId"],
});

type CombinationRuleFormValues = z.infer<typeof combinationRuleFormSchema>;

interface MappingEntryFormState {
  segmentACriterionType: CombinationRuleCriterionType | '';
  segmentACodeValue: string;
  segmentARangeStart: string;
  segmentARangeEnd: string;
  segmentAHierarchyNodeId: string;
  segmentAIncludeChildren: boolean;

  segmentBCriterionType: CombinationRuleCriterionType | '';
  segmentBCodeValue: string;
  segmentBRangeStart: string;
  segmentBRangeEnd: string;
  segmentBHierarchyNodeId: string;
  segmentBIncludeChildren: boolean;
}

const initialMappingEntryFormState: MappingEntryFormState = {
  segmentACriterionType: '',
  segmentACodeValue: '',
  segmentARangeStart: '',
  segmentARangeEnd: '',
  segmentAHierarchyNodeId: '',
  segmentAIncludeChildren: false,
  segmentBCriterionType: '',
  segmentBCodeValue: '',
  segmentBRangeStart: '',
  segmentBRangeEnd: '',
  segmentBHierarchyNodeId: '',
  segmentBIncludeChildren: false,
};


export default function CombinationRuleBuildPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { segments, getSegmentById } = useSegments();
  const { addCombinationRule, updateCombinationRule, getCombinationRuleById } = useCombinationRules();

  const ruleIdQueryParam = searchParams.get('ruleId');
  const [currentRuleId, setCurrentRuleId] = useState<string | null>(ruleIdQueryParam);
  const [isEditMode, setIsEditMode] = useState<boolean>(!!ruleIdQueryParam);
  
  const [mappingEntries, setMappingEntries] = useState<CombinationRuleMappingEntry[]>([]);
  const [isMappingEntryDialogOpen, setIsMappingEntryDialogOpen] = useState(false);
  const [mappingEntryFormState, setMappingEntryFormState] = useState<MappingEntryFormState>(initialMappingEntryFormState);


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
      mappingEntries: mappingEntries,
      lastModifiedDate: new Date(),
      lastModifiedBy: "Current User", 
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

  const selectedSegmentA = useMemo(() => segmentAValue ? getSegmentById(segmentAValue) : null, [segmentAValue, getSegmentById]);
  const selectedSegmentB = useMemo(() => segmentBValue ? getSegmentById(segmentBValue) : null, [segmentBValue, getSegmentById]);

  const availableSegmentsForA = segments;
  const availableSegmentsForB = segments.filter(s => s.id !== segmentAValue);

  const breadcrumbItems = [
    { label: 'COA Configuration', href: '/' },
    { label: 'Combination Rules', href: '/configure/combination-rules' },
    { label: isEditMode ? 'Edit Combination Rule' : 'Create Combination Rule' },
  ];

  const handleOpenAddMappingEntryDialog = () => {
    setMappingEntryFormState(initialMappingEntryFormState);
    setIsMappingEntryDialogOpen(true);
  };

  const handleMappingEntryFormChange = (field: keyof MappingEntryFormState, value: any) => {
    setMappingEntryFormState(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveMappingEntry = () => {
    const {
      segmentACriterionType, segmentACodeValue, segmentARangeStart, segmentARangeEnd, segmentAHierarchyNodeId, segmentAIncludeChildren,
      segmentBCriterionType, segmentBCodeValue, segmentBRangeStart, segmentBRangeEnd, segmentBHierarchyNodeId, segmentBIncludeChildren
    } = mappingEntryFormState;

    let critA: CombinationRuleCriterion | null = null;
    if (segmentACriterionType === 'CODE' && segmentACodeValue) {
      critA = { type: 'CODE', codeValue: segmentACodeValue };
    } else if (segmentACriterionType === 'RANGE' && segmentARangeStart && segmentARangeEnd) {
      critA = { type: 'RANGE', rangeStartValue: segmentARangeStart, rangeEndValue: segmentARangeEnd };
    } else if (segmentACriterionType === 'HIERARCHY_NODE' && segmentAHierarchyNodeId) {
      critA = { type: 'HIERARCHY_NODE', hierarchyNodeId: segmentAHierarchyNodeId, includeChildren: segmentAIncludeChildren };
    }

    let critB: CombinationRuleCriterion | null = null;
    if (segmentBCriterionType === 'CODE' && segmentBCodeValue) {
      critB = { type: 'CODE', codeValue: segmentBCodeValue };
    } else if (segmentBCriterionType === 'RANGE' && segmentBRangeStart && segmentBRangeEnd) {
      critB = { type: 'RANGE', rangeStartValue: segmentBRangeStart, rangeEndValue: segmentBRangeEnd };
    } else if (segmentBCriterionType === 'HIERARCHY_NODE' && segmentBHierarchyNodeId) {
      critB = { type: 'HIERARCHY_NODE', hierarchyNodeId: segmentBHierarchyNodeId, includeChildren: segmentBIncludeChildren };
    }

    if (critA && critB) {
      const newEntry: CombinationRuleMappingEntry = {
        id: crypto.randomUUID(),
        segmentACriterion: critA,
        segmentBCriterion: critB,
      };
      setMappingEntries(prev => [...prev, newEntry]);
      setIsMappingEntryDialogOpen(false);
    } else {
      alert("Please complete all required fields for both Segment A and Segment B criteria.");
    }
  };

  const handleRemoveMappingEntry = (entryId: string) => {
    setMappingEntries(prev => prev.filter(entry => entry.id !== entryId));
  };
  
  const renderCriterionDisplay = (criterion: CombinationRuleCriterion, segmentName?: string): string => {
    const namePrefix = segmentName ? `${segmentName} ` : '';
    switch (criterion.type) {
      case 'CODE':
        return `${namePrefix}Code: ${criterion.codeValue}`;
      case 'RANGE':
        return `${namePrefix}Range: ${criterion.rangeStartValue} - ${criterion.rangeEndValue}`;
      case 'HIERARCHY_NODE':
        return `${namePrefix}Hierarchy Node: ${criterion.hierarchyNodeId}${criterion.includeChildren ? ' (and children)' : ''}`;
      default:
        return 'Invalid Criterion';
    }
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
                            form.setValue("segmentBId", ""); 
                          }
                        }} 
                        value={field.value}
                        disabled={isEditMode}
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
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Button type="button" variant="outline" onClick={handleOpenAddMappingEntryDialog} disabled={!segmentAValue || !segmentBValue}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Mapping Entry
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
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {renderCriterionDisplay(entry.segmentACriterion)}
                      </p>
                      <p className="text-sm font-medium">
                        {renderCriterionDisplay(entry.segmentBCriterion)}
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

      {/* Dialog for Adding/Editing Mapping Entry */}
      <Dialog open={isMappingEntryDialogOpen} onOpenChange={setIsMappingEntryDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Mapping Entry</DialogTitle>
            <DialogDescription>
              Define the criteria for Segment A ({selectedSegmentA?.displayName || 'N/A'}) and Segment B ({selectedSegmentB?.displayName || 'N/A'}).
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] p-1">
            <div className="space-y-6 py-4 pr-4">
              {/* Segment A Criterion */}
              <Card>
                <CardHeader><CardTitle className="text-lg">Segment A Criterion: {selectedSegmentA?.displayName || 'N/A'}</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label htmlFor="segmentACriterionType">Criterion Type</Label>
                    <Select
                      value={mappingEntryFormState.segmentACriterionType}
                      onValueChange={(value) => handleMappingEntryFormChange('segmentACriterionType', value as CombinationRuleCriterionType)}
                    >
                      <SelectTrigger id="segmentACriterionType"><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CODE">Specific Code</SelectItem>
                        <SelectItem value="RANGE">Range of Codes</SelectItem>
                        <SelectItem value="HIERARCHY_NODE">Hierarchy Node</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {mappingEntryFormState.segmentACriterionType === 'CODE' && (
                    <div>
                      <Label htmlFor="segmentACodeValue">Code Value</Label>
                      <Input id="segmentACodeValue" value={mappingEntryFormState.segmentACodeValue} onChange={(e) => handleMappingEntryFormChange('segmentACodeValue', e.target.value)} />
                    </div>
                  )}
                  {mappingEntryFormState.segmentACriterionType === 'RANGE' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="segmentARangeStart">Start Code</Label>
                        <Input id="segmentARangeStart" value={mappingEntryFormState.segmentARangeStart} onChange={(e) => handleMappingEntryFormChange('segmentARangeStart', e.target.value)} />
                      </div>
                      <div>
                        <Label htmlFor="segmentARangeEnd">End Code</Label>
                        <Input id="segmentARangeEnd" value={mappingEntryFormState.segmentARangeEnd} onChange={(e) => handleMappingEntryFormChange('segmentARangeEnd', e.target.value)} />
                      </div>
                    </div>
                  )}
                  {mappingEntryFormState.segmentACriterionType === 'HIERARCHY_NODE' && (
                    <div className="space-y-2">
                      <div>
                        <Label htmlFor="segmentAHierarchyNodeId">Hierarchy Node ID</Label>
                        <Input id="segmentAHierarchyNodeId" value={mappingEntryFormState.segmentAHierarchyNodeId} onChange={(e) => handleMappingEntryFormChange('segmentAHierarchyNodeId', e.target.value)} />
                        <p className="text-xs text-muted-foreground mt-1">Specify the ID of the node from a relevant hierarchy for Segment A.</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="segmentAIncludeChildren" checked={mappingEntryFormState.segmentAIncludeChildren} onCheckedChange={(checked) => handleMappingEntryFormChange('segmentAIncludeChildren', !!checked)} />
                        <Label htmlFor="segmentAIncludeChildren" className="text-sm font-normal">Include Children</Label>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Segment B Criterion */}
              <Card>
                <CardHeader><CardTitle className="text-lg">Segment B Criterion: {selectedSegmentB?.displayName || 'N/A'}</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                   <div>
                    <Label htmlFor="segmentBCriterionType">Criterion Type</Label>
                    <Select
                      value={mappingEntryFormState.segmentBCriterionType}
                      onValueChange={(value) => handleMappingEntryFormChange('segmentBCriterionType', value as CombinationRuleCriterionType)}
                    >
                      <SelectTrigger id="segmentBCriterionType"><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CODE">Specific Code</SelectItem>
                        <SelectItem value="RANGE">Range of Codes</SelectItem>
                        <SelectItem value="HIERARCHY_NODE">Hierarchy Node</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {mappingEntryFormState.segmentBCriterionType === 'CODE' && (
                    <div>
                      <Label htmlFor="segmentBCodeValue">Code Value</Label>
                      <Input id="segmentBCodeValue" value={mappingEntryFormState.segmentBCodeValue} onChange={(e) => handleMappingEntryFormChange('segmentBCodeValue', e.target.value)} />
                    </div>
                  )}
                  {mappingEntryFormState.segmentBCriterionType === 'RANGE' && (
                     <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="segmentBRangeStart">Start Code</Label>
                        <Input id="segmentBRangeStart" value={mappingEntryFormState.segmentBRangeStart} onChange={(e) => handleMappingEntryFormChange('segmentBRangeStart', e.target.value)} />
                      </div>
                      <div>
                        <Label htmlFor="segmentBRangeEnd">End Code</Label>
                        <Input id="segmentBRangeEnd" value={mappingEntryFormState.segmentBRangeEnd} onChange={(e) => handleMappingEntryFormChange('segmentBRangeEnd', e.target.value)} />
                      </div>
                    </div>
                  )}
                  {mappingEntryFormState.segmentBCriterionType === 'HIERARCHY_NODE' && (
                    <div className="space-y-2">
                      <div>
                        <Label htmlFor="segmentBHierarchyNodeId">Hierarchy Node ID</Label>
                        <Input id="segmentBHierarchyNodeId" value={mappingEntryFormState.segmentBHierarchyNodeId} onChange={(e) => handleMappingEntryFormChange('segmentBHierarchyNodeId', e.target.value)} />
                        <p className="text-xs text-muted-foreground mt-1">Specify the ID of the node from a relevant hierarchy for Segment B.</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="segmentBIncludeChildren" checked={mappingEntryFormState.segmentBIncludeChildren} onCheckedChange={(checked) => handleMappingEntryFormChange('segmentBIncludeChildren', !!checked)} />
                        <Label htmlFor="segmentBIncludeChildren" className="text-sm font-normal">Include Children</Label>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="button" onClick={handleSaveMappingEntry}>Save Entry</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

