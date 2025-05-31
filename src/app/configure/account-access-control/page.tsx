
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PlusCircle, Eye, Edit2, Trash2, MoreHorizontal, ShieldQuestion } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useAccountAccessControl } from '@/contexts/AccountAccessControlContext';
import type { AccessControlRule } from '@/lib/account-access-control-types';

export default function AccountAccessControlPage() {
  const router = useRouter();
  const { rules, deleteRule } = useAccountAccessControl();
  const [overallDefaultBehavior, setOverallDefaultBehavior] = useState<'Full Access' | 'No Access'>('No Access');

  const handleCreateRule = () => {
    router.push('/configure/account-access-control/build');
  };

  const handleViewRule = (ruleId: string) => {
    router.push(`/configure/account-access-control/build?ruleId=${ruleId}`);
  };

  const handleEditRule = (ruleId: string) => {
    router.push(`/configure/account-access-control/build?ruleId=${ruleId}`);
  };

  const handleDeleteRule = (ruleId: string, ruleName: string) => {
    if (window.confirm(`Are you sure you want to delete the rule "${ruleName}"?`)) {
      deleteRule(ruleId);
      alert(`Rule "${ruleName}" deleted successfully.`);
    }
  };

  const breadcrumbItems = [
    { label: 'COA Configuration', href: '/' },
    { label: 'Account Access Control' },
  ];

  return (
    <div className="flex flex-col min-h-screen p-4 sm:p-6 lg:p-8 bg-background">
      <Breadcrumbs items={breadcrumbItems} />
      <header className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary">
            Manage Account Access Control
          </h1>
          <p className="text-md text-muted-foreground mt-1">
            Define user or role-based access to segment codes and combinations.
          </p>
        </div>
        <Button onClick={handleCreateRule}>
          <PlusCircle className="mr-2 h-5 w-5" />
          Create Rule
        </Button>
      </header>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <ShieldQuestion className="mr-2 h-6 w-6 text-primary" />
            Overall Default Access Behavior
          </CardTitle>
          <CardDescription>
            Select the default access level for users or roles NOT covered by any specific rule below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={overallDefaultBehavior}
            onValueChange={(value: 'Full Access' | 'No Access') => setOverallDefaultBehavior(value)}
            className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-6"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Full Access" id="overall-full-access" />
              <Label htmlFor="overall-full-access">Full Access</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="No Access" id="overall-no-access" />
              <Label htmlFor="overall-no-access">No Access (Recommended)</Label>
            </div>
          </RadioGroup>
          <p className="text-xs text-muted-foreground mt-3">
            This global setting applies if a user/role doesn't match any configured access rules.
            'No Access' provides a more secure default posture.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configured Access Control Rules</CardTitle>
        </CardHeader>
        <CardContent>
          {rules.length > 0 ? (
            <ScrollArea className="w-full whitespace-nowrap">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Rule Name</TableHead>
                    <TableHead className="min-w-[100px]">Applies To</TableHead>
                    <TableHead className="min-w-[150px]">User/Role</TableHead>
                    <TableHead className="min-w-[100px]">Status</TableHead>
                    <TableHead className="min-w-[150px]">Rule Default</TableHead>
                    <TableHead className="text-center w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map(rule => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/configure/account-access-control/build?ruleId=${rule.id}`}
                          className="text-primary hover:underline"
                        >
                          {rule.name}
                        </Link>
                      </TableCell>
                      <TableCell>{rule.appliesToType}</TableCell>
                      <TableCell>{rule.appliesToName} ({rule.appliesToId})</TableCell>
                      <TableCell>{rule.status}</TableCell>
                      <TableCell>{rule.defaultBehaviorForRule}</TableCell>
                      <TableCell className="text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewRule(rule.id)}>
                              <Eye className="mr-2 h-4 w-4" /> View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditRule(rule.id)}>
                              <Edit2 className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteRule(rule.id, rule.name)}
                              className="text-destructive focus:text-destructive focus:bg-destructive/10"
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No account access control rules defined yet. Click "+ Create Rule" to get started.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
