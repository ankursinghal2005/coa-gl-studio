
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { DatePicker } from '@/components/ui/date-picker';
import { PlusCircle, Eye, Edit2, Trash2, MoreHorizontal, CalendarCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCombinationRules } from '@/contexts/CombinationRulesContext';
import { useSegments } from '@/contexts/SegmentsContext';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

export default function CombinationRulesPage() {
  const router = useRouter();
  const { combinationRules, deleteCombinationRule } = useCombinationRules(); // Assuming deleteCombinationRule is added to context
  const { getSegmentById } = useSegments();
  const [defaultUnmatchedBehavior, setDefaultUnmatchedBehavior] = useState<'Allowed' | 'Not Allowed'>('Not Allowed');

  const [isDateDialogOpen, setIsDateDialogOpen] = useState(false);
  const [selectedDateForView, setSelectedDateForView] = useState<Date | undefined>(new Date());

  const handleCreateRule = () => {
    router.push('/configure/combination-rules/build');
  };

  const handleViewRule = (ruleId: string) => {
    router.push(`/configure/combination-rules/build?ruleId=${ruleId}`);
  };

  const handleEditRule = (ruleId: string) => {
    router.push(`/configure/combination-rules/build?ruleId=${ruleId}`);
  };

  const handleDeleteRule = (ruleId: string, ruleName: string) => {
    if (window.confirm(`Are you sure you want to delete the combination rule "${ruleName}"?`)) {
      deleteCombinationRule(ruleId);
      alert(`Combination rule "${ruleName}" deleted.`);
    }
  };
  
  const handleOpenDateDialog = () => {
    setSelectedDateForView(new Date()); // Reset to current date
    setIsDateDialogOpen(true);
  };

  const handleViewValidCombinations = () => {
    if (!selectedDateForView) {
      alert("Please select a date.");
      return;
    }
    router.push(`/configure/combination-rules/view-valid-combinations?date=${selectedDateForView.toISOString()}`);
    setIsDateDialogOpen(false);
  };


  const breadcrumbItems = [
    { label: 'COA Configuration', href: '/' },
    { label: 'Combination Rules' },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto">
      <Breadcrumbs items={breadcrumbItems} />
      <header className="mb-6 flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary">
            Manage Combination Rules
          </h1>
          <p className="text-md text-muted-foreground mt-1">
            Define and manage rules for valid segment code combinations.
          </p>
        </div>
        <div className="flex gap-2">
            <Button onClick={handleOpenDateDialog} variant="outline">
                <CalendarCheck className="mr-2 h-5 w-5" />
                View Valid Combinations by Date
            </Button>
            <Button onClick={handleCreateRule}>
                <PlusCircle className="mr-2 h-5 w-5" />
                Create Rule
            </Button>
        </div>
      </header>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Default Behavior for Unmatched Combinations</CardTitle>
          <CardDescription>
            Select what happens to segment code combinations that are not explicitly covered by any rule.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={defaultUnmatchedBehavior}
            onValueChange={(value: 'Allowed' | 'Not Allowed') => setDefaultUnmatchedBehavior(value)}
            className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-6"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Allowed" id="unmatched-allowed" />
              <Label htmlFor="unmatched-allowed">Allowed</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Not Allowed" id="unmatched-not-allowed" />
              <Label htmlFor="unmatched-not-allowed">Not Allowed (Recommended)</Label>
            </div>
          </RadioGroup>
          <p className="text-xs text-muted-foreground mt-3">
            This setting determines if combinations are permitted or denied by default if no specific rule applies to them.
            Choosing 'Not Allowed' provides a more restrictive setup.
          </p>
        </CardContent>
      </Card>

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

      <Dialog open={isDateDialogOpen} onOpenChange={setIsDateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>View Valid Combinations</DialogTitle>
            <DialogDescription>
              Select a date to view combination rule entries that are effective on that day.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="combination-date">Effective Date</Label>
            <DatePicker 
              value={selectedDateForView}
              onValueChange={setSelectedDateForView}
              placeholder="Select a date"
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleViewValidCombinations}>View Combinations</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

    