package models

import (
	"time"
)

// Province represents a province/city
type Province struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	Name      string    `json:"name" gorm:"not null"`
	Code      string    `json:"code" gorm:"unique;not null"`
	Units     []Unit    `json:"units,omitempty" gorm:"foreignKey:ProvinceID"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Unit represents a unit/organization within a province
type Unit struct {
	ID         uint      `json:"id" gorm:"primaryKey"`
	Name       string    `json:"name" gorm:"not null"`
	Code       string    `json:"code" gorm:"not null"`
	ProvinceID uint      `json:"province_id" gorm:"not null"`
	Province   Province  `json:"province,omitempty" gorm:"foreignKey:ProvinceID"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

// ExcelFile represents an uploaded Excel file
type ExcelFile struct {
	ID         uint      `json:"id" gorm:"primaryKey"`
	FileName   string    `json:"file_name" gorm:"not null"`
	FilePath   string    `json:"file_path" gorm:"not null"`
	FileSize   int64     `json:"file_size"`
	ProvinceID *uint     `json:"province_id,omitempty"`
	UnitID     *uint     `json:"unit_id,omitempty"`
	Province   *Province `json:"province,omitempty" gorm:"foreignKey:ProvinceID"`
	Unit       *Unit     `json:"unit,omitempty" gorm:"foreignKey:UnitID"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

// SheetInfo represents information about an Excel sheet
type SheetInfo struct {
	Name    string   `json:"name"`
	Columns []string `json:"columns"`
	RowCount int     `json:"row_count"`
}

// CalculationRequest represents a calculation request
type CalculationRequest struct {
	FileID       uint     `json:"file_id" binding:"required"`
	SheetName    string   `json:"sheet_name" binding:"required"`
	MainColumn   string   `json:"main_column" binding:"required"`
	TargetColumns []string `json:"target_columns" binding:"required"`
	Operation    string   `json:"operation" binding:"required"` // sum, average, etc.
	StartRow     *int     `json:"start_row,omitempty"`          // Optional: 0-based row index to start calculation from
}

// RowCalculationRequest represents a row-wise calculation request
type RowCalculationRequest struct {
	FileID        uint     `json:"file_id" binding:"required"`
	SheetName     string   `json:"sheet_name" binding:"required"`
	SourceColumns []string `json:"source_columns" binding:"required"` // Columns to calculate from (e.g., I, K, M)
	TargetColumn  string   `json:"target_column" binding:"required"`  // Column to write result to (e.g., L)
	Operation     string   `json:"operation" binding:"required"`      // add, subtract, multiply, divide
	StartRow      int      `json:"start_row"`                         // Row to start calculation from (e.g., 11)
	EndRow        *int     `json:"end_row,omitempty"`                 // Row to end calculation (optional, auto-detect if nil)
}

// RowCalculationResult represents the result of a row-wise calculation
type RowCalculationResult struct {
	SourceColumns []string                 `json:"source_columns"`
	TargetColumn  string                   `json:"target_column"`
	Operation     string                   `json:"operation"`
	StartRow      int                      `json:"start_row"`
	EndRow        int                      `json:"end_row"`
	Results       []map[string]interface{} `json:"results"` // Each result contains row number and calculated value
	TotalRows     int                      `json:"total_rows"`
	Formula       string                   `json:"formula"` // e.g., "I + K + M"
}

// CalculationResult represents the result of a calculation
type CalculationResult struct {
	MainColumn    string                 `json:"main_column"`
	Results       []map[string]interface{} `json:"results"`
	Summary       map[string]float64     `json:"summary"`
}

// ExportRequest represents an export request
type ExportRequest struct {
	FileID       uint                   `json:"file_id" binding:"required"`
	SheetName    string                 `json:"sheet_name" binding:"required"`
	Data         []map[string]interface{} `json:"data" binding:"required"`
	TemplateName string                 `json:"template_name,omitempty"`
}

// TemplateExportRequest represents a template export request for row calculations
type TemplateExportRequest struct {
	CalculationResult RowCalculationResult `json:"calculation_result" binding:"required"`
	TemplatePath      string               `json:"template_path,omitempty"`
}

// MergeDataRequest represents data merge request
type MergeDataRequest struct {
	SourceFileID   uint                    `json:"source_file_id"`
	SourceSheet    string                  `json:"source_sheet"`
	TemplateID     uint                    `json:"template_id"`
	TemplateSheet  string                  `json:"template_sheet"`
	ColumnMappings []ColumnMapping         `json:"column_mappings"`
	StartRow       int                     `json:"start_row"`       // Where to start inserting in template
	TargetColumn   string                  `json:"target_column"`   // Column in template to insert data
}

// ColumnMapping represents mapping between source and template columns
type ColumnMapping struct {
	SourceColumn   string `json:"source_column"`
	TemplateColumn string `json:"template_column"`
	Operation      string `json:"operation"` // "copy", "calculate", "formula"
}

// MultiColumnCalculationRequest represents calculation for multiple columns
type MultiColumnCalculationRequest struct {
	FileID       uint                     `json:"file_id"`
	SheetName    string                   `json:"sheet_name"`
	Calculations []ColumnCalculationSpec  `json:"calculations"`
	StartRow     int                      `json:"start_row"`
}

// ColumnCalculationSpec represents calculation specification for a column
type ColumnCalculationSpec struct {
	TargetColumn  string   `json:"target_column"`   // Column to store result
	SourceColumns []string `json:"source_columns"`  // Columns to calculate from
	Operation     string   `json:"operation"`       // "add", "subtract", "multiply", "divide"
	Formula       string   `json:"formula"`         // Custom formula (optional)
}

// MultiColumnCalculationResult represents result of multi-column calculation
type MultiColumnCalculationResult struct {
	Calculations []ColumnCalculationResult `json:"calculations"`
	TotalRows    int                       `json:"total_rows"`
	Success      bool                      `json:"success"`
	Message      string                    `json:"message"`
}

// ColumnCalculationResult represents result for a single column calculation
type ColumnCalculationResult struct {
	TargetColumn string                   `json:"target_column"`
	Results      []RowCalculationResult   `json:"results"`
	Summary      CalculationSummary       `json:"summary"`
}

// CalculationSummary represents summary statistics for calculations
type CalculationSummary struct {
	Total   float64 `json:"total"`
	Average float64 `json:"average"`
	Min     float64 `json:"min"`
	Max     float64 `json:"max"`
	Count   int     `json:"count"`
}
