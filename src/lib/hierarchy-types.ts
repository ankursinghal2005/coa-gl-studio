
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
    segmentHierarchies: [
      {
        id: 'sh-gasb-fund',
        segmentId: 'fund',
        description: 'Fund hierarchy rollup for GASB reports, focusing on major fund types.',
        treeNodes: [
          {
            id: 'gasb-fund-root-gov',
            segmentCode: { id: 'fb-f-100', code: '100', description: 'General Fund (Summary)', summaryIndicator: true, isActive: true, validFrom: new Date(Date.UTC(2023,0,1)), availableForTransactionCoding: false, availableForBudgeting: true, defaultParentCode: '' },
            children: [
              {
                id: 'gasb-fund-child-101',
                segmentCode: { id: 'fb-f-101', code: '101', description: 'Governmental Operating Fund', summaryIndicator: false, isActive: true, validFrom: new Date(Date.UTC(2023,0,1)), availableForTransactionCoding: true, availableForBudgeting: true, defaultParentCode: '100' },
                children: []
              },
              {
                id: 'gasb-fund-child-103',
                segmentCode: { id: 'fb-f-103', code: '103', description: 'Special Revenue Fund - Grants', summaryIndicator: false, isActive: true, validFrom: new Date(Date.UTC(2023,0,1)), availableForTransactionCoding: true, availableForBudgeting: true, defaultParentCode: '100' },
                children: []
              }
            ]
          },
          {
            id: 'gasb-fund-root-ent',
            segmentCode: { id: 'fb-f-200', code: '200', description: 'Enterprise Funds (Summary)', summaryIndicator: true, isActive: true, validFrom: new Date(Date.UTC(2023,6,1)), validTo: new Date(Date.UTC(2024,11,31)), availableForTransactionCoding: false, availableForBudgeting: true, defaultParentCode: '' },
            children: [
               {
                id: 'gasb-fund-child-102', 
                segmentCode: { id: 'fb-f-102', code: '102', description: 'Enterprise Parking Fund', summaryIndicator: false, isActive: true, validFrom: new Date(Date.UTC(2023,0,1)), availableForTransactionCoding: true, availableForBudgeting: true, defaultParentCode: '200' },
                children: []
              }
            ]
          }
        ]
      },
      {
        id: 'sh-gasb-dept', 
        segmentId: 'department',
        description: 'Functional department rollup for statement of activities.',
        treeNodes: [
           {
            id: 'gasb-dept-root-govops',
            segmentCode: { id: 'fb-d-GOV', code: 'GOV', description: 'General Government (Summary)', summaryIndicator: true, isActive: true, validFrom: new Date(Date.UTC(2023,0,1)), availableForTransactionCoding: false, availableForBudgeting: true, defaultParentCode: '' },
            children: [
              {
                id: 'gasb-dept-child-finance',
                segmentCode: { id: 'fb-d-FIN', code: 'FIN', description: 'Finance Department', summaryIndicator: true, isActive: true, validFrom: new Date(Date.UTC(2023,0,1)), availableForTransactionCoding: false, availableForBudgeting: true, defaultParentCode: 'GOV' },
                children: [
                    {
                        id: 'gasb-dept-grandchild-fin-acc',
                        segmentCode: { id: 'fb-d-FIN-ACC', code: 'FIN-ACC', description: 'Accounting Division', summaryIndicator: false, isActive: true, validFrom: new Date(Date.UTC(2023,0,1)), availableForTransactionCoding: true, availableForBudgeting: true, defaultParentCode: 'FIN' },
                        children: []
                    }
                ]
              },
              {
                id: 'gasb-dept-child-hr',
                segmentCode: { id: 'fb-d-HR', code: 'HR', description: 'Human Resources Dept', summaryIndicator: true, isActive: true, validFrom: new Date(Date.UTC(2023,0,1)), availableForTransactionCoding: false, availableForBudgeting: true, defaultParentCode: 'GOV' },
                children: []
              }
            ]
          }
        ]
      },
      {
        id: 'sh-gasb-object', 
        segmentId: 'object',
        description: 'Object code rollup for natural expense classification.',
        treeNodes: [
           {
            id: 'gasb-obj-root-personnel',
            segmentCode: { id: 'fb-o-EXP', code: 'EXP', description: 'Expenditures (Summary)', summaryIndicator: true, isActive: true, validFrom: new Date(Date.UTC(2023,0,1)), availableForTransactionCoding: false, availableForBudgeting: true, defaultParentCode: '' },
            children: [
                {
                  id: 'gasb-obj-child-pers',
                  segmentCode: { id: 'fb-o-5000', code: '5000', description: 'Personnel Services (Summary)', summaryIndicator: true, isActive: true, validFrom: new Date(Date.UTC(2023,0,1)), availableForTransactionCoding: false, availableForBudgeting: true, defaultParentCode: 'EXP' },
                  children: []
                }
            ]
          }
        ]
      }
    ],
    lastModifiedDate: new Date(Date.UTC(2024, 1, 15)), 
    lastModifiedBy: 'SysAdmin',
  },
  {
    id: 'hset-budget-1',
    name: 'FY2025 Budget Preparation Hierarchy',
    status: 'Active',
    description: 'Hierarchy set used for preparing the Fiscal Year 2025 budget.',
    segmentHierarchies: [
      {
        id: 'sh-budget-dept',
        segmentId: 'department',
        description: 'Departmental rollup for budget allocation and control.',
        treeNodes: [] 
      },
      {
        id: 'sh-budget-object',
        segmentId: 'object',
        description: 'Object code hierarchy for detailed budget line items.',
        treeNodes: [] 
      }
    ],
    lastModifiedDate: new Date(Date.UTC(2024, 2, 1)), 
    lastModifiedBy: 'BudgetDirector',
  },
  {
    id: 'hset-system-default-code-hierarchy',
    name: 'Default Code Structures (System)',
    status: 'Active',
    description: "Automatically generated and updated based on 'Default Parent Code' in segment code definitions. Managed by the system.",
    segmentHierarchies: [],
    lastModifiedDate: undefined,
    lastModifiedBy: 'System (Initial Build)',
  }
];
