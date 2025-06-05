
'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GripVertical, FolderTree, Trash2, AlertTriangle, PlusCircle, Edit3, Workflow, ArrowLeft, Eye } from 'lucide-react';
import { useSegments } from '@/contexts/SegmentsContext';
import { useHierarchies } from '@/contexts/HierarchiesContext';
import type { Segment, SegmentCode } from '@/lib/segment-types';
import { mockSegmentCodesData } from '@/lib/segment-types';
import type { HierarchyNode, HierarchySet, SegmentHierarchyInSet } from '@/lib/hierarchy-types';
import { Label } from '@/components/ui/label';

// --- Helper functions for tree manipulation ---
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

// --- TreeNodeDisplay Component ---
const TreeNodeDisplay: React.FC<{
  node: HierarchyNode;
  level: number;
  selectedParentNodeId: string | null;
  onSelectParent: (nodeId: string) => void;
  onRemoveNode: (nodeId: string) => void;
  isViewOnlyMode: boolean;
}> = ({ node, level, selectedParentNodeId, onSelectParent, onRemoveNode, isViewOnlyMode }) => {
  const isSelectedParent = node.id === selectedParentNodeId;
  const canBeParent = node.segmentCode.summaryIndicator;

  return (
    <div
      style={{ marginLeft: `${level * 20}px` }}
      className={`relative p-3 border rounded-md mb-2 shadow-sm ${
        isSelectedParent && !isViewOnlyMode ? 'bg-blue-100 ring-2 ring-blue-500' 
        : isViewOnlyMode ? 'bg-card' : 'bg-card hover:bg-accent/50'
      }`}
      onClick={(e) => {
        if (canBeParent && !isViewOnlyMode) {
          e.stopPropagation();
          onSelectParent(node.id);
        }
      }}
    >
      {!isViewOnlyMode && (
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
      )}
      <div className="font-medium text-primary flex items-center">
        {node.segmentCode.code} - {node.segmentCode.description}
      </div>
      <div className="text-xs text-muted-foreground mt-1">
        Type: {node.segmentCode.summaryIndicator ? 'Summary (Parent)' : 'Detail (Child)'}
      </div>
      {canBeParent && !isViewOnlyMode && (
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
              isViewOnlyMode={isViewOnlyMode}
            />
          ))}
        </div>
      )}
    </div>
  );
};


