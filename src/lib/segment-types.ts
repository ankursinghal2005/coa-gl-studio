
export interface Segment {
  id: string;
  displayName: string;
  segmentType: string;
  isActive: boolean;
  isCore: boolean;
  regex?: string;
  defaultCode?: string;
  separator?: '-' | '|' | ',' | '.';
  isCustom: boolean;
  isMandatoryForCoding: boolean;
  validFrom?: Date;
  validTo?: Date;
}

export const initialSegmentsData: Segment[] = [
  { id: 'fund', displayName: 'Fund', segmentType: 'Fund', isActive: true, isCore: true, isCustom: false, isMandatoryForCoding: true, separator: '-', regex: undefined, defaultCode: undefined, validFrom: undefined, validTo: undefined },
  { id: 'object', displayName: 'Object', segmentType: 'Object', isActive: true, isCore: true, isCustom: false, isMandatoryForCoding: true, separator: '-', regex: undefined, defaultCode: undefined, validFrom: undefined, validTo: undefined },
  { id: 'department', displayName: 'Department', segmentType: 'Department', isActive: true, isCore: true, isCustom: false, isMandatoryForCoding: true, separator: '-', regex: undefined, defaultCode: undefined, validFrom: undefined, validTo: undefined },
  { id: 'project', displayName: 'Project', segmentType: 'Project', isActive: true, isCore: false, isCustom: false, isMandatoryForCoding: false, separator: '-', regex: undefined, defaultCode: undefined, validFrom: undefined, validTo: undefined },
  { id: 'grant', displayName: 'Grant', segmentType: 'Grant', isActive: true, isCore: false, isCustom: false, isMandatoryForCoding: false, separator: '-', regex: undefined, defaultCode: undefined, validFrom: undefined, validTo: undefined },
  { id: 'function', displayName: 'Function', segmentType: 'Function', isActive: true, isCore: false, isCustom: false, isMandatoryForCoding: false, separator: '-', regex: undefined, defaultCode: undefined, validFrom: undefined, validTo: undefined },
  { id: 'location', displayName: 'Location', segmentType: 'Location', isActive: true, isCore: false, isCustom: false, isMandatoryForCoding: false, separator: '-', regex: undefined, defaultCode: undefined, validFrom: undefined, validTo: undefined },
  { id: 'program', displayName: 'Program', segmentType: 'Program', isActive: true, isCore: false, isCustom: false, isMandatoryForCoding: false, separator: '-', regex: undefined, defaultCode: undefined, validFrom: undefined, validTo: undefined },
];
