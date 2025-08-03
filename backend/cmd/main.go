package main

import (
	"log"
	"net/http"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	
	"excel-processor/internal/handlers"
	"excel-processor/internal/models"
	"excel-processor/internal/services"
)

func main() {
	// Initialize database
	db, err := gorm.Open(sqlite.Open("excel_processor.db"), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// Auto migrate models
	err = db.AutoMigrate(&models.Province{}, &models.Unit{}, &models.ExcelFile{})
	if err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	// Initialize Gin
	r := gin.Default()

	// CORS middleware
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173", "http://localhost:5174"}, // Support both Vite ports
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		AllowCredentials: true,
	}))

	// Initialize handlers
	excelService := services.NewExcelService()
	provinceService := services.NewProvinceService()
	h := handlers.NewHandler(db, excelService, provinceService)

	// Routes
	api := r.Group("/api")
	{
		api.GET("/health", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"status": "ok"})
		})
		
		// Excel processing routes
		api.POST("/upload", h.UploadExcel)
		api.POST("/upload-template", h.UploadTemplate)
		api.GET("/sheets/:fileId", h.GetSheets)
		api.GET("/data/:fileId/:sheetName", h.GetSheetData)
		
		// Province and unit routes
		api.GET("/provinces", h.GetProvinces)
		api.GET("/units/:provinceId", h.GetUnits)
		
		// Calculation routes
		api.POST("/calculate", h.CalculateColumns)
		api.POST("/calculate-column", h.CalculateColumn)
		api.POST("/calculate-rowwise", h.CalculateRowWise)
		api.POST("/export", h.ExportExcel)
		api.POST("/export-template", h.ExportToTemplate)
		api.POST("/merge-download", h.MergeAndDownload)
	}

	log.Println("Server starting on :8080")
	if err := r.Run(":8080"); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
