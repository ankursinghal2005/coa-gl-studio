
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation'; // Added useRouter
import Link from 'next/link'; // Added Link
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
import { PlusCircle, ListFilter, Eye, Edit2, Copy, Trash2, MoreHorizontal } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useSegments } from '@/contexts/SegmentsContext';
import type { Segment } from '@/lib/segment-types';

// Basic Hierarchy interface for now
interface Hierarchy {
  id: string;
  name: string;
  segmentId: string;
  status: 'Active' | 'Inactive' | 'Deprecated';
  lastModifiedDate?: Date; // Placeholder
  lastModifiedBy?: string; // Placeholder
}

// Mock data for hierarchies
const initialHierarchiesData: Record<string, Hierarchy[]> = {
  'fund': [
    { id: 'fund-h1', name: 'Standard Fund Hierarchy', segmentId: 'fund', status: 'Active', lastModifiedDate: new Date(2023, 10, 15), lastModifiedBy: 'Admin User' },
    { id: 'fund-h2', name: 'Budgeting Fund Rollup', segmentId: 'fund', status: 'Inactive', lastModifiedDate: new Date(2023, 8, 1), lastModifiedBy: 'Finance Team' },
  ],
  'department': [
    { id: 'dept-h1', name: 'Organizational Chart View', segmentId: 'department', status: 'Active', lastModifiedDate: new Date(2024, 0, 5), lastModifiedBy: 'System Admin' },
  ],
  'object': [
    { id: 'object-h1', name: 'Expense Object Rollup', segmentId: 'object', status: 'Active', lastModifiedDate: new Date(2024, 1, 10), lastModifiedBy: 'Finance Team' },
  ],
  'project': [
    { id: 'project-h1', name: 'Capital Projects Hierarchy', segmentId: 'project', status: 'Deprecated', lastModifiedDate: new Date(2023, 5, 20), lastModifiedBy: 'Admin User' },
  ]
  // Other segments like 'grant', 'function', 'location', 'program' will be initialized with [] by the useEffect
};


