
import type { SegmentCode } from './segment-types';

// Interface for a node in our hierarchy tree
export interface HierarchyNode {
  id: string; // Unique ID for this node instance in the tree
  segmentCode: SegmentCode; // The segment code this node represents
  children: HierarchyNode[];
}

// Interface for a Hierarchy definition
export interface Hierarchy {
  id: string; // Unique ID for the hierarchy itself
  name: string;
  segmentId: string; // ID of the segment this hierarchy is for (e.g., 'fund', 'department')
  status: 'Active' | 'Inactive' | 'Deprecated';
  description?: string;
  treeNodes: HierarchyNode[]; // The root nodes of the hierarchy tree
  lastModifiedDate?: Date;
  lastModifiedBy?: string; // Placeholder for user tracking
}

// Initial mock data for hierarchies (flat array)
export const initialHierarchiesData: Hierarchy[] = [
  { 
    id: 'fund-h1', 
    name: 'Standard Fund Hierarchy', 
    segmentId: 'fund', 
    status: 'Active', 
    lastModifiedDate: new Date(2023, 10, 15), 
    lastModifiedBy: 'Admin User',
    description: 'Main reporting hierarchy for funds.',
    treeNodes: [
      // Example simple tree structure for this fund hierarchy
      {
        id: 'fund-root-100',
        segmentCode: { id: 'fb-f-100', code: '100', description: 'General Fund', summaryIndicator: true, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: false, availableForBudgeting: true },
        children: [
          {
            id: 'fund-child-101',
            segmentCode: { id: 'fb-f-101', code: '101', description: 'Governmental Operating Fund', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true },
            children: []
          },
          {
            id: 'fund-child-102',
            segmentCode: { id: 'fb-f-102', code: '102', description: 'Enterprise Parking Fund', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true },
            children: []
          }
        ]
      },
      {
        id: 'fund-root-200',
        segmentCode: { id: 'fb-f-200', code: '200', description: 'Grants & Donations Fund', summaryIndicator: true, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: false, availableForBudgeting: true },
        children: [
           {
            id: 'fund-child-210',
            segmentCode: { id: 'fb-f-210', code: '210', description: 'Federal Grant A', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true },
            children: []
          }
        ]
      }
    ]
  },
  { 
    id: 'fund-h2', 
    name: 'Budgeting Fund Rollup', 
    segmentId: 'fund', 
    status: 'Inactive', 
    lastModifiedDate: new Date(2023, 8, 1), 
    lastModifiedBy: 'Finance Team',
    description: 'Hierarchy for budget preparation rollup.',
    treeNodes: [] // Empty tree for now
  },
  { 
    id: 'dept-h1', 
    name: 'Organizational Chart View', 
    segmentId: 'department', 
    status: 'Active', 
    lastModifiedDate: new Date(2024, 0, 5), 
    lastModifiedBy: 'System Admin',
    treeNodes: [] 
  },
  { 
    id: 'object-h1', 
    name: 'Expense Object Rollup', 
    segmentId: 'object', 
    status: 'Active', 
    lastModifiedDate: new Date(2024, 1, 10), 
    lastModifiedBy: 'Finance Team',
    treeNodes: [] 
  },
  { 
    id: 'project-h1', 
    name: 'Capital Projects Hierarchy', 
    segmentId: 'project', 
    status: 'Deprecated', 
    lastModifiedDate: new Date(2023, 5, 20), 
    lastModifiedBy: 'Admin User',
    treeNodes: [] 
  }
];
