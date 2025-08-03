package handlers

import (
	"bytes"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	
	"excel-processor/internal/models"
	"excel-processor/internal/services"
)

type Handler struct {
	db       *gorm.DB
	excel    *services.ExcelService
	province *services.ProvinceService
}

func NewHandler(db *gorm.DB, excel *services.ExcelService, province *services.ProvinceService) *Handler {
	return &Handler{
		db:       db,
		excel:    excel,
		province: province,
	}
}

// UploadExcel handles Excel file upload
func (h *Handler) UploadExcel(c *gin.Context) {
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}
	defer file.Close()

	// Validate file extension
	ext := filepath.Ext(header.Filename)
	if ext != ".xlsx" && ext != ".xls" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Only .xlsx and .xls files are allowed"})
		return
	}

	// Create uploads directory if not exists
	uploadsDir := "uploads"
	if err := os.MkdirAll(uploadsDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create uploads directory"})
		return
	}

	// Generate unique filename
	filename := fmt.Sprintf("%d_%s", time.Now().Unix(), header.Filename)
	filePath := filepath.Join(uploadsDir, filename)

	// Save file
	dst, err := os.Create(filePath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create file"})
		return
	}
	defer dst.Close()

	if _, err = io.Copy(dst, file); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
		return
	}

	// Save to database
	excelFile := models.ExcelFile{
		FileName: header.Filename,
		FilePath: filePath,
		FileSize: header.Size,
	}

	if err := h.db.Create(&excelFile).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file info"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "File uploaded successfully",
		"file_id": excelFile.ID,
		"filename": excelFile.FileName,
	})
}

// UploadTemplate handles template file upload
func (h *Handler) UploadTemplate(c *gin.Context) {
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No template file uploaded"})
		return
	}
	defer file.Close()

	// Validate file extension
	ext := filepath.Ext(header.Filename)
	if ext != ".xlsx" && ext != ".xls" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Only .xlsx and .xls files are allowed"})
		return
	}

	// Create templates directory if not exists
	templatesDir := "templates"
	if err := os.MkdirAll(templatesDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create templates directory"})
		return
	}

	// Generate unique filename for template
	filename := fmt.Sprintf("template_%d_%s", time.Now().Unix(), header.Filename)
	filePath := filepath.Join(templatesDir, filename)

	// Save file
	dst, err := os.Create(filePath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create template file"})
		return
	}
	defer dst.Close()

	if _, err = io.Copy(dst, file); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save template file"})
		return
	}

	// Save to database with template flag (we can add a template field later)
	templateFile := models.ExcelFile{
		FileName: header.Filename,
		FilePath: filePath,
		FileSize: header.Size,
	}

	if err := h.db.Create(&templateFile).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save template info"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Template uploaded successfully",
		"template_id": templateFile.ID,
		"filename": templateFile.FileName,
	})
}

// GetSheets returns all sheets in an Excel file
func (h *Handler) GetSheets(c *gin.Context) {
	fileIDStr := c.Param("fileId")
	fileID, err := strconv.ParseUint(fileIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid file ID"})
		return
	}

	var excelFile models.ExcelFile
	if err := h.db.First(&excelFile, uint(fileID)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "File not found"})
		return
	}

	sheets, err := h.excel.GetSheets(excelFile.FilePath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read Excel file"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"sheets": sheets})
}

// GetSheetData returns data from a specific sheet
func (h *Handler) GetSheetData(c *gin.Context) {
	fileIDStr := c.Param("fileId")
	sheetName := c.Param("sheetName")

	fileID, err := strconv.ParseUint(fileIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid file ID"})
		return
	}

	var excelFile models.ExcelFile
	if err := h.db.First(&excelFile, uint(fileID)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "File not found"})
		return
	}

	data, err := h.excel.GetSheetData(excelFile.FilePath, sheetName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read sheet data"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": data})
}

// GetProvinces returns all provinces
func (h *Handler) GetProvinces(c *gin.Context) {
	provinces := h.province.GetAllProvinces()
	c.JSON(http.StatusOK, gin.H{"provinces": provinces})
}

// GetUnits returns units for a specific province
func (h *Handler) GetUnits(c *gin.Context) {
	provinceIDStr := c.Param("provinceId")
	provinceID, err := strconv.ParseUint(provinceIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid province ID"})
		return
	}

	units := h.province.GetUnitsByProvince(uint(provinceID))
	c.JSON(http.StatusOK, gin.H{"units": units})
}

