
export type DataType = 'Alphanumeric' | 'Numeric' | 'Text';

export interface CustomFieldDefinition {
  id: string;
  label: string;
  type: 'Text' | 'Number' | 'Date' | 'Boolean' | 'Dropdown';
  required: boolean;
  dropdownOptions?: string[];
}

export interface Segment {
  id: string;
  displayName: string;
  segmentType: string;
  dataType: DataType;
  maxLength: number;
  specialCharsAllowed: string;
  defaultCode?: string;
  separator: '-' | '|' | ',' | '.';
  isCustom: boolean;
  isMandatoryForCoding: boolean;
  isActive: boolean;
  isCore: boolean;
  validFrom: Date;
  validTo?: Date;
  customFields?: CustomFieldDefinition[];
}

export const initialSegmentsData: Segment[] = [
  { id: 'fund', displayName: 'Fund', segmentType: 'Fund', dataType: 'Alphanumeric', maxLength: 10, specialCharsAllowed: '', defaultCode: '101', separator: '-', isCustom: false, isMandatoryForCoding: true, isActive: true, isCore: true, validFrom: new Date(2023, 0, 1), customFields: [] },
  { id: 'object', displayName: 'Object', segmentType: 'Object', dataType: 'Alphanumeric', maxLength: 10, specialCharsAllowed: '', defaultCode: '4001', separator: '-', isCustom: false, isMandatoryForCoding: true, isActive: true, isCore: true, validFrom: new Date(2023, 0, 1), customFields: [] },
  { id: 'department', displayName: 'Department', segmentType: 'Department', dataType: 'Alphanumeric', maxLength: 15, specialCharsAllowed: '', defaultCode: 'POL-1', separator: '-', isCustom: false, isMandatoryForCoding: true, isActive: true, isCore: true, validFrom: new Date(2023, 0, 1), customFields: [] },
  { 
    id: 'project', 
    displayName: 'Project', 
    segmentType: 'Project', 
    dataType: 'Alphanumeric', 
    maxLength: 20, 
    specialCharsAllowed: '-_', 
    defaultCode: 'BUILD', 
    separator: '-', 
    isCustom: false, 
    isMandatoryForCoding: false, 
    isActive: true, 
    isCore: false, 
    validFrom: new Date(2023, 0, 1), 
    customFields: [
      { id: 'proj-status-field', label: 'Project Status', type: 'Text', required: false },
      { id: 'proj-start-date-field', label: 'Project Start Date', type: 'Date', required: true }
    ] 
  },
  { id: 'grant', displayName: 'Grant', segmentType: 'Grant', dataType: 'Alphanumeric', maxLength: 20, specialCharsAllowed: '-_', defaultCode: '1111', separator: '-', isCustom: false, isMandatoryForCoding: false, isActive: true, isCore: false, validFrom: new Date(2023, 0, 1), customFields: [] },
  { id: 'function', displayName: 'Function', segmentType: 'Function', dataType: 'Numeric', maxLength: 5, specialCharsAllowed: '', defaultCode: '2302', separator: '-', isCustom: false, isMandatoryForCoding: false, isActive: true, isCore: false, validFrom: new Date(2023, 0, 1), customFields: [] },
  { id: 'location', displayName: 'Location', segmentType: 'Location', dataType: 'Alphanumeric', maxLength: 10, specialCharsAllowed: '', defaultCode: 'KLN1', separator: '-', isCustom: false, isMandatoryForCoding: false, isActive: true, isCore: false, validFrom: new Date(2023, 0, 1), customFields: [] },
  { id: 'program', displayName: 'Program', segmentType: 'Program', dataType: 'Text', maxLength: 50, specialCharsAllowed: '-_ ', defaultCode: '9999', separator: '-', isCustom: false, isMandatoryForCoding: false, isActive: true, isCore: false, validFrom: new Date(2023, 0, 1), customFields: [] },
];

