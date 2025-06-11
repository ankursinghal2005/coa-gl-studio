
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';

export default function JournalEntriesPage() {
  const router = useRouter();

  const breadcrumbItems = [
    { label: 'General Ledger', href: '/' },
    { label: 'Work with Journal Entries' },
  ];

  const handleCreateNewJournalEntry = () => {
    router.push('/journal-entries/create');
  };

  return (
    <div className="w-full max-w-full mx-auto">
      <Breadcrumbs items={breadcrumbItems} />
      <header className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-primary">
          Work with Journal Entries
        </h1>
        <Button onClick={handleCreateNewJournalEntry}>
          <PlusCircle className="mr-2 h-5 w-5" />
          Create New Journal Entry
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Journal Entries List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[100px]">Fiscal Year</TableHead>
                <TableHead className="min-w-[120px]">JE Date</TableHead>
                <TableHead className="min-w-[250px]">JE Description</TableHead>
                <TableHead className="min-w-[100px]">Status</TableHead>
                <TableHead className="min-w-[150px]">Created By</TableHead>
                <TableHead className="min-w-[150px]">Created On</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Table rows will be populated here later */}
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No journal entries to display.
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
