
'use client';

import React, { useState } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Segment {
  id: string;
  displayName: string;
  segmentType: 'Core Segment' | 'Standard Segment';
  isActive: boolean;
  isCore: boolean; // True if it's Fund, Object, Department
}

const initialSegmentsData: Segment[] = [
  { id: 'fund', displayName: 'Fund', segmentType: 'Core Segment', isActive: true, isCore: true },
  { id: 'object', displayName: 'Object', segmentType: 'Core Segment', isActive: true, isCore: true },
  { id: 'department', displayName: 'Department', segmentType: 'Core Segment', isActive: true, isCore: true },
  { id: 'project', displayName: 'Project', segmentType: 'Standard Segment', isActive: true, isCore: false },
  { id: 'grant', displayName: 'Grant', segmentType: 'Standard Segment', isActive: true, isCore: false },
  { id: 'function', displayName: 'Function', segmentType: 'Standard Segment', isActive: true, isCore: false },
  { id: 'location', displayName: 'Location', segmentType: 'Standard Segment', isActive: true, isCore: false },
  { id: 'program', displayName: 'Program', segmentType: 'Standard Segment', isActive: true, isCore: false },
];

export default function SegmentsPage() {
  const [segments, setSegments] = useState<Segment[]>(initialSegmentsData);

  const handleToggleChange = (segmentId: string) => {
    setSegments(prevSegments =>
      prevSegments.map(segment =>
        segment.id === segmentId ? { ...segment, isActive: !segment.isActive } : segment
      )
    );
    // In a real application, you would persist this change to a backend.
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen p-4 py-8 sm:p-8 bg-background">
      <div className="w-full max-w-4xl">
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-primary">Manage Segments</h1>
          <p className="text-md text-muted-foreground mt-2">
            Configure the building blocks of your chart of accounts. Define core and standard segments.
          </p>
        </header>

        <div className="mb-6 flex justify-end">
          <Button>
            <PlusCircle className="mr-2 h-5 w-5" />
            Add Custom Segment
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Configured Segments</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px] sm:w-[350px]">Display Name</TableHead>
                  <TableHead>Segment Type</TableHead>
                  <TableHead className="text-right w-[150px] sm:w-[180px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {segments.map(segment => (
                  <TableRow key={segment.id}>
                    <TableCell className="font-medium">{segment.displayName}</TableCell>
                    <TableCell>{segment.segmentType}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <span className={`text-sm ${segment.isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {segment.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <Switch
                          id={`status-toggle-${segment.id}`}
                          checked={segment.isActive}
                          onCheckedChange={() => handleToggleChange(segment.id)}
                          disabled={segment.isCore}
                          aria-label={`Toggle status for ${segment.displayName}`}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