// Consolidated SegmentCode interface
export interface SegmentCode {
  id: string; // Unique ID for the code instance, e.g., "fund-100", "dept-FIN"
  code: string; // The actual code value, e.g., "100", "FIN"
  description: string;
  external1?: string;
  external2?: string;
  external3?: string;
  external4?: string;
  external5?: string;
  summaryIndicator: boolean;
  isActive: boolean;
  validFrom: Date;
  validTo?: Date;
  availableForTransactionCoding: boolean;
  availableForBudgeting: boolean;
  allowedSubmodules?: string[]; 
  customFieldValues?: Record<string, any>; 
  defaultParentCode?: string; // New field
}

// Shared mock segment codes data
export const mockSegmentCodesData: Record<string, SegmentCode[]> = {
  'fund': [
    // Level 1 Parents
    { id: 'fb-f-100', code: '100', description: 'General Fund (Summary)', summaryIndicator: true, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: false, availableForBudgeting: true, external1: "GF-001", allowedSubmodules: ['General Ledger', 'Accounts Payable'], customFieldValues: {}, defaultParentCode: '' },
    { id: 'fb-f-200', code: '200', description: 'Enterprise Funds (Summary)', summaryIndicator: true, isActive: true, validFrom: new Date(2023,6,1), validTo: new Date(2024,11,31), availableForTransactionCoding: false, availableForBudgeting: true, external2: "Summary", customFieldValues: {}, defaultParentCode: '' },
    { id: 'fb-f-300', code: '300', description: 'Capital Outlay Fund (Summary)', summaryIndicator: true, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: false, availableForBudgeting: true, customFieldValues: {}, defaultParentCode: '' },
    { id: 'fb-f-400', code: '400', description: 'Fiduciary Funds (Summary)', summaryIndicator: true, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: false, availableForBudgeting: true, customFieldValues: {}, defaultParentCode: '' },


    // Children of 100
    { id: 'fb-f-101', code: '101', description: 'Governmental Operating Fund', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true, external1: "SRFA-001", allowedSubmodules: ['General Ledger'], customFieldValues: {}, defaultParentCode: '100' },
    { id: 'fb-f-101A', code: '101A', description: 'Operating Sub-Fund A', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true, customFieldValues: {}, defaultParentCode: '101' }, // Grandchild
    { id: 'fb-f-101B', code: '101B', description: 'Operating Sub-Fund B', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true, customFieldValues: {}, defaultParentCode: '101' }, // Grandchild
    { id: 'fb-f-103', code: '103', description: 'Special Revenue Fund - Grants', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true, external1: "DSFC-001", customFieldValues: {}, defaultParentCode: '100' },
    { id: 'fb-f-105', code: '105', description: 'Debt Service Fund - Bonds', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true, customFieldValues: {}, defaultParentCode: '100' },
    { id: 'fb-f-106', code: '106', description: 'Internal Service Fund - IT', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true, customFieldValues: {}, defaultParentCode: '100' },


    // Children of 200
    { id: 'fb-f-102', code: '102', description: 'Enterprise Parking Fund', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true, external1: "CPFB-001", customFieldValues: {}, defaultParentCode: '200' },
    { id: 'fb-f-210', code: '210', description: 'Enterprise Water Fund', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true, external1: "SRFD-001", customFieldValues: {}, defaultParentCode: '200'},
    { id: 'fb-f-210A', code: '210A', description: 'Water Fund - Operations', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true, customFieldValues: {}, defaultParentCode: '210'}, // Grandchild
    { id: 'fb-f-220', code: '220', description: 'Enterprise Sewer Fund', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true, external1: "CPFE-001", customFieldValues: {}, defaultParentCode: '200'},
    { id: 'fb-f-230', code: '230', description: 'Enterprise Airport Fund', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true, external1: "DSFF-001", customFieldValues: {}, defaultParentCode: '200'},

    // Children of 300
    { id: 'fb-f-104', code: '104', description: 'Capital Projects Fund - Infrastructure', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true, customFieldValues: {}, defaultParentCode: '300' },
    { id: 'fb-f-301', code: '301', description: 'Building Project Z (Detail)', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true, customFieldValues: {}, defaultParentCode: '300' },
    { id: 'fb-f-310', code: '310', description: 'Equipment Purchase X', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true, customFieldValues: {}, defaultParentCode: '300' },
    { id: 'fb-f-320', code: '320', description: 'Infrastructure Upgrade Y', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true, customFieldValues: {}, defaultParentCode: '300' },

    // Children of 400 (Fiduciary Funds)
    { id: 'fb-f-107', code: '107', description: 'Trust Fund - Pension', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true, customFieldValues: {}, defaultParentCode: '400' },
    { id: 'fb-f-108', code: '108', description: 'Agency Fund - Payroll Deductions', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true, customFieldValues: {}, defaultParentCode: '400' },
    { id: 'fb-f-109', code: '109', description: 'Permanent Fund - Library Endowment', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true, customFieldValues: {}, defaultParentCode: '400' },
    { id: 'fb-f-401', code: '401', description: 'Pension Reserve (Detail)', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true, customFieldValues: {}, defaultParentCode: '107' }, // Grandchild
  ],
  'department': [
    // Level 1 Parents
    { id: 'fb-d-GOV', code: 'GOV', description: 'General Government (Summary)', summaryIndicator: true, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: false, availableForBudgeting: true, customFieldValues: {}, defaultParentCode: '' },
    { id: 'fb-d-PS', code: 'PS', description: 'Public Safety (Summary)', summaryIndicator: true, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: false, availableForBudgeting: true, customFieldValues: {}, defaultParentCode: '' },
    
    // Children of GOV
    { id: 'fb-d-FIN', code: 'FIN', description: 'Finance Department', summaryIndicator: true, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: false, availableForBudgeting: true, allowedSubmodules: ['General Ledger'], customFieldValues: {}, defaultParentCode: 'GOV' },
    { id: 'fb-d-FIN-ACC', code: 'FIN-ACC', description: 'Accounting Division', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true, customFieldValues: {}, defaultParentCode: 'FIN' },
    { id: 'fb-d-FIN-BUD', code: 'FIN-BUD', description: 'Budgeting Division', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true, customFieldValues: {}, defaultParentCode: 'FIN' },
    { id: 'fb-d-FIN-BUD-ANL', code: 'FIN-BUD-ANL', description: 'Budget Analysis Team', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true, customFieldValues: {}, defaultParentCode: 'FIN-BUD' }, // Grandchild
    { id: 'fb-d-HR', code: 'HR', description: 'Human Resources Dept', summaryIndicator: true, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: false, availableForBudgeting: true, allowedSubmodules: ['Payroll'], customFieldValues: {}, defaultParentCode: 'GOV' },
    { id: 'fb-d-HR-REC', code: 'HR-REC', description: 'Recruitment Section', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true, customFieldValues: {}, defaultParentCode: 'HR' },
    { id: 'fb-d-HR-BEN', code: 'HR-BEN', description: 'Benefits Administration', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true, customFieldValues: {}, defaultParentCode: 'HR' },
    { id: 'fb-d-IT', code: 'IT', description: 'IT Department', summaryIndicator: true, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: false, availableForBudgeting: true, customFieldValues: {}, defaultParentCode: 'GOV' },
    { id: 'fb-d-IT-INFRA', code: 'IT-INFRA', description: 'IT Infrastructure', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true, customFieldValues: {}, defaultParentCode: 'IT' },
    { id: 'fb-d-IT-SUPPORT', code: 'IT-SUPPORT', description: 'IT Support Services', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true, customFieldValues: {}, defaultParentCode: 'IT' },


    // Children of PS
    { id: 'fb-d-PD', code: 'PD', description: 'Police Department', summaryIndicator: true, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: false, availableForBudgeting: true, customFieldValues: {}, defaultParentCode: 'PS' },
    { id: 'fb-d-PD-PATROL', code: 'PD-PATROL', description: 'Patrol Division', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true, customFieldValues: {}, defaultParentCode: 'PD' },
    { id: 'fb-d-FD', code: 'FD', description: 'Fire Department', summaryIndicator: true, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: false, availableForBudgeting: true, customFieldValues: {}, defaultParentCode: 'PS' },
    { id: 'fb-d-FD-OPS', code: 'FD-OPS', description: 'Fire Operations', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true, customFieldValues: {}, defaultParentCode: 'FD' },
    { id: 'fb-d-PW', code: 'PW', description: 'Public Works', summaryIndicator: true, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: false, availableForBudgeting: true, customFieldValues: {}, defaultParentCode: 'GOV'}, // Public Works often under General Gov.
    { id: 'fb-d-PW-ROADS', code: 'PW-ROADS', description: 'Roads Maintenance', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true, customFieldValues: {}, defaultParentCode: 'PW'},
  ],
  'object': [
    // Level 1 Parents
    { id: 'fb-o-REV', code: 'REV', description: 'Revenues (Summary)', summaryIndicator: true, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: false, availableForBudgeting: true, customFieldValues: {}, defaultParentCode: ''},
    { id: 'fb-o-EXP', code: 'EXP', description: 'Expenditures (Summary)', summaryIndicator: true, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: false, availableForBudgeting: true, customFieldValues: {}, defaultParentCode: ''},

    // Children of REV
    { id: 'fb-o-4000', code: '4000', description: 'Taxes (Summary)', summaryIndicator: true, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: false, availableForBudgeting: true, customFieldValues: {}, defaultParentCode: 'REV'},
    { id: 'fb-o-4100', code: '4100', description: 'Property Taxes', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true, customFieldValues: {}, defaultParentCode: '4000'},
    { id: 'fb-o-4200', code: '4200', description: 'Sales Taxes', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true, customFieldValues: {}, defaultParentCode: '4000'},

    // Children of EXP
    { id: 'fb-o-5000', code: '5000', description: 'Personnel Services (Summary)', summaryIndicator: true, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: false, availableForBudgeting: true, allowedSubmodules: ['Payroll', 'General Ledger'], customFieldValues: {}, defaultParentCode: 'EXP' },
    { id: 'fb-o-5100', code: '5100', description: 'Full-time Salaries (Detail)', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true, customFieldValues: {}, defaultParentCode: '5000' },
    { id: 'fb-o-5200', code: '5200', description: 'Part-time Salaries (Detail)', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true, customFieldValues: {}, defaultParentCode: '5000' },
    { id: 'fb-o-5300', code: '5300', description: 'Overtime Pay (Detail)', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true, customFieldValues: {}, defaultParentCode: '5000' },
    { id: 'fb-o-5400', code: '5400', description: 'Benefits (Summary)', summaryIndicator: true, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: false, availableForBudgeting: true, customFieldValues: {}, defaultParentCode: '5000'},
    { id: 'fb-o-5410', code: '5410', description: 'Health Insurance', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true, customFieldValues: {}, defaultParentCode: '5400'},


    { id: 'fb-o-6000', code: '6000', description: 'Operating Expenses (Summary)', summaryIndicator: true, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: false, availableForBudgeting: true, customFieldValues: {}, defaultParentCode: 'EXP' },
    { id: 'fb-o-6100', code: '6100', description: 'Office Supplies (Summary)', summaryIndicator: true, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: false, availableForBudgeting: true, allowedSubmodules: ['Accounts Payable'], customFieldValues: {}, defaultParentCode: '6000' },
    { id: 'fb-o-6110', code: '6110', description: 'Stationery (Detail)', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true, customFieldValues: {}, defaultParentCode: '6100' }, // Grandchild
    { id: 'fb-o-6120', code: '6120', description: 'Computer Supplies (Detail)', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true, customFieldValues: {}, defaultParentCode: '6100' }, // Grandchild
    { id: 'fb-o-6200', code: '6200', description: 'Utilities (Detail)', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true, allowedSubmodules: ['Accounts Payable'], customFieldValues: {}, defaultParentCode: '6000' },
    { id: 'fb-o-6300', code: '6300', description: 'Travel Expenses (Detail)', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true, customFieldValues: {}, defaultParentCode: '6000' },
  ],
  'project': [
    { 
      id: 'proj-001', 
      code: 'P001', 
      description: 'City Hall Renovation', 
      summaryIndicator: false, 
      isActive: true, 
      validFrom: new Date(2023,0,1), 
      availableForTransactionCoding: true, 
      availableForBudgeting: true, 
      allowedSubmodules: ['General Ledger', 'Accounts Payable'], 
      customFieldValues: {
        'proj-status-field': 'In Progress',
        'proj-start-date-field': new Date(2023, 2, 15)
      },
      defaultParentCode: ''
    },
    { 
      id: 'proj-002', 
      code: 'P002', 
      description: 'New Park Development', 
      summaryIndicator: false, 
      isActive: true, 
      validFrom: new Date(2024,0,1), 
      availableForTransactionCoding: true, 
      availableForBudgeting: true, 
      allowedSubmodules: ['General Ledger', 'Accounts Payable'], 
      customFieldValues: {
        'proj-status-field': 'Planning',
        'proj-start-date-field': new Date(2024, 5, 1)
      },
      defaultParentCode: ''
    },
  ],
   'grant': [
    { id: 'grant-A', code: 'GR-A', description: 'Federal Infrastructure Grant', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true, allowedSubmodules: ['General Ledger', 'Cash Receipts'], customFieldValues: {}, defaultParentCode: '' },
    { id: 'grant-B', code: 'GR-B', description: 'State Education Grant', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true, allowedSubmodules: ['General Ledger', 'Cash Receipts'], customFieldValues: {}, defaultParentCode: '' },
  ],
  'function': [
    { id: 'func-gov', code: '1000', description: 'General Government (Summary)', summaryIndicator: true, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: false, availableForBudgeting: true, customFieldValues: {}, defaultParentCode: '' },
    { id: 'func-gov-admin', code: '1100', description: 'Administration', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true, customFieldValues: {}, defaultParentCode: '1000' },
    { id: 'func-safety', code: '2000', description: 'Public Safety (Summary)', summaryIndicator: true, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: false, availableForBudgeting: true, customFieldValues: {}, defaultParentCode: '' },
    { id: 'func-safety-pol', code: '2100', description: 'Police Services', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true, customFieldValues: {}, defaultParentCode: '2000' },
  ],
  'location': [
    { id: 'loc-north', code: 'NORTH', description: 'North District (Summary)', summaryIndicator: true, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: false, availableForBudgeting: true, customFieldValues: {}, defaultParentCode: '' },
    { id: 'loc-north-HQ', code: 'NORTH-HQ', description: 'North District HQ', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true, customFieldValues: {}, defaultParentCode: 'NORTH' },
    { id: 'loc-south', code: 'SOUTH', description: 'South District', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true, customFieldValues: {}, defaultParentCode: '' },
  ],
   'program': [
    { id: 'prog-health', code: 'HEALTH', description: 'Public Health Programs (Summary)', summaryIndicator: true, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: false, availableForBudgeting: true, customFieldValues: {}, defaultParentCode: '' },
    { id: 'prog-health-vacc', code: 'HEALTH-VACC', description: 'Vaccination Program', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true, customFieldValues: {}, defaultParentCode: 'HEALTH' },
  ]
};

    