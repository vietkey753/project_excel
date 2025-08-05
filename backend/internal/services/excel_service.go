package services

import (
	"fmt"
	"strconv"
	"strings"
	"time"
	"os"

	"github.com/xuri/excelize/v2"
	"excel-processor/internal/models"
)

type ExcelService struct {
}

func NewExcelService() *ExcelService {
	return &ExcelService{}
}

// getAllExcelColumns returns all column letters (A, B, C, ..., AK) that have data in any row
func (s *ExcelService) getAllExcelColumns(f *excelize.File, sheetName string) []string {
	// Get the sheet dimension to find the actual used range
	cols, _ := f.GetSheetDimension(sheetName)
	
	var columns []string
	
	// Convert column letter to number to iterate
	maxCol, _ := excelize.ColumnNameToNumber(cols)
	
	// Generate all column letters up to the max used column
	for i := 1; i <= maxCol; i++ {
		colName, _ := excelize.ColumnNumberToName(i)
		columns = append(columns, colName)
	}
	
	// If no data found, return standard Excel columns A-AK (first 37 columns)
	if len(columns) == 0 {
		for i := 1; i <= 52; i++ {
			colName, _ := excelize.ColumnNumberToName(i)
			columns = append(columns, colName)
		}
	}
	
	return columns
}

// parseNumberWithCommas parses numbers that may contain commas as thousand separators
func (s *ExcelService) parseNumberWithCommas(str string) (float64, error) {
	if str == "" {
		return 0, fmt.Errorf("empty string")
	}
	
	// Remove all commas (thousand separators)
	cleanStr := strings.ReplaceAll(str, ",", "")
	
	// Remove any spaces
	cleanStr = strings.TrimSpace(cleanStr)
	
	// Try to parse as float
	return strconv.ParseFloat(cleanStr, 64)
}

// GetSheets returns all sheet names and their info from an Excel file
func (s *ExcelService) GetSheets(filePath string) ([]models.SheetInfo, error) {
	f, err := excelize.OpenFile(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to open file: %w", err)
	}
	defer f.Close()

	sheetList := f.GetSheetList()
	sheets := make([]models.SheetInfo, 0, len(sheetList))

	for _, sheetName := range sheetList {
		rows, err := f.GetRows(sheetName)
		if err != nil {
			continue
		}

		// Get all columns from Excel structure, not just from first row
		columns := s.getAllExcelColumns(f, sheetName)

		sheets = append(sheets, models.SheetInfo{
			Name:     sheetName,
			Columns:  columns,
			RowCount: len(rows),
		})
	}

	return sheets, nil
}

// GetSheetData returns all data from a specific sheet
func (s *ExcelService) GetSheetData(filePath, sheetName string) ([]map[string]interface{}, error) {
	f, err := excelize.OpenFile(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to open file: %w", err)
	}
	defer f.Close()

	rows, err := f.GetRows(sheetName)
	if err != nil {
		return nil, fmt.Errorf("failed to read sheet %s: %w", sheetName, err)
	}

	if len(rows) == 0 {
		return []map[string]interface{}{}, nil
	}

	// Get all available columns from Excel structure
	allColumns := s.getAllExcelColumns(f, sheetName)
	data := make([]map[string]interface{}, 0, len(rows))

	// Process all rows including row 0 (headers can be anywhere)
	for i := 0; i < len(rows); i++ {
		row := rows[i]
		rowData := make(map[string]interface{})

		// Map each column to its data
		for j, colName := range allColumns {
			var value interface{} = ""
			if j < len(row) && row[j] != "" {
				// Try to parse as number with comma support, otherwise keep as string
				if numVal, err := s.parseNumberWithCommas(row[j]); err == nil {
					value = numVal
				} else {
					value = row[j]
				}
			}
			rowData[colName] = value
		}
		data = append(data, rowData)
	}

	return data, nil
}

