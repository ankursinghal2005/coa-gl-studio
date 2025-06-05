
'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
  FormDescription
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription as DialogDesc, 
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GripVertical, FolderTree, Trash2, AlertTriangle, PlusCircle, Edit3, Workflow } from 'lucide-react';
import { useSegments } from '@/contexts/SegmentsContext';
import { useHierarchies } from '@/contexts/HierarchiesContext';
import type { Segment, SegmentCode } from '@/lib/segment-types';
import { mockSegmentCodesData } from '@/lib/segment-types';
import type { HierarchyNode, HierarchySet, SegmentHierarchyInSet } from '@/lib/hierarchy-types';
import { DatePicker } from '@/components/ui/date-picker';
import { format } from 'date-fns';

const hierarchySetFormSchema = z.object({
  name: z.string().min(1, { message: 'Hierarchy Set Name is required.' }),
  status: z.enum(['Active', 'Inactive', 'Deprecated'] as [HierarchySet['status'], ...Array<HierarchySet['status']>], {
    required_error: 'Status is required.',
  }),
  description: z.string().optional(),
  validFrom: z.date({ required_error: "Valid From date is required." }),
  validTo: z.date().optional(),
}).refine(data => {
  if (data.validFrom && data.validTo) {
    return data.validTo >= data.validFrom;
  }
  return true;
}, {
  message: "Valid To date must be after or the same as Valid From date.",
  path: ["validTo"],
});

type HierarchySetFormValues = z.infer<typeof hierarchySetFormSchema>;

const codeExistsInTree = (nodes: HierarchyNode[], codeId: string): boolean => {
  for (const node of nodes) {
    if (node.segmentCode.id === codeId) return true;
    if (node.children && node.children.length > 0) {
      if (codeExistsInTree(node.children, codeId)) return true;
    }
  }
  return false;
};

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

