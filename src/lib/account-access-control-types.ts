
export type AccessControlAppliesToType = 'User' | 'Role';
export type AccessControlRuleStatus = 'Active' | 'Inactive';
export type AccessControlDefaultBehavior = 'Full Access' | 'No Access'; // Within a rule, if no restrictions match
export type AccessControlAccessType = 'Read-Only' | 'Editable' | 'No Access'; // For a specific restriction

export type AccessControlCriterionType = 'All' | 'SpecificCode' | 'CodeRange' | 'HierarchyNode';

export interface SegmentCriterion {
  id: string; // Unique ID for this criterion within a restriction
  segmentId: string;
  criterionType: AccessControlCriterionType;
  codeValue?: string;
  rangeStartValue?: string;
  rangeEndValue?: string;
  hierarchyNodeId?: string;
  includeChildren?: boolean;
}

export interface AccessControlRestriction {
  id: string; // Unique ID for this restriction within the rule
  description?: string; // Optional description for the restriction line
  segmentCriteria: SegmentCriterion[]; // Allows for multi-segment conditions, e.g., Fund X AND Object Y
  accessType: AccessControlAccessType;
}

export interface AccessControlRule {
  id: string;
  name: string;
  description?: string;
  status: AccessControlRuleStatus;
  appliesToType: AccessControlAppliesToType;
  appliesToId: string; // User ID or Role ID/Name
  appliesToName: string; // User Name or Role Name (for display)
  defaultBehaviorForRule: AccessControlDefaultBehavior; // Default if rule applies but no restrictions match
  restrictions: AccessControlRestriction[];
  lastModifiedDate: Date;
  lastModifiedBy: string;
}

// Initial mock data for account access control rules
export const initialAccountAccessControlRulesData: AccessControlRule[] = [
  {
    id: 'aac-rule-1',
    name: 'Finance Read-Only Access to Sensitive Funds',
    status: 'Active',
    appliesToType: 'Role',
    appliesToId: 'FINANCE_USER_ROLE',
    appliesToName: 'Finance Standard User',
    defaultBehaviorForRule: 'No Access', // If this rule applies, but no specific restriction matches, deny.
    restrictions: [
      {
        id: 'res-1-1',
        segmentCriteria: [
          { id: 'sc-1-1-1', segmentId: 'fund', criterionType: 'SpecificCode', codeValue: 'FND-SENSITIVE-A' },
        ],
        accessType: 'Read-Only',
        description: "Read-only access to Sensitive Fund A"
      },
      {
        id: 'res-1-2',
        segmentCriteria: [
          { id: 'sc-1-2-1', segmentId: 'fund', criterionType: 'SpecificCode', codeValue: 'FND-SENSITIVE-B' },
        ],
        accessType: 'Read-Only',
        description: "Read-only access to Sensitive Fund B"
      },
    ],
    lastModifiedDate: new Date(2023, 11, 5),
    lastModifiedBy: 'Admin',
  },
  {
    id: 'aac-rule-2',
    name: 'AP Clerk Access to Operational Objects',
    status: 'Active',
    appliesToType: 'User',
    appliesToId: 'ap_clerk_01',
    appliesToName: 'John Doe (AP Clerk)',
    defaultBehaviorForRule: 'No Access',
    restrictions: [
      {
        id: 'res-2-1',
        segmentCriteria: [
          { id: 'sc-2-1-1', segmentId: 'object', criterionType: 'CodeRange', rangeStartValue: '6000', rangeEndValue: '6999' },
          // Example of multi-segment:
          // { id: 'sc-2-1-2', segmentId: 'department', criterionType: 'SpecificCode', codeValue: 'FINANCE' }
        ],
        accessType: 'Editable',
        description: "Editable access to operational expense objects"
      },
    ],
    lastModifiedDate: new Date(2024, 0, 15),
    lastModifiedBy: 'Finance Manager',
  },
  {
    id: 'aac-rule-3',
    name: 'Department Head Full Access (Default)',
    status: 'Active',
    appliesToType: 'Role',
    appliesToId: 'DEPT_HEAD_ROLE',
    appliesToName: 'Department Head',
    defaultBehaviorForRule: 'Full Access', // This rule essentially grants full access by default
    restrictions: [], // No specific restrictions means default behavior applies widely for this role.
    lastModifiedDate: new Date(2023, 10, 1),
    lastModifiedBy: 'Admin',
  },
];
