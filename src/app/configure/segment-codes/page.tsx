
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, parse as parseDateFns } from "date-fns";
import { useSearchParams } from 'next/navigation';
import * as XLSX from 'xlsx';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { PlusCircle, ListFilter, CheckCircle, XCircle, ChevronsUpDown, DownloadCloud, UploadCloud, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription as CardDesc } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useSegments } from '@/contexts/SegmentsContext';
import type { Segment, SegmentCode, CustomFieldDefinition } from '@/lib/segment-types';
import { mockSegmentCodesData } from '@/lib/segment-types';
import { useHierarchies } from '@/contexts/HierarchiesContext';
import type { HierarchyNode, HierarchySet, SegmentHierarchyInSet } from '@/lib/hierarchy-types';
import { useToast } from "@/hooks/use-toast"


const submoduleOptions = [
  'General Ledger',
  'Accounts Payable',
  'Accounts Receivables',
  'Cash Receipts',
  'Payroll'
] as const;

const segmentCodeFormSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(1, { message: 'Segment Code is required.' }),
  description: z.string().min(1, { message: 'Description is required.' }),
  external1: z.string().optional(),
  external2: z.string().optional(),
  external3: z.string().optional(),
  external4: z.string().optional(),
  external5: z.string().optional(),
  summaryIndicator: z.boolean().default(false),
  isActive: z.boolean().default(true),
  validFrom: z.date({ required_error: "Valid From date is required." }),
  validTo: z.date().optional(),
  availableForTransactionCoding: z.boolean().default(false),
  availableForBudgeting: z.boolean().default(false),
  allowedSubmodules: z.array(z.string()).optional(),
  customFieldValues: z.record(z.string(), z.any().optional()).optional(),
  defaultParentCode: z.string().optional(),
}).refine(data => {
  if (data.validFrom && data.validTo) {
    return data.validTo >= data.validFrom;
  }
  return true;
}, {
  message: "Valid To date must be after or the same as Valid From date.",
  path: ["validTo"],
});

type SegmentCodeFormValues = z.infer<typeof segmentCodeFormSchema>;

const defaultCodeFormValues: SegmentCodeFormValues = {
  code: '',
  description: '',
  external1: '',
  external2: '',
  external3: '',
  external4: '',
  external5: '',
  summaryIndicator: false,
  isActive: true,
  validFrom: new Date(),
  validTo: undefined,
  availableForTransactionCoding: false,
  availableForBudgeting: false,
  allowedSubmodules: [...submoduleOptions],
  customFieldValues: {},
  defaultParentCode: '',
};

const codeExistsInSegmentHierarchy = (nodes: HierarchyNode[], segmentCodeId: string): boolean => {
  for (const node of nodes) {
    if (node.segmentCode.id === segmentCodeId) return true;
    if (node.children && codeExistsInSegmentHierarchy(node.children, segmentCodeId)) {
      return true;
    }
  }
  return false;
};

const findNodeBySegmentCodeIdRecursive = (nodes: HierarchyNode[], segmentCodeId: string): HierarchyNode | null => {
  for (const node of nodes) {
    if (node.segmentCode.id === segmentCodeId) return node;
    if (node.children) {
      const found = findNodeBySegmentCodeIdRecursive(node.children, segmentCodeId);
      if (found) return found;
    }
  }
  return null;
};

// Helper function to validate characters in a code string
const validateCodeChars = (code: string | undefined, allowedSpecialChars: string): boolean => {
  if (!code) return true; // Empty string is valid by this check
  const alphanumericRegex = /^[a-zA-Z0-9]*$/;
  for (const char of code) {
    // Check if character is NOT alphanumeric AND NOT in allowedSpecialChars
    if (!/^[a-zA-Z0-9]$/.test(char) && !allowedSpecialChars.includes(char)) {
      return false; 
    }
  }
  return true;
};


