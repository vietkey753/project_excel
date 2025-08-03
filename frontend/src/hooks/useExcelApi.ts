import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { excelApi } from '../services/api';
import type {
  Province,
  Unit,
  SheetInfo,
  CalculationRequest,
  CalculationResult,
  ExportRequest,
} from '../types';

// Hook for health check
export const useHealthCheck = () => {
  return useQuery({
    queryKey: ['health'],
    queryFn: excelApi.healthCheck,
    staleTime: 30000, // 30 seconds
  });
};

// Hook for file upload
export const useFileUpload = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: excelApi.uploadFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
  });
};

// Hook for template upload
export const useTemplateUpload = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: excelApi.uploadTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });
};

// Hook for getting template sheets
export const useGetTemplateSheets = (templateId: number | null) => {
  return useQuery<SheetInfo[]>({
    queryKey: ['templateSheets', templateId],
    queryFn: () => excelApi.getSheets(templateId!),
    enabled: !!templateId,
  });
};

// Hook for getting template data
export const useGetTemplateData = (templateId: number | null, sheetName: string | null) => {
  return useQuery<Record<string, any>[]>({
    queryKey: ['templateData', templateId, sheetName],
    queryFn: () => excelApi.getSheetData(templateId!, sheetName!),
    enabled: !!(templateId && sheetName),
  });
};

// Hook for getting sheets
export const useGetSheets = (fileId: number | null) => {
  return useQuery<SheetInfo[]>({
    queryKey: ['sheets', fileId],
    queryFn: () => excelApi.getSheets(fileId!),
    enabled: !!fileId,
  });
};

// Hook for getting sheet data
export const useGetSheetData = (fileId: number | null, sheetName: string | null) => {
  return useQuery<Record<string, any>[]>({
    queryKey: ['sheetData', fileId, sheetName],
    queryFn: () => excelApi.getSheetData(fileId!, sheetName!),
    enabled: !!(fileId && sheetName),
  });
};

// Hook for getting provinces
export const useGetProvinces = () => {
  return useQuery<Province[]>({
    queryKey: ['provinces'],
    queryFn: excelApi.getProvinces,
  });
};

// Hook for getting units
export const useGetUnits = (provinceId: number | null) => {
  return useQuery<Unit[]>({
    queryKey: ['units', provinceId],
    queryFn: () => excelApi.getUnits(provinceId!),
    enabled: !!provinceId,
  });
};

// Hook for calculations
export const useCalculate = () => {
  return useMutation<CalculationResult, Error, CalculationRequest>({
    mutationFn: excelApi.calculate,
  });
};

// Hook for single column calculation
export const useCalculateColumn = () => {
  return useMutation<CalculationResult, Error, CalculationRequest>({
    mutationFn: excelApi.calculateColumn,
  });
};

// Hook for export
export const useExportExcel = () => {
  return useMutation<Blob, Error, ExportRequest>({
    mutationFn: excelApi.exportExcel,
  });
};

// Hook for merge and download
export const useMergeAndDownload = () => {
  return useMutation({
    mutationFn: excelApi.mergeAndDownload,
  });
};