// CalculateColumns performs calculations on selected columns
func (s *ExcelService) CalculateColumns(filePath string, req models.CalculationRequest) (*models.CalculationResult, error) {
	data, err := s.GetSheetData(filePath, req.SheetName)
	if err != nil {
		return nil, err
	}

	result := &models.CalculationResult{
		MainColumn: req.MainColumn,
		Results:    make([]map[string]interface{}, 0),
		Summary:    make(map[string]float64),
	}

	// Group data by main column value
	groups := make(map[string][]map[string]interface{})
	for _, row := range data {
		if mainVal, exists := row[req.MainColumn]; exists {
			key := fmt.Sprintf("%v", mainVal)
			groups[key] = append(groups[key], row)
		}
	}

	// Calculate for each group
	for groupKey, groupData := range groups {
		groupResult := map[string]interface{}{
			req.MainColumn: groupKey,
		}

		for _, targetCol := range req.TargetColumns {
			sum := 0.0
			count := 0

			for _, row := range groupData {
				if val, exists := row[targetCol]; exists {
					if numVal, ok := val.(float64); ok {
						sum += numVal
						count++
					}
				}
			}

			switch req.Operation {
			case "sum":
				groupResult[targetCol] = sum
			case "average":
				if count > 0 {
					groupResult[targetCol] = sum / float64(count)
				} else {
					groupResult[targetCol] = 0
				}
			case "count":
				groupResult[targetCol] = count
			}

			// Add to summary
			if _, exists := result.Summary[targetCol]; !exists {
				result.Summary[targetCol] = 0
			}
			result.Summary[targetCol] += sum
		}

		result.Results = append(result.Results, groupResult)
	}

	return result, nil
}

// CalculateColumn performs simple calculation on a single column
func (s *ExcelService) CalculateColumn(req models.CalculationRequest) (*models.CalculationResult, error) {
	// Get file from database
	file, err := s.getFileByID(req.FileID)
	if err != nil {
		return nil, fmt.Errorf("file not found: %w", err)
	}

	return s.CalculateColumnWithFile(*file, req)
}

// CalculateColumnWithFile performs simple calculation on a single column with provided file
func (s *ExcelService) CalculateColumnWithFile(file models.ExcelFile, req models.CalculationRequest) (*models.CalculationResult, error) {
	// Read data
	data, err := s.GetSheetData(file.FilePath, req.SheetName)
	if err != nil {
		return nil, fmt.Errorf("failed to read sheet data: %w", err)
	}

	if len(data) == 0 {
		return nil, fmt.Errorf("no data found in sheet")
	}

	// Determine start row (default to 0 if not specified)
	startRow := 0
	if req.StartRow != nil {
		startRow = *req.StartRow
		if startRow < 0 || startRow >= len(data) {
			return nil, fmt.Errorf("invalid start row: %d (data has %d rows)", startRow, len(data))
		}
	}

	// Extract column values starting from the specified row
	var values []float64
	processedRows := data[startRow:] // Only process rows from startRow onwards
	
	for _, row := range processedRows {
		if val, exists := row[req.MainColumn]; exists {
			if strVal, ok := val.(string); ok {
				// Use parseNumberWithCommas to handle comma-separated numbers
				if numVal, err := s.parseNumberWithCommas(strVal); err == nil {
					values = append(values, numVal)
				}
			} else if numVal, ok := val.(float64); ok {
				values = append(values, numVal)
			}
		}
	}

	if len(values) == 0 {
		return nil, fmt.Errorf("no numeric values found in column %s starting from row %d", req.MainColumn, startRow)
	}

	// Perform calculation
	var result float64
	switch req.Operation {
	case "sum":
		for _, v := range values {
			result += v
		}
	case "average":
		sum := 0.0
		for _, v := range values {
			sum += v
		}
		result = sum / float64(len(values))
	case "count":
		result = float64(len(values))
	case "max":
		result = values[0]
		for _, v := range values {
			if v > result {
				result = v
			}
		}
	case "min":
		result = values[0]
		for _, v := range values {
			if v < result {
				result = v
			}
		}
	default:
		return nil, fmt.Errorf("unsupported operation: %s", req.Operation)
	}

	return &models.CalculationResult{
		MainColumn: req.MainColumn,
		Summary: map[string]float64{
			req.Operation: result,
		},
		Results: []map[string]interface{}{
			{
				"column":      req.MainColumn,
				"operation":   req.Operation,
				"result":      result,
				"count":       len(values),
				"total_rows":  len(processedRows),
				"start_row":   startRow,
				"data_length": len(data),
			},
		},
	}, nil
}

