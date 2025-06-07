
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription as CardDesc } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlusCircle, Trash2 } from 'lucide-react';
import { useAccountAccessControl } from '@/contexts/AccountAccessControlContext';
import { useSegments } from '@/contexts/SegmentsContext';
import type { Segment } from '@/lib/segment-types';
import type { AccessControlRule, AccessControlAppliesToType, AccessControlRuleStatus, AccessControlDefaultBehavior, AccessControlRestriction, SegmentCriterion, AccessControlCriterionType, AccessControlAccessType } from '@/lib/account-access-control-types';
import { Checkbox } from '@/components/ui/checkbox';


const accessControlRuleFormSchema = z.object({
  name: z.string().min(1, { message: 'Rule Name is required.' }),
  description: z.string().optional(),
  status: z.enum(['Active', 'Inactive'] as [AccessControlRuleStatus, ...AccessControlRuleStatus[]], { 
    required_error: 'Status is required.',
  }),
  appliesToType: z.enum(['User', 'Role'] as [AccessControlAppliesToType, ...AccessControlAppliesToType[]],{
    required_error: '"Applies To Type" is required.',
  }),
  appliesToId: z.string().min(1, { message: '"Applies To ID/Name" is required.' }),
  appliesToName: z.string().min(1, { message: '"Applies To Display Name" is required.' }),
  defaultBehaviorForRule: z.enum(['Full Access', 'No Access'] as [AccessControlDefaultBehavior, ...AccessControlDefaultBehavior[]], {
    required_error: '"Default Behavior for Rule" is required.',
  }),
});

type AccessControlRuleFormValues = z.infer<typeof accessControlRuleFormSchema>;

const initialRestrictionDialogState = {
  id: '', 
  description: '',
  accessType: 'Read-Only' as AccessControlAccessType,
  segmentCriteria: [] as SegmentCriterion[],
};

