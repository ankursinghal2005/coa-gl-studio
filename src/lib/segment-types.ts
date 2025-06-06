
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
    { id: 'fb-f-100', code: '100', description: 'General Fund', summaryIndicator: true, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: false, availableForBudgeting: true, external1: "GF-001", allowedSubmodules: ['General Ledger', 'Accounts Payable'], customFieldValues: {}, defaultParentCode: '' },
    { id: 'fb-f-101', code: '101', description: 'Governmental Operating Fund', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true, external1: "SRFA-001", allowedSubmodules: ['General Ledger'], customFieldValues: {}, defaultParentCode: '100' },
    { id: 'fb-f-102', code: '102', description: 'Enterprise Parking Fund', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true, external1: "CPFB-001", customFieldValues: {}, defaultParentCode: '200' },
    { id: 'fb-f-103', code: '103', description: 'Special Revenue Fund - Grants', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true, external1: "DSFC-001", customFieldValues: {}, defaultParentCode: '100' },
    { id: 'fb-f-104', code: '104', description: 'Capital Projects Fund - Infrastructure', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true, customFieldValues: {}, defaultParentCode: '300' },
    { id: 'fb-f-105', code: '105', description: 'Debt Service Fund - Bonds', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true, customFieldValues: {}, defaultParentCode: '' }, // No explicit summary parent in mock
    { id: 'fb-f-106', code: '106', description: 'Internal Service Fund - IT', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true, customFieldValues: {}, defaultParentCode: '' }, // No explicit summary parent
    { id: 'fb-f-107', code: '107', description: 'Trust Fund - Pension', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true, customFieldValues: {}, defaultParentCode: '' }, // No explicit summary parent
    { id: 'fb-f-108', code: '108', description: 'Agency Fund - Payroll Deductions', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true, customFieldValues: {}, defaultParentCode: '' }, // No explicit summary parent
    { id: 'fb-f-109', code: '109', description: 'Permanent Fund - Library Endowment', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true, customFieldValues: {}, defaultParentCode: '' }, // No explicit summary parent
    { id: 'fb-f-200', code: '200', description: 'Enterprise Funds (Summary)', summaryIndicator: true, isActive: true, validFrom: new Date(2023,6,1), validTo: new Date(2024,11,31), availableForTransactionCoding: false, availableForBudgeting: true, external2: "Summary", customFieldValues: {}, defaultParentCode: '' },
    { id: 'fb-f-210', code: '210', description: 'Federal Grant A', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true, external1: "SRFD-001", customFieldValues: {}, defaultParentCode: '200'},
    { id: 'fb-f-220', code: '220', description: 'State Grant B', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true, external1: "CPFE-001", customFieldValues: {}, defaultParentCode: '200'},
    { id: 'fb-f-230', code: '230', description: 'Private Donation C', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true, external1: "DSFF-001", customFieldValues: {}, defaultParentCode: '200'},
    { id: 'fb-f-300', code: '300', description: 'Capital Outlay Fund (Summary)', summaryIndicator: true, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: false, availableForBudgeting: true, customFieldValues: {}, defaultParentCode: '' },
    { id: 'fb-f-301', code: '301', description: 'Building Project Z (Detail)', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true, customFieldValues: {}, defaultParentCode: '300' },
    { id: 'fb-f-310', code: '310', description: 'Equipment Purchase X', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true, customFieldValues: {}, defaultParentCode: '300' },
    { id: 'fb-f-320', code: '320', description: 'Infrastructure Upgrade Y', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true, customFieldValues: {}, defaultParentCode: '300' },
  ],
  'department': [
    { id: 'fb-d-FIN', code: 'FIN', description: 'Finance Department (Summary)', summaryIndicator: true, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: false, availableForBudgeting: true, allowedSubmodules: ['General Ledger'], customFieldValues: {}, defaultParentCode: '' },
    { id: 'fb-d-HR', code: 'HR', description: 'Human Resources (Summary)', summaryIndicator: true, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: false, availableForBudgeting: true, allowedSubmodules: ['Payroll'], customFieldValues: {}, defaultParentCode: '' },
    { id: 'fb-d-FIN-ACC', code: 'FIN-ACC', description: 'Accounting (Detail)', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true, customFieldValues: {}, defaultParentCode: 'FIN' },
    { id: 'fb-d-FIN-BUD', code: 'FIN-BUD', description: 'Budgeting (Detail)', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true, customFieldValues: {}, defaultParentCode: 'FIN' },
    { id: 'fb-d-IT', code: 'IT', description: 'IT Department (Detail)', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true, customFieldValues: {}, defaultParentCode: '' },
    { id: 'fb-d-PD', code: 'PD', description: 'Police Department', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true, customFieldValues: {}, defaultParentCode: '' },
    { id: 'fb-d-FD', code: 'FD', description: 'Fire Department', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true, customFieldValues: {}, defaultParentCode: '' },
    { id: 'fb-d-PW', code: 'PW', description: 'Public Works', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true, customFieldValues: {}, defaultParentCode: '' },
  ],
  'object': [
    { id: 'fb-o-5000', code: '5000', description: 'Salaries & Wages (Summary)', summaryIndicator: true, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: false, availableForBudgeting: true, allowedSubmodules: ['Payroll', 'General Ledger'], customFieldValues: {}, defaultParentCode: '' },
    { id: 'fb-o-5100', code: '5100', description: 'Full-time Salaries (Detail)', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true, customFieldValues: {}, defaultParentCode: '5000' },
    { id: 'fb-o-5200', code: '5200', description: 'Part-time Salaries (Detail)', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true, customFieldValues: {}, defaultParentCode: '5000' },
    { id: 'fb-o-6000', code: '6000', description: 'Operating Expenses (Summary)', summaryIndicator: true, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: false, availableForBudgeting: true, customFieldValues: {}, defaultParentCode: '' },
    { id: 'fb-o-6100', code: '6100', description: 'Office Supplies (Detail)', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true, allowedSubmodules: ['Accounts Payable'], customFieldValues: {}, defaultParentCode: '6000' },
    { id: 'fb-o-6200', code: '6200', description: 'Utilities (Detail)', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true, allowedSubmodules: ['Accounts Payable'], customFieldValues: {}, defaultParentCode: '6000' },
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
  ],
  // Add more mock codes for other segments as needed
};

    