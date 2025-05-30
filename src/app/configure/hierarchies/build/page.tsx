
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GripVertical, FolderTree, Trash2, AlertTriangle } from 'lucide-react';
import { useSegments } from '@/contexts/SegmentsContext';
import type { Segment } from '@/lib/segment-types';

// Mock Segment Code interface (simplified for this page)
interface SegmentCode {
  id: string;
  code: string;
  description: string;
  summaryIndicator: boolean;
}

// Interface for a node in our hierarchy tree
interface HierarchyNode {
  id: string; // Unique ID for this node instance in the tree (can be segmentCode.id if codes are unique in tree)
  segmentCode: SegmentCode;
  children: HierarchyNode[];
}

// Updated mock data for segment codes, specific to this builder page
const mockSegmentCodesForBuilder: Record<string, SegmentCode[]> = {
  'fund': [
    { id: 'fb-f-100', code: '100', description: 'General Fund', summaryIndicator: true },
    { id: 'fb-f-101', code: '101', description: 'Governmental Operating Fund', summaryIndicator: false },
    { id: 'fb-f-102', code: '102', description: 'Enterprise Parking Fund', summaryIndicator: false },
    { id: 'fb-f-103', code: '103', description: 'Special Revenue Fund - Grants', summaryIndicator: false },
    { id: 'fb-f-104', code: '104', description: 'Capital Projects Fund - Infrastructure', summaryIndicator: false },
    { id: 'fb-f-105', code: '105', description: 'Debt Service Fund - Bonds', summaryIndicator: false },
    { id: 'fb-f-106', code: '106', description: 'Internal Service Fund - IT', summaryIndicator: false },
    { id: 'fb-f-107', code: '107', description: 'Trust Fund - Pension', summaryIndicator: false },
    { id: 'fb-f-108', code: '108', description: 'Agency Fund - Payroll Deductions', summaryIndicator: false },
    { id: 'fb-f-109', code: '109', description: 'Permanent Fund - Library Endowment', summaryIndicator: false },
    { id: 'fb-f-200', code: '200', description: 'Grants & Donations Fund', summaryIndicator: true },
    { id: 'fb-f-210', code: '210', description: 'Federal Grant A', summaryIndicator: false },
    { id: 'fb-f-220', code: '220', description: 'State Grant B', summaryIndicator: false },
    { id: 'fb-f-230', code: '230', description: 'Private Donation C', summaryIndicator: false },
    { id: 'fb-f-300', code: '300', description: 'Capital Outlay Fund', summaryIndicator: true },
    { id: 'fb-f-301', code: '301', description: 'Building Project Z (Detail)', summaryIndicator: false },
    { id: 'fb-f-310', code: '310', description: 'Equipment Purchase X', summaryIndicator: false },
    { id: 'fb-f-320', code: '320', description: 'Infrastructure Upgrade Y', summaryIndicator: false },
  ],
  'department': [
    { id: 'fb-d-FIN', code: 'FIN', description: 'Finance Department (Summary)', summaryIndicator: true },
    { id: 'fb-d-HR', code: 'HR', description: 'Human Resources (Summary)', summaryIndicator: true },
    { id: 'fb-d-FIN-ACC', code: 'FIN-ACC', description: 'Accounting (Detail)', summaryIndicator: false },
    { id: 'fb-d-FIN-BUD', code: 'FIN-BUD', description: 'Budgeting (Detail)', summaryIndicator: false },
    { id: 'fb-d-IT', code: 'IT', description: 'IT Department (Detail)', summaryIndicator: false },
    { id: 'fb-d-PD', code: 'PD', description: 'Police Department', summaryIndicator: false },
    { id: 'fb-d-FD', code: 'FD', description: 'Fire Department', summaryIndicator: false },
    { id: 'fb-d-PW', code: 'PW', description: 'Public Works', summaryIndicator: false },
  ],
  'object': [
    { id: 'fb-o-5000', code: '5000', description: 'Salaries & Wages (Summary)', summaryIndicator: true },
    { id: 'fb-o-5100', code: '5100', description: 'Full-time Salaries (Detail)', summaryIndicator: false },
    { id: 'fb-o-5200', code: '5200', description: 'Part-time Salaries (Detail)', summaryIndicator: false },
    { id: 'fb-o-6000', code: '6000', description: 'Operating Expenses (Summary)', summaryIndicator: true },
    { id: 'fb-o-6100', code: '6100', description: 'Office Supplies (Detail)', summaryIndicator: false },
    { id: 'fb-o-6200', code: '6200', description: 'Utilities (Detail)', summaryIndicator: false },
  ]
};