export default function AccountAccessControlBuildPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addRule, updateRule, getRuleById } = useAccountAccessControl();
  const { segments: availableSegments, getSegmentById } = useSegments();

  const ruleIdQueryParam = searchParams.get('ruleId');
  const [currentRuleId, setCurrentRuleId] = useState<string | null>(ruleIdQueryParam);
  const [isEditMode, setIsEditMode] = useState<boolean>(!!ruleIdQueryParam);
  
  const [restrictions, setRestrictions] = useState<AccessControlRestriction[]>([]);
  const [isRestrictionDialogOpen, setIsRestrictionDialogOpen] = useState(false);
  const [restrictionDialogState, setRestrictionDialogState] = useState(initialRestrictionDialogState);
  const [editingRestrictionId, setEditingRestrictionId] = useState<string | null>(null);


  const form = useForm<AccessControlRuleFormValues>({
    resolver: zodResolver(accessControlRuleFormSchema),
    defaultValues: {
      name: '',
      description: '',
      status: 'Active',
      appliesToType: 'User',
      appliesToId: '',
      appliesToName: '',
      defaultBehaviorForRule: 'No Access',
    },
  });

  useEffect(() => {
    if (ruleIdQueryParam) {
      const existingRule = getRuleById(ruleIdQueryParam);
      if (existingRule) {
        form.reset({
          name: existingRule.name,
          description: existingRule.description || '',
          status: existingRule.status,
          appliesToType: existingRule.appliesToType,
          appliesToId: existingRule.appliesToId,
          appliesToName: existingRule.appliesToName,
          defaultBehaviorForRule: existingRule.defaultBehaviorForRule,
        });
        setRestrictions(existingRule.restrictions || []);
        setCurrentRuleId(existingRule.id);
        setIsEditMode(true);
      } else {
        alert("Access Control Rule not found. Starting new rule.");
        router.replace('/configure/account-access-control/build');
        setIsEditMode(false);
        setCurrentRuleId(null);
        form.reset();
        setRestrictions([]);
      }
    } else {
        setIsEditMode(false);
        setCurrentRuleId(null);
        form.reset();
        setRestrictions([]);
    }
  }, [ruleIdQueryParam, getRuleById, form, router]);

  const onSubmit = (values: AccessControlRuleFormValues) => {
    if (restrictions.length === 0 && values.defaultBehaviorForRule === 'No Access') {
        alert("Warning: This rule is set to 'No Access' by default and has no specific access restrictions defined to grant permissions. This might lead to unintended broad denials for the targeted user/role if this rule is the only one that applies to them.");
    }
     if (restrictions.length === 0 && values.defaultBehaviorForRule === 'Full Access') {
        alert("Warning: This rule is set to 'Full Access' by default and has no specific access restrictions defined to limit permissions. This might lead to unintended broad access for the targeted user/role if this rule is the only one that applies to them.");
    }
    const ruleData = {
      ...values,
      restrictions: restrictions,
      lastModifiedDate: new Date(),
      lastModifiedBy: "Current User", 
    };

    if (isEditMode && currentRuleId) {
      updateRule({ ...ruleData, id: currentRuleId });
      alert(`Access Control Rule "${values.name}" updated successfully!`);
    } else {
      const newId = crypto.randomUUID();
      addRule({ ...ruleData, id: newId });
      alert(`Access Control Rule "${values.name}" saved successfully!`);
    }
    router.push('/configure/account-access-control');
  };

  const handleCancel = () => {
    router.push('/configure/account-access-control');
  };

  const breadcrumbItems = [
    { label: 'COA Configuration', href: '/' },
    { label: 'Account Access Control', href: '/configure/account-access-control' },
    { label: isEditMode ? 'Edit Rule' : 'Create Rule' },
  ];

  const handleOpenRestrictionDialog = (restrictionId?: string) => {
    if (restrictionId) {
      const restrictionToEdit = restrictions.find(r => r.id === restrictionId);
      if (restrictionToEdit) {
        setRestrictionDialogState({
          id: restrictionToEdit.id,
          description: restrictionToEdit.description || '',
          accessType: restrictionToEdit.accessType,
          segmentCriteria: restrictionToEdit.segmentCriteria.map(sc => ({...sc})), 
        });
        setEditingRestrictionId(restrictionId);
      } else {
        setRestrictionDialogState(initialRestrictionDialogState);
        setEditingRestrictionId(null);
      }
    } else {
      setRestrictionDialogState(initialRestrictionDialogState);
      setEditingRestrictionId(null);
    }
    setIsRestrictionDialogOpen(true);
  };

  const handleDialogFieldChange = (field: keyof typeof initialRestrictionDialogState, value: any) => {
    setRestrictionDialogState(prev => ({ ...prev, [field]: value }));
  };

  const handleDialogSegmentCriterionChange = (criterionIndex: number, field: keyof SegmentCriterion, value: any) => {
    setRestrictionDialogState(prev => {
      const updatedCriteria = [...prev.segmentCriteria];
      const criterionToUpdate = { ...updatedCriteria[criterionIndex] };
      (criterionToUpdate as any)[field] = value;
      
      if (field === 'criterionType') {
        criterionToUpdate.codeValue = '';
        criterionToUpdate.rangeStartValue = '';
        criterionToUpdate.rangeEndValue = '';
        criterionToUpdate.hierarchyNodeId = '';
        criterionToUpdate.includeChildren = false;
      }
      
      updatedCriteria[criterionIndex] = criterionToUpdate;
      return { ...prev, segmentCriteria: updatedCriteria };
    });
  };

  const handleAddSegmentCriterionToDialog = () => {
    setRestrictionDialogState(prev => ({
      ...prev,
      segmentCriteria: [...prev.segmentCriteria, { id: crypto.randomUUID(), segmentId: '', criterionType: 'SpecificCode' }]
    }));
  };

  const handleRemoveSegmentCriterionFromDialog = (criterionIdToRemove: string) => {
    setRestrictionDialogState(prev => ({
      ...prev,
      segmentCriteria: prev.segmentCriteria.filter(sc => sc.id !== criterionIdToRemove)
    }));
  };
  
  const handleSaveRestriction = () => {
    const { id, description, accessType, segmentCriteria } = restrictionDialogState;

    if (segmentCriteria.length === 0) {
      alert("Please define at least one segment condition for this restriction.");
      return;
    }

    for (const crit of segmentCriteria) {
        if (!crit.segmentId) {
            alert("Please select a segment for all conditions.");
            return;
        }
        if (crit.criterionType === 'SpecificCode' && !crit.codeValue) {
            alert(`Please enter a Code Value for the condition related to segment: ${getSegmentById(crit.segmentId)?.displayName || crit.segmentId}.`);
            return;
        }
        if (crit.criterionType === 'CodeRange' && (!crit.rangeStartValue || !crit.rangeEndValue)) {
            alert(`Please enter both Start and End Code Values for the range condition related to segment: ${getSegmentById(crit.segmentId)?.displayName || crit.segmentId}.`);
            return;
        }
        if (crit.criterionType === 'HierarchyNode' && !crit.hierarchyNodeId) {
            alert(`Please enter a Hierarchy Node ID for the condition related to segment: ${getSegmentById(crit.segmentId)?.displayName || crit.segmentId}.`);
            return;
        }
    }


    const newOrUpdatedRestriction: AccessControlRestriction = {
      id: editingRestrictionId || id || crypto.randomUUID(),
      description,
      accessType,
      segmentCriteria,
    };

    if (editingRestrictionId) {
      setRestrictions(prev => prev.map(r => r.id === editingRestrictionId ? newOrUpdatedRestriction : r));
    } else {
      setRestrictions(prev => [...prev, newOrUpdatedRestriction]);
    }
    setIsRestrictionDialogOpen(false);
    setEditingRestrictionId(null);
  };

  const handleRemoveRestriction = (restrictionId: string) => {
    if (window.confirm("Are you sure you want to delete this restriction entry?")) {
      setRestrictions(prev => prev.filter(r => r.id !== restrictionId));
    }
  };

  const renderSegmentCriterionDisplay = (criterion: SegmentCriterion): string => {
    const segment = getSegmentById(criterion.segmentId);
    const segmentName = segment ? segment.displayName : 'Unknown Segment';
    switch (criterion.criterionType) {
      case 'All':
        return `${segmentName}: All Codes`;
      case 'SpecificCode':
        return `${segmentName}: Code = ${criterion.codeValue}`;
      case 'CodeRange':
        return `${segmentName}: Range = ${criterion.rangeStartValue} to ${criterion.rangeEndValue}`;
      case 'HierarchyNode':
        return `${segmentName}: Node = ${criterion.hierarchyNodeId}${criterion.includeChildren ? ' (and children)' : ''}`;
      default:
        return `${segmentName}: Invalid Criterion`;
    }
  };

  return (
    // Removed p-4/sm:p-6/lg:p-8, min-h-screen, bg-background. Added w-full, max-w-5xl, mx-auto.
    <div className="w-full max-w-5xl mx-auto">
      <Breadcrumbs items={breadcrumbItems} />
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-primary">
          {isEditMode ? 'Edit Access Control Rule' : 'Create New Access Control Rule'}
        </h1>
      </header>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Rule Definition</CardTitle>
              <CardDesc>Define the core attributes of this access control rule, who it applies to, and its general access level.</CardDesc>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rule Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Finance Read-Only for Fund X" {...field} />
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
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Optional: Describe the purpose of this rule"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
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
                  name="appliesToType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Applies To Type *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="User">User</SelectItem>
                          <SelectItem value="Role">Role</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="appliesToId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Applies To ID / System Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., user_id_001 or FINANCE_ROLE" {...field} />
                      </FormControl>
                      <FormDescription>Enter the system identifier for the user or role (e.g., user ID, role name, department ID, designation code).</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="appliesToName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Applies To Display Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., John Doe or Finance Department" {...field} />
                      </FormControl>
                       <FormDescription>Enter a user-friendly name for display purposes (e.g., John Doe, Finance Department, Senior Accountant).</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
               <FormField
                  control={form.control}
                  name="defaultBehaviorForRule"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Behavior for this Rule *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select default behavior" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Full Access">Full Access (Allow if no restrictions match)</SelectItem>
                          <SelectItem value="No Access">No Access (Deny if no restrictions match)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        This sets the baseline access for this rule. If the user/role matches this rule but *none* of the specific restrictions below are met, this behavior applies.
                        Choose 'No Access' if you intend for this rule to primarily grant specific permissions through the restrictions.
                        Choose 'Full Access' if you intend for this rule to primarily limit or deny access through the restrictions.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Define Specific Access Permissions / Denials</CardTitle>
              <CardDesc>
                Specify segment code conditions and their access levels (Read-Only, Editable, No Access). These specific restrictions will override the 'Default Behavior for this Rule' when their conditions are met.
              </CardDesc>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Button type="button" variant="outline" onClick={() => handleOpenRestrictionDialog()}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Restriction Entry
                </Button>
              </div>
              {restrictions.length === 0 ? (
                <div className="border rounded-md p-8 text-center text-muted-foreground bg-muted/30">
                  <p>No specific access restrictions defined for this rule yet.</p>
                  <p className="text-sm">
                    Click "Add Restriction Entry" to define specific segment criteria and their access types.
                  </p>
                </div>
              ) : (
                <ScrollArea className="max-h-96 border rounded-md p-2">
                  <div className="space-y-3">
                    {restrictions.map((restriction) => (
                      <Card key={restriction.id} className="p-4 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            {restriction.description && <p className="text-sm font-semibold text-primary">{restriction.description}</p>}
                            <p className={`text-sm font-medium ${
                                restriction.accessType === 'Editable' ? 'text-green-600' :
                                restriction.accessType === 'Read-Only' ? 'text-blue-600' : 'text-red-600'
                              }`}>
                              Access Type: {restriction.accessType}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleOpenRestrictionDialog(restriction.id)}>Edit</Button>
                            <Button variant="destructive" size="sm" onClick={() => handleRemoveRestriction(restriction.id)}>Delete</Button>
                          </div>
                        </div>
                        <div className="space-y-1 pl-2 border-l-2 border-muted">
                          {restriction.segmentCriteria.map((criterion, index) => (
                            <p key={criterion.id} className="text-xs text-muted-foreground">
                              {index > 0 && <span className="font-semibold">AND </span>}
                              {renderSegmentCriterionDisplay(criterion)}
                            </p>
                          ))}
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
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

      <Dialog open={isRestrictionDialogOpen} onOpenChange={setIsRestrictionDialogOpen}>
        <DialogContent className="sm:max-w-2xl md:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingRestrictionId ? 'Edit Restriction Entry' : 'Add New Restriction Entry'}</DialogTitle>
            <DialogDescription>
              Define the segment conditions for this specific access restriction and the type of access it grants/denies.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[65vh]">
            <div className="space-y-6 p-4">
              <div className="space-y-2">
                <Label htmlFor="restrictionDescription">Restriction Description (Optional)</Label>
                <Input 
                  id="restrictionDescription" 
                  value={restrictionDialogState.description} 
                  onChange={(e) => handleDialogFieldChange('description', e.target.value)}
                  placeholder="e.g., Access to operational expenses for Fund 101"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="restrictionAccessType">Access Type for this Restriction *</Label>
                <Select 
                  value={restrictionDialogState.accessType} 
                  onValueChange={(value) => handleDialogFieldChange('accessType', value as AccessControlAccessType)}
                >
                  <SelectTrigger id="restrictionAccessType">
                    <SelectValue placeholder="Select access type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Editable">Editable</SelectItem>
                    <SelectItem value="Read-Only">Read-Only</SelectItem>
                    <SelectItem value="No Access">No Access</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Segment Conditions</CardTitle>
                  <CardDesc>Define one or more segment conditions. All conditions must be met (AND logic) for this restriction to apply.</CardDesc>
                </CardHeader>
                <CardContent className="space-y-4">
                  {restrictionDialogState.segmentCriteria.map((criterion, index) => (
                    <Card key={criterion.id} className="p-4 space-y-3 bg-muted/30 relative">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute top-2 right-2 h-6 w-6 text-destructive hover:text-destructive/80"
                        onClick={() => handleRemoveSegmentCriterionFromDialog(criterion.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor={`segmentId-${criterion.id}`}>Segment *</Label>
                            <Select 
                              value={criterion.segmentId}
                              onValueChange={(value) => handleDialogSegmentCriterionChange(index, 'segmentId', value)}
                            >
                              <SelectTrigger id={`segmentId-${criterion.id}`}><SelectValue placeholder="Select Segment" /></SelectTrigger>
                              <SelectContent>
                                {availableSegments.map(seg => (
                                  <SelectItem key={seg.id} value={seg.id}>{seg.displayName}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor={`criterionType-${criterion.id}`}>Criterion Type *</Label>
                            <Select 
                              value={criterion.criterionType}
                              onValueChange={(value) => handleDialogSegmentCriterionChange(index, 'criterionType', value as AccessControlCriterionType)}
                            >
                              <SelectTrigger id={`criterionType-${criterion.id}`}><SelectValue placeholder="Select Type" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="All">All Codes</SelectItem>
                                <SelectItem value="SpecificCode">Specific Code</SelectItem>
                                <SelectItem value="CodeRange">Code Range</SelectItem>
                                <SelectItem value="HierarchyNode">Hierarchy Node</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                       </div>
                        
                        {criterion.criterionType === 'SpecificCode' && (
                          <div>
                            <Label htmlFor={`codeValue-${criterion.id}`}>Code Value *</Label>
                            <Input 
                              id={`codeValue-${criterion.id}`}
                              value={criterion.codeValue || ''}
                              onChange={(e) => handleDialogSegmentCriterionChange(index, 'codeValue', e.target.value)} 
                            />
                          </div>
                        )}
                        {criterion.criterionType === 'CodeRange' && (
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label htmlFor={`rangeStart-${criterion.id}`}>Start Code *</Label>
                              <Input 
                                id={`rangeStart-${criterion.id}`}
                                value={criterion.rangeStartValue || ''}
                                onChange={(e) => handleDialogSegmentCriterionChange(index, 'rangeStartValue', e.target.value)} 
                              />
                            </div>
                            <div>
                              <Label htmlFor={`rangeEnd-${criterion.id}`}>End Code *</Label>
                              <Input 
                                id={`rangeEnd-${criterion.id}`}
                                value={criterion.rangeEndValue || ''}
                                onChange={(e) => handleDialogSegmentCriterionChange(index, 'rangeEndValue', e.target.value)} 
                              />
                            </div>
                          </div>
                        )}
                        {criterion.criterionType === 'HierarchyNode' && (
                          <div className="space-y-2">
                            <div>
                              <Label htmlFor={`hierarchyNodeId-${criterion.id}`}>Hierarchy Node ID *</Label>
                              <Input 
                                id={`hierarchyNodeId-${criterion.id}`}
                                value={criterion.hierarchyNodeId || ''}
                                onChange={(e) => handleDialogSegmentCriterionChange(index, 'hierarchyNodeId', e.target.value)}
                                placeholder="Enter ID of hierarchy node"
                              />
                               <FormDescription className="text-xs">Specify the ID of the node from a relevant hierarchy for this segment.</FormDescription>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id={`includeChildren-${criterion.id}`}
                                checked={criterion.includeChildren || false}
                                onCheckedChange={(checked) => handleDialogSegmentCriterionChange(index, 'includeChildren', !!checked)}
                              />
                              <Label htmlFor={`includeChildren-${criterion.id}`} className="text-sm font-normal">Include Children Nodes</Label>
                            </div>
                          </div>
                        )}
                    </Card>
                  ))}
                  <Button type="button" variant="outline" onClick={handleAddSegmentCriterionToDialog} className="mt-2">
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
            <Button type="button" onClick={handleSaveRestriction}>
              {editingRestrictionId ? 'Update Restriction' : 'Save Restriction'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
