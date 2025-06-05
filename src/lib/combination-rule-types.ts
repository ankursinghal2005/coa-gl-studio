
export type CombinationRuleCriterionType = 'CODE' | 'RANGE' | 'HIERARCHY_NODE';

export interface CombinationRuleCriterion {
  type: CombinationRuleCriterionType;
  codeValue?: string;
  rangeStartValue?: string;
  rangeEndValue?: string;
  hierarchyNodeId?: string;
  includeChildren?: boolean;
}

export interface SegmentCondition {
  id: string; // Unique ID for this specific segment condition within the definition entry
  segmentId: string;
  criterion: CombinationRuleCriterion;
}

export interface CombinationRuleDefinitionEntry {
  id: string; // Unique ID for this definition entry (e.g., a specific scenario in the rule)
  description?: string;
  behavior: 'Include' | 'Exclude';
  segmentConditions: SegmentCondition[]; // Conditions for various segments
}

export interface CombinationRule {
  id: string;
  name: string;
  status: 'Active' | 'Inactive';
  description?: string;
  definitionEntries: CombinationRuleDefinitionEntry[];
  lastModifiedDate: Date;
  lastModifiedBy: string;
}

// Initial data is now empty due to structural changes.
export const initialCombinationRulesData: CombinationRule[] = [];