const hierarchyBuilderFormSchema = z.object({
  hierarchyName: z.string().min(1, { message: 'Hierarchy Name is required.' }),
  status: z.enum(['Active', 'Inactive', 'Deprecated'], {
    required_error: 'Status is required.',
  }),
  description: z.string().optional(),
});

type HierarchyBuilderFormValues = z.infer<typeof hierarchyBuilderFormSchema>;

// Helper to check if a code already exists anywhere in the tree
const codeExistsInTree = (nodes: HierarchyNode[], codeId: string): boolean => {
  for (const node of nodes) {
    if (node.id === codeId) return true;
    if (node.children && node.children.length > 0) {
      if (codeExistsInTree(node.children, codeId)) return true;
    }
  }
  return false;
};

// Helper to check if a node (by ID) exists anywhere in the tree
const nodeStillExistsInTree = (nodes: HierarchyNode[], nodeId: string | null): boolean => {
  if (!nodeId) return false;
  for (const node of nodes) {
    if (node.id === nodeId) return true;
    if (node.children && node.children.length > 0) {
      if (nodeStillExistsInTree(node.children, nodeId)) return true;
    }
  }
  return false;
};

// Helper function to find a node by ID in the tree
const findNodeById = (nodes: HierarchyNode[], nodeId: string): HierarchyNode | null => {
  for (const node of nodes) {
    if (node.id === nodeId) return node;
    if (node.children) {
      const foundInChildren = findNodeById(node.children, nodeId);
      if (foundInChildren) return foundInChildren;
    }
  }
  return null;
};


// Helper function to recursively find a node by ID and add a child
const addChildToNode = (nodes: HierarchyNode[], parentId: string, childNode: HierarchyNode): HierarchyNode[] => {
  return nodes.map(node => {
    if (node.id === parentId) {
      if (!node.segmentCode.summaryIndicator) {
        alert(`Cannot add child to detail code "${node.segmentCode.code}". Select a summary code.`);
        return node;
      }
      if (node.children.find(c => c.id === childNode.id)) {
          alert(`Code ${childNode.segmentCode.code} already exists under this parent.`);
          return node;
      }
      return { ...node, children: [...node.children, childNode] };
    }
    if (node.children && node.children.length > 0) {
      return { ...node, children: addChildToNode(node.children, parentId, childNode) };
    }
    return node;
  });
};

// Helper function to recursively remove a node by ID from the tree
const removeNodeFromTreeRecursive = (nodes: HierarchyNode[], idToRemove: string): HierarchyNode[] => {
  return nodes
    .filter(node => node.id !== idToRemove)
    .map(node => {
      if (node.children && node.children.length > 0) {
        return { ...node, children: removeNodeFromTreeRecursive(node.children, idToRemove) };
      }
      return node;
    });
};


