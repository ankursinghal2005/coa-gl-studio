
import type { SegmentCode } from './segment-types';

// Node in a hierarchy tree (remains the same)
export interface HierarchyNode {
  id: string; // Unique ID for this node instance in the tree
  segmentCode: SegmentCode; // The segment code this node represents
  children: HierarchyNode[];
}

// Represents a specific hierarchy for a single segment *within* a HierarchySet
export interface SegmentHierarchyInSet {
  id: string; // Unique ID for this segment-specific hierarchy within the set, e.g., "sh-gasb-fund"
  segmentId: string; // ID of the segment this hierarchy is for (e.g., 'fund')
  // name?: string; // Optional name if needed, e.g., "Fund Hierarchy for GASB". Could be derived.
  description?: string; // Optional description for this segment's role in the set
  treeNodes: HierarchyNode[];
}

// Top-level Hierarchy Set (e.g., "GASB Reporting", "Budget Hierarchy")
export interface HierarchySet {
  id: string; // Unique ID for the hierarchy set itself, e.g., "hset-gasb-1"
  name: string;
  status: 'Active' | 'Inactive' | 'Deprecated';
  description?: string;
  validFrom: Date;
  validTo?: Date;
  segmentHierarchies: SegmentHierarchyInSet[]; // Array of segment-specific hierarchies
  lastModifiedDate?: Date;
  lastModifiedBy?: string; // Placeholder for user tracking
}

// Initial mock data for hierarchy sets
export const initialHierarchiesData: HierarchySet[] = [
  {
    id: 'hset-gasb-1',
    name: 'GASB General Purpose Reporting Structure',
    status: 'Active',
    description: 'Standard reporting structure for city-wide GASB financial statements.',
    validFrom: new Date(2024, 0, 1), // Jan 1, 2024
    validTo: new Date(2024, 11, 31), // Dec 31, 2024
    segmentHierarchies: [
      {
        id: 'sh-gasb-fund',
        segmentId: 'fund',
        description: 'Fund hierarchy rollup for GASB reports, focusing on major fund types.',
        treeNodes: [
          {
            id: 'gasb-fund-root-gov',
            segmentCode: { id: 'fb-f-100', code: '100', description: 'Governmental Funds (GASB)', summaryIndicator: true, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: false, availableForBudgeting: true },
            children: [
              {
                id: 'gasb-fund-child-101',
                segmentCode: { id: 'fb-f-101', code: '101', description: 'General Operating Fund', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true },
                children: []
              },
              {
                id: 'gasb-fund-child-103',
                segmentCode: { id: 'fb-f-103', code: '103', description: 'Special Revenue - Grants (GASB)', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true },
                children: []
              }
            ]
          },
          {
            id: 'gasb-fund-root-ent',
            segmentCode: { id: 'fb-f-200', code: '200', description: 'Enterprise Funds (GASB)', summaryIndicator: true, isActive: true, validFrom: new Date(2023,6,1), validTo: new Date(2024,11,31), availableForTransactionCoding: false, availableForBudgeting: true },
            children: [
               {
                id: 'gasb-fund-child-102', // Re-using existing code, assuming it fits
                segmentCode: { id: 'fb-f-102', code: '102', description: 'Parking Enterprise Fund', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true },
                children: []
              }
            ]
          }
        ]
      },
      {
        id: 'sh-gasb-dept', // Example: Department hierarchy for functional expense reporting
        segmentId: 'department',
        description: 'Functional department rollup for statement of activities.',
        treeNodes: [
           {
            id: 'gasb-dept-root-govops',
            segmentCode: { id: 'fb-d-FIN', code: 'FIN', description: 'General Government (GASB Summary)', summaryIndicator: true, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: false, availableForBudgeting: true },
            children: [
              {
                id: 'gasb-dept-child-finance',
                segmentCode: { id: 'fb-d-FIN-ACC', code: 'FIN-ACC', description: 'Finance & Accounting', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true },
                children: []
              },
              {
                id: 'gasb-dept-child-hr',
                segmentCode: { id: 'fb-d-HR', code: 'HR', description: 'Human Resources Dept', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true },
                children: []
              }
            ]
          }
        ]
      },
      {
        id: 'sh-gasb-object', // Example: Object hierarchy for expense classification
        segmentId: 'object',
        description: 'Object code rollup for natural expense classification.',
        treeNodes: [
           {
            id: 'gasb-obj-root-personnel',
            segmentCode: { id: 'fb-o-5000', code: '5000', description: 'Personnel Services (GASB)', summaryIndicator: true, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: false, availableForBudgeting: true },
            children: [] // Details to be added
          }
        ]
      }
    ],
    lastModifiedDate: new Date(2024, 1, 15), // Feb 15, 2024
    lastModifiedBy: 'SysAdmin',
  },
  {
    id: 'hset-budget-1',
    name: 'FY2025 Budget Preparation Hierarchy',
    status: 'Active',
    description: 'Hierarchy set used for preparing the Fiscal Year 2025 budget.',
    validFrom: new Date(2024, 6, 1), // July 1, 2024
    segmentHierarchies: [
      {
        id: 'sh-budget-dept',
        segmentId: 'department',
        description: 'Departmental rollup for budget allocation and control.',
        treeNodes: [] // Empty tree for now, to be built by budget officers
      },
      {
        id: 'sh-budget-object',
        segmentId: 'object',
        description: 'Object code hierarchy for detailed budget line items.',
        treeNodes: [] // Empty tree for now
      }
    ],
    lastModifiedDate: new Date(2024, 2, 1), // Mar 1, 2024
    lastModifiedBy: 'BudgetDirector',
  }
];
