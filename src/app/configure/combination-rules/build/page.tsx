
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription as CardDesc } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlusCircle, Trash2 } from 'lucide-react';
import { useSegments } from '@/contexts/SegmentsContext';
import { useCombinationRules } from '@/contexts/CombinationRulesContext';
import type {
  CombinationRule,
  CombinationRuleDefinitionEntry,
  SegmentCondition,
  CombinationRuleCriterion,
  CombinationRuleCriterionType,
} from '@/lib/combination-rule-types';
import type { Segment } from '@/lib/segment-types';


const combinationRuleFormSchema = z.object({
  name: z.string().min(1, { message: 'Rule Name is required.' }),
  status: z.enum(['Active', 'Inactive'] as [string, ...string[]], { // Adjusted for general enum
    required_error: 'Status is required.',
  }),
  description: z.string().optional(),
});

type CombinationRuleFormValues = z.infer<typeof combinationRuleFormSchema>;

// Form state for a single SegmentCondition within the dialog
interface SegmentConditionFormState {
  id: string;
  segmentId: string;
  criterionType: CombinationRuleCriterionType | '';
  codeValue: string;
  rangeStartValue: string;
  rangeEndValue: string;
  hierarchyNodeId: string;
  includeChildren: boolean;
}

// Form state for the Definition Entry dialog
interface DefinitionEntryFormState {
  id: string; // ID of the CombinationRuleDefinitionEntry being edited, or empty for new
  description: string;
  behavior: 'Include' | 'Exclude';
  segmentConditions: SegmentConditionFormState[];
}

const initialSegmentConditionFormState: Omit<SegmentConditionFormState, 'id' | 'segmentId'> = {
  criterionType: '',
  codeValue: '',
  rangeStartValue: '',
  rangeEndValue: '',
  hierarchyNodeId: '',
  includeChildren: false,
};

const initialDefinitionEntryFormState: Omit<DefinitionEntryFormState, 'id'> = {
  description: '',
  behavior: 'Include',
  segmentConditions: [],
};


