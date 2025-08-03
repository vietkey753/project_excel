export interface Province {
  id: number;
  name: string;
  code: string;
  units?: Unit[];
}

export interface Unit {
  id: number;
  name: string;
  code: string;
  province_id: number;
  province?: Province;
}

export interface ExcelFile {
  id: number;
  file_name: string;
  file_path: string;
  file_size: number;
  province_id?: number;
  unit_id?: number;
  province?: Province;
  unit?: Unit;
  created_at: string;
  updated_at: string;
}

export interface SheetInfo {
  name: string;
  columns: string[];
  row_count: number;
}

export interface CalculationRequest {
  file_id: number;
  sheet_name: string;
  main_column: string;
  target_columns: string[];
  operation: 'sum' | 'average' | 'count' | 'max' | 'min' | 'custom';
}

export interface CalculationResult {
  main_column: string;
  results: Record<string, any>[];
  summary: Record<string, number>;
}

// New types for row-wise calculations
export interface RowCalculationRequest {
  file_id: number;
  sheet_name: string;
  source_columns: string[];  // Columns to calculate from (e.g., ["I", "K", "M"])
  target_column: string;     // Column to write result to (e.g., "L")
  operation: 'add' | 'subtract' | 'multiply' | 'divide' | 'copy';
  start_row: number;         // Row to start calculation from (e.g., 11)
  end_row?: number;          // Row to end calculation (optional, auto-detect if undefined)
}

export interface RowCalculationResult {
  source_columns: string[];
  target_column: string;
  operation: string;
  start_row: number;
  end_row: number;
  results: Array<{
    row_number: number;
    calculated_value: number;
    [key: string]: any;  // Source column values
  }>;
  total_rows: number;
  formula: string;  // e.g., "I + K + M"
}

export interface ExportRequest {
  file_id: number;
  sheet_name: string;
  data: Record<string, any>[];
  template_name?: string;
}

export interface UploadResponse {
  message: string;
  file_id: number;
  filename: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}