// CalculateRowWise performs row-wise calculations (e.g., I11 + K11 = L11, I12 + K12 = L12, ...)
func (s *ExcelService) CalculateRowWise(filePath string, req models.RowCalculationRequest) (*models.RowCalculationResult, error) {
	f, err := excelize.OpenFile(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to open file: %w", err)
	}
	defer f.Close()

	// Get sheet data to determine the actual end row
	rows, err := f.GetRows(req.SheetName)
	if err != nil {
		return nil, fmt.Errorf("failed to read sheet %s: %w", req.SheetName, err)
	}

	// Determine end row (auto-detect if not specified)
	endRow := len(rows) - 1 // Convert to 0-based index
	if req.EndRow != nil {
		endRow = *req.EndRow
	}

	// Validate row range
	if req.StartRow < 0 || req.StartRow >= len(rows) {
		return nil, fmt.Errorf("invalid start row: %d (sheet has %d rows)", req.StartRow, len(rows))
	}
	if endRow < req.StartRow || endRow >= len(rows) {
		endRow = len(rows) - 1
	}

	// Build formula string for display
	formula := ""
	switch req.Operation {
	case "add":
		formula = fmt.Sprintf("%s", req.SourceColumns[0])
		for i := 1; i < len(req.SourceColumns); i++ {
			formula += " + " + req.SourceColumns[i]
		}
	case "subtract":
		formula = fmt.Sprintf("%s", req.SourceColumns[0])
		for i := 1; i < len(req.SourceColumns); i++ {
			formula += " - " + req.SourceColumns[i]
		}
	case "multiply":
		formula = fmt.Sprintf("%s", req.SourceColumns[0])
		for i := 1; i < len(req.SourceColumns); i++ {
			formula += " × " + req.SourceColumns[i]
		}
	case "divide":
		formula = fmt.Sprintf("%s", req.SourceColumns[0])
		for i := 1; i < len(req.SourceColumns); i++ {
			formula += " ÷ " + req.SourceColumns[i]
		}
	case "copy":
		formula = fmt.Sprintf("Copy from %s", req.SourceColumns[0])
	}

	result := &models.RowCalculationResult{
		SourceColumns: req.SourceColumns,
		TargetColumn:  req.TargetColumn,
		Operation:     req.Operation,
		StartRow:      req.StartRow + 1, // Convert to 1-based for display
		EndRow:        endRow + 1,       // Convert to 1-based for display
		Results:       make([]map[string]interface{}, 0),
		Formula:       formula,
	}

	// Perform row-wise calculations
	for rowIndex := req.StartRow; rowIndex <= endRow; rowIndex++ {
		if rowIndex >= len(rows) {
			break
		}

		row := rows[rowIndex]
		
		// For copy operation, handle text data differently
		if req.Operation == "copy" {
			// Get the original text value from the first source column
			colIndex, err := excelize.ColumnNameToNumber(req.SourceColumns[0])
			if err != nil {
				continue
			}
			colIndex-- // Convert to 0-based

			var originalValue interface{} = ""
			if colIndex < len(row) && row[colIndex] != "" {
				originalValue = row[colIndex] // Keep original text/string value
			}

			// Store result with original text value
			rowResult := map[string]interface{}{
				"row_number":       rowIndex + 1, // 1-based for display
				"calculated_value": originalValue,
				req.TargetColumn:   originalValue,
			}

			// Add source values for reference
			rowResult[req.SourceColumns[0]] = originalValue

			result.Results = append(result.Results, rowResult)
			continue
		}
		
		// For numeric operations, continue with existing logic
		values := make([]float64, 0)
		
		// Get values from source columns
		for _, colName := range req.SourceColumns {
			colIndex, err := excelize.ColumnNameToNumber(colName)
			if err != nil {
				continue
			}
			colIndex-- // Convert to 0-based

			var value float64 = 0
			if colIndex < len(row) && row[colIndex] != "" {
				// Use the new parseNumberWithCommas function to handle commas
				if val, err := s.parseNumberWithCommas(row[colIndex]); err == nil {
					value = val
				}
			}
			values = append(values, value)
		}

		// Calculate result based on operation
		var calculatedValue float64 = 0
		if len(values) > 0 {
			calculatedValue = values[0]
			
			for i := 1; i < len(values); i++ {
				switch req.Operation {
				case "add":
					calculatedValue += values[i]
				case "subtract":
					calculatedValue -= values[i]
				case "multiply":
					calculatedValue *= values[i]
				case "divide":
					if values[i] != 0 {
						calculatedValue /= values[i]
					}
				}
			}
		}

		// Store result
		rowResult := map[string]interface{}{
			"row_number":       rowIndex + 1, // 1-based for display
			"calculated_value": calculatedValue,
			req.TargetColumn:   calculatedValue,
		}

		// Add source values for reference
		for i, colName := range req.SourceColumns {
			if i < len(values) {
				rowResult[colName] = values[i]
			}
		}

		result.Results = append(result.Results, rowResult)
	}

	result.TotalRows = len(result.Results)
	return result, nil
}