const addChildToNode = (nodes: HierarchyNode[], parentId: string, childNode: HierarchyNode): HierarchyNode[] => {
  return nodes.map(node => {
    if (node.id === parentId) {
      if (!node.segmentCode.summaryIndicator) {
        alert(`Cannot add child to detail code "${node.segmentCode.code}". Select a summary code.`);
        return node;
      }
      if (node.children.find(c => c.segmentCode.id === childNode.segmentCode.id)) {
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
            <span className="text-green-600 font-semibold">(Selected as Parent)</span>
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


export default function HierarchySetBuildPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { segments: allGlobalSegments, getSegmentById } = useSegments();
  const { addHierarchySet, updateHierarchySet, getHierarchySetById } = useHierarchies();
  
  const hierarchySetIdQueryParam = searchParams.get('hierarchySetId');
  const [currentHierarchySetId, setCurrentHierarchySetId] = useState<string | null>(hierarchySetIdQueryParam);
  const [isEditMode, setIsEditMode] = useState<boolean>(!!hierarchySetIdQueryParam);

  const [segmentHierarchiesInSet, setSegmentHierarchiesInSet] = useState<SegmentHierarchyInSet[]>([]);
  const [segmentToAdd, setSegmentToAdd] = useState<string>('');

  const [isTreeBuilderModalOpen, setIsTreeBuilderModalOpen] = useState(false);
  const [editingSegmentHierarchyConfig, setEditingSegmentHierarchyConfig] = useState<{ segmentId: string; segmentName: string; initialTreeNodes: HierarchyNode[] } | null>(null);
  
  const [modalTreeNodes, setModalTreeNodes] = useState<HierarchyNode[]>([]);
  const [modalSelectedParentNodeId, setModalSelectedParentNodeId] = useState<string | null>(null);
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  const [modalRangeStartCode, setModalRangeStartCode] = useState('');
  const [modalRangeEndCode, setModalRangeEndCode] = useState('');
  
  const [modalAllSegmentCodes, setModalAllSegmentCodes] = useState<SegmentCode[]>([]);
  const [modalAvailableSummaryCodes, setModalAvailableSummaryCodes] = useState<SegmentCode[]>([]);
  const [modalAvailableDetailCodes, setModalAvailableDetailCodes] = useState<SegmentCode[]>([]);


  const form = useForm<HierarchySetFormValues>({
    resolver: zodResolver(hierarchySetFormSchema),
    defaultValues: {
      name: '',
      status: 'Active',
      description: '',
      validFrom: new Date(),
      validTo: undefined,
    },
  });

  useEffect(() => {
    if (hierarchySetIdQueryParam) {
      const existingSet = getHierarchySetById(hierarchySetIdQueryParam);
      if (existingSet) {
        form.reset({
          name: existingSet.name,
          status: existingSet.status,
          description: existingSet.description || '',
          validFrom: new Date(existingSet.validFrom),
          validTo: existingSet.validTo ? new Date(existingSet.validTo) : undefined,
        });
        setSegmentHierarchiesInSet(existingSet.segmentHierarchies.map(sh => ({...sh, treeNodes: [...(sh.treeNodes || [])]})));
        setCurrentHierarchySetId(existingSet.id);
        setIsEditMode(true);
      } else {
        alert("Hierarchy Set not found. Starting new set.");
        router.replace('/configure/hierarchies/build');
        setIsEditMode(false);
        setCurrentHierarchySetId(null);
        form.reset();
        setSegmentHierarchiesInSet([]);
      }
    } else {
      setIsEditMode(false);
      setCurrentHierarchySetId(null);
      form.reset();
      setSegmentHierarchiesInSet([]);
    }
  }, [hierarchySetIdQueryParam, getHierarchySetById, form, router]);

  const onSubmit = (values: HierarchySetFormValues) => {
    if (segmentHierarchiesInSet.length === 0) {
      alert("Please add and define at least one segment hierarchy for this set.");
      return;
    }

    const hierarchySetData: HierarchySet = {
      id: currentHierarchySetId || crypto.randomUUID(),
      name: values.name,
      status: values.status,
      description: values.description,
      validFrom: values.validFrom,
      validTo: values.validTo,
      segmentHierarchies: segmentHierarchiesInSet,
      lastModifiedDate: new Date(),
      lastModifiedBy: "Current User", 
    };

    if (isEditMode && currentHierarchySetId) {
      updateHierarchySet(hierarchySetData);
      alert(`Hierarchy Set "${values.name}" updated successfully!`);
    } else {
      addHierarchySet(hierarchySetData);
      alert(`Hierarchy Set "${values.name}" saved successfully!`);
    }
    router.push('/configure/hierarchies');
  };

  const handleCancel = () => {
    router.push('/configure/hierarchies');
  };
  
  const handleAddSegmentToSet = () => {
    if (!segmentToAdd) {
      alert("Please select a segment to add.");
      return;
    }
    if (segmentHierarchiesInSet.find(sh => sh.segmentId === segmentToAdd)) {
      alert("This segment is already part of the hierarchy set.");
      return;
    }
    const newSegmentHierarchy: SegmentHierarchyInSet = {
      id: crypto.randomUUID(),
      segmentId: segmentToAdd,
      treeNodes: [],
    };
    setSegmentHierarchiesInSet(prev => [...prev, newSegmentHierarchy]);
    setSegmentToAdd(''); 
  };

  const handleRemoveSegmentFromSet = (segmentHierarchyIdToRemove: string) => {
    if (window.confirm("Are you sure you want to remove this segment's hierarchy from the set?")) {
        setSegmentHierarchiesInSet(prev => prev.filter(sh => sh.id !== segmentHierarchyIdToRemove));
    }
  };
  
  const handleOpenTreeBuilderModal = (segmentHierarchy: SegmentHierarchyInSet) => {
    const segment = getSegmentById(segmentHierarchy.segmentId);
    if (!segment) {
      alert("Segment details not found for this hierarchy.");
      return;
    }
    setEditingSegmentHierarchyConfig({
      segmentId: segmentHierarchy.segmentId,
      segmentName: segment.displayName,
      initialTreeNodes: JSON.parse(JSON.stringify(segmentHierarchy.treeNodes || [])), 
    });
    setModalTreeNodes(JSON.parse(JSON.stringify(segmentHierarchy.treeNodes || []))); 
    setIsTreeBuilderModalOpen(true);
  };

  const handleSaveSegmentTree = () => {
    if (editingSegmentHierarchyConfig) {
      setSegmentHierarchiesInSet(prev =>
        prev.map(sh =>
          sh.segmentId === editingSegmentHierarchyConfig.segmentId
            ? { ...sh, treeNodes: modalTreeNodes }
            : sh
        )
      );
    }
    setIsTreeBuilderModalOpen(false);
    setEditingSegmentHierarchyConfig(null);
  };

  useEffect(() => {
    if (isTreeBuilderModalOpen && editingSegmentHierarchyConfig) {
        const segment = getSegmentById(editingSegmentHierarchyConfig.segmentId);
        if (segment) {
            const codesForSegment = (mockSegmentCodesData[segment.id] || [])
              .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
            setModalAllSegmentCodes(codesForSegment);
        } else {
            setModalAllSegmentCodes([]);
        }
    } else {
        setModalSearchTerm('');
        setModalSelectedParentNodeId(null);
        setModalRangeStartCode('');
        setModalRangeEndCode('');
        setModalAllSegmentCodes([]);
    }
  }, [isTreeBuilderModalOpen, editingSegmentHierarchyConfig, getSegmentById]);

  useEffect(() => { 
    if (modalAllSegmentCodes.length > 0) {
        const filteredCodes = modalSearchTerm
          ? modalAllSegmentCodes.filter(
              (code) =>
                code.code.toLowerCase().includes(modalSearchTerm.toLowerCase()) ||
                code.description.toLowerCase().includes(modalSearchTerm.toLowerCase())
            )
          : modalAllSegmentCodes;
        setModalAvailableSummaryCodes(filteredCodes.filter(c => c.summaryIndicator));
        setModalAvailableDetailCodes(filteredCodes.filter(c => !c.summaryIndicator));
    } else {
        setModalAvailableSummaryCodes([]);
        setModalAvailableDetailCodes([]);
    }
  }, [modalSearchTerm, modalAllSegmentCodes]);

  const modalSelectedParentNodeDetails = useMemo(() => {
    if (!modalSelectedParentNodeId) return null;
    return findNodeById(modalTreeNodes, modalSelectedParentNodeId);
  }, [modalSelectedParentNodeId, modalTreeNodes]);

  const handleModalDragStart = (event: React.DragEvent<HTMLDivElement>, code: SegmentCode) => {
    event.dataTransfer.setData('application/json', JSON.stringify(code));
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleModalDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const handleModalDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const codeDataString = event.dataTransfer.getData('application/json');
    if (!codeDataString) return;

    try {
      const droppedSegmentCode: SegmentCode = JSON.parse(codeDataString);
      if (codeExistsInTree(modalTreeNodes, droppedSegmentCode.id)) {
        alert(`Code ${droppedSegmentCode.code} already exists in this hierarchy.`);
        return;
      }
      const newNode: HierarchyNode = { id: crypto.randomUUID(), segmentCode: droppedSegmentCode, children: [] };

      if (modalTreeNodes.length === 0) {
        if (!newNode.segmentCode.summaryIndicator) {
          alert('The first node in a hierarchy must be a summary code.'); return;
        }
        setModalTreeNodes([newNode]);
        setModalSelectedParentNodeId(newNode.id);
      } else {
        if (modalSelectedParentNodeId) {
          const parentNode = findNodeById(modalTreeNodes, modalSelectedParentNodeId);
          if (parentNode && !parentNode.segmentCode.summaryIndicator) {
            alert(`Cannot add child to detail code "${parentNode.segmentCode.code}". Select a summary code as parent.`); return;
          }
          setModalTreeNodes(prevNodes => addChildToNode(prevNodes, modalSelectedParentNodeId, newNode));
        } else {
          if (!newNode.segmentCode.summaryIndicator) {
            alert('Cannot add a detail code as a new root. Select a summary parent or add a summary code as a new root.'); return;
          }
          setModalTreeNodes(prevNodes => [...prevNodes, newNode]);
          setModalSelectedParentNodeId(newNode.id); 
        }
      }
    } catch (e) { console.error("Failed to process dropped code:", e); alert("Error processing dropped code."); }
  };

  const handleModalSelectParent = (nodeId: string) => {
    const node = findNodeById(modalTreeNodes, nodeId);
    if (node && node.segmentCode.summaryIndicator) setModalSelectedParentNodeId(nodeId);
    else if (node && !node.segmentCode.summaryIndicator) { setModalSelectedParentNodeId(null); alert("Detail codes cannot be parents."); }
    else setModalSelectedParentNodeId(null);
  };

  const handleModalRemoveNode = (nodeIdToRemove: string) => {
    const newTree = removeNodeFromTreeRecursive(modalTreeNodes, nodeIdToRemove);
    setModalTreeNodes(newTree);
    if (modalSelectedParentNodeId && !nodeStillExistsInTree(newTree, modalSelectedParentNodeId)) {
      setModalSelectedParentNodeId(null);
    }
  };

  const handleModalAddRangeToParent = () => {
    if (!modalSelectedParentNodeId) { alert('Please select a summary parent node from the tree first.'); return; }
    const parentNode = findNodeById(modalTreeNodes, modalSelectedParentNodeId);
    if (!parentNode || !parentNode.segmentCode.summaryIndicator) { alert('Selected parent is not valid.'); return; }
    if (!modalRangeStartCode || !modalRangeEndCode) { alert('Please enter Start and End Codes for the range.'); return; }

    const startIndex = modalAllSegmentCodes.findIndex(c => c.code === modalRangeStartCode);
    const endIndex = modalAllSegmentCodes.findIndex(c => c.code === modalRangeEndCode);
    if (startIndex === -1 || endIndex === -1) { alert('Start/End code not found.'); return; }
    if (startIndex > endIndex) { alert('Start Code must precede or be End Code.'); return; }

    const codesInRange = modalAllSegmentCodes.slice(startIndex, endIndex + 1);
    let currentTree = [...modalTreeNodes];
    let addedCount = 0;
    const skippedExisting = [];

    codesInRange.forEach(code => {
      if (codeExistsInTree(currentTree, code.id)) { skippedExisting.push(code.code); return; }
      const newNode: HierarchyNode = { id: crypto.randomUUID(), segmentCode: code, children: [] };
      
      const tempTree = addChildToNode(currentTree, modalSelectedParentNodeId, newNode);
      if (JSON.stringify(tempTree) !== JSON.stringify(currentTree)) { 
          currentTree = tempTree;
          addedCount++;
      } else if (!skippedExisting.includes(code.code)) { 
          skippedExisting.push(code.code + " (parent type restriction or already child)");
      }
    });
    setModalTreeNodes(currentTree);
    setModalRangeStartCode(''); setModalRangeEndCode('');
    let message = `${addedCount} codes added to parent "${parentNode.segmentCode.code}".`;
    if (skippedExisting.length > 0) message += ` Skipped codes: ${skippedExisting.join(', ')}.`;
    alert(message);
  };

  const getModalDropZoneMessage = () => {
    if (modalTreeNodes.length === 0) return "Drag a SUMMARY code here to start building this segment's hierarchy root.";
    if (!modalSelectedParentNodeId) return "Select a summary node from the tree to add children, or drag another SUMMARY code here to create a new root.";
    const selectedNodeName = modalSelectedParentNodeDetails ? `${modalSelectedParentNodeDetails.segmentCode.code}` : 'the selected parent';
    return `Drag codes here to add as children to "${selectedNodeName}".`;
  };

  const breadcrumbItems = [
    { label: 'COA Configuration', href: '/' },
    { label: 'Hierarchy Sets', href: '/configure/hierarchies' },
    { label: isEditMode ? 'Edit Hierarchy Set' : 'Create Hierarchy Set' },
  ];

  const availableSegmentsForAdding = allGlobalSegments.filter(
    seg => !segmentHierarchiesInSet.some(sh => sh.segmentId === seg.id)
  );

  return (
    // Removed p-4/sm:p-6/lg:p-8, min-h-screen, bg-background. Added w-full, max-w-7xl, mx-auto.
    <div className="w-full max-w-7xl mx-auto">
      <Breadcrumbs items={breadcrumbItems} />
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-primary flex items-center">
           <Workflow className="mr-3 h-7 w-7" />
          {isEditMode ? 'Edit Hierarchy Set' : 'Create New Hierarchy Set'}
        </h1>
      </header>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Hierarchy Set Details</CardTitle>
              <CardDescription>Define the general properties for this collection of hierarchies.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Set Name *</FormLabel>
                    <FormControl><Input placeholder="e.g., GASB Reporting Structure, FY25 Budget Rollup" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl><Textarea placeholder="Optional: Purpose of this hierarchy set" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem className="flex flex-col"> {/* Ensure vertical stacking */}
                      <FormLabel>Status *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl>
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
                <FormField
                  control={form.control}
                  name="validFrom"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Valid From *</FormLabel>
                      <DatePicker value={field.value} onValueChange={field.onChange} placeholder="Select start date" />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="validTo"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Valid To</FormLabel>
                      <DatePicker 
                        value={field.value} 
                        onValueChange={field.onChange} 
                        placeholder="Optional: Select end date" 
                        disableDates={(date) => {
                            const validFrom = form.getValues("validFrom");
                            return validFrom instanceof Date ? date < validFrom : false;
                        }}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Segment Hierarchies in this Set</CardTitle>
              <CardDescription>Define or edit the tree structure for each segment included in this Hierarchy Set.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 p-4 border rounded-md bg-muted/30">
                <Label htmlFor="segmentToAdd">Add Segment to this Set</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Select value={segmentToAdd} onValueChange={setSegmentToAdd}>
                    <SelectTrigger id="segmentToAdd" className="flex-grow">
                      <SelectValue placeholder="Select a segment..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSegmentsForAdding.length > 0 ? (
                        availableSegmentsForAdding.map(seg => (
                          <SelectItem key={seg.id} value={seg.id}>{seg.displayName}</SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>All segments already added or no segments available.</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <Button type="button" onClick={handleAddSegmentToSet} disabled={!segmentToAdd || segmentToAdd === 'none'}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Segment
                  </Button>
                </div>
                 {availableSegmentsForAdding.length === 0 && segmentHierarchiesInSet.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">All available segments have been added to this set.</p>
                )}
              </div>

              {segmentHierarchiesInSet.length === 0 ? (
                <p className="text-center text-muted-foreground py-6">No segment hierarchies defined for this set yet. Add a segment above to begin.</p>
              ) : (
                <div className="space-y-4">
                  {segmentHierarchiesInSet.map((sh) => {
                    const segmentDetails = getSegmentById(sh.segmentId);
                    const treeNodeCount = sh.treeNodes?.length || 0; 
                    return (
                      <Card key={sh.id} className="shadow">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                          <CardTitle className="text-xl">{segmentDetails?.displayName || 'Unknown Segment'}</CardTitle>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleOpenTreeBuilderModal(sh)}>
                              <Edit3 className="mr-2 h-4 w-4" /> Edit Tree
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleRemoveSegmentFromSet(sh.id)}>
                              <Trash2 className="mr-2 h-4 w-4" /> Remove
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            {sh.description || `Hierarchy for ${segmentDetails?.displayName || 'this segment'}.`}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {treeNodeCount > 0 ? `${treeNodeCount} root node(s) defined.` : 'No tree structure defined yet.'}
                          </p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="mt-8 flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={handleCancel}>Cancel</Button>
            <Button type="submit">
              {isEditMode ? 'Update Hierarchy Set' : 'Save Hierarchy Set'}
            </Button>
          </div>
        </form>
      </Form>

      <Dialog open={isTreeBuilderModalOpen} onOpenChange={(isOpen) => {
          if (!isOpen) { 
              setIsTreeBuilderModalOpen(false);
              setEditingSegmentHierarchyConfig(null);
          } else {
              setIsTreeBuilderModalOpen(true);
          }
      }}>
        <DialogContent className="max-w-5xl min-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Build Hierarchy for: {editingSegmentHierarchyConfig?.segmentName || 'Segment'}</DialogTitle>
            <DialogDesc>Drag codes from the left panel to the structure on the right. Select summary codes in the tree to add children to them.</DialogDesc>
          </DialogHeader>
          
          {editingSegmentHierarchyConfig && (
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 overflow-hidden pt-2">
              <Card className="flex flex-col">
                <CardHeader className="pt-2 pb-2">
                  <CardTitle className="text-lg">Available Codes: {editingSegmentHierarchyConfig.segmentName}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col p-0 overflow-y-auto">
                  <div className="p-3 border-b shrink-0">
                    <Input
                      placeholder="Search codes..."
                      value={modalSearchTerm}
                      onChange={(e) => setModalSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col flex-1">
                    <div className="px-3 pt-3 pb-1"><h4 className="text-md font-semibold text-muted-foreground">Summary Codes (Parents)</h4></div>
                    <ScrollArea className="px-3 flex-1 min-h-0">
                      {modalAvailableSummaryCodes.map(code => (
                        <div key={code.id} draggable onDragStart={(e) => handleModalDragStart(e, code)} className="flex items-center p-1.5 mb-1 border rounded-md hover:bg-accent cursor-grab">
                          <GripVertical className="h-5 w-5 mr-2 text-muted-foreground shrink-0" />
                          <div><div className="font-medium text-sm">{code.code}</div><div className="text-xs text-muted-foreground">{code.description}</div></div>
                        </div>
                      ))}
                      {modalAvailableSummaryCodes.length === 0 && <p className="text-xs text-muted-foreground p-2">{modalSearchTerm ? 'No matching summary codes.' : 'No summary codes.'}</p>}
                    </ScrollArea>
                    <div className="px-3 pt-3 pb-1 border-t"><h4 className="text-md font-semibold text-muted-foreground">Detail Codes (Children)</h4></div>
                    <ScrollArea className="px-3 pb-1 flex-1 min-h-0">
                      {modalAvailableDetailCodes.map(code => (
                        <div key={code.id} draggable onDragStart={(e) => handleModalDragStart(e, code)} className="flex items-center p-1.5 mb-1 border rounded-md hover:bg-accent cursor-grab">
                           <GripVertical className="h-5 w-5 mr-2 text-muted-foreground shrink-0" />
                           <div><div className="font-medium text-sm">{code.code}</div><div className="text-xs text-muted-foreground">{code.description}</div></div>
                        </div>
                      ))}
                      {modalAvailableDetailCodes.length === 0 && <p className="text-xs text-muted-foreground p-2">{modalSearchTerm ? 'No matching detail codes.' : 'No detail codes.'}</p>}
                    </ScrollArea>
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2 flex flex-col" onDragOver={handleModalDragOver} onDrop={handleModalDrop}>
                <CardHeader className="pt-2 pb-2">
                  <CardTitle className="text-lg">Tree Structure</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col overflow-hidden p-3 bg-slate-50">
                  {modalSelectedParentNodeDetails && modalSelectedParentNodeDetails.segmentCode.summaryIndicator && (
                    <Card className="mb-3 p-3 shadow shrink-0">
                      <h3 className="text-md font-semibold mb-1 text-primary">Add Codes to: {modalSelectedParentNodeDetails.segmentCode.code}</h3>
                      <div className="flex items-end gap-2 mb-1">
                        <div className="flex-1 space-y-1"><Label htmlFor="modalRangeStartCode" className="text-xs">Start Code</Label><Input id="modalRangeStartCode" value={modalRangeStartCode} onChange={(e) => setModalRangeStartCode(e.target.value)} className="h-8 text-xs" /></div>
                        <div className="flex-1 space-y-1"><Label htmlFor="modalRangeEndCode" className="text-xs">End Code</Label><Input id="modalRangeEndCode" value={modalRangeEndCode} onChange={(e) => setModalRangeEndCode(e.target.value)} className="h-8 text-xs" /></div>
                        <Button onClick={handleModalAddRangeToParent} size="sm" className="h-8">Add Range</Button>
                      </div>
                      <p className="text-xs text-muted-foreground">Codes within range (inclusive) will be added.</p>
                    </Card>
                  )}
                  <ScrollArea className="flex-1 min-h-0">
                    {modalTreeNodes.length === 0 ? (
                      <div className="text-center text-muted-foreground h-full flex flex-col items-center justify-center py-6">
                        <FolderTree className="w-12 h-12 text-slate-400 mb-3" />
                        <p className="text-md mb-1">{getModalDropZoneMessage()}</p>
                        <p className="text-xs">(Only SUMMARY codes can be parents.)</p>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {modalTreeNodes.map((rootNode) => (
                          <TreeNodeDisplay key={rootNode.id} node={rootNode} level={0} selectedParentNodeId={modalSelectedParentNodeId} onSelectParent={handleModalSelectParent} onRemoveNode={handleModalRemoveNode} />
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                  {modalSelectedParentNodeDetails && modalSelectedParentNodeDetails.segmentCode.summaryIndicator && (
                      <div className="mt-2 p-2 border border-dashed border-green-500 rounded-md bg-green-50/70 text-center text-xs text-green-700 shrink-0"> 
                          Adding to: '{modalSelectedParentNodeDetails.segmentCode.code}'. Drag/drop or use 'Add Range'.
                      </div>
                  )}
                  {!modalSelectedParentNodeId && modalTreeNodes.length > 0 && (
                      <div className="mt-2 p-2 border border-dashed border-blue-500 rounded-md bg-blue-50/70 text-center text-xs text-blue-700 shrink-0"> 
                          No parent selected. Drag new SUMMARY code for another root, or click existing SUMMARY node.
                      </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
          <DialogFooter className="pt-4">
            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
            <Button type="button" onClick={handleSaveSegmentTree}>Save Tree Structure</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
