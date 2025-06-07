
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Added useRouter

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MoreHorizontal, PlusCircle, Settings2, FileDown } from 'lucide-react';
import { FormattedDateTime } from '@/components/ui/FormattedDateTime';
import {
  initialJournalEntriesData,
  type JournalEntry,
  type JournalEntryStatus,
  type PostedStatusFilter,
  fiscalYears,
  jeSources,
  jeStatuses,
  allUserIds,
  workflowRules,
  approvalPendingWithOptions,
  additionalPeriods,
  postedOptions,
} from '@/lib/journal-entry-types';
import { cn } from '@/lib/utils';

const filterSchema = z.object({
  fiscalYear: z.string().optional(),
  jeNumber: z.string().optional(),
  jeDate: z.date().optional(),
  description: z.string().optional(),
  source: z.string().optional(),
  useridCreated: z.string().optional(),
  additionalPeriod: z.string().optional(),
  status: z.string().optional(),
  workflowRule: z.string().optional(),
  approvalPendingWith: z.string().optional(),
  posted: z.string().optional(),
});

type FilterFormValues = z.infer<typeof filterSchema>;

const statusMap: Record<JournalEntryStatus, { variant: "default" | "secondary" | "destructive" | "outline", className?: string }> = {
  Draft: { variant: 'outline', className: 'border-slate-400 text-slate-600' },
  Error: { variant: 'destructive' },
  'Pending Action': { variant: 'default', className: 'bg-yellow-500 hover:bg-yellow-500/90 text-white' },
  Rejected: { variant: 'destructive', className: 'bg-orange-600 hover:bg-orange-600/90 text-white' },
  Approved: { variant: 'default', className: 'bg-blue-600 hover:bg-blue-600/90 text-white' },
  Posted: { variant: 'default', className: 'bg-green-600 hover:bg-green-600/90 text-white' },
};