// ExportRowCalculationToTemplate exports row calculation results to a template file
func (s *ExcelService) ExportRowCalculationToTemplate(calculationResult *models.RowCalculationResult, templatePath string) (string, error) {
	// Check if template exists
	if templatePath == "" {
		templatePath = "templates/FileMauImportThuNhap.xlsx"
	}
	
	// Open template file
	f, err := excelize.OpenFile(templatePath)
	if err != nil {
		return "", fmt.Errorf("failed to open template file %s: %w", templatePath, err)
	}
	defer f.Close()

	// Get the first sheet name
	sheetList := f.GetSheetList()
	if len(sheetList) == 0 {
		return "", fmt.Errorf("template file has no sheets")
	}
	sheetName := sheetList[0]

	// Write calculation results to the target column
	for _, rowResult := range calculationResult.Results {
		rowNumber := int(rowResult["row_number"].(float64))
		calculatedValue := rowResult["calculated_value"].(float64)
		
		// Write to target column at the specific row
		cellAddress := fmt.Sprintf("%s%d", calculationResult.TargetColumn, rowNumber)
		err := f.SetCellValue(sheetName, cellAddress, calculatedValue)
		if err != nil {
			return "", fmt.Errorf("failed to write to cell %s: %w", cellAddress, err)
		}
	}

	// Create exports directory if not exists
	exportsDir := "exports"
	if err := os.MkdirAll(exportsDir, 0755); err != nil {
		return "", fmt.Errorf("failed to create exports directory: %w", err)
	}

	// Save the modified template
	outputPath := fmt.Sprintf("%s/calculated_template_%d.xlsx", exportsDir, time.Now().Unix())
	if err := f.SaveAs(outputPath); err != nil {
		return "", fmt.Errorf("failed to save template file: %w", err)
	}

	return outputPath, nil
}

// ExportToExcel exports data to Excel file
func (s *ExcelService) ExportToExcel(req models.ExportRequest) (string, error) {
	f := excelize.NewFile()
	defer f.Close()

	sheetName := "Export"
	f.SetSheetName("Sheet1", sheetName)

	if len(req.Data) == 0 {
		return "", fmt.Errorf("no data to export")
	}

	// Write headers
	headers := make([]string, 0)
	for key := range req.Data[0] {
		headers = append(headers, key)
	}

	for i, header := range headers {
		cell := fmt.Sprintf("%c1", 'A'+i)
		f.SetCellValue(sheetName, cell, header)
	}

	// Write data
	for rowIndex, row := range req.Data {
		for colIndex, header := range headers {
			cell := fmt.Sprintf("%c%d", 'A'+colIndex, rowIndex+2)
			f.SetCellValue(sheetName, cell, row[header])
		}
	}

	// Create exports directory if not exists
	exportsDir := "exports"
	if err := os.MkdirAll(exportsDir, 0755); err != nil {
		return "", fmt.Errorf("failed to create exports directory: %w", err)
	}

	// Save file
	outputPath := fmt.Sprintf("%s/export_%d.xlsx", exportsDir, time.Now().Unix())
	if err := f.SaveAs(outputPath); err != nil {
		return "", fmt.Errorf("failed to save file: %w", err)
	}

	return outputPath, nil
}

// getFileByID is a helper method to get file by ID
// In a real implementation, this would query the database
func (s *ExcelService) getFileByID(fileID uint) (*models.ExcelFile, error) {
	// This is a simplified implementation
	// In reality, you would query the database
	return &models.ExcelFile{
		ID:       fileID,
		FileName: fmt.Sprintf("file_%d.xlsx", fileID),
		FilePath: fmt.Sprintf("uploads/file_%d.xlsx", fileID),
	}, nil
}