// CalculateColumns performs calculations on selected columns
func (h *Handler) CalculateColumns(c *gin.Context) {
	var req models.CalculationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var excelFile models.ExcelFile
	if err := h.db.First(&excelFile, req.FileID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "File not found"})
		return
	}

	result, err := h.excel.CalculateColumns(excelFile.FilePath, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Calculation failed"})
		return
	}

	c.JSON(http.StatusOK, result)
}

// CalculateColumn performs calculation on a specific column
func (h *Handler) CalculateColumn(c *gin.Context) {
	var req models.CalculationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get file from database
	var excelFile models.ExcelFile
	if err := h.db.First(&excelFile, req.FileID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "File not found"})
		return
	}

	result, err := h.excel.CalculateColumnWithFile(excelFile, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Calculation failed: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

// CalculateRowWise performs row-wise calculations (e.g., I11 + K11 = L11)
func (h *Handler) CalculateRowWise(c *gin.Context) {
	var req models.RowCalculationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get file from database
	var excelFile models.ExcelFile
	if err := h.db.First(&excelFile, req.FileID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "File not found"})
		return
	}

	result, err := h.excel.CalculateRowWise(excelFile.FilePath, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Row-wise calculation failed: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

// ExportToTemplate exports row calculation results to template
func (h *Handler) ExportToTemplate(c *gin.Context) {
	var req models.TemplateExportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	filePath, err := h.excel.ExportRowCalculationToTemplate(&req.CalculationResult, req.TemplatePath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Template export failed: " + err.Error()})
		return
	}

	c.Header("Content-Disposition", "attachment; filename=calculated_template.xlsx")
	c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	c.File(filePath)

	// Clean up temporary file
	go func() {
		time.Sleep(time.Minute)
		os.Remove(filePath)
	}()
}

// ExportExcel exports data to Excel format
func (h *Handler) ExportExcel(c *gin.Context) {
	var req models.ExportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	filePath, err := h.excel.ExportToExcel(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Export failed"})
		return
	}

	c.Header("Content-Disposition", "attachment; filename=export.xlsx")
	c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	c.File(filePath)

	// Clean up temporary file
	go func() {
		time.Sleep(time.Minute)
		os.Remove(filePath)
	}()
}

// MergeAndDownload merges calculated data into template and provides download
func (h *Handler) MergeAndDownload(c *gin.Context) {
	log.Println("🔄 MergeAndDownload API called")
	
	// First, try to read the raw request body for debugging
	bodyBytes, _ := c.GetRawData()
	log.Printf("📄 Raw request body: %s", string(bodyBytes))
	
	// Reset the request body for binding
	c.Request.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))
	
	var mergeRequest map[string]interface{}
	if err := c.ShouldBindJSON(&mergeRequest); err != nil {
		log.Printf("❌ JSON binding error: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON: " + err.Error()})
		return
	}

	log.Printf("📦 Received merge request: %+v", mergeRequest)

	// Get template file info
	templateID, ok := mergeRequest["templateId"].(float64)
	if !ok {
		log.Printf("❌ Template ID not found or invalid type in request: %+v", mergeRequest)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Template ID not provided or invalid type"})
		return
	}

	log.Printf("🎯 Template ID: %v", templateID)

	var templateFile models.ExcelFile
	if err := h.db.First(&templateFile, uint(templateID)).Error; err != nil {
		log.Printf("❌ Template file not found for ID %v: %v", templateID, err)
		c.JSON(http.StatusNotFound, gin.H{"error": "Template file not found"})
		return
	}

	log.Printf("✅ Found template file: %s", templateFile.FilePath)

	// Check if this is multi-column merge or single column
	_, hasMultipleColumns := mergeRequest["mergeData"]
	
	var outputPath string
	var err error
	
	if hasMultipleColumns {
		log.Printf("🔢 Multi-column merge detected")
		outputPath, err = h.excel.MergeMultipleColumnsToTemplate(templateFile.FilePath, mergeRequest)
	} else {
		log.Printf("📝 Single-column merge detected")
		outputPath, err = h.excel.MergeDataToTemplate(templateFile.FilePath, mergeRequest)
	}

	if err != nil {
		log.Printf("❌ Merge failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Merge failed: " + err.Error()})
		return
	}

	log.Printf("✅ Merge completed, output file: %s", outputPath)

	// Set headers for file download
	filename := fmt.Sprintf("merged_result_%d.xlsx", time.Now().Unix())
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s", filename))
	c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	c.File(outputPath)

	// Clean up temporary file after download
	go func() {
		time.Sleep(time.Minute)
		os.Remove(outputPath)
	}()
}