export default function HierarchiesPage() {
  const { segments: allAvailableSegments } = useSegments();
  const searchParams = useSearchParams();
  const router = useRouter(); // Added useRouter
  
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [hierarchiesData, setHierarchiesData] = useState<Record<string, Hierarchy[]>>(initialHierarchiesData);

  useEffect(() => {
    // Initialize hierarchies for all segments if not already present from initialHierarchiesData
    setHierarchiesData(prevData => {
      const newData = {...prevData};
      allAvailableSegments.forEach(segment => {
        if (!Object.prototype.hasOwnProperty.call(newData, segment.id)) {
          newData[segment.id] = [];
        }
      });
      return newData;
    });

    const querySegmentId = searchParams.get('segmentId');
    if (querySegmentId && allAvailableSegments.some(s => s.id === querySegmentId)) {
      if (selectedSegmentId !== querySegmentId) {
        setSelectedSegmentId(querySegmentId);
      }
    } else if (!selectedSegmentId && allAvailableSegments.length > 0) {
      setSelectedSegmentId(allAvailableSegments[0].id);
    } else if (selectedSegmentId && !allAvailableSegments.some(s => s.id === selectedSegmentId)) {
      // If current selected segment is no longer valid (e.g. removed from context), reset
      setSelectedSegmentId(allAvailableSegments.length > 0 ? allAvailableSegments[0].id : null);
    }
  }, [searchParams, allAvailableSegments, selectedSegmentId]);


  const selectedSegment = useMemo(() => {
    return allAvailableSegments.find(s => s.id === selectedSegmentId);
  }, [allAvailableSegments, selectedSegmentId]);

  const currentSegmentHierarchies = useMemo(() => {
    if (!selectedSegmentId || !hierarchiesData[selectedSegmentId]) {
      return [];
    }
    return hierarchiesData[selectedSegmentId];
  }, [selectedSegmentId, hierarchiesData]);

  const handleCreateHierarchy = () => {
    if (selectedSegmentId) {
      router.push(`/configure/hierarchies/build?segmentId=${selectedSegmentId}`);
    } else {
      alert('Please select a segment first.');
    }
  };

  const handleViewHierarchy = (hierarchy: Hierarchy) => {
    console.log('View Hierarchy:', hierarchy.name);
    alert('Hierarchy view UI not yet implemented.');
  };

  const handleEditHierarchy = (hierarchy: Hierarchy) => {
    console.log('Edit Hierarchy:', hierarchy.name);
    alert('Hierarchy edit UI not yet implemented.');
  };

  const handleCopyHierarchy = (hierarchy: Hierarchy) => {
    console.log('Copy Hierarchy:', hierarchy.name);
    alert('Hierarchy copy UI not yet implemented.');
  };

  const handleDeleteHierarchy = (hierarchyId: string) => {
    console.log('Delete Hierarchy ID:', hierarchyId);
    alert('Hierarchy deletion logic not yet implemented.');
  };


  const breadcrumbItems = [
    { label: 'COA Configuration', href: '/' },
    { label: 'Hierarchies' }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="p-4 sm:p-8">
         <Breadcrumbs items={breadcrumbItems} />
      </div>
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-1/4 min-w-[200px] max-w-[300px] border-r bg-card p-4 space-y-2 overflow-y-auto">
          <h2 className="text-lg font-semibold mb-3 text-primary flex items-center">
            <ListFilter className="mr-2 h-5 w-5" /> Segments
          </h2>
          <ScrollArea className="h-[calc(100%-3rem)]">
            {allAvailableSegments.map(segment => (
              <Button
                key={segment.id}
                variant={selectedSegmentId === segment.id ? 'secondary' : 'ghost'}
                className={cn(
                  "w-full justify-start text-left mb-1",
                  selectedSegmentId === segment.id && "font-semibold text-primary"
                )}
                onClick={() => setSelectedSegmentId(segment.id)}
              >
                {segment.displayName}
              </Button>
            ))}
          </ScrollArea>
        </aside>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {selectedSegment ? (
            <>
              <header className="mb-6 flex justify-between items-center">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-primary">
                    Hierarchies for: {selectedSegment.displayName}
                  </h1>
                  <p className="text-md text-muted-foreground mt-1">
                    Manage hierarchical structures for segment codes.
                  </p>
                </div>
                <Button onClick={handleCreateHierarchy}>
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Create Hierarchy
                </Button>
              </header>

              <Card>
                <CardHeader>
                  <CardTitle>Configured Hierarchies</CardTitle>
                </CardHeader>
                <CardContent>
                  {currentSegmentHierarchies.length > 0 ? (
                    <ScrollArea className="w-full whitespace-nowrap">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[200px]">Hierarchy Name</TableHead>
                          <TableHead className="min-w-[100px]">Status</TableHead>
                          <TableHead className="min-w-[150px]">Last Modified By</TableHead>
                          <TableHead className="min-w-[150px]">Last Modified Date</TableHead>
                          <TableHead className="text-center w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentSegmentHierarchies.map(hierarchy => (
                          <TableRow key={hierarchy.id}>
                            <TableCell className="font-medium">
                              {hierarchy.name}
                            </TableCell>
                            <TableCell>{hierarchy.status}</TableCell>
                            <TableCell>{hierarchy.lastModifiedBy || 'N/A'}</TableCell>
                            <TableCell>
                              {hierarchy.lastModifiedDate 
                                ? new Date(hierarchy.lastModifiedDate).toLocaleDateString() 
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
                                  <DropdownMenuItem onClick={() => handleViewHierarchy(hierarchy)}>
                                    <Eye className="mr-2 h-4 w-4" /> View
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleEditHierarchy(hierarchy)}>
                                    <Edit2 className="mr-2 h-4 w-4" /> Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleCopyHierarchy(hierarchy)}>
                                    <Copy className="mr-2 h-4 w-4" /> Copy
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteHierarchy(hierarchy.id)} 
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
                      No hierarchies defined for {selectedSegment.displayName}. Click "+ Create Hierarchy" to get started.
                    </p>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
               {allAvailableSegments.length > 0 ?
                <p className="text-xl text-muted-foreground">Please select a segment from the left panel.</p>
                :
                <p className="text-xl text-muted-foreground">No segments configured. Please add segments in 'Manage Segments' first.</p>
              }
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

