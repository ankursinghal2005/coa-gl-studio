
export type DataType = 'Alphanumeric' | 'Numeric' | 'Text';

export interface Segment {
  id: string;
  displayName: string;
  segmentType: string; // This is often the same as displayName for custom, fixed for core/standard
  dataType: DataType;
  maxLength: number;
  specialCharsAllowed: string; // Empty string means none
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
