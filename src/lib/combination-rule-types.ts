
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

// Initial mock data for combination rules (can be empty initially)
export const initialCombinationRulesData: CombinationRule[] = [
  {
    id: 'cr-1',
    name: 'Fund/Object Core Spending Rule',
    status: 'Active',
    segmentAId: 'fund', // Assuming 'fund' is an ID from your SegmentsContext
    segmentBId: 'object', // Assuming 'object' is an ID from your SegmentsContext
    description: 'Restricts spending from General Fund (100-109) to operational expense objects (6000-6999).',
    mappingEntries: [
      {
        id: 'map-1-1',
        segmentACriterion: { type: 'CODE', codeValue: '101' },
        segmentBCriterion: { type: 'RANGE', rangeStartValue: '6000', rangeEndValue: '6199' },
      },
      {
        id: 'map-1-2',
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
    mappingEntries: [], // To be defined
    lastModifiedDate: new Date(2024, 0, 10),
    lastModifiedBy: 'Finance Lead',
  }
];
