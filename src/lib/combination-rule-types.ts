
export type CombinationRuleCriterionType = 'CODE' | 'RANGE' | 'HIERARCHY_NODE';

export interface CombinationRuleCriterion {
  type: CombinationRuleCriterionType;
  // For CODE type
  codeValue?: string; 
  // For RANGE type
  rangeStartValue?: string;
  rangeEndValue?: string;
  // For HIERARCHY_NODE type
  hierarchyNodeId?: string; // ID of the HierarchyNode from a specific Hierarchy
  includeChildren?: boolean; // If the rule applies to children of the hierarchy node
}

export interface CombinationRuleMappingEntry {
  id: string; // Unique ID for this mapping entry within the rule
  behavior: 'Include' | 'Exclude'; // Specifies if the combination is allowed or disallowed
  segmentACriterion: CombinationRuleCriterion;
  segmentBCriterion: CombinationRuleCriterion;
}

export interface CombinationRule {
  id: string;
  name: string;
  status: 'Active' | 'Inactive';
  description?: string;
  segmentAId: string;
  segmentBId: string;
  mappingEntries: CombinationRuleMappingEntry[]; // Defines the specific combinations
  lastModifiedDate: Date;
  lastModifiedBy: string; // Placeholder for user tracking
}

// Initial mock data for combination rules
export const initialCombinationRulesData: CombinationRule[] = [
  {
    id: 'cr-1',
    name: 'Fund/Object Core Spending Rule',
    status: 'Active',
    segmentAId: 'fund', 
    segmentBId: 'object', 
    description: 'Restricts spending from General Fund (100-109) to operational expense objects (6000-6999).',
    mappingEntries: [
      {
        id: 'map-1-1',
        behavior: 'Include',
        segmentACriterion: { type: 'CODE', codeValue: '101' },
        segmentBCriterion: { type: 'RANGE', rangeStartValue: '6000', rangeEndValue: '6199' },
      },
      {
        id: 'map-1-2',
        behavior: 'Include',
        segmentACriterion: { type: 'CODE', codeValue: '102' },
        segmentBCriterion: { type: 'CODE', codeValue: '6200' },
      }
    ],
    lastModifiedDate: new Date(2023, 11, 1),
    lastModifiedBy: 'Admin',
  },
  {
    id: 'cr-2',
    name: 'Grant Specific Department Restriction',
    status: 'Inactive',
    segmentAId: 'grant', 
    segmentBId: 'department',
    description: 'Federal Grant A (GR-A) can only be used by Finance (FIN) and Police (PD) departments.',
    mappingEntries: [
      {
        id: 'map-2-1',
        behavior: 'Include',
        segmentACriterion: { type: 'CODE', codeValue: 'GR-A' },
        segmentBCriterion: { type: 'CODE', codeValue: 'FIN' }
      },
      {
        id: 'map-2-2',
        behavior: 'Include',
        segmentACriterion: { type: 'CODE', codeValue: 'GR-A' },
        segmentBCriterion: { type: 'CODE', codeValue: 'PD' }
      },
      {
        id: 'map-2-3',
        behavior: 'Exclude', // Example of an exclusion
        segmentACriterion: { type: 'CODE', codeValue: 'GR-A' },
        segmentBCriterion: { type: 'CODE', codeValue: 'HR' } // HR cannot use GR-A
      }
    ],
    lastModifiedDate: new Date(2024, 0, 10),
    lastModifiedBy: 'Finance Lead',
  }
];
