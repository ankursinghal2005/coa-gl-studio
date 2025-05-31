
'use client';

import React from 'react';
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
import { PlusCircle, Eye, Edit2, Trash2, MoreHorizontal } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCombinationRules } from '@/contexts/CombinationRulesContext';
import { useSegments } from '@/contexts/SegmentsContext'; // To get segment names

export default function CombinationRulesPage() {
  const router = useRouter();
  const { combinationRules } = useCombinationRules();
  const { getSegmentById } = useSegments();

  const handleCreateRule = () => {
    router.push('/configure/combination-rules/build');
  };

  const handleViewRule = (ruleId: string) => {
    // For now, viewing will be same as editing
    router.push(`/configure/combination-rules/build?ruleId=${ruleId}`);
  };

  const handleEditRule = (ruleId: string) => {
    router.push(`/configure/combination-rules/build?ruleId=${ruleId}`);
  };

  const handleDeleteRule = (ruleId: string) => {
    console.log('Delete Combination Rule ID:', ruleId);
    alert('Combination rule deletion logic not yet implemented.');
    // Future: call a deleteCombinationRule function from context
  };

  const breadcrumbItems = [
    { label: 'COA Configuration', href: '/' },
    { label: 'Combination Rules' },
  ];

  return (
    <div className="flex flex-col min-h-screen p-4 sm:p-6 lg:p-8 bg-background">
      <Breadcrumbs items={breadcrumbItems} />
      <header className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary">
            Manage Combination Rules
          </h1>
          <p className="text-md text-muted-foreground mt-1">
            Define and manage rules for valid segment code combinations.
          </p>
        </div>
        <Button onClick={handleCreateRule}>
          <PlusCircle className="mr-2 h-5 w-5" />
          Create Rule
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Configured Combination Rules</CardTitle>
        </CardHeader>
        <CardContent>
          {combinationRules.length > 0 ? (
            <ScrollArea className="w-full whitespace-nowrap">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Rule Name</TableHead>
                    <TableHead className="min-w-[150px]">Segment A</TableHead>
                    <TableHead className="min-w-[150px]">Segment B</TableHead>
                    <TableHead className="min-w-[100px]">Status</TableHead>
                    <TableHead className="min-w-[150px]">Last Modified</TableHead>
                    <TableHead className="text-center w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {combinationRules.map(rule => {
                    const segmentA = getSegmentById(rule.segmentAId);
                    const segmentB = getSegmentById(rule.segmentBId);
                    return (
                      <TableRow key={rule.id}>
                        <TableCell className="font-medium">
                           <Link
                            href={`/configure/combination-rules/build?ruleId=${rule.id}`}
                            className="text-primary hover:underline"
                          >
                            {rule.name}
                          </Link>
                        </TableCell>
                        <TableCell>{segmentA?.displayName || 'N/A'}</TableCell>
                        <TableCell>{segmentB?.displayName || 'N/A'}</TableCell>
                        <TableCell>{rule.status}</TableCell>
                        <TableCell>
                          {rule.lastModifiedDate
                            ? new Date(rule.lastModifiedDate).toLocaleDateString()
                            : 'N/A'}
                          {' by '}{rule.lastModifiedBy || 'N/A'}
                        </TableCell>
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
                                onClick={() => handleDeleteRule(rule.id)}
                                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No combination rules defined yet. Click "+ Create Rule" to get started.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
