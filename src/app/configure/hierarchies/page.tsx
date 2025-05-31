
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
import { useHierarchies } from '@/contexts/HierarchiesContext';
import type { Segment } from '@/lib/segment-types';
import type { Hierarchy } from '@/lib/hierarchy-types';


export default function HierarchiesPage() {
  const { segments: allAvailableSegments } = useSegments();
  const { hierarchies: allHierarchies } = useHierarchies();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const querySegmentIdParam = searchParams.get('segmentId');

  useEffect(() => {
    // Wait until segments are loaded
    if (allAvailableSegments.length === 0) {
      // If there was a segmentId in query, but no segments loaded yet,
      // we might want to clear selectedSegmentId or just wait.
      // If selectedSegmentId is already set from a previous render with segments,
      // and now segments become empty, we might clear it.
      if (selectedSegmentId !== null) {
          setSelectedSegmentId(null);
          // If URL had a param, and now there are no segments, clear URL param.
          if (querySegmentIdParam) {
            router.replace('/configure/hierarchies', { scroll: false });
          }
      }
      return;
    }

    let determinedSegmentId: string | null = null;

    // Try to use the segment ID from the URL if it's valid
    if (querySegmentIdParam && allAvailableSegments.some(s => s.id === querySegmentIdParam)) {
      determinedSegmentId = querySegmentIdParam;
    } else {
      // Fallback to the first available segment if URL param is invalid or missing
      determinedSegmentId = allAvailableSegments[0].id;
    }

    // Update the selectedSegmentId state only if it's different
    if (selectedSegmentId !== determinedSegmentId) {
      setSelectedSegmentId(determinedSegmentId);
    }

    // Synchronize the URL:
    // If we have a valid determinedSegmentId and the URL doesn't match it, update the URL.
    if (determinedSegmentId && querySegmentIdParam !== determinedSegmentId) {
      router.replace(`/configure/hierarchies?segmentId=${determinedSegmentId}`, { scroll: false });
    } 
    // If we determined no segment should be selected (e.g., determinedSegmentId became null, though current logic always picks one if available)
    // or if the query param was present but invalid and no fallback was determined (less likely with current logic)
    // then clear the segmentId from URL. This condition might need refinement if `determinedSegmentId` could truly be null while `allAvailableSegments` is not empty.
    else if (!determinedSegmentId && querySegmentIdParam) { 
      router.replace('/configure/hierarchies', { scroll: false });
    }
  }, [querySegmentIdParam, allAvailableSegments, router, selectedSegmentId]);


  const selectedSegment = useMemo(() => {
    return allAvailableSegments.find(s => s.id === selectedSegmentId);
  }, [allAvailableSegments, selectedSegmentId]);

  const currentSegmentHierarchies = useMemo(() => {
    if (!selectedSegmentId) {
      return [];
    }
    return allHierarchies.filter(h => h.segmentId === selectedSegmentId);
  }, [selectedSegmentId, allHierarchies]);

  const handleCreateHierarchy = () => {
    if (selectedSegmentId) {
      router.push(`/configure/hierarchies/build?segmentId=${selectedSegmentId}`);
    } else {
      alert('Please select a segment first.');
    }
  };

  const handleViewHierarchy = (hierarchy: Hierarchy) => {
    console.log('View Hierarchy:', hierarchy.name);
    alert(`Hierarchy view for "${hierarchy.name}" not yet implemented. Tree structure: ${JSON.stringify(hierarchy.treeNodes, null, 2)}`);
  };

  const handleEditHierarchy = (hierarchy: Hierarchy) => {
    console.log('Edit Hierarchy:', hierarchy.name);
    alert('Hierarchy edit UI not yet implemented.');
    // Future: router.push(`/configure/hierarchies/build?segmentId=${hierarchy.segmentId}&hierarchyId=${hierarchy.id}`);
  };

  const handleCopyHierarchy = (hierarchy: Hierarchy) => {
    console.log('Copy Hierarchy:', hierarchy.name);
    alert('Hierarchy copy UI not yet implemented.');
  };

  const handleDeleteHierarchy = (hierarchyId: string) => {
    console.log('Delete Hierarchy ID:', hierarchyId);
    alert('Hierarchy deletion logic not yet implemented.');
    // Future: call a deleteHierarchy function from context
  };

  const handleSegmentSelect = (segmentIdToSelect: string) => {
    // Update state, which will trigger useEffect to sync URL if needed
    if (selectedSegmentId !== segmentIdToSelect) {
        setSelectedSegmentId(segmentIdToSelect);
        router.push(`/configure/hierarchies?segmentId=${segmentIdToSelect}`, { scroll: false });
    }
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
                onClick={() => handleSegmentSelect(segment.id)}
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