// Recursive component to display tree nodes
const TreeNodeDisplay: React.FC<{ 
  node: HierarchyNode; 
  level: number; 
  selectedParentNodeId: string | null;
  onSelectParent: (nodeId: string) => void;
  onRemoveNode: (nodeId: string) => void; 
}> = ({ node, level, selectedParentNodeId, onSelectParent, onRemoveNode }) => {
  const isSelectedParent = node.id === selectedParentNodeId;
  const canBeParent = node.segmentCode.summaryIndicator;

  return (
    <div 
      style={{ marginLeft: `${level * 20}px` }}
      className={`relative p-3 border rounded-md mb-2 shadow-sm ${isSelectedParent ? 'bg-blue-100 ring-2 ring-blue-500' : 'bg-card hover:bg-accent/50'}`}
      onClick={(e) => {
        if (canBeParent) {
          e.stopPropagation(); 
          onSelectParent(node.id);
        }
      }}
    >
      <Button 
        variant="ghost" 
        size="icon" 
        className="absolute top-1 right-1 h-6 w-6 text-destructive hover:text-destructive/80"
        onClick={(e) => {
          e.stopPropagation(); 
          onRemoveNode(node.id);
        }}
        aria-label="Remove node"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      <div className="font-medium text-primary flex items-center">
        {node.segmentCode.code} - {node.segmentCode.description}
      </div>
      <div className="text-xs text-muted-foreground mt-1">
        Type: {node.segmentCode.summaryIndicator ? 'Summary (Parent)' : 'Detail (Child)'}
      </div>
      {canBeParent && (
        <div className="text-xs mt-1">
          {isSelectedParent ? (
            <span className="text-green-600 font-semibold">(Selected as Parent for new children)</span>
          ) : (
            <span className="text-blue-600 cursor-pointer hover:underline">(Click to select as parent)</span>
          )}
        </div>
      )}
      {node.children && node.children.length > 0 && (
        <div className="mt-3 pl-4 border-l-2 border-blue-200">
          {node.children.map(child => (
            <TreeNodeDisplay 
              key={child.id} 
              node={child} 
              level={level + 1} 
              selectedParentNodeId={selectedParentNodeId}
              onSelectParent={onSelectParent}
              onRemoveNode={onRemoveNode} 
            />
          ))}
        </div>
      )}
    </div>
  );
};


