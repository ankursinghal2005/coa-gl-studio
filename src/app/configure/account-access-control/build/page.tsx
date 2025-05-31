
'use client';

import React, { useEffect, useState } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { PlusCircle } from 'lucide-react'; // For future use
import { useAccountAccessControl } from '@/contexts/AccountAccessControlContext';
import type { AccessControlRule, AccessControlAppliesToType, AccessControlRuleStatus, AccessControlDefaultBehavior } from '@/lib/account-access-control-types';

const accessControlRuleFormSchema = z.object({
  name: z.string().min(1, { message: 'Rule Name is required.' }),
  description: z.string().optional(),
  status: z.enum(['Active', 'Inactive'] as [AccessControlRuleStatus, ...AccessControlRuleStatus[]], { // Ensure enum values match type
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

export default function AccountAccessControlBuildPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addRule, updateRule, getRuleById } = useAccountAccessControl();

  const ruleIdQueryParam = searchParams.get('ruleId');
  const [currentRuleId, setCurrentRuleId] = useState<string | null>(ruleIdQueryParam);
  const [isEditMode, setIsEditMode] = useState<boolean>(!!ruleIdQueryParam);
  
  // Placeholder for restrictions - will be developed in a future step
  // const [restrictions, setRestrictions] = useState<AccessControlRestriction[]>([]);

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
        // setRestrictions(existingRule.restrictions || []); // For future use
        setCurrentRuleId(existingRule.id);
        setIsEditMode(true);
      } else {
        alert("Access Control Rule not found. Starting new rule.");
        router.replace('/configure/account-access-control/build');
        setIsEditMode(false);
        setCurrentRuleId(null);
        form.reset();
        // setRestrictions([]); // For future use
      }
    } else {
        setIsEditMode(false);
        setCurrentRuleId(null);
        form.reset();
        // setRestrictions([]); // For future use
    }
  }, [ruleIdQueryParam, getRuleById, form, router]);

  const onSubmit = (values: AccessControlRuleFormValues) => {
    // if (restrictions.length === 0 && values.defaultBehaviorForRule === 'No Access') {
    //     alert("Warning: This rule is set to 'No Access' by default and has no specific access restrictions defined. This might lead to unintended broad denials.");
    // }
    const ruleData = {
      ...values,
      restrictions: [], // Placeholder for now
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

  return (
    <div className="flex flex-col min-h-screen p-4 sm:p-6 lg:p-8 bg-background">
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
              <CardDescription>Define the core attributes of this access control rule.</CardDescription>
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
                      <FormDescription>Enter the system identifier for the user or role.</FormDescription>
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
                       <FormDescription>Enter a user-friendly name for display purposes.</FormDescription>
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
                        This determines access if the user/role matches this rule, but no specific restrictions below are met.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Define Access Restrictions</CardTitle>
              <CardDescription>
                Specify segment codes, combinations, and their access levels (Read-Only, Editable, No Access).
                This section will be developed further.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Button type="button" variant="outline" disabled> {/* Disabled for now */}
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Restriction Entry
                </Button>
              </div>
              <div className="border rounded-md p-8 text-center text-muted-foreground bg-muted/30">
                <p>Restriction definition UI coming soon.</p>
                <p className="text-sm">
                  (This is where you'll define specific segment criteria and access types like Read-Only, Editable, or No Access for different code combinations).
                </p>
              </div>
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