export default function SegmentCodesPage() {
  const { segments: allAvailableSegments } = useSegments();
  const { addHierarchySet, updateHierarchySet, getHierarchySetById } = useHierarchies();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const querySegmentIdParam = searchParams.get('segmentId');

  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [segmentCodesData, setSegmentCodesData] = useState<Record<string, SegmentCode[]>>(() => {
    const initialData: Record<string, SegmentCode[]> = {};
    for (const segmentKey in mockSegmentCodesData) {
      initialData[segmentKey] = mockSegmentCodesData[segmentKey].map(code => ({...code}));
    }
    allAvailableSegments.forEach(segment => {
      if (!initialData[segment.id]) {
        initialData[segment.id] = [];
      }
    });
    return initialData;
  });

  const [isCodeFormSheetOpen, setIsCodeFormSheetOpen] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'view' | 'edit'>('add');
  const [currentEditingCode, setCurrentEditingCode] = useState<SegmentCode | null>(null);

  const form = useForm<SegmentCodeFormValues>({
    resolver: zodResolver(segmentCodeFormSchema),
    defaultValues: defaultCodeFormValues,
  });


  useEffect(() => {
    setSelectedSegmentId(currentSelectedId => {
      if (querySegmentIdParam && allAvailableSegments.some(s => s.id === querySegmentIdParam)) {
        if (currentSelectedId !== querySegmentIdParam) {
          return querySegmentIdParam;
        }
        return currentSelectedId;
      }
      if (currentSelectedId && allAvailableSegments.some(s => s.id === currentSelectedId)) {
        return currentSelectedId;
      }
      if (allAvailableSegments.length > 0) {
        return allAvailableSegments[0].id;
      }
      return null;
    });
  }, [querySegmentIdParam, allAvailableSegments]);

  useEffect(() => {
    if (isCodeFormSheetOpen) {
      if (formMode === 'add') {
        form.reset({...defaultCodeFormValues, customFieldValues: {}, defaultParentCode: ''});
        setCurrentEditingCode(null);
      } else if ((formMode === 'view' || formMode === 'edit') && currentEditingCode) {
        form.reset({
          ...currentEditingCode,
          validFrom: currentEditingCode.validFrom ? new Date(currentEditingCode.validFrom) : new Date(),
          validTo: currentEditingCode.validTo ? new Date(currentEditingCode.validTo) : undefined,
          allowedSubmodules: currentEditingCode.allowedSubmodules || [],
          customFieldValues: currentEditingCode.customFieldValues || {},
          defaultParentCode: currentEditingCode.defaultParentCode || '',
        });
      }
    } else {
      form.reset({...defaultCodeFormValues, customFieldValues: {}, defaultParentCode: ''});
      setCurrentEditingCode(null);
      setFormMode('add');
    }
  }, [isCodeFormSheetOpen, formMode, currentEditingCode, form]);


  const selectedSegment = useMemo(() => {
    return allAvailableSegments.find(s => s.id === selectedSegmentId);
  }, [allAvailableSegments, selectedSegmentId]);

  const currentSegmentCodes = useMemo(() => {
    if (!selectedSegmentId || !segmentCodesData[selectedSegmentId]) {
      return [];
    }
    return segmentCodesData[selectedSegmentId];
  }, [selectedSegmentId, segmentCodesData]);


  const saveSegmentCodeAndUpdateHierarchy = (
    codeToSave: SegmentCode,
    targetSegmentId: string,
    targetSegment: Segment,
    currentCodesForSegment: SegmentCode[]
  ): { savedCode: SegmentCode | null, hierarchyMessage?: string } => {

    let existingCodeIndex = currentCodesForSegment.findIndex(c => c.id === codeToSave.id || c.code === codeToSave.code);
    let savedCode: SegmentCode;
    let operation: 'added' | 'updated' = 'added';

    if (existingCodeIndex !== -1) { // Update existing
        savedCode = { ...currentCodesForSegment[existingCodeIndex], ...codeToSave };
        operation = 'updated';
        setSegmentCodesData(prev => {
            const updatedSegmentCodes = [...(prev[targetSegmentId] || [])];
            updatedSegmentCodes[existingCodeIndex] = savedCode;
            return { ...prev, [targetSegmentId]: updatedSegmentCodes };
        });
    } else { // Add new
        savedCode = { ...codeToSave, id: codeToSave.id || `${targetSegmentId}-code-${crypto.randomUUID()}` };
        setSegmentCodesData(prev => ({
            ...prev,
            [targetSegmentId]: [...(prev[targetSegmentId] || []), savedCode],
        }));
    }

    setCurrentEditingCode(savedCode); 

    let hierarchyMessage: string | undefined;

    if (savedCode.defaultParentCode) {
      const DEFAULT_HIERARCHY_SET_ID = 'hset-system-default-code-hierarchy';
      const DEFAULT_HIERARCHY_SET_NAME = "Default Code Structures (System)";

      let hierarchySet = getHierarchySetById(DEFAULT_HIERARCHY_SET_ID);

      if (!hierarchySet) {
        hierarchySet = {
          id: DEFAULT_HIERARCHY_SET_ID,
          name: DEFAULT_HIERARCHY_SET_NAME,
          status: 'Active',
          description: "Automatically generated and updated based on 'Default Parent Code' in segment code definitions. Managed by the system.",
          segmentHierarchies: [],
          lastModifiedDate: new Date(),
          lastModifiedBy: "System (Excel Upload)"
        };
        addHierarchySet(hierarchySet);
        hierarchySet = getHierarchySetById(DEFAULT_HIERARCHY_SET_ID); 
         if (!hierarchySet) {
            return { savedCode, hierarchyMessage: `Failed to create/retrieve default hierarchy set for ${savedCode.code}.` };
         }
      }

      let hierarchySetToUpdate = JSON.parse(JSON.stringify(hierarchySet)) as HierarchySet;
      const allCodesForCurrentSegment = segmentCodesData[targetSegmentId] || [savedCode]; 

      const parentSegmentCodeObj = allCodesForCurrentSegment.find(sc => sc.code === savedCode.defaultParentCode);

      if (!parentSegmentCodeObj) {
        hierarchyMessage = `Default parent code "${savedCode.defaultParentCode}" not found for code "${savedCode.code}". Hierarchy not updated.`;
      } else if (!parentSegmentCodeObj.summaryIndicator) {
        hierarchyMessage = `Default parent code "${savedCode.defaultParentCode}" for code "${savedCode.code}" must be a summary code. Hierarchy not updated.`;
      } else {
        let segmentHierarchy = hierarchySetToUpdate.segmentHierarchies.find(sh => sh.segmentId === targetSegmentId);
        if (!segmentHierarchy) {
          segmentHierarchy = { id: `${DEFAULT_HIERARCHY_SET_ID}-${targetSegmentId}-sh`, segmentId: targetSegmentId, treeNodes: [] };
          hierarchySetToUpdate.segmentHierarchies.push(segmentHierarchy);
        }

        let parentNodeInTree = findNodeBySegmentCodeIdRecursive(segmentHierarchy.treeNodes, parentSegmentCodeObj.id);
        if (!parentNodeInTree) {
          parentNodeInTree = { id: crypto.randomUUID(), segmentCode: parentSegmentCodeObj, children: [] };
          segmentHierarchy.treeNodes.push(parentNodeInTree);
        }

        if (!codeExistsInSegmentHierarchy(segmentHierarchy.treeNodes, savedCode.id)) {
            const childHierarchyNode: HierarchyNode = { id: crypto.randomUUID(), segmentCode: savedCode, children: [] };
            parentNodeInTree.children.push(childHierarchyNode); 
            hierarchySetToUpdate.lastModifiedDate = new Date();
            hierarchySetToUpdate.lastModifiedBy = "System (Code Update)";
            updateHierarchySet(hierarchySetToUpdate);
            hierarchyMessage = `Code "${savedCode.code}" ${operation} and added to default hierarchy under "${parentSegmentCodeObj.code}".`;
        } else {
            hierarchyMessage = `Code "${savedCode.code}" ${operation}. It already exists in the default hierarchy.`;
        }
      }
    } else {
       hierarchyMessage = `Code "${savedCode.code}" ${operation}. No default parent specified.`;
    }
    return { savedCode, hierarchyMessage };
  };


  const handleSaveCodeSubmit = (values: SegmentCodeFormValues) => {
    if (!selectedSegmentId || !selectedSegment) {
        toast({ title: "Error", description: "No segment selected.", variant: "destructive" });
        return;
    }

    // Stricter character validation for 'code'
    if (!validateCodeChars(values.code, selectedSegment.specialCharsAllowed)) {
        form.setError("code", { 
            type: "manual", 
            message: `Code contains invalid characters. Only alphanumeric or: '${selectedSegment.specialCharsAllowed || '(none)'}' are allowed.` 
        });
        return;
    }

    // Stricter character validation for 'defaultParentCode'
    if (values.defaultParentCode && !validateCodeChars(values.defaultParentCode, selectedSegment.specialCharsAllowed)) {
        form.setError("defaultParentCode", { 
            type: "manual", 
            message: `Default Parent Code contains invalid characters. Only alphanumeric or: '${selectedSegment.specialCharsAllowed || '(none)'}' are allowed.` 
        });
        return;
    }
    
    // Validation: Code should not contain its segment's separator
    if (values.code && selectedSegment.separator && values.code.includes(selectedSegment.separator)) {
      form.setError("code", {
        type: "manual",
        message: `Code cannot contain the segment's separator character ('${selectedSegment.separator}').`,
      });
      return;
    }

    // Validation: defaultParentCode should not contain its segment's separator
    if (values.defaultParentCode && selectedSegment.separator && values.defaultParentCode.includes(selectedSegment.separator)) {
      form.setError("defaultParentCode", {
        type: "manual",
        message: `Default Parent Code cannot contain the segment's separator character ('${selectedSegment.separator}').`,
      });
      return;
    }


    const dataToSave: SegmentCode = {
      id: values.id || `${selectedSegmentId}-code-${crypto.randomUUID()}`, 
      code: values.code,
      description: values.description,
      external1: values.external1,
      external2: values.external2,
      external3: values.external3,
      external4: values.external4,
      external5: values.external5,
      summaryIndicator: values.summaryIndicator,
      isActive: values.isActive,
      validFrom: values.validFrom,
      validTo: values.validTo,
      availableForTransactionCoding: values.availableForTransactionCoding,
      availableForBudgeting: values.availableForBudgeting,
      allowedSubmodules: values.allowedSubmodules || [],
      customFieldValues: values.customFieldValues || {},
      defaultParentCode: values.defaultParentCode?.trim() || undefined,
    };

    const isAdding = formMode === 'add';
    const codeExists = (segmentCodesData[selectedSegmentId] || []).some(
        c => c.code === dataToSave.code && (isAdding || c.id !== dataToSave.id)
    );

    if (codeExists) {
        form.setError("code", { type: "manual", message: "This code already exists for this segment." });
        toast({ title: "Validation Error", description: "This code already exists for this segment.", variant: "destructive" });
        return;
    }

    const { savedCode, hierarchyMessage } = saveSegmentCodeAndUpdateHierarchy(dataToSave, selectedSegmentId, selectedSegment, currentSegmentCodes);

    if (savedCode) {
        toast({ title: "Success", description: hierarchyMessage || `Code "${savedCode.code}" processed.` });
        if (formMode === 'edit') {
            setFormMode('view');
        } else {
            setIsCodeFormSheetOpen(false);
        }
    } else {
        toast({ title: "Error", description: "Failed to save code.", variant: "destructive" });
    }
  };


  const handleCodeStatusToggle = (codeId: string) => {
    if (!selectedSegmentId) return;
    setSegmentCodesData(prev => ({
      ...prev,
      [selectedSegmentId]: (prev[selectedSegmentId] || []).map(code =>
        code.id === codeId ? { ...code, isActive: !code.isActive } : code
      ),
    }));
  };

  const handleOpenAddCodeSheet = () => {
    setFormMode('add');
    setCurrentEditingCode(null);
    setIsCodeFormSheetOpen(true);
  };

  const handleViewCode = (code: SegmentCode) => {
    setFormMode('view');
    setCurrentEditingCode(code);
    setIsCodeFormSheetOpen(true);
  };

  const handleEditCodeFromSheet = () => {
    if (currentEditingCode) {
      setFormMode('edit');
    }
  };

   const handleSheetOpenChange = (isOpen: boolean) => {
    setIsCodeFormSheetOpen(isOpen);
    if (!isOpen) {
      setFormMode('add'); 
    }
  };

  const breadcrumbItems = [
    { label: 'COA Configuration', href: '/' },
    { label: 'Segment Codes' }
  ];

  const isFieldDisabled = formMode === 'view';

  const handleDownloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    const standardizedDate = (date: Date | undefined) => date ? format(date, 'yyyy-MM-dd') : '';
    const booleanToString = (val: boolean | undefined) => val === true ? 'TRUE' : (val === false ? 'FALSE' : '');

    allAvailableSegments.forEach(segment => {
      const headers = [
        'Code*', 'Description*', 'DefaultParentCode',
        'External1', 'External2', 'External3', 'External4', 'External5',
        'SummaryIndicator (TRUE/FALSE)*', 'IsActive (TRUE/FALSE)*',
        'ValidFrom (YYYY-MM-DD)*', 'ValidTo (YYYY-MM-DD)',
        'AvailableForTransactionCoding (TRUE/FALSE)*', 'AvailableForBudgeting (TRUE/FALSE)*',
        'AllowedSubmodules (comma-separated)'
      ];
      (segment.customFields || []).forEach(cf => {
        headers.push(`${cf.label}${cf.required ? '*' : ''}`);
      });

      const sheetData: (string | boolean | number | Date | undefined)[][] = [headers];
       const exampleRow = [
        segment.defaultCode || 'EXAMPLE101', 
        'Example Description', 
        '', 
        '', '', '', '', '', 
        'FALSE', 
        'TRUE',  
        standardizedDate(new Date()), 
        '', 
        'TRUE', 
        'TRUE', 
        submoduleOptions.join(','), 
      ];
      (segment.customFields || []).forEach(cf => {
        exampleRow.push(cf.type === 'Boolean' ? 'FALSE' : (cf.type === 'Date' ? standardizedDate(new Date()) : 'Example Value'));
      });
      sheetData.push(exampleRow);


      const ws = XLSX.utils.aoa_to_sheet(sheetData);
      const sheetName = segment.displayName.replace(/[\/\?\[\]\*:]/g, "").substring(0, 31);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });

    XLSX.writeFile(wb, "SegmentCodes_Template.xlsx");
    toast({ title: "Success", description: "Template downloaded." });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
        toast({ title: "No File Selected", description: "Please select an Excel file to upload.", variant: "destructive" });
        return;
    }

    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        let codesProcessed = 0;
        let codesAdded = 0;
        let codesUpdated = 0;
        let errorsFound = 0;
        let errorMessages: string[] = [];

        const segmentMap = new Map(allAvailableSegments.map(s => [s.displayName.replace(/[\/\?\[\]\*:]/g, "").substring(0, 31), s]));

        workbook.SheetNames.forEach(sheetName => {
          const targetSegment = segmentMap.get(sheetName);
          if (!targetSegment) {
            errorMessages.push(`Sheet "${sheetName}" does not match any known segment. Skipping.`);
            errorsFound++;
            return;
          }
          
          const targetSegmentIdForSave = targetSegment.id;


          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1 , raw: false, dateNF: 'yyyy-MM-dd'});

          if (jsonData.length < 2) { 
             errorMessages.push(`Sheet "${sheetName}" is empty or contains only headers. Skipping.`);
             return; 
          }


          const headers: string[] = jsonData[0].map((h:any) => String(h).trim());
          const rows = jsonData.slice(1);

          rows.forEach((rowArray, rowIndex) => {
            if (rowArray.every(cell => cell === undefined || cell === null || String(cell).trim() === '')) {
                return;
            }
            codesProcessed++;
            const row: Record<string, any> = {};
            headers.forEach((header, index) => {
                const cleanHeader = header.replace(/\s?\*$/, '').replace(/\s\(.*\)$/, '');
                row[cleanHeader] = rowArray[index];
            });

            try {
              const customFieldValues: Record<string, any> = {};
              (targetSegment.customFields || []).forEach(cf => {
                const excelHeader = cf.label; 
                if (row[excelHeader] !== undefined) {
                  let val = row[excelHeader];
                  if (cf.type === 'Boolean') val = ['TRUE', 'YES', '1'].includes(String(val).toUpperCase());
                  else if (cf.type === 'Date') val = val instanceof Date ? val : (val ? parseDateFns(String(val), 'yyyy-MM-dd', new Date()) : undefined);
                  else if (cf.type === 'Number') val = val !== undefined && val !== '' ? parseFloat(String(val)) : undefined;
                  customFieldValues[cf.id] = val;
                } else if (cf.required) {
                    throw new Error(`Custom field "${cf.label}" is required.`);
                }
              });

              const parseBoolean = (val: any) => {
                if (val === undefined || val === null || String(val).trim() === '') return undefined; 
                const sVal = String(val).toUpperCase();
                return ['TRUE', 'YES', '1'].includes(sVal);
              };

              const codeStr = String(row['Code'] || '').trim();
              const parentCodeStr = String(row['DefaultParentCode'] || '').trim() || undefined;

              if (!validateCodeChars(codeStr, targetSegment.specialCharsAllowed)) {
                throw new Error(`Code "${codeStr}" contains invalid characters. Only alphanumeric or these special characters are permitted: '${targetSegment.specialCharsAllowed || '(none)'}'.`);
              }
              if (parentCodeStr && !validateCodeChars(parentCodeStr, targetSegment.specialCharsAllowed)) {
                 throw new Error(`DefaultParentCode "${parentCodeStr}" contains invalid characters. Only alphanumeric or these special characters are permitted: '${targetSegment.specialCharsAllowed || '(none)'}'.`);
              }
              if (codeStr && targetSegment.separator && codeStr.includes(targetSegment.separator)) {
                throw new Error(`Code "${codeStr}" cannot contain the segment's separator character ('${targetSegment.separator}').`);
              }
              if (parentCodeStr && targetSegment.separator && parentCodeStr.includes(targetSegment.separator)) {
                throw new Error(`DefaultParentCode "${parentCodeStr}" cannot contain the segment's separator character ('${targetSegment.separator}').`);
              }


              const validFromStr = String(row['ValidFrom'] || '').trim();
              const validToStr = String(row['ValidTo'] || '').trim();

              const parsedData = {
                code: codeStr,
                description: String(row['Description'] || '').trim(),
                defaultParentCode: parentCodeStr,
                external1: String(row['External1'] || '').trim() || undefined,
                external2: String(row['External2'] || '').trim() || undefined,
                external3: String(row['External3'] || '').trim() || undefined,
                external4: String(row['External4'] || '').trim() || undefined,
                external5: String(row['External5'] || '').trim() || undefined,
                summaryIndicator: parseBoolean(row['SummaryIndicator']) ?? false, 
                isActive: parseBoolean(row['IsActive']) ?? true, 
                validFrom: validFromStr ? parseDateFns(validFromStr, 'yyyy-MM-dd', new Date()) : undefined,
                validTo: validToStr ? parseDateFns(validToStr, 'yyyy-MM-dd', new Date()) : undefined,
                availableForTransactionCoding: parseBoolean(row['AvailableForTransactionCoding']) ?? false,
                availableForBudgeting: parseBoolean(row['AvailableForBudgeting']) ?? false,
                allowedSubmodules: String(row['AllowedSubmodules'] || '').split(',').map(s => s.trim()).filter(Boolean),
                customFieldValues: customFieldValues,
              };

              const validationResult = segmentCodeFormSchema.safeParse({
                  ...parsedData,
                  validFrom: parsedData.validFrom || new Date(0,0,0,0,0,0,0), 
              });

              if (!validationResult.success) {
                errorsFound++;
                const errorDetails = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
                errorMessages.push(`Sheet "${sheetName}", Row ${rowIndex + 2}: ${errorDetails}`);
                console.error(`Validation error for row ${rowIndex + 2} in sheet ${sheetName}:`, validationResult.error.flatten());
                return;
              }

              const codeToProcess: SegmentCode = {
                ...validationResult.data,
                id: (segmentCodesData[targetSegmentIdForSave] || []).find(c => c.code === validationResult.data.code)?.id || `${targetSegmentIdForSave}-code-${crypto.randomUUID()}`,
              };
              
              const currentCodesForTargetSegment = segmentCodesData[targetSegmentIdForSave] || [];
              const existingCodeIndex = currentCodesForTargetSegment.findIndex(c => c.code === codeToProcess.code);

              saveSegmentCodeAndUpdateHierarchy(codeToProcess, targetSegmentIdForSave, targetSegment, currentCodesForTargetSegment);

              if (existingCodeIndex !== -1) codesUpdated++; else codesAdded++;

            } catch (parseError: any) {
              errorsFound++;
              errorMessages.push(`Sheet "${sheetName}", Row ${rowIndex + 2}: Error parsing data - ${parseError.message}`);
              console.error(`Error processing row ${rowIndex + 2} in sheet ${sheetName}:`, parseError);
            }
          });
        });

        if (errorsFound > 0) {
          toast({
            title: "Upload Complete with Errors",
            description: `${codesAdded} codes added, ${codesUpdated} updated. ${errorsFound} errors occurred. ${errorMessages.slice(0,3).join('; ')} Check console for full details.`,
            variant: "destructive",
            duration: 7000,
          });
           console.error("Full list of Excel upload errors:", errorMessages);
        } else if (codesAdded > 0 || codesUpdated > 0) {
          toast({
            title: "Upload Successful",
            description: `${codesAdded} codes added, ${codesUpdated} updated across all sheets.`,
          });
        } else {
             toast({
                title: "Upload Processed",
                description: "No new codes were added or updated. The file might have been empty or contained only existing data without changes.",
                variant: "default"
            });
        }


      } catch (error: any) {
        toast({ title: "Upload Failed", description: `Error reading Excel file: ${error.message}`, variant: "destructive" });
        console.error("Excel upload error:", error);
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = ''; 
      }
    };
    reader.readAsArrayBuffer(file);
  };


  return (
    <div className="flex flex-col h-full">
      <div className="p-0 md:px-0 lg:px-0">
         <Breadcrumbs items={breadcrumbItems} />
      </div>
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-1/4 min-w-[200px] max-w-[300px] border-r bg-card p-4 space-y-2 overflow-y-auto">
          <h2 className="text-lg font-semibold mb-3 text-primary flex items-center">
            <ListFilter className="mr-2 h-5 w-5" /> Segments
          </h2>
          <ScrollArea className="h-[calc(100%-3rem)]">
            {allAvailableSegments.map(segment => (
              <Button
                key={segment.id}
                variant={selectedSegmentId === segment.id ? 'secondary' : 'ghost'}
                className={cn(
                  "w-full justify-start text-left mb-1",
                  selectedSegmentId === segment.id && "font-semibold text-primary"
                )}
                onClick={() => setSelectedSegmentId(segment.id)}
              >
                {segment.displayName}
              </Button>
            ))}
          </ScrollArea>
        </aside>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {selectedSegment ? (
            <>
              <header className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-primary">
                  Manage Codes for: {selectedSegment.displayName}
                </h1>
                <p className="text-md text-muted-foreground mt-1">
                  Define and manage codes associated with the selected segment. You can also download a template or upload codes using an Excel file.
                </p>
                 <CardDesc className="text-xs text-muted-foreground pt-1">
                    Allowed special characters for codes in this segment: <strong>'{selectedSegment.specialCharsAllowed || '(none)'}'</strong>.
                    Separator for this segment is: <strong>'{selectedSegment.separator}'</strong> (cannot be used in codes).
                </CardDesc>
              </header>

              <div className="mb-6 flex flex-col sm:flex-row justify-end gap-2">
                 <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".xlsx, .xls"
                    style={{ display: 'none' }}
                    id="excel-upload-input"
                  />
                <Button onClick={handleDownloadTemplate} variant="outline" disabled={isUploading}>
                  <DownloadCloud className="mr-2 h-5 w-5" /> Download Template
                </Button>
                <Button onClick={() => fileInputRef.current?.click()} variant="outline" disabled={isUploading}>
                  {isUploading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <UploadCloud className="mr-2 h-5 w-5" />}
                  Upload Codes
                </Button>
              </div>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Codes for {selectedSegment.displayName}</CardTitle>
                  <Sheet open={isCodeFormSheetOpen} onOpenChange={handleSheetOpenChange}>
                    <SheetTrigger asChild>
                      <Button onClick={handleOpenAddCodeSheet} disabled={isUploading}>
                        <PlusCircle className="mr-2 h-5 w-5" />
                        Add Code Manually
                      </Button>
                    </SheetTrigger>
                    <SheetContent className="sm:max-w-2xl w-full flex flex-col">
                      <SheetHeader>
                        <SheetTitle>
                          {formMode === 'add' && `Add New Code for ${selectedSegment.displayName}`}
                          {formMode === 'view' && `View Code: ${currentEditingCode?.code} for ${selectedSegment.displayName}`}
                          {formMode === 'edit' && `Edit Code: ${currentEditingCode?.code} for ${selectedSegment.displayName}`}
                        </SheetTitle>
                        <SheetDescription>
                          {formMode === 'add' && "Fill in the details for the new segment code."}
                          {formMode === 'view' && "Viewing details for the selected segment code."}
                          {formMode === 'edit' && "Modify the details of the segment code."}
                        </SheetDescription>
                      </SheetHeader>
                      <ScrollArea className="flex-1 min-h-0">
                        <div className="p-4">
                          <Form {...form}>
                            <form onSubmit={form.handleSubmit(handleSaveCodeSubmit)} className="space-y-4">
                              <FormField
                                control={form.control}
                                name="code"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Segment Code *</FormLabel>
                                    <FormControl>
                                      <Input {...field} disabled={isFieldDisabled || (formMode === 'edit' && !!currentEditingCode?.id)} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Description *</FormLabel>
                                    <FormControl>
                                      <Textarea {...field} disabled={isFieldDisabled} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="defaultParentCode"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Default Parent Code (for Hierarchy)</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder="Enter code of parent (optional)" value={field.value ?? ''} disabled={isFieldDisabled} />
                                    </FormControl>
                                    <CardDesc className="text-xs text-muted-foreground pt-1">If provided, this code will be added under the specified parent in a system-generated default hierarchy. Parent must be a summary code within this segment.</CardDesc>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                  control={form.control}
                                  name="external1"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>External 1</FormLabel>
                                      <FormControl><Input {...field} value={field.value ?? ''} disabled={isFieldDisabled} /></FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name="external2"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>External 2</FormLabel>
                                      <FormControl><Input {...field} value={field.value ?? ''} disabled={isFieldDisabled} /></FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name="external3"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>External 3</FormLabel>
                                      <FormControl><Input {...field} value={field.value ?? ''} disabled={isFieldDisabled} /></FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name="external4"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>External 4</FormLabel>
                                      <FormControl><Input {...field} value={field.value ?? ''} disabled={isFieldDisabled} /></FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name="external5"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>External 5</FormLabel>
                                      <FormControl><Input {...field} value={field.value ?? ''} disabled={isFieldDisabled} /></FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>

                              <FormField
                                control={form.control}
                                name="allowedSubmodules"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Allowed Submodules</FormLabel>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild disabled={isFieldDisabled}>
                                        <Button
                                          variant="outline"
                                          className="w-full justify-between"
                                          disabled={isFieldDisabled}
                                        >
                                          <span>
                                            {field.value && field.value.length > 0
                                              ? `${field.value.length} selected`
                                              : "Select submodules"}
                                          </span>
                                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                                        <DropdownMenuLabel>Allowed Submodules</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        {submoduleOptions.map((option) => (
                                          <DropdownMenuCheckboxItem
                                            key={option}
                                            checked={field.value?.includes(option) ?? false}
                                            onCheckedChange={(checked) => {
                                              const currentSelection = field.value || [];
                                              if (checked) {
                                                field.onChange([...currentSelection, option]);
                                              } else {
                                                field.onChange(currentSelection.filter((item) => item !== option));
                                              }
                                            }}
                                            onSelect={(e) => e.preventDefault()}
                                            disabled={isFieldDisabled}
                                          >
                                            {option}
                                          </DropdownMenuCheckboxItem>
                                        ))}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                  control={form.control}
                                  name="validFrom"
                                  render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                      <FormLabel>Valid From *</FormLabel>
                                      <DatePicker
                                        value={field.value}
                                        onValueChange={field.onChange}
                                        placeholder="Select valid from date"
                                        disabled={isFieldDisabled}
                                      />
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name="validTo"
                                  render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                      <FormLabel>Valid To</FormLabel>
                                      <DatePicker
                                        value={field.value}
                                        onValueChange={field.onChange}
                                        placeholder="Select valid to date"
                                        disabled={isFieldDisabled}
                                        disableDates={(date) => {
                                          const validFrom = form.getValues("validFrom");
                                          return validFrom instanceof Date ? date < validFrom : false;
                                        }}
                                      />
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>

                              {selectedSegment && selectedSegment.customFields && selectedSegment.customFields.length > 0 && (
                                <Card className="my-4">
                                  <CardHeader>
                                    <CardTitle className="text-lg">Custom Fields for {selectedSegment.displayName}</CardTitle>
                                    <CardDesc>Provide values for segment-specific custom fields.</CardDesc>
                                  </CardHeader>
                                  <CardContent className="space-y-4">
                                    {selectedSegment.customFields.map((customFieldDef) => (
                                      <FormField
                                        key={customFieldDef.id}
                                        control={form.control}
                                        name={`customFieldValues.${customFieldDef.id}`}
                                        rules={{ required: customFieldDef.required ? `${customFieldDef.label} is required.` : false }}
                                        render={({ field }) => {
                                          const getInputComponent = () => {
                                            switch (customFieldDef.type) {
                                              case 'Text':
                                                return <Input type="text" {...field} value={field.value ?? ''} disabled={isFieldDisabled} />;
                                              case 'Number':
                                                return (
                                                  <Input
                                                    type="number"
                                                    {...field}
                                                    value={field.value ?? ''}
                                                    onChange={(e) => field.onChange(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                                                    disabled={isFieldDisabled}
                                                  />
                                                );
                                              case 'Date':
                                                return (
                                                  <DatePicker
                                                    value={field.value ? new Date(field.value) : undefined}
                                                    onValueChange={field.onChange}
                                                    disabled={isFieldDisabled}
                                                    placeholder={`Select ${customFieldDef.label}`}
                                                  />
                                                );
                                              case 'Boolean':
                                                const switchId = `custom-field-switch-${customFieldDef.id}-${field.name}`;
                                                return (
                                                  <div className="flex items-center space-x-2 pt-2">
                                                    <Switch
                                                      {...field}
                                                      checked={field.value ?? false}
                                                      onCheckedChange={field.onChange}
                                                      disabled={isFieldDisabled}
                                                      id={switchId}
                                                    />
                                                    <label htmlFor={switchId} className="text-sm cursor-pointer">
                                                      {field.value ? 'Yes' : 'No'}
                                                    </label>
                                                  </div>
                                                );
                                              case 'Dropdown':
                                                return (
                                                  <Select
                                                    onValueChange={field.onChange}
                                                    value={field.value ?? ''}
                                                    disabled={isFieldDisabled}
                                                  >
                                                    <SelectTrigger>
                                                      <SelectValue placeholder={`Select ${customFieldDef.label}`} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                      {(customFieldDef.dropdownOptions || []).map(option => (
                                                        <SelectItem key={option} value={option}>
                                                          {option}
                                                        </SelectItem>
                                                      ))}
                                                    </SelectContent>
                                                  </Select>
                                                );
                                              default:
                                                return null;
                                            }
                                          };

                                          return (
                                            <FormItem>
                                              <FormLabel>{customFieldDef.label}{customFieldDef.required ? ' *' : ''}</FormLabel>
                                              <FormControl>
                                                {getInputComponent()}
                                              </FormControl>
                                              <FormMessage />
                                            </FormItem>
                                          );
                                        }}
                                      />
                                    ))}
                                  </CardContent>
                                </Card>
                              )}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                <FormField
                                  control={form.control}
                                  name="availableForTransactionCoding"
                                  render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                      <FormLabel>Available for Transaction Coding</FormLabel>
                                      <FormControl>
                                        <Switch
                                          checked={field.value}
                                          onCheckedChange={field.onChange}
                                          disabled={isFieldDisabled}
                                        />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name="availableForBudgeting"
                                  render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                      <FormLabel>Available for Budgeting</FormLabel>
                                      <FormControl>
                                        <Switch
                                          checked={field.value}
                                          onCheckedChange={field.onChange}
                                          disabled={isFieldDisabled}
                                        />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                <FormField
                                  control={form.control}
                                  name="summaryIndicator"
                                  render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                      <FormLabel>Summary Indicator</FormLabel>
                                      <FormControl>
                                        <Switch
                                          checked={field.value}
                                          onCheckedChange={field.onChange}
                                          disabled={isFieldDisabled}
                                        />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name="isActive"
                                  render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                      <FormLabel>Active</FormLabel>
                                      <FormControl>
                                        <Switch
                                          checked={field.value}
                                          onCheckedChange={field.onChange}
                                          disabled={isFieldDisabled}
                                        />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </form>
                          </Form>
                        </div>
                      </ScrollArea>
                      <SheetFooter className="pt-4 mt-auto">
                        {formMode === 'add' && (
                          <>
                            <SheetClose asChild>
                              <Button type="button" variant="outline">Cancel</Button>
                            </SheetClose>
                            <Button type="submit" onClick={form.handleSubmit(handleSaveCodeSubmit)}>Save Code</Button>
                          </>
                        )}
                        {formMode === 'view' && currentEditingCode && (
                          <>
                            <SheetClose asChild>
                              <Button type="button" variant="outline">Close</Button>
                            </SheetClose>
                            <Button type="button" onClick={handleEditCodeFromSheet}>Edit</Button>
                          </>
                        )}
                        {formMode === 'edit' && currentEditingCode && (
                          <>
                            <Button type="button" variant="outline" onClick={() => {
                              setFormMode('view');
                              if(currentEditingCode) form.reset({
                                ...currentEditingCode,
                                validFrom: currentEditingCode.validFrom ? new Date(currentEditingCode.validFrom) : new Date(),
                                validTo: currentEditingCode.validTo ? new Date(currentEditingCode.validTo) : undefined,
                                allowedSubmodules: currentEditingCode.allowedSubmodules || [],
                                customFieldValues: currentEditingCode.customFieldValues || {},
                                defaultParentCode: currentEditingCode.defaultParentCode || '',
                              });
                            }}>Cancel</Button>
                            <Button type="submit" onClick={form.handleSubmit(handleSaveCodeSubmit)}>Save Changes</Button>
                          </>
                        )}
                      </SheetFooter>
                    </SheetContent>
                  </Sheet>
                </CardHeader>
                <CardContent>
                  {currentSegmentCodes.length > 0 ? (
                    <ScrollArea className="w-full whitespace-nowrap">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[100px]">Code</TableHead>
                          <TableHead className="min-w-[200px]">Description</TableHead>
                          <TableHead className="min-w-[150px]">Default Parent</TableHead>
                          <TableHead className="text-center min-w-[100px]">Summary</TableHead>
                          <TableHead className="text-center min-w-[100px]">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentSegmentCodes.map(code => (
                          <TableRow key={code.id}>
                            <TableCell className="font-medium">
                              <button 
                                onClick={() => handleViewCode(code)} 
                                className="cursor-pointer text-primary hover:underline bg-transparent border-none p-0"
                              >
                                {code.code}
                              </button>
                            </TableCell>
                            <TableCell className="whitespace-normal break-words">{code.description}</TableCell>
                            <TableCell>{code.defaultParentCode || ''}</TableCell>
                            <TableCell className="text-center">
                              {code.summaryIndicator ? <CheckCircle className="h-5 w-5 text-green-500 inline" /> : <XCircle className="h-5 w-5 text-muted-foreground inline" />}
                            </TableCell>
                            <TableCell className="text-center">
                              <Switch
                                checked={code.isActive}
                                onCheckedChange={() => handleCodeStatusToggle(code.id)}
                                aria-label={`Toggle status for code ${code.code}`}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    </ScrollArea>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      No codes defined for {selectedSegment.displayName}. Click "Add Code" to get started or upload an Excel file.
                    </p>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
               {allAvailableSegments.length > 0 ?
                <p className="text-xl text-muted-foreground">Please select a segment from the left panel.</p>
                :
                <p className="text-xl text-muted-foreground">No segments configured. Please add segments in 'Manage Segments' first.</p>
              }
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