export default function BuildSegmentTreePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getSegmentById } = useSegments();
  const { hierarchySets: allSetsFromContext, getHierarchySetById, updateHierarchySet } = useHierarchies();

  const hierarchySetId = searchParams.get('hierarchySetId');
  const segmentHierarchyId = searchParams.get('segmentHierarchyId');
  const viewModeQueryParam = searchParams.get('viewMode');

  const [isLoading, setIsLoading] = useState(true);
  const [isViewOnlyMode, setIsViewOnlyMode] = useState(viewModeQueryParam === 'true');
  const [hierarchySet, setHierarchySet] = useState<HierarchySet | null>(null);
  const [segmentHierarchy, setSegmentHierarchy] = useState<SegmentHierarchyInSet | null>(null);
  const [segmentDetails, setSegmentDetails] = useState<Segment | null>(null);

  const [treeNodes, setTreeNodes] = useState<HierarchyNode[]>([]);
  const [selectedParentNodeId, setSelectedParentNodeId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [rangeStartCode, setRangeStartCode] = useState('');
  const [rangeEndCode, setRangeEndCode] = useState('');

  const [allSegmentCodes, setAllSegmentCodes] = useState<SegmentCode[]>([]);
  const [availableSummaryCodes, setAvailableSummaryCodes] = useState<SegmentCode[]>([]);
  const [availableDetailCodes, setAvailableDetailCodes] = useState<SegmentCode[]>([]);

 useEffect(() => {
    setIsLoading(true);
    console.log("BuildSegmentTreePage: useEffect triggered with hierarchySetId:", hierarchySetId, "segmentHierarchyId:", segmentHierarchyId);
    
    // Log all HierarchySet IDs currently in context for diagnostics
    console.log("BuildSegmentTreePage: IDs in context at lookup:", allSetsFromContext.map(s => s.id));
    console.log("BuildSegmentTreePage: Searching for ID:", hierarchySetId);


    if (hierarchySetId) {
      // Directly find the HierarchySet from the context's current array
      const hs = allSetsFromContext.find(s => s.id === hierarchySetId);
      console.log("BuildSegmentTreePage: Fetched HierarchySet from context:", hs ? `ID: ${hs.id}, SegHierarchies: ${JSON.stringify(hs.segmentHierarchies.map(s => s.id))}` : 'Not Found');

      if (hs && segmentHierarchyId) {
        const sh = hs.segmentHierarchies.find(s => s.id === segmentHierarchyId);
        console.log("BuildSegmentTreePage: Found SegmentHierarchyInSet in hs:", sh ? `ID: ${sh.id}` : 'Not Found');

        if (sh) {
          const seg = getSegmentById(sh.segmentId);
          console.log("BuildSegmentTreePage: Fetched SegmentDetails:", seg ? `ID: ${seg.id}` : 'Not Found');

          if (seg) { 
            setHierarchySet(hs);
            setSegmentHierarchy(sh);
            setSegmentDetails(seg);
            setTreeNodes(JSON.parse(JSON.stringify(sh.treeNodes || []))); 

            const codesForSegment = (mockSegmentCodesData[seg.id] || [])
              .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
            setAllSegmentCodes(codesForSegment);
            setIsLoading(false); 
            return; 
          } else {
            console.error("BuildSegmentTreePage: SegmentDetails NOT FOUND for segmentId:", sh.segmentId);
          }
        } else {
          console.error("BuildSegmentTreePage: SegmentHierarchyInSet NOT FOUND for ID:", segmentHierarchyId, "within set:", hs.id);
        }
      } else {
        if (!hs) console.error("BuildSegmentTreePage: HierarchySet NOT FOUND for ID:", hierarchySetId);
        if (!segmentHierarchyId) console.error("BuildSegmentTreePage: segmentHierarchyId is missing from URL params.");
      }
    } else {
      console.error("BuildSegmentTreePage: hierarchySetId is missing from URL params.");
    }

    setHierarchySet(null);
    setSegmentHierarchy(null);
    setSegmentDetails(null);
    setTreeNodes([]);
    setAllSegmentCodes([]);
    setIsLoading(false);
  }, [hierarchySetId, segmentHierarchyId, getSegmentById, allSetsFromContext]); // Added allSetsFromContext


  useEffect(() => {
    if (allSegmentCodes.length > 0) {
        const filteredCodes = searchTerm
          ? allSegmentCodes.filter(
              (code) =>
                code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                code.description.toLowerCase().includes(searchTerm.toLowerCase())
            )
          : allSegmentCodes;
        setAvailableSummaryCodes(filteredCodes.filter(c => c.summaryIndicator));
        setAvailableDetailCodes(filteredCodes.filter(c => !c.summaryIndicator));
    } else {
        setAvailableSummaryCodes([]);
        setAvailableDetailCodes([]);
    }
  }, [searchTerm, allSegmentCodes]);

  const selectedParentNodeDetails = useMemo(() => {
    if (!selectedParentNodeId) return null;
    return findNodeById(treeNodes, selectedParentNodeId);
  }, [selectedParentNodeId, treeNodes]);

  const handleDragStart = (event: React.DragEvent<HTMLDivElement>, code: SegmentCode) => {
    if (isViewOnlyMode) return;
    event.dataTransfer.setData('application/json', JSON.stringify(code));
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    if (isViewOnlyMode) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    if (isViewOnlyMode) return;
    event.preventDefault();
    const codeDataString = event.dataTransfer.getData('application/json');
    if (!codeDataString) return;

    try {
      const droppedSegmentCode: SegmentCode = JSON.parse(codeDataString);
      if (codeExistsInTree(treeNodes, droppedSegmentCode.id)) {
        alert(`Code ${droppedSegmentCode.code} already exists in this hierarchy.`);
        return;
      }
      const newNode: HierarchyNode = { id: crypto.randomUUID(), segmentCode: droppedSegmentCode, children: [] };

      if (treeNodes.length === 0) {
        if (!newNode.segmentCode.summaryIndicator) {
          alert('The first node in a hierarchy must be a summary code.'); return;
        }
        setTreeNodes([newNode]);
        setSelectedParentNodeId(newNode.id);
      } else {
        if (selectedParentNodeId) {
          const parentNode = findNodeById(treeNodes, selectedParentNodeId);
          if (parentNode && !parentNode.segmentCode.summaryIndicator) {
            alert(`Cannot add child to detail code "${parentNode.segmentCode.code}". Select a summary code as parent.`); return;
          }
          setTreeNodes(prevNodes => addChildToNode(prevNodes, selectedParentNodeId, newNode));
        } else {
          if (!newNode.segmentCode.summaryIndicator) {
            alert('Cannot add a detail code as a new root. Select a summary parent or add a summary code as a new root.'); return;
          }
          setTreeNodes(prevNodes => [...prevNodes, newNode]);
          setSelectedParentNodeId(newNode.id);
        }
      }
    } catch (e) { console.error("Failed to process dropped code:", e); alert("Error processing dropped code."); }
  };

  const handleSelectParent = (nodeId: string) => {
    if (isViewOnlyMode) return;
    const node = findNodeById(treeNodes, nodeId);
    if (node && node.segmentCode.summaryIndicator) setSelectedParentNodeId(nodeId);
    else if (node && !node.segmentCode.summaryIndicator) { setSelectedParentNodeId(null); alert("Detail codes cannot be parents."); }
    else setSelectedParentNodeId(null);
  };

  const handleRemoveNode = (nodeIdToRemove: string) => {
    if (isViewOnlyMode) return;
    const newTree = removeNodeFromTreeRecursive(treeNodes, nodeIdToRemove);
    setTreeNodes(newTree);
    if (selectedParentNodeId && !nodeStillExistsInTree(newTree, selectedParentNodeId)) {
      setSelectedParentNodeId(null);
    }
  };

  const handleAddRangeToParent = () => {
    if (isViewOnlyMode) return;
    if (!selectedParentNodeId) { alert('Please select a summary parent node from the tree first.'); return; }
    const parentNode = findNodeById(treeNodes, selectedParentNodeId);
    if (!parentNode || !parentNode.segmentCode.summaryIndicator) { alert('Selected parent is not valid.'); return; }
    if (!rangeStartCode || !rangeEndCode) { alert('Please enter Start and End Codes for the range.'); return; }

    const startIndex = allSegmentCodes.findIndex(c => c.code === rangeStartCode);
    const endIndex = allSegmentCodes.findIndex(c => c.code === rangeEndCode);
    if (startIndex === -1 || endIndex === -1) { alert('Start/End code not found.'); return; }
    if (startIndex > endIndex) { alert('Start Code must precede or be End Code.'); return; }

    const codesInRange = allSegmentCodes.slice(startIndex, endIndex + 1);
    let currentTree = [...treeNodes];
    let addedCount = 0;
    const skippedExisting = [];

    codesInRange.forEach(code => {
      if (codeExistsInTree(currentTree, code.id)) { skippedExisting.push(code.code); return; }
      const newNode: HierarchyNode = { id: crypto.randomUUID(), segmentCode: code, children: [] };

      const tempTree = addChildToNode(currentTree, selectedParentNodeId, newNode);
      if (JSON.stringify(tempTree) !== JSON.stringify(currentTree)) {
          currentTree = tempTree;
          addedCount++;
      } else if (!skippedExisting.includes(code.code)) {
          skippedExisting.push(code.code + " (parent type restriction or already child)");
      }
    });
    setTreeNodes(currentTree);
    setRangeStartCode(''); setRangeEndCode('');
    let message = `${addedCount} codes added to parent "${parentNode.segmentCode.code}".`;
    if (skippedExisting.length > 0) message += ` Skipped codes: ${skippedExisting.join(', ')}.`;
    alert(message);
  };

  const getDropZoneMessage = () => {
    if (isViewOnlyMode) return "Viewing hierarchy tree. Click 'Enable Editing' to make changes.";
    if (treeNodes.length === 0) return "Drag a SUMMARY code here to start building this segment's hierarchy root.";
    if (!selectedParentNodeId) return "Select a summary node from the tree to add children, or drag another SUMMARY code here to create a new root.";
    const selectedNodeName = selectedParentNodeDetails ? `${selectedParentNodeDetails.segmentCode.code}` : 'the selected parent';
    return `Drag codes here to add as children to "${selectedNodeName}".`;
  };

  const handleSaveTree = () => {
    if (isViewOnlyMode) return;
    if (!hierarchySet || !segmentHierarchy || !segmentDetails) { 
      alert("Error: Critical hierarchy details are missing. Cannot save.");
      return;
    }
    const updatedSegmentHierarchies = hierarchySet.segmentHierarchies.map(sh =>
      sh.id === segmentHierarchy.id ? { ...sh, treeNodes: treeNodes } : sh
    );
    const updatedHierarchySet = { ...hierarchySet, segmentHierarchies: updatedSegmentHierarchies, lastModifiedDate: new Date(), lastModifiedBy: "Current User" };
    updateHierarchySet(updatedHierarchySet);
    alert(`Tree structure for segment "${segmentDetails.displayName}" in set "${hierarchySet.name}" saved.`);
    router.push(`/configure/hierarchies/build?hierarchySetId=${hierarchySetId}`);
  };

  const handleCancel = () => {
    router.push(`/configure/hierarchies/build?hierarchySetId=${hierarchySetId}`);
  };

  const handleEnableEditing = () => {
    setIsViewOnlyMode(false);
  };


  const breadcrumbItems = [
    { label: 'COA Configuration', href: '/' },
    { label: 'Hierarchy Sets', href: '/configure/hierarchies' },
    { label: `Set: ${hierarchySet?.name || 'Loading...'}`, href: hierarchySetId ? `/configure/hierarchies/build?hierarchySetId=${hierarchySetId}` : '/configure/hierarchies' },
    { label: `${isViewOnlyMode ? 'View' : 'Build'} Tree: ${segmentDetails?.displayName || 'Loading...'}` },
  ];

  if (isLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto p-6 flex justify-center items-center h-screen">
        <div className="flex flex-col items-center">
          <Workflow className="h-12 w-12 text-primary animate-spin mb-4" />
          <p className="text-lg text-muted-foreground">Loading Tree Builder...</p>
        </div>
      </div>
    );
  }

  if (!hierarchySet || !segmentHierarchy || !segmentDetails) {
    return (
      <div className="w-full max-w-7xl mx-auto p-6">
        <Breadcrumbs items={[{ label: "Error Loading Hierarchy Configuration"}]} />
        <Card className="mt-4">
            <CardHeader>
                <CardTitle className="text-destructive flex items-center">
                    <AlertTriangle className="mr-2 h-6 w-6" />
                    Error Loading Hierarchy Details
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground mb-1">The system could not load the necessary details to build the hierarchy tree.</p>
                <p className="text-sm text-muted-foreground mb-4">
                    This might be due to invalid or missing parameters in the URL, or the requested data could not be found. Please ensure the Hierarchy Set and Segment Hierarchy IDs are correct.
                </p>
                <ul className="text-xs list-disc list-inside text-muted-foreground/80 mb-4">
                    <li>Hierarchy Set ID from URL: {hierarchySetId || 'Not provided'}</li>
                    <li>Segment Hierarchy ID from URL: {segmentHierarchyId || 'Not provided'}</li>
                    <li>Hierarchy Set found in context: {hierarchySet ? 'Yes' : 'No'}</li>
                    <li>Segment Hierarchy found in Set: {segmentHierarchy ? 'Yes' : 'No'}</li>
                    <li>Segment Details found: {segmentDetails ? 'Yes' : 'No'}</li>
                </ul>
                <Button onClick={() => router.push(hierarchySetId ? `/configure/hierarchies/build?hierarchySetId=${hierarchySetId}` : '/configure/hierarchies')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Hierarchy Set
                </Button>
            </CardContent>
        </Card>
      </div>
    );
  }


  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col h-full">
      <div className="p-4 md:p-6 lg:p-8">
        <Breadcrumbs items={breadcrumbItems} />
        <header className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-primary flex items-center">
            <Workflow className="mr-3 h-7 w-7" />
            {isViewOnlyMode ? 'View Hierarchy for: ' : 'Build Hierarchy for: '} {segmentDetails.displayName}
          </h1>
          <CardDescription>
             {isViewOnlyMode ? 'Viewing the ' : 'Define the '} tree structure for the "{segmentDetails.displayName}" segment within the "{hierarchySet.name}" Hierarchy Set.
          </CardDescription>
        </header>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 overflow-y-auto px-4 md:px-6 lg:px-8 pb-4">
          <Card className="flex flex-col">
            <CardHeader className="pt-4 pb-2">
              <CardTitle className="text-lg">Available Codes: {segmentDetails.displayName}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0 overflow-y-auto">
              <div className="p-3 border-b shrink-0">
                <Input
                  placeholder="Search codes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={isViewOnlyMode}
                />
              </div>
              <div className="flex flex-col flex-1">
                <div className="px-3 pt-3 pb-1"><h4 className="text-md font-semibold text-muted-foreground">Summary Codes (Parents)</h4></div>
                <ScrollArea className="px-3 max-h-52 min-h-16">
                  {availableSummaryCodes.map(code => (
                    <div 
                      key={code.id} 
                      draggable={!isViewOnlyMode} 
                      onDragStart={(e) => handleDragStart(e, code)} 
                      className={`flex items-center p-1.5 mb-1 border rounded-md ${!isViewOnlyMode ? 'hover:bg-accent cursor-grab' : 'cursor-default'}`}
                    >
                      <GripVertical className="h-5 w-5 mr-2 text-muted-foreground shrink-0" />
                      <div><div className="font-medium text-sm">{code.code}</div><div className="text-xs text-muted-foreground">{code.description}</div></div>
                    </div>
                  ))}
                  {availableSummaryCodes.length === 0 && <p className="text-xs text-muted-foreground p-2">{searchTerm ? 'No matching summary codes.' : 'No summary codes available for this segment.'}</p>}
                </ScrollArea>
                <div className="px-3 pt-3 pb-1 border-t"><h4 className="text-md font-semibold text-muted-foreground">Detail Codes (Children)</h4></div>
                <ScrollArea className="px-3 pb-1 max-h-52 min-h-16">
                  {availableDetailCodes.map(code => (
                    <div 
                      key={code.id} 
                      draggable={!isViewOnlyMode}
                      onDragStart={(e) => handleDragStart(e, code)} 
                      className={`flex items-center p-1.5 mb-1 border rounded-md ${!isViewOnlyMode ? 'hover:bg-accent cursor-grab' : 'cursor-default'}`}
                    >
                        <GripVertical className="h-5 w-5 mr-2 text-muted-foreground shrink-0" />
                        <div><div className="font-medium text-sm">{code.code}</div><div className="text-xs text-muted-foreground">{code.description}</div></div>
                    </div>
                  ))}
                  {availableDetailCodes.length === 0 && <p className="text-xs text-muted-foreground p-2">{searchTerm ? 'No matching detail codes.' : 'No detail codes available for this segment.'}</p>}
                </ScrollArea>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 flex flex-col" onDragOver={handleDragOver} onDrop={handleDrop}>
            <CardHeader className="pt-4 pb-2">
              <CardTitle className="text-lg">Tree Structure</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-3 bg-slate-50">
            {!isViewOnlyMode && selectedParentNodeDetails && selectedParentNodeDetails.segmentCode.summaryIndicator && (
                <Card className="mb-3 p-3 shadow shrink-0">
                  <h3 className="text-md font-semibold mb-1 text-primary">Add Codes to: {selectedParentNodeDetails.segmentCode.code}</h3>
                  <div className="flex items-end gap-2 mb-1">
                    <div className="flex-1 space-y-1"><Label htmlFor="rangeStartCode" className="text-xs">Start Code</Label><Input id="rangeStartCode" value={rangeStartCode} onChange={(e) => setRangeStartCode(e.target.value)} className="h-8 text-xs" /></div>
                    <div className="flex-1 space-y-1"><Label htmlFor="rangeEndCode" className="text-xs">End Code</Label><Input id="rangeEndCode" value={rangeEndCode} onChange={(e) => setRangeEndCode(e.target.value)} className="h-8 text-xs" /></div>
                    <Button onClick={handleAddRangeToParent} size="sm" className="h-8">Add Range</Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Codes within range (inclusive) will be added.</p>
                </Card>
              )}
              <ScrollArea className="flex-1 min-h-0">
                {treeNodes.length === 0 ? (
                  <div className="text-center text-muted-foreground h-full flex flex-col items-center justify-center py-6">
                    <FolderTree className="w-12 h-12 text-slate-400 mb-3" />
                    <p className="text-md mb-1">{getDropZoneMessage()}</p>
                    {!isViewOnlyMode && <p className="text-xs">(Only SUMMARY codes can be parents.)</p>}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {treeNodes.map((rootNode) => (
                      <TreeNodeDisplay key={rootNode.id} node={rootNode} level={0} selectedParentNodeId={selectedParentNodeId} onSelectParent={handleSelectParent} onRemoveNode={handleRemoveNode} isViewOnlyMode={isViewOnlyMode} />
                    ))}
                  </div>
                )}
              </ScrollArea>
              {!isViewOnlyMode && selectedParentNodeDetails && selectedParentNodeDetails.segmentCode.summaryIndicator && (
                  <div className="mt-2 p-2 border border-dashed border-green-500 rounded-md bg-green-50/70 text-center text-xs text-green-700 shrink-0">
                      Adding to: '{selectedParentNodeDetails.segmentCode.code}'. Drag/drop or use 'Add Range'.
                  </div>
              )}
              {!isViewOnlyMode && !selectedParentNodeId && treeNodes.length > 0 && (
                  <div className="mt-2 p-2 border border-dashed border-blue-500 rounded-md bg-blue-50/70 text-center text-xs text-blue-700 shrink-0">
                      No parent selected. Drag new SUMMARY code for another root, or click existing SUMMARY node.
                  </div>
              )}
            </CardContent>
          </Card>
      </div>
      <div className="p-4 md:p-6 lg:p-8 border-t bg-background sticky bottom-0">
          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={handleCancel}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Set
            </Button>
            {isViewOnlyMode ? (
                <Button type="button" onClick={handleEnableEditing}>
                    <Edit3 className="mr-2 h-4 w-4" /> Enable Editing
                </Button>
            ) : (
                <Button type="button" onClick={handleSaveTree}>
                    Save Tree Structure
                </Button>
            )}
          </div>
      </div>
    </div>
  );
}
    

    



    