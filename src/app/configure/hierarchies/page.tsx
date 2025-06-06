
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns'; 
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
import { PlusCircle, Eye, Edit2, Trash2, MoreHorizontal, Network } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useHierarchies } from '@/contexts/HierarchiesContext';
import type { HierarchySet } from '@/lib/hierarchy-types';

export default function HierarchySetsPage() {
  const { hierarchySets, deleteHierarchySet } = useHierarchies();
  const router = useRouter();

  const handleCreateHierarchySet = () => {
    router.push(`/configure/hierarchies/build`); 
  };

  const handleViewHierarchySet = (set: HierarchySet) => {
    router.push(`/configure/hierarchies/build?hierarchySetId=${set.id}`);
  };

  const handleEditHierarchySet = (set: HierarchySet) => {
    router.push(`/configure/hierarchies/build?hierarchySetId=${set.id}`);
  };

  const handleDeleteHierarchySet = (setId: string, setName: string) => {
    if (window.confirm(`Are you sure you want to delete the Hierarchy Set "${setName}"? This will delete all segment hierarchies within it.`)) {
      deleteHierarchySet(setId);
      alert(`Hierarchy Set "${setName}" deleted successfully.`);
    }
  };

  const breadcrumbItems = [
    { label: 'COA Configuration', href: '/' },
    { label: 'Hierarchy Sets' }
  ];

  return (
    // Removed p-4/sm:p-6/lg:p-8, min-h-screen, bg-background. Added w-full, max-w-6xl, mx-auto.
    <div className="w-full max-w-6xl mx-auto">
      <Breadcrumbs items={breadcrumbItems} />
      <header className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary flex items-center">
            <Network className="mr-3 h-7 w-7" /> Manage Hierarchy Sets
          </h1>
          <p className="text-md text-muted-foreground mt-1">
            Define and manage comprehensive hierarchy structures, such as for GASB or Budgeting.
          </p>
        </div>
        <Button onClick={handleCreateHierarchySet}>
          <PlusCircle className="mr-2 h-5 w-5" />
          Create Hierarchy Set
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Configured Hierarchy Sets</CardTitle>
          <CardDescription>
            Each set can contain multiple segment-specific hierarchies (e.g., Fund hierarchy, Department hierarchy) tailored for a specific purpose.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hierarchySets.length > 0 ? (
            <ScrollArea className="w-full whitespace-nowrap">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[250px]">Set Name</TableHead>
                    <TableHead className="min-w-[100px]">Status</TableHead>
                    <TableHead className="min-w-[150px]">Last Modified</TableHead>
                    <TableHead className="text-center w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hierarchySets.map(set => (
                    <TableRow key={set.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/configure/hierarchies/build?hierarchySetId=${set.id}`}
                          className="text-primary hover:underline"
                        >
                          {set.name}
                        </Link>
                        {set.description && <p className="text-xs text-muted-foreground whitespace-normal">{set.description}</p>}
                      </TableCell>
                      <TableCell>{set.status}</TableCell>
                      <TableCell>
                        {set.lastModifiedDate && set.lastModifiedBy
                          ? `${format(new Date(set.lastModifiedDate), 'MM/dd/yyyy')} by ${set.lastModifiedBy}`
                          : 'N/A'}
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
                            <DropdownMenuItem onClick={() => handleViewHierarchySet(set)}>
                              <Eye className="mr-2 h-4 w-4" /> View/Manage
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditHierarchySet(set)}>
                              <Edit2 className="mr-2 h-4 w-4" /> Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteHierarchySet(set.id, set.name)}
                              className="text-destructive focus:text-destructive focus:bg-destructive/10"
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete Set
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
              No Hierarchy Sets defined yet. Click "+ Create Hierarchy Set" to get started.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