export default function JournalEntriesPage() {
  const router = useRouter(); // Initialized useRouter
  const [activeTab, setActiveTab] = useState<JournalEntryStatus | 'All'>('All');
  const [allEntries] = useState<JournalEntry[]>(initialJournalEntriesData);
  const [displayedEntries, setDisplayedEntries] = useState<JournalEntry[]>(allEntries);

  const memoizedDefaultValues = useMemo(() => ({
    fiscalYear: undefined,
    jeNumber: '',
    jeDate: undefined,
    description: '',
    source: 'All',
    useridCreated: 'All',
    additionalPeriod: 'All',
    status: 'All',
    workflowRule: 'All',
    approvalPendingWith: 'All',
    posted: 'Both',
  }), []);

  const form = useForm<FilterFormValues>({
    resolver: zodResolver(filterSchema),
    defaultValues: memoizedDefaultValues,
  });

  const { watch, reset, control } = form;

  const fiscalYear = watch('fiscalYear');
  const jeNumber = watch('jeNumber');
  const jeDate = watch('jeDate');
  const description = watch('description');
  const source = watch('source');
  const useridCreated = watch('useridCreated');
  const additionalPeriod = watch('additionalPeriod');
  const status = watch('status');
  const workflowRule = watch('workflowRule');
  const approvalPendingWith = watch('approvalPendingWith');
  const posted = watch('posted');


  useEffect(() => {
    let filtered = [...allEntries];

    if (activeTab !== 'All') {
      filtered = filtered.filter(entry => entry.status === activeTab);
    }

    if (fiscalYear && fiscalYear !== 'All') {
      filtered = filtered.filter(entry => entry.fiscalYear === fiscalYear);
    }
    if (jeNumber) {
      filtered = filtered.filter(entry => entry.jeNumber.includes(jeNumber));
    }
    if (jeDate) {
      const filterDateOnly = new Date(jeDate.getFullYear(), jeDate.getMonth(), jeDate.getDate());
      filtered = filtered.filter(entry => {
        const entryDateOnly = new Date(entry.jeDate.getFullYear(), entry.jeDate.getMonth(), entry.jeDate.getDate());
        return entryDateOnly.getTime() === filterDateOnly.getTime();
      });
    }
    if (description) {
      filtered = filtered.filter(entry => entry.description.toLowerCase().includes(description.toLowerCase()));
    }
    if (source && source !== 'All') {
      filtered = filtered.filter(entry => entry.source === source);
    }
    if (useridCreated && useridCreated !== 'All') {
      filtered = filtered.filter(entry => entry.useridCreated === useridCreated);
    }
    if (status && status !== 'All') {
      filtered = filtered.filter(entry => entry.status === status);
    }
    if (workflowRule && workflowRule !== 'All') {
      filtered = filtered.filter(entry => entry.workflowRule === workflowRule);
    }
    if (approvalPendingWith && approvalPendingWith !== 'All') {
      filtered = filtered.filter(entry => entry.approvalPendingWith === approvalPendingWith);
    }
    if (additionalPeriod && additionalPeriod !== 'All') {
        filtered = filtered.filter(entry => entry.additionalPeriod === additionalPeriod);
    }
    if (posted && posted !== 'Both') {
        const isPostedFilter = posted === 'Yes';
        filtered = filtered.filter(entry => entry.isPosted === isPostedFilter);
    }
    
    setDisplayedEntries(filtered);
  }, [
    activeTab, 
    allEntries, 
    fiscalYear, 
    jeNumber, 
    jeDate, 
    description, 
    source, 
    useridCreated, 
    additionalPeriod, 
    status, 
    workflowRule, 
    approvalPendingWith, 
    posted
  ]);

  const handleResetFilters = () => {
    reset(memoizedDefaultValues);
  };
  
  const handleFind = () => {
    console.log("Filtering with current form values.");
  };

  const breadcrumbItems = [
    { label: 'General Ledger', href: '/' }, 
    { label: 'Work with Journal Entries' },
  ];

  const handleCreateNewJE = () => {
    router.push('/journal-entries/create'); // Navigate to create page
  };

  const handleRowAction = (action: string, jeId: string) => {
    console.log(`Action: ${action} on JE: ${jeId}`);
    alert(`Action: ${action} on JE: ${jeId} - To be implemented.`);
  }

  return (
    <div className="w-full max-w-full mx-auto">
      <Breadcrumbs items={breadcrumbItems} />
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-primary">
          Work with Journal Entries
        </h1>
      </header>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as JournalEntryStatus | 'All')}>
        <TabsList className="mb-4 overflow-x-auto whitespace-nowrap justify-start sm:justify-center">
          <TabsTrigger value="All">All Journal Entries</TabsTrigger>
          {jeStatuses.map(sVal => ( 
            <TabsTrigger key={sVal} value={sVal}>{sVal}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{activeTab === 'All' ? 'All Journal Entries' : `${activeTab} Entries`} - Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(handleFind)} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 items-end">
            <Controller
              name="fiscalYear"
              control={control}
              render={({ field }) => (
                <div>
                  <label htmlFor="fiscalYear" className="block text-sm font-medium text-muted-foreground mb-1">Fiscal Year</label>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="fiscalYear"><SelectValue placeholder="Select Year" /></SelectTrigger>
                    <SelectContent>
                      {fiscalYears.map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            />
            <Controller
              name="jeNumber"
              control={control}
              render={({ field }) => (
                <div>
                  <label htmlFor="jeNumber" className="block text-sm font-medium text-muted-foreground mb-1">JE Number</label>
                  <Input id="jeNumber" placeholder="JE Number" {...field} value={field.value || ''} />
                </div>
              )}
            />
             <Controller
                name="jeDate"
                control={control}
                render={({ field }) => (
                    <div>
                        <label htmlFor="jeDate" className="block text-sm font-medium text-muted-foreground mb-1">JE Date</label>
                        <DatePicker 
                            value={field.value} 
                            onValueChange={field.onChange} 
                            placeholder="MM/DD/YYYY"
                        />
                    </div>
                )}
            />
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-muted-foreground mb-1">Description</label>
                  <Input id="description" placeholder="Description" {...field} value={field.value || ''} />
                </div>
              )}
            />
            <Controller
              name="source"
              control={control}
              render={({ field }) => (
                <div>
                  <label htmlFor="source" className="block text-sm font-medium text-muted-foreground mb-1">Source</label>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="source"><SelectValue placeholder="Select Source" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All</SelectItem>
                      {jeSources.map(src => <SelectItem key={src} value={src}>{src}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            />
            <Controller
              name="useridCreated"
              control={control}
              render={({ field }) => (
                <div>
                  <label htmlFor="useridCreated" className="block text-sm font-medium text-muted-foreground mb-1">Userid Created</label>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="useridCreated"><SelectValue placeholder="Select User" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All</SelectItem>
                      {allUserIds.map(user => <SelectItem key={user} value={user}>{user}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            />
            <Controller
              name="additionalPeriod"
              control={control}
              render={({ field }) => (
                <div>
                  <label htmlFor="additionalPeriod" className="block text-sm font-medium text-muted-foreground mb-1">Additional Period</label>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="additionalPeriod"><SelectValue placeholder="Select Period" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All</SelectItem>
                      {additionalPeriods.map(period => <SelectItem key={period} value={period}>{period}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            />
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-muted-foreground mb-1">Status</label>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="status"><SelectValue placeholder="Select Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All</SelectItem>
                      {jeStatuses.map(sVal => <SelectItem key={sVal} value={sVal}>{sVal}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            />
             <Controller
              name="workflowRule"
              control={control}
              render={({ field }) => (
                <div>
                  <label htmlFor="workflowRule" className="block text-sm font-medium text-muted-foreground mb-1">Workflow Rule</label>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="workflowRule"><SelectValue placeholder="Select Rule" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All</SelectItem>
                      {workflowRules.map(rule => <SelectItem key={rule} value={rule}>{rule || 'N/A'}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            />
            <Controller
              name="approvalPendingWith"
              control={control}
              render={({ field }) => (
                <div>
                  <label htmlFor="approvalPendingWith" className="block text-sm font-medium text-muted-foreground mb-1">Approval Pending with</label>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="approvalPendingWith"><SelectValue placeholder="Select Approver" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All</SelectItem>
                      {approvalPendingWithOptions.map(opt => <SelectItem key={opt} value={opt}>{opt || 'N/A'}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            />
             <Controller
              name="posted"
              control={control}
              render={({ field }) => (
                <div>
                  <label htmlFor="posted" className="block text-sm font-medium text-muted-foreground mb-1">Posted</label>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="posted"><SelectValue placeholder="Select Status" /></SelectTrigger>
                    <SelectContent>
                      {postedOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            />
            <div className="col-span-full sm:col-span-1 flex items-end space-x-2 justify-end">
              <Button type="button" variant="outline" onClick={handleResetFilters}>Reset</Button>
              <Button type="submit">Find</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-2 mb-4">
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline">
                    <Settings2 className="mr-2 h-4 w-4" /> Actions
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => alert("Export All to CSV - To be implemented")}>
                    <FileDown className="mr-2 h-4 w-4" /> Export All to CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => alert("Export Selected to CSV - To be implemented")}>
                    <FileDown className="mr-2 h-4 w-4" /> Export Selected to CSV
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
        <Button onClick={handleCreateNewJE}>
          <PlusCircle className="mr-2 h-5 w-5" />
          Create New JE
        </Button>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="w-full whitespace-nowrap">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Fiscal Year</TableHead>
                  <TableHead className="w-[120px]">JE Number</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[120px]">JE Date</TableHead>
                  <TableHead className="w-[100px]">Source</TableHead>
                  <TableHead className="w-[150px]">Status</TableHead>
                  <TableHead className="w-[180px]">Workflow Rule</TableHead>
                  <TableHead className="w-[200px]">Approval Pending with</TableHead>
                  <TableHead className="w-[180px]">Last Approval Action On</TableHead>
                  <TableHead className="w-[120px]">Userid Created</TableHead>
                  <TableHead className="w-[80px] text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedEntries.length > 0 ? (
                  displayedEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{entry.fiscalYear}</TableCell>
                      <TableCell>
                        <Link href={`/journal-entries/${entry.id}`} className="text-primary hover:underline">
                          {entry.jeNumber}
                        </Link>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{entry.description}</TableCell>
                      <TableCell>
                        <FormattedDateTime date={entry.jeDate} formatString="MM/dd/yyyy" />
                      </TableCell>
                      <TableCell>{entry.source}</TableCell>
                      <TableCell>
                        <Badge variant={statusMap[entry.status].variant} className={cn(statusMap[entry.status].className)}>
                            {entry.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{entry.workflowRule || '-'}</TableCell>
                      <TableCell>{entry.approvalPendingWith || '-'}</TableCell>
                      <TableCell>
                        {entry.lastApprovalActionOn ? (
                          <FormattedDateTime date={entry.lastApprovalActionOn} formatString="MM/dd/yyyy hh:mm a" />
                        ) : '-'}
                      </TableCell>
                      <TableCell>{entry.useridCreated}</TableCell>
                      <TableCell className="text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleRowAction('view', entry.id)}>View Details</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRowAction('edit', entry.id)} disabled={entry.status === 'Posted'}>Edit</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRowAction('copy', entry.id)}>Copy JE</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleRowAction('delete', entry.id)} className="text-destructive focus:text-destructive" disabled={entry.status === 'Posted'}>
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={11} className="h-24 text-center">
                      No journal entries found for the current filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
