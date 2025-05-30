
export type DataType = 'Alphanumeric' | 'Numeric' | 'Text';

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
}

export const initialSegmentsData: Segment[] = [
  { id: 'fund', displayName: 'Fund', segmentType: 'Fund', dataType: 'Alphanumeric', maxLength: 10, specialCharsAllowed: '', separator: '-', isCustom: false, isMandatoryForCoding: true, isActive: true, isCore: true, validFrom: new Date(2023, 0, 1) },
  { id: 'object', displayName: 'Object', segmentType: 'Object', dataType: 'Alphanumeric', maxLength: 10, specialCharsAllowed: '', separator: '-', isCustom: false, isMandatoryForCoding: true, isActive: true, isCore: true, validFrom: new Date(2023, 0, 1) },
  { id: 'department', displayName: 'Department', segmentType: 'Department', dataType: 'Alphanumeric', maxLength: 15, specialCharsAllowed: '', separator: '-', isCustom: false, isMandatoryForCoding: true, isActive: true, isCore: true, validFrom: new Date(2023, 0, 1) },
  { id: 'project', displayName: 'Project', segmentType: 'Project', dataType: 'Alphanumeric', maxLength: 20, specialCharsAllowed: '-_', separator: '-', isCustom: false, isMandatoryForCoding: false, isActive: true, isCore: false, validFrom: new Date(2023, 0, 1) },
  { id: 'grant', displayName: 'Grant', segmentType: 'Grant', dataType: 'Alphanumeric', maxLength: 20, specialCharsAllowed: '-_', separator: '-', isCustom: false, isMandatoryForCoding: false, isActive: true, isCore: false, validFrom: new Date(2023, 0, 1) },
  { id: 'function', displayName: 'Function', segmentType: 'Function', dataType: 'Numeric', maxLength: 5, specialCharsAllowed: '', separator: '-', isCustom: false, isMandatoryForCoding: false, isActive: true, isCore: false, validFrom: new Date(2023, 0, 1) },
  { id: 'location', displayName: 'Location', segmentType: 'Location', dataType: 'Alphanumeric', maxLength: 10, specialCharsAllowed: '', separator: '-', isCustom: false, isMandatoryForCoding: false, isActive: true, isCore: false, validFrom: new Date(2023, 0, 1) },
  { id: 'program', displayName: 'Program', segmentType: 'Program', dataType: 'Text', maxLength: 50, specialCharsAllowed: '-_ ', separator: '-', isCustom: false, isMandatoryForCoding: false, isActive: true, isCore: false, validFrom: new Date(2023, 0, 1) },
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
}

// Shared mock segment codes data
export const mockSegmentCodesData: Record<string, SegmentCode[]> = {
  'fund': [
    { id: 'fb-f-100', code: '100', description: 'General Fund', summaryIndicator: true, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: false, availableForBudgeting: true, external1: "GF-001" },
    { id: 'fb-f-101', code: '101', description: 'Governmental Operating Fund', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true, external1: "SRFA-001"},
    { id: 'fb-f-102', code: '102', description: 'Enterprise Parking Fund', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true, external1: "CPFB-001" },
    { id: 'fb-f-103', code: '103', description: 'Special Revenue Fund - Grants', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true, external1: "DSFC-001" },
    { id: 'fb-f-104', code: '104', description: 'Capital Projects Fund - Infrastructure', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true },
    { id: 'fb-f-105', code: '105', description: 'Debt Service Fund - Bonds', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true },
    { id: 'fb-f-106', code: '106', description: 'Internal Service Fund - IT', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true },
    { id: 'fb-f-107', code: '107', description: 'Trust Fund - Pension', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true },
    { id: 'fb-f-108', code: '108', description: 'Agency Fund - Payroll Deductions', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true },
    { id: 'fb-f-109', code: '109', description: 'Permanent Fund - Library Endowment', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true },
    { id: 'fb-f-200', code: '200', description: 'Grants & Donations Fund', summaryIndicator: true, isActive: true, validFrom: new Date(2023,6,1), validTo: new Date(2024,11,31), availableForTransactionCoding: false, availableForBudgeting: true, external2: "Summary" },
    { id: 'fb-f-210', code: '210', description: 'Federal Grant A', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true, external1: "SRFD-001"},
    { id: 'fb-f-220', code: '220', description: 'State Grant B', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true, external1: "CPFE-001"},
    { id: 'fb-f-230', code: '230', description: 'Private Donation C', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true, external1: "DSFF-001"},
    { id: 'fb-f-300', code: '300', description: 'Capital Outlay Fund', summaryIndicator: true, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: false, availableForBudgeting: true },
    { id: 'fb-f-301', code: '301', description: 'Building Project Z (Detail)', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true },
    { id: 'fb-f-310', code: '310', description: 'Equipment Purchase X', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true },
    { id: 'fb-f-320', code: '320', description: 'Infrastructure Upgrade Y', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true },
  ],
  'department': [
    { id: 'fb-d-FIN', code: 'FIN', description: 'Finance Department (Summary)', summaryIndicator: true, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: false, availableForBudgeting: true },
    { id: 'fb-d-HR', code: 'HR', description: 'Human Resources (Summary)', summaryIndicator: true, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: false, availableForBudgeting: true },
    { id: 'fb-d-FIN-ACC', code: 'FIN-ACC', description: 'Accounting (Detail)', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true },
    { id: 'fb-d-FIN-BUD', code: 'FIN-BUD', description: 'Budgeting (Detail)', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true },
    { id: 'fb-d-IT', code: 'IT', description: 'IT Department (Detail)', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true },
    { id: 'fb-d-PD', code: 'PD', description: 'Police Department', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true },
    { id: 'fb-d-FD', code: 'FD', description: 'Fire Department', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true },
    { id: 'fb-d-PW', code: 'PW', description: 'Public Works', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true },
  ],
  'object': [
    { id: 'fb-o-5000', code: '5000', description: 'Salaries & Wages (Summary)', summaryIndicator: true, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: false, availableForBudgeting: true },
    { id: 'fb-o-5100', code: '5100', description: 'Full-time Salaries (Detail)', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true },
    { id: 'fb-o-5200', code: '5200', description: 'Part-time Salaries (Detail)', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true },
    { id: 'fb-o-6000', code: '6000', description: 'Operating Expenses (Summary)', summaryIndicator: true, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: false, availableForBudgeting: true },
    { id: 'fb-o-6100', code: '6100', description: 'Office Supplies (Detail)', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true },
    { id: 'fb-o-6200', code: '6200', description: 'Utilities (Detail)', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true },
  ],
  'project': [
    { id: 'proj-001', code: 'P001', description: 'City Hall Renovation', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true },
    { id: 'proj-002', code: 'P002', description: 'Park Improvement Project', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true },
  ],
   'grant': [
    { id: 'grant-A', code: 'GR-A', description: 'Federal Infrastructure Grant', summaryIndicator: false, isActive: true, validFrom: new Date(2023,0,1), availableForTransactionCoding: true, availableForBudgeting: true },
  ],
  // Add more mock codes for other segments as needed
};