export default function CombinationRuleBuildPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { segments: availableSegments, getSegmentById } = useSegments();
  const { addCombinationRule, updateCombinationRule, getCombinationRuleById } = useCombinationRules();

  const ruleIdQueryParam = searchParams.get('ruleId');
  const [currentRuleId, setCurrentRuleId] = useState<string | null>(ruleIdQueryParam);
  const [isEditMode, setIsEditMode] = useState<boolean>(!!ruleIdQueryParam);
  
  const [definitionEntries, setDefinitionEntries] = useState<CombinationRuleDefinitionEntry[]>([]);
  const [isDefinitionEntryDialogOpen, setIsDefinitionEntryDialogOpen] = useState(false);
  const [currentEditingDefinitionEntryId, setCurrentEditingDefinitionEntryId] = useState<string | null>(null);
  const [definitionEntryFormState, setDefinitionEntryFormState] = useState<DefinitionEntryFormState>({
    ...initialDefinitionEntryFormState,
    id: '', // Initialize id for new entries
  });


  const form = useForm<CombinationRuleFormValues>({
    resolver: zodResolver(combinationRuleFormSchema),
    defaultValues: {
      name: '',
      status: 'Active',
      description: '',
    },
  });

  useEffect(() => {
    if (ruleIdQueryParam) {
      const existingRule = getCombinationRuleById(ruleIdQueryParam);
      if (existingRule) {
        form.reset({
          name: existingRule.name,
          status: existingRule.status as 'Active' | 'Inactive',
          description: existingRule.description || '',
        });
        setDefinitionEntries(existingRule.definitionEntries || []);
        setCurrentRuleId(existingRule.id);
        setIsEditMode(true);
      } else {
        alert("Combination Rule not found. Starting new rule.");
        router.replace('/configure/combination-rules/build');
        setIsEditMode(false);
        setCurrentRuleId(null);
        form.reset();
        setDefinitionEntries([]);
      }
    } else {
        setIsEditMode(false);
        setCurrentRuleId(null);
        form.reset(); 
        setDefinitionEntries([]);
    }
  }, [ruleIdQueryParam, getCombinationRuleById, form, router]);

  const onSubmit = (values: CombinationRuleFormValues) => {
    if (definitionEntries.length === 0) {
        alert("Please define at least one combination definition entry.");
        return;
    }
    const ruleData: Omit<CombinationRule, 'id' | 'lastModifiedDate' | 'lastModifiedBy'> & {id?: string} = {
      name: values.name,
      status: values.status as 'Active' | 'Inactive',
      description: values.description,
      definitionEntries: definitionEntries,
    };

    if (isEditMode && currentRuleId) {
      updateCombinationRule({ ...ruleData, id: currentRuleId, lastModifiedDate: new Date(), lastModifiedBy: "Current User" });
      alert(`Combination Rule "${values.name}" updated successfully!`);
    } else {
      const newId = crypto.randomUUID();
      addCombinationRule({ ...ruleData, id: newId, lastModifiedDate: new Date(), lastModifiedBy: "Current User" });
      alert(`Combination Rule "${values.name}" saved successfully!`);
    }
    router.push('/configure/combination-rules');
  };

  const handleCancel = () => {
    router.push('/configure/combination-rules');
  };
  
  const breadcrumbItems = [
    { label: 'COA Configuration', href: '/' },
    { label: 'Combination Rules', href: '/configure/combination-rules' },
    { label: isEditMode ? 'Edit Combination Rule' : 'Create Combination Rule' },
  ];

  const handleOpenDefinitionEntryDialog = (entryToEditId?: string) => {
    if (entryToEditId) {
      const entry = definitionEntries.find(e => e.id === entryToEditId);
      if (entry) {
        setDefinitionEntryFormState({
          id: entry.id,
          description: entry.description || '',
          behavior: entry.behavior,
          segmentConditions: entry.segmentConditions.map(sc => ({
            id: sc.id,
            segmentId: sc.segmentId,
            criterionType: sc.criterion.type,
            codeValue: sc.criterion.codeValue || '',
            rangeStartValue: sc.criterion.rangeStartValue || '',
            rangeEndValue: sc.criterion.rangeEndValue || '',
            hierarchyNodeId: sc.criterion.hierarchyNodeId || '',
            includeChildren: sc.criterion.includeChildren || false,
          })),
        });
        setCurrentEditingDefinitionEntryId(entryToEditId);
      }
    } else {
      setDefinitionEntryFormState({ ...initialDefinitionEntryFormState, id: crypto.randomUUID(), segmentConditions: [] });
      setCurrentEditingDefinitionEntryId(null);
    }
    setIsDefinitionEntryDialogOpen(true);
  };

  const handleDefinitionEntryDialogChange = (field: keyof Omit<DefinitionEntryFormState, 'segmentConditions' | 'id'>, value: any) => {
    setDefinitionEntryFormState(prev => ({ ...prev, [field]: value }));
  };

  const handleSegmentConditionChange = (index: number, field: keyof SegmentConditionFormState, value: any) => {
    setDefinitionEntryFormState(prev => {
      const updatedConditions = [...prev.segmentConditions];
      const conditionToUpdate = { ...updatedConditions[index] };
      (conditionToUpdate as any)[field] = value;

      if (field === 'criterionType') { // Reset other fields when criterion type changes
        conditionToUpdate.codeValue = '';
        conditionToUpdate.rangeStartValue = '';
        conditionToUpdate.rangeEndValue = '';
        conditionToUpdate.hierarchyNodeId = '';
        conditionToUpdate.includeChildren = false;
      }
      updatedConditions[index] = conditionToUpdate;
      return { ...prev, segmentConditions: updatedConditions };
    });
  };

  const handleAddSegmentConditionToDialog = () => {
    setDefinitionEntryFormState(prev => ({
      ...prev,
      segmentConditions: [
        ...prev.segmentConditions,
        { id: crypto.randomUUID(), segmentId: '', ...initialSegmentConditionFormState }
      ]
    }));
  };
  
  const handleRemoveSegmentConditionFromDialog = (conditionIdToRemove: string) => {
     setDefinitionEntryFormState(prev => ({
      ...prev,
      segmentConditions: prev.segmentConditions.filter(sc => sc.id !== conditionIdToRemove)
    }));
  };

  const handleSaveDefinitionEntry = () => {
    const { id, description, behavior, segmentConditions: formConditions } = definitionEntryFormState;

    if (formConditions.length === 0) {
      alert("Please define at least one segment condition for this definition entry.");
      return;
    }

    const finalSegmentConditions: SegmentCondition[] = [];
    for (const formCond of formConditions) {
      if (!formCond.segmentId) {
        alert("Please select a segment for all conditions.");
        return;
      }
      if (!formCond.criterionType) {
        alert(`Please select a criterion type for segment: ${getSegmentById(formCond.segmentId)?.displayName}.`);
        return;
      }

      let criterion: CombinationRuleCriterion | null = null;
      switch (formCond.criterionType) {
        case 'CODE':
          if (!formCond.codeValue) {
            alert(`Code Value is required for segment: ${getSegmentById(formCond.segmentId)?.displayName}.`);
            return;
          }
          criterion = { type: 'CODE', codeValue: formCond.codeValue };
          break;
        case 'RANGE':
          if (!formCond.rangeStartValue || !formCond.rangeEndValue) {
            alert(`Start and End Code Values are required for segment: ${getSegmentById(formCond.segmentId)?.displayName}.`);
            return;
          }
          criterion = { type: 'RANGE', rangeStartValue: formCond.rangeStartValue, rangeEndValue: formCond.rangeEndValue };
          break;
        case 'HIERARCHY_NODE':
          if (!formCond.hierarchyNodeId) {
            alert(`Hierarchy Node ID is required for segment: ${getSegmentById(formCond.segmentId)?.displayName}.`);
            return;
          }
          criterion = { type: 'HIERARCHY_NODE', hierarchyNodeId: formCond.hierarchyNodeId, includeChildren: formCond.includeChildren };
          break;
        default:
          alert(`Invalid criterion type for segment: ${getSegmentById(formCond.segmentId)?.displayName}.`);
          return;
      }
      finalSegmentConditions.push({ id: formCond.id, segmentId: formCond.segmentId, criterion });
    }
    
    const newOrUpdatedEntry: CombinationRuleDefinitionEntry = {
      id: currentEditingDefinitionEntryId || id || crypto.randomUUID(),
      description,
      behavior,
      segmentConditions: finalSegmentConditions,
    };

    if (currentEditingDefinitionEntryId) {
      setDefinitionEntries(prev => prev.map(entry => entry.id === currentEditingDefinitionEntryId ? newOrUpdatedEntry : entry));
    } else {
      setDefinitionEntries(prev => [...prev, newOrUpdatedEntry]);
    }
    setIsDefinitionEntryDialogOpen(false);
    setCurrentEditingDefinitionEntryId(null);
  };

  const handleRemoveDefinitionEntry = (entryId: string) => {
    if (window.confirm("Are you sure you want to delete this definition entry?")) {
        setDefinitionEntries(prev => prev.filter(entry => entry.id !== entryId));
    }
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
    <div className="w-full max-w-5xl mx-auto">
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
              <CardDesc>Define the name, status, and overall description for this rule.</CardDesc>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rule Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Fund/Object/Dept Core Spending" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
              <CardTitle>Define Combination Scenarios</CardTitle>
              <CardDesc>
                Specify sets of segment conditions and their behavior (Include/Exclude).
                Each scenario defines a multi-segment condition.
              </CardDesc>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Button type="button" variant="outline" onClick={() => handleOpenDefinitionEntryDialog()}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Definition Entry
                </Button>
              </div>
              <ScrollArea className="h-auto max-h-96 border rounded-md p-4">
                {definitionEntries.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No definition entries created yet. Click "Add Definition Entry" to start.
                  </p>
                )}
                <div className="space-y-3">
                {definitionEntries.map(entry => (
                  <Card key={entry.id} className="p-3 shadow-sm">
                    <div className="flex items-start justify-between mb-2">
                        <div>
                            {entry.description && <p className="text-md font-semibold text-primary">{entry.description}</p>}
                            <p className={`text-sm font-semibold ${entry.behavior === 'Include' ? 'text-green-600' : 'text-red-600'}`}>
                                Behavior: {entry.behavior.toUpperCase()}
                            </p>
                        </div>
                        <div className="flex space-x-1">
                             <Button 
                                type="button" 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleOpenDefinitionEntryDialog(entry.id)}
                            >
                              Edit
                            </Button>
                            <Button 
                                type="button" 
                                variant="destructive" 
                                size="sm" 
                                onClick={() => handleRemoveDefinitionEntry(entry.id)}
                            >
                              Delete
                            </Button>
                        </div>
                    </div>
                    <div className="space-y-1 pl-2 border-l-2 border-muted">
                      {entry.segmentConditions.map((sc, index) => (
                         <p key={sc.id} className="text-xs text-muted-foreground">
                           {index > 0 && <span className="font-semibold">AND </span>}
                           {renderCriterionDisplay(sc.criterion, getSegmentById(sc.segmentId)?.displayName)}
                         </p>
                      ))}
                    </div>
                  </Card>
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

      <Dialog open={isDefinitionEntryDialogOpen} onOpenChange={setIsDefinitionEntryDialogOpen}>
        <DialogContent className="sm:max-w-2xl md:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{currentEditingDefinitionEntryId ? 'Edit Definition Entry' : 'Add New Definition Entry'}</DialogTitle>
            <DialogDescription>
              Define a specific combination scenario, its behavior, and the conditions for relevant segments.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[65vh]">
            <div className="space-y-6 p-4">
               <div>
                <Label htmlFor="entryDescription">Entry Description (Optional)</Label>
                <Input 
                  id="entryDescription" 
                  value={definitionEntryFormState.description} 
                  onChange={(e) => handleDefinitionEntryDialogChange('description', e.target.value)}
                  placeholder="e.g., Allow Fund X with specific Object and Department"
                />
              </div>
              <div>
                <Label htmlFor="entryBehavior">Behavior Type *</Label>
                <Select
                  value={definitionEntryFormState.behavior}
                  onValueChange={(value) => handleDefinitionEntryDialogChange('behavior', value as 'Include' | 'Exclude')}
                >
                  <SelectTrigger id="entryBehavior">
                    <SelectValue placeholder="Select behavior" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Include">Include (Allow this combination scenario)</SelectItem>
                    <SelectItem value="Exclude">Exclude (Disallow this combination scenario)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Segment Conditions</CardTitle>
                  <CardDesc>Define conditions for one or more segments. All conditions must be met (AND logic) for this entry to apply.</CardDesc>
                </CardHeader>
                <CardContent className="space-y-4">
                  {definitionEntryFormState.segmentConditions.map((condition, index) => (
                    <Card key={condition.id} className="p-4 space-y-3 bg-muted/30 relative">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute top-2 right-2 h-6 w-6 text-destructive hover:text-destructive/80"
                        onClick={() => handleRemoveSegmentConditionFromDialog(condition.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor={`segmentId-${condition.id}`}>Segment *</Label>
                            <Select 
                              value={condition.segmentId}
                              onValueChange={(value) => handleSegmentConditionChange(index, 'segmentId', value)}
                            >
                              <SelectTrigger id={`segmentId-${condition.id}`}><SelectValue placeholder="Select Segment" /></SelectTrigger>
                              <SelectContent>
                                {availableSegments.filter(s => 
                                    !definitionEntryFormState.segmentConditions.some(sc => sc.segmentId === s.id && sc.id !== condition.id) || condition.segmentId === s.id
                                ).map(seg => (
                                  <SelectItem key={seg.id} value={seg.id}>{seg.displayName}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor={`criterionType-${condition.id}`}>Criterion Type *</Label>
                            <Select 
                              value={condition.criterionType}
                              onValueChange={(value) => handleSegmentConditionChange(index, 'criterionType', value as CombinationRuleCriterionType)}
                            >
                              <SelectTrigger id={`criterionType-${condition.id}`}><SelectValue placeholder="Select Type" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="CODE">Specific Code</SelectItem>
                                <SelectItem value="RANGE">Range of Codes</SelectItem>
                                <SelectItem value="HIERARCHY_NODE">Hierarchy Node</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                       </div>
                        
                        {condition.criterionType === 'CODE' && (
                          <div>
                            <Label htmlFor={`codeValue-${condition.id}`}>Code Value *</Label>
                            <Input 
                              id={`codeValue-${condition.id}`}
                              value={condition.codeValue}
                              onChange={(e) => handleSegmentConditionChange(index, 'codeValue', e.target.value)} 
                            />
                          </div>
                        )}
                        {condition.criterionType === 'RANGE' && (
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label htmlFor={`rangeStart-${condition.id}`}>Start Code *</Label>
                              <Input 
                                id={`rangeStart-${condition.id}`}
                                value={condition.rangeStartValue}
                                onChange={(e) => handleSegmentConditionChange(index, 'rangeStartValue', e.target.value)} 
                              />
                            </div>
                            <div>
                              <Label htmlFor={`rangeEnd-${condition.id}`}>End Code *</Label>
                              <Input 
                                id={`rangeEnd-${condition.id}`}
                                value={condition.rangeEndValue}
                                onChange={(e) => handleSegmentConditionChange(index, 'rangeEndValue', e.target.value)} 
                              />
                            </div>
                          </div>
                        )}
                        {condition.criterionType === 'HIERARCHY_NODE' && (
                          <div className="space-y-2">
                            <div>
                              <Label htmlFor={`hierarchyNodeId-${condition.id}`}>Hierarchy Node ID *</Label>
                              <Input 
                                id={`hierarchyNodeId-${condition.id}`}
                                value={condition.hierarchyNodeId}
                                onChange={(e) => handleSegmentConditionChange(index, 'hierarchyNodeId', e.target.value)}
                                placeholder="Enter ID of hierarchy node"
                              />
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id={`includeChildren-${condition.id}`}
                                checked={condition.includeChildren}
                                onCheckedChange={(checked) => handleSegmentConditionChange(index, 'includeChildren', !!checked)}
                              />
                              <Label htmlFor={`includeChildren-${condition.id}`} className="text-sm font-normal">Include Children Nodes</Label>
                            </div>
                          </div>
                        )}
                    </Card>
                  ))}
                  <Button type="button" variant="outline" onClick={handleAddSegmentConditionToDialog} className="mt-2">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Segment Condition
                  </Button>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="button" onClick={handleSaveDefinitionEntry}>
              {currentEditingDefinitionEntryId ? 'Update Entry' : 'Save Entry'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