// MergeDataToTemplate merges calculated data into template and exports new file
func (s *ExcelService) MergeDataToTemplate(templatePath string, mergeData map[string]interface{}) (string, error) {
	// Open template file
	f, err := excelize.OpenFile(templatePath)
	if err != nil {
		return "", fmt.Errorf("failed to open template file: %v", err)
	}
	defer f.Close()

	// Extract merge parameters
	targetColumn, ok := mergeData["targetColumn"].(string)
	if !ok {
		return "", fmt.Errorf("target column not specified")
	}

	startRow, ok := mergeData["startRow"].(float64)
	if !ok {
		return "", fmt.Errorf("start row not specified")
	}

	templateSheet, ok := mergeData["templateSheet"].(string)
	if !ok {
		return "", fmt.Errorf("template sheet not specified")
	}

	calculatedData, ok := mergeData["calculatedData"].([]interface{})
	if !ok {
		return "", fmt.Errorf("calculated data not found")
	}

	// Insert calculated values into template
	for i, data := range calculatedData {
		if dataMap, ok := data.(map[string]interface{}); ok {
			if value, exists := dataMap["value"]; exists {
				cellRef := fmt.Sprintf("%s%d", targetColumn, int(startRow)+i)
				
				// Convert value to appropriate type
				if numVal, ok := value.(float64); ok {
					err = f.SetCellValue(templateSheet, cellRef, numVal)
				} else {
					err = f.SetCellValue(templateSheet, cellRef, value)
				}
				
				if err != nil {
					return "", fmt.Errorf("failed to set cell %s: %v", cellRef, err)
				}
			}
		}
	}

	// Generate output filename
	timestamp := time.Now().Unix()
	outputPath := fmt.Sprintf("exports/merged_%d.xlsx", timestamp)
	
	// Create exports directory if not exists
	if err := os.MkdirAll("exports", 0755); err != nil {
		return "", fmt.Errorf("failed to create exports directory: %v", err)
	}

	// Save merged file
	if err := f.SaveAs(outputPath); err != nil {
		return "", fmt.Errorf("failed to save merged file: %v", err)
	}

	return outputPath, nil
}

// MergeMultipleColumnsToTemplate merges multiple calculated columns into template
func (s *ExcelService) MergeMultipleColumnsToTemplate(templatePath string, mergeData map[string]interface{}) (string, error) {
	// Open template file
	f, err := excelize.OpenFile(templatePath)
	if err != nil {
		return "", fmt.Errorf("failed to open template file: %v", err)
	}
	defer f.Close()

	// Extract common parameters
	templateSheet, ok := mergeData["templateSheet"].(string)
	if !ok {
		return "", fmt.Errorf("template sheet not specified")
	}

	// Extract merge data array for multiple columns
	mergeDataArray, ok := mergeData["mergeData"].([]interface{})
	if !ok {
		// Fallback to single column format
		return s.MergeDataToTemplate(templatePath, mergeData)
	}

	// Process each column mapping
	for _, columnData := range mergeDataArray {
		if columnMap, ok := columnData.(map[string]interface{}); ok {
			targetColumn, hasTarget := columnMap["targetColumn"].(string)
			if !hasTarget {
				continue // Skip if no target column
			}

			calculatedData, hasData := columnMap["calculatedData"].([]interface{})
			if !hasData {
				continue // Skip if no calculated data
			}

			// Insert calculated values for this column
			for i, data := range calculatedData {
				if dataMap, ok := data.(map[string]interface{}); ok {
					if value, exists := dataMap["value"]; exists {
						// Always use targetRow from frontend data (already calculated correctly)
						targetRow, hasTargetRow := dataMap["targetRow"].(float64)
						if !hasTargetRow {
							return "", fmt.Errorf("targetRow not found in calculated data for row %d", i)
						}
						
						cellRef := fmt.Sprintf("%s%d", targetColumn, int(targetRow))
						
						// Convert value to appropriate type
						if numVal, ok := value.(float64); ok {
							err = f.SetCellValue(templateSheet, cellRef, numVal)
						} else {
							err = f.SetCellValue(templateSheet, cellRef, value)
						}
						
						if err != nil {
							return "", fmt.Errorf("failed to set cell %s: %v", cellRef, err)
						}
					}
				}
			}
		}
	}

	// Generate output filename
	timestamp := time.Now().Unix()
	outputPath := fmt.Sprintf("exports/merged_multi_%d.xlsx", timestamp)
	
	// Create exports directory if not exists
	if err := os.MkdirAll("exports", 0755); err != nil {
		return "", fmt.Errorf("failed to create exports directory: %v", err)
	}

	// Save merged file
	if err := f.SaveAs(outputPath); err != nil {
		return "", fmt.Errorf("failed to save merged file: %v", err)
	}

	return outputPath, nil
}