export default function HierarchyBuildPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getSegmentById } = useSegments();

  const [selectedSegment, setSelectedSegment] = useState<Segment | null>(null);
  const [allSegmentCodes, setAllSegmentCodes] = useState<SegmentCode[]>([]);
  const [availableSummaryCodes, setAvailableSummaryCodes] = useState<SegmentCode[]>([]);
  const [availableDetailCodes, setAvailableDetailCodes] = useState<SegmentCode[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [treeNodes, setTreeNodes] = useState<HierarchyNode[]>([]); 
  const [selectedParentNodeId, setSelectedParentNodeId] = useState<string | null>(null);
  
  const [rangeStartCode, setRangeStartCode] = useState('');
  const [rangeEndCode, setRangeEndCode] = useState('');


  const segmentId = searchParams.get('segmentId');

  useEffect(() => {
    if (segmentId) {
      const segment = getSegmentById(segmentId);
      if (segment) {
        setSelectedSegment(segment);
        const codesForSegment = mockSegmentCodesForBuilder[segment.id] || [];
        setAllSegmentCodes(codesForSegment.sort((a, b) => a.code.localeCompare(b.code))); // Sort all codes
        
        const filteredCodes = searchTerm
          ? codesForSegment.filter(
              (code) =>
                code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                code.description.toLowerCase().includes(searchTerm.toLowerCase())
            )
          : codesForSegment;

        setAvailableSummaryCodes(filteredCodes.filter(c => c.summaryIndicator));
        setAvailableDetailCodes(filteredCodes.filter(c => !c.summaryIndicator));
      } else {
        router.push('/configure/hierarchies');
      }
    } else {
      router.push('/configure/hierarchies');
    }
  }, [segmentId, getSegmentById, router, searchTerm]);

  const form = useForm<HierarchyBuilderFormValues>({
    resolver: zodResolver(hierarchyBuilderFormSchema),
    defaultValues: {
      hierarchyName: '',
      status: 'Active',
      description: '',
    },
  });

  const onSubmit = (values: HierarchyBuilderFormValues) => {
    console.log('Hierarchy Form Submitted:', values);
    console.log('Current Tree Nodes:', JSON.stringify(treeNodes, null, 2)); 
    alert(`Hierarchy "${values.hierarchyName}" save action placeholder. Tree structure logged to console. Full save logic not yet implemented.`);
    if (segmentId) {
        router.push(`/configure/hierarchies?segmentId=${segmentId}`);
    } else {
        router.push('/configure/hierarchies');
    }
  };
  
  const handleCancel = () => {
    if (segmentId) {
        router.push(`/configure/hierarchies?segmentId=${segmentId}`);
    } else {
        router.push('/configure/hierarchies');
    }
  };

  const handleReset = () => {
    form.reset();
    setSearchTerm('');
    setTreeNodes([]);
    setSelectedParentNodeId(null);
    setRangeStartCode('');
    setRangeEndCode('');
    alert('Reset Hierarchy action placeholder. Form and tree structure cleared.');
  };

  const handleDragStart = (event: React.DragEvent<HTMLDivElement>, code: SegmentCode) => {
    event.dataTransfer.setData('application/json', JSON.stringify(code));
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault(); 
    event.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const codeDataString = event.dataTransfer.getData('application/json');
    if (!codeDataString) return;

    try {
      const droppedSegmentCode: SegmentCode = JSON.parse(codeDataString);
      
      if (codeExistsInTree(treeNodes, droppedSegmentCode.id)) {
        alert(`Code ${droppedSegmentCode.code} already exists in the hierarchy.`);
        return;
      }

      const newNode: HierarchyNode = {
        id: droppedSegmentCode.id, 
        segmentCode: droppedSegmentCode,
        children: [],
      };

      if (treeNodes.length === 0) { 
        if (!newNode.segmentCode.summaryIndicator) {
          alert('The first node in a hierarchy must be a summary code.');
          return;
        }
        setTreeNodes([newNode]);
        setSelectedParentNodeId(newNode.id); 
      } else {
        if (selectedParentNodeId) {
          const parentNode = findNodeById(treeNodes, selectedParentNodeId);
          if (parentNode && !parentNode.segmentCode.summaryIndicator) {
            alert(`Cannot add child to detail code "${parentNode.segmentCode.code}". Select a summary code as parent.`);
            return;
          }
          setTreeNodes(prevNodes => addChildToNode(prevNodes, selectedParentNodeId, newNode));
        } else {
          if (!newNode.segmentCode.summaryIndicator) {
            alert('Cannot add a detail code as a new root. Select a summary parent or add a summary code as a new root.');
            return;
          }
          setTreeNodes(prevNodes => [...prevNodes, newNode]);
          setSelectedParentNodeId(newNode.id); 
        }
      }
    } catch (e) {
      console.error("Failed to parse dropped data or add to tree:", e);
      alert("Error processing dropped code.");
    }
  };
  
  const handleSelectParent = (nodeId: string) => {
    const node = findNodeById(treeNodes, nodeId);
    if (node && node.segmentCode.summaryIndicator) {
      setSelectedParentNodeId(nodeId);
    } else {
      setSelectedParentNodeId(null); // Or keep previous selection if clicking on detail
    }
  };

  const handleRemoveNode = (nodeIdToRemove: string) => {
    const newTree = removeNodeFromTreeRecursive(treeNodes, nodeIdToRemove);
    setTreeNodes(newTree);

    if (selectedParentNodeId && !nodeStillExistsInTree(newTree, selectedParentNodeId)) {
      setSelectedParentNodeId(null);
    }
  };

  const handleAddRangeToParent = () => {
    if (!selectedParentNodeId) {
      alert('Please select a summary parent node from the tree first.');
      return;
    }
    const parentNode = findNodeById(treeNodes, selectedParentNodeId);
    if (!parentNode || !parentNode.segmentCode.summaryIndicator) {
      alert('Selected parent is not a valid summary code.');
      return;
    }
    if (!rangeStartCode || !rangeEndCode) {
      alert('Please enter both a Start Code and an End Code for the range.');
      return;
    }

    const startIndex = allSegmentCodes.findIndex(c => c.code === rangeStartCode);
    const endIndex = allSegmentCodes.findIndex(c => c.code === rangeEndCode);

    if (startIndex === -1 || endIndex === -1) {
      alert('Start or End code not found in available codes for this segment.');
      return;
    }
    if (startIndex > endIndex) {
      alert('Start Code must come before or be the same as End Code.');
      return;
    }

    const codesToAddInRange = allSegmentCodes.slice(startIndex, endIndex + 1);
    let newTreeNodes = [...treeNodes];
    let codesAddedCount = 0;
    const codesSkipped: string[] = [];

    codesToAddInRange.forEach(code => {
      if (codeExistsInTree(newTreeNodes, code.id)) {
        codesSkipped.push(code.code);
        return; 
      }
      // Check if already child of current parent
      if (parentNode.children.some(child => child.id === code.id)) {
        codesSkipped.push(code.code);
        return;
      }

      const newNode: HierarchyNode = {
        id: code.id,
        segmentCode: code,
        children: [],
      };
      newTreeNodes = addChildToNode(newTreeNodes, selectedParentNodeId, newNode);
      codesAddedCount++;
    });

    setTreeNodes(newTreeNodes);
    setRangeStartCode('');
    setRangeEndCode('');
    alert(`${codesAddedCount} codes added to parent "${parentNode.segmentCode.code}". ${codesSkipped.length > 0 ? `Skipped existing codes: ${codesSkipped.join(', ')}` : ''}`);
  };


  if (!selectedSegment) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading segment information...</p>
      </div>
    );
  }

  const breadcrumbItems = [
    { label: 'COA Configuration', href: '/' },
    { label: 'Hierarchies', href: `/configure/hierarchies?segmentId=${selectedSegment.id}` },
    { label: 'Build Hierarchy' },
  ];

  const getDropZoneMessage = () => {
    if (treeNodes.length === 0) {
      return "Drag a SUMMARY code here from the left panel to start building your hierarchy root.";
    }
    if (!selectedParentNodeId) {
      return "Select a summary node from the tree to add children, or drag another SUMMARY code here to create a new root.";
    }
    const selectedNode = findNodeById(treeNodes, selectedParentNodeId);
    const selectedNodeName = selectedNode ? `${selectedNode.segmentCode.code} - ${selectedNode.segmentCode.description}` : 'the selected parent';
    return `Drag codes here to add as children to "${selectedNodeName}". You can also drag a new SUMMARY code to start another root.`;
  };
  
  const selectedParentNodeDetails = useMemo(() => {
    if (!selectedParentNodeId) return null;
    return findNodeById(treeNodes, selectedParentNodeId);
  }, [selectedParentNodeId, treeNodes]);

  return (
    <div className="flex flex-col min-h-screen p-4 sm:p-6 lg:p-8 bg-background">
      <Breadcrumbs items={breadcrumbItems} />
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-primary">
          Create Hierarchy for: {selectedSegment.displayName}
        </h1>
      </header>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Hierarchy Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="hierarchyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hierarchy Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Main Reporting Hierarchy" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Inactive">Inactive</SelectItem>
                          <SelectItem value="Deprecated">Deprecated</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormItem>
                    <FormLabel>Segment</FormLabel>
                    <Input value={selectedSegment.displayName} disabled />
                  </FormItem>
              </div>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Optional: Describe the purpose of this hierarchy"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[500px]">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Available Codes for {selectedSegment.displayName}</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col overflow-hidden p-0">
            <div className="p-4 border-b">
              <Input 
                placeholder="Search codes..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="px-4 pt-4 pb-2">
                <h4 className="text-md font-semibold mb-2 text-muted-foreground">Summary Codes (Parents)</h4>
              </div>
              <ScrollArea className="flex-1 min-h-0 px-4">
                {availableSummaryCodes.length > 0 ? (
                  availableSummaryCodes.map(code => (
                    <div
                      key={code.id}
                      draggable="true"
                      onDragStart={(e) => handleDragStart(e, code)}
                      className="flex items-center p-2 mb-1 border rounded-md hover:bg-accent cursor-grab active:cursor-grabbing"
                    >
                      <GripVertical className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
                      <div className="flex-grow">
                        <div className="font-medium">{code.code}</div>
                        <div className="text-xs text-muted-foreground">{code.description}</div>
                      </div>
                    </div>
                  ))
                ) : (
                   <p className="text-sm text-muted-foreground px-2 py-1">
                    {searchTerm ? 'No matching summary codes found.' : 'No summary codes available.'}
                  </p>
                )}
              </ScrollArea>
               <div className="px-4 pt-2 border-t">
                <h4 className="text-md font-semibold mb-2 text-muted-foreground">Detail Codes (Children)</h4>
              </div>
              <ScrollArea className="flex-1 min-h-0 px-4 pb-1">
                 {availableDetailCodes.length > 0 ? (
                  availableDetailCodes.map(code => (
                    <div
                      key={code.id}
                      draggable="true"
                      onDragStart={(e) => handleDragStart(e, code)}
                      className="flex items-center p-2 mb-1 border rounded-md hover:bg-accent cursor-grab active:cursor-grabbing"
                    >
                      <GripVertical className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
                      <div className="flex-grow">
                        <div className="font-medium">{code.code}</div>
                        <div className="text-xs text-muted-foreground">{code.description}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground px-2 py-1">
                     {searchTerm ? 'No matching detail codes found.' : 'No detail codes available.'}
                  </p>
                )}
              </ScrollArea>
            </div>
          </CardContent>
        </Card>

        <Card 
            className="lg:col-span-2 flex flex-col"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        > 
          <CardHeader>
            <CardTitle>Hierarchy Structure</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col overflow-hidden p-6 bg-slate-50">
            {/* Add by Range Form */}
            {selectedParentNodeDetails && selectedParentNodeDetails.segmentCode.summaryIndicator && (
              <Card className="mb-4 p-4 shadow">
                <h3 className="text-lg font-semibold mb-2 text-primary">
                  Add Codes to Parent: {selectedParentNodeDetails.segmentCode.code} - {selectedParentNodeDetails.segmentCode.description}
                </h3>
                <div className="flex items-end gap-2 mb-2">
                  <FormItem className="flex-1">
                    <FormLabel htmlFor="rangeStartCode">Start Code</FormLabel>
                    <Input 
                      id="rangeStartCode"
                      placeholder="Enter start code" 
                      value={rangeStartCode} 
                      onChange={(e) => setRangeStartCode(e.target.value)} 
                    />
                  </FormItem>
                  <FormItem className="flex-1">
                    <FormLabel htmlFor="rangeEndCode">End Code</FormLabel>
                    <Input 
                      id="rangeEndCode"
                      placeholder="Enter end code" 
                      value={rangeEndCode} 
                      onChange={(e) => setRangeEndCode(e.target.value)} 
                    />
                  </FormItem>
                  <Button onClick={handleAddRangeToParent} className="h-10">Add Range</Button>
                </div>
                 <p className="text-xs text-muted-foreground">
                  Enter existing codes from the 'Available Codes' panel. Codes within the range (inclusive, sorted alphanumerically) will be added.
                </p>
              </Card>
            )}
            
            <ScrollArea className="flex-1 min-h-0">
              {treeNodes.length === 0 ? (
                <div className="text-center text-muted-foreground h-full flex flex-col items-center justify-center py-10">
                  <FolderTree className="w-16 h-16 text-slate-400 mb-4" />
                  <p className="text-lg mb-2">{getDropZoneMessage()}</p>
                  <p className="text-sm">(Only SUMMARY codes can be parents. Click a summary node in the tree to select it as the parent for new children.)</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {treeNodes.map((rootNode) => (
                    <TreeNodeDisplay 
                      key={rootNode.id} 
                      node={rootNode} 
                      level={0} 
                      selectedParentNodeId={selectedParentNodeId}
                      onSelectParent={handleSelectParent}
                      onRemoveNode={handleRemoveNode} 
                    />
                  ))}
                  {selectedParentNodeId && treeNodes.length > 0 && !selectedParentNodeDetails?.segmentCode.summaryIndicator && (
                     <div className="mt-4 p-3 border border-dashed border-destructive rounded-md bg-red-50 text-center text-sm text-destructive flex items-center justify-center">
                        <AlertTriangle className="h-4 w-4 mr-2"/>
                        The selected node is a DETAIL code. You cannot add children to it. Please select a SUMMARY node.
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
             {selectedParentNodeDetails && selectedParentNodeDetails.segmentCode.summaryIndicator && (
                <div className="mt-4 p-3 border border-dashed border-green-500 rounded-md bg-green-50 text-center text-sm text-green-700">
                    New children will be added to parent: '{selectedParentNodeDetails.segmentCode.code} - {selectedParentNodeDetails.segmentCode.description}'. Drag and drop or use 'Add Range'.
                </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 flex justify-end space-x-3">
        <Button type="button" variant="outline" onClick={handleCancel}>
          Cancel
        </Button>
        <Button type="button" variant="ghost" onClick={handleReset}>
          Reset Hierarchy
        </Button>
        <Button type="button" onClick={form.handleSubmit(onSubmit)}>
          Save Hierarchy
        </Button>
      </div>
    </div>
  );
}
