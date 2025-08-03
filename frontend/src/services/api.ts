import axios from 'axios';
import type {
  Province,
  Unit,
  SheetInfo,
  CalculationRequest,
  CalculationResult,
  ExportRequest,
  UploadResponse,
} from '../types';

const API_BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const excelApi = {
  // File upload
  uploadFile: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Template upload
  uploadTemplate: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/upload-template', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get sheets from Excel file
  getSheets: async (fileId: number): Promise<SheetInfo[]> => {
    const response = await api.get(`/sheets/${fileId}`);
    return response.data.sheets;
  },

  // Get data from specific sheet
  getSheetData: async (fileId: number, sheetName: string): Promise<Record<string, any>[]> => {
    const response = await api.get(`/data/${fileId}/${encodeURIComponent(sheetName)}`);
    return response.data.data;
  },

  // Get provinces
  getProvinces: async (): Promise<Province[]> => {
    const response = await api.get('/provinces');
    return response.data.provinces;
  },

  // Get units by province
  getUnits: async (provinceId: number): Promise<Unit[]> => {
    const response = await api.get(`/units/${provinceId}`);
    return response.data.units;
  },

  // Perform calculations
  calculate: async (request: CalculationRequest): Promise<CalculationResult> => {
    const response = await api.post('/calculate', request);
    return response.data;
  },

  // Perform single column calculation
  calculateColumn: async (request: CalculationRequest): Promise<CalculationResult> => {
    const response = await api.post('/calculate-column', request);
    return response.data;
  },

  // Perform row-wise calculations (NEW)
  calculateRowWise: async (request: any): Promise<any> => {
    const response = await api.post('/calculate-rowwise', request);
    return response.data;
  },

  // Export row calculation results to template
  exportToTemplate: async (request: any): Promise<Blob> => {
    const response = await api.post('/export-template', request, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Export to Excel
  exportExcel: async (request: ExportRequest): Promise<Blob> => {
    const response = await api.post('/export', request, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Health check
  healthCheck: async (): Promise<{ status: string }> => {
    const response = await api.get('/health');
    return response.data;
  },

  // Merge and download
  mergeAndDownload: async (mergeData: any): Promise<Blob> => {
    console.log('🔄 API mergeAndDownload called with:', mergeData);
    
    try {
      const response = await api.post('/merge-download', mergeData, {
        responseType: 'blob',
      });
      
      console.log('✅ API response received:', {
        status: response.status,
        headers: response.headers,
        dataSize: response.data.size,
        dataType: response.data.type
      });
      
      return response.data;
    } catch (error) {
      console.error('❌ API mergeAndDownload error:', error);
      throw error;
    }
  },
};

export default api;
