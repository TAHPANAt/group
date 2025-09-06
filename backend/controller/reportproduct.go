// backend/controller/Report.go
package controller

import (
	"net/http"
	"time"

	"example.com/GROUB/config"
	"example.com/GROUB/entity"
	"github.com/gin-gonic/gin"
)

type CreateReportInput struct {
	ProductID    uint   `json:"product_id"`
	SellerID     uint   `json:"seller_id"`
	TargetType   string `json:"targetType"`
	ReportTypeID uint   `json:"report_type_id"`
	Description  string `json:"description"`
}

// POST /api/reports
func CreateReportProduct(c *gin.Context) {
	// ✅ ดึง member_id จาก context (middleware jwt)
	memberIDVal, exists := c.Get("member_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	memberID := memberIDVal.(uint)

	var input CreateReportInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	report := entity.Report{
		ProductID:    input.ProductID,
		SellerID:     input.SellerID,
		TargetType:   input.TargetType,
		ReportTypeID: input.ReportTypeID,
		MemberID:     memberID,
		CreatedAt:    time.Now(),
	}

	// ✅ ใช้ config.DB() ตรง ๆ
	if err := config.DB().Create(&report).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถบันทึกรีพอร์ตได้"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "สร้างรีพอร์ตสำเร็จ ✅",
		"data":    report,
	})
}

func GetReports(c *gin.Context) {
	var reports []entity.Report
	if err := config.DB().
		Preload("ReportType").
		Preload("Member").
		Preload("Seller").
		Preload("Product"). // ✅ preload product ด้วย
		Find(&reports).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// ✅ ส่งออกเป็น JSON พร้อม field "data"
	c.JSON(http.StatusOK, gin.H{"data": reports})
}