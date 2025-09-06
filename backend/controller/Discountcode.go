package controller

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"example.com/GROUB/config"
	"example.com/GROUB/entity"
	"github.com/gin-gonic/gin"
)

type createDiscountDTO struct {
	Name       string `form:"name" binding:"required"`
	Amount     int    `form:"amount" binding:"required"`
	MinOrder   int    `form:"min_order"`
	UsageLimit int    `form:"usage_limit"`
	StartsAt   string `form:"starts_at"`
	ExpiresAt  string `form:"expires_at"`
}

func parseTimePtr(iso string) (*time.Time, error) {
	if iso == "" {
		return nil, nil
	}
	if t, err := time.Parse(time.RFC3339, iso); err == nil {
		return &t, nil
	}
	if t, err := time.Parse("2006-01-02", iso); err == nil {
		return &t, nil
	}
	return nil, fmt.Errorf("invalid time format: %s", iso)
}

func ensureDir(p string) error {
	return os.MkdirAll(p, 0755)
}

// baseURL เช่น http://localhost:8080
func baseURL(c *gin.Context) string {
	scheme := "http"
	// ถ้า reverse proxy ใส่ X-Forwarded-Proto มาก็ใช้ได้
	if xf := c.Request.Header.Get("X-Forwarded-Proto"); xf != "" {
		scheme = xf
	}
	return fmt.Sprintf("%s://%s", scheme, c.Request.Host)
}

func saveImageAndReturnURL(c *gin.Context) (string, error) {
	file, err := c.FormFile("image")
	if err != nil || file == nil {
		return "", nil // ไม่อัปก็ไม่เป็นไร
	}

	ext := strings.ToLower(filepath.Ext(file.Filename))
	switch ext {
	case ".jpg", ".jpeg", ".png", ".gif", ".webp":
	default:
		// ปล่อยผ่านได้ แต่แนะนำ validate ฝั่งหน้าบ้านแล้ว
	}

	uploadDir := filepath.Join("uploads", "Discountcode")
	if err := ensureDir(uploadDir); err != nil {
		return "", err
	}

	filename := fmt.Sprintf("dc_%d%s", time.Now().UnixNano(), ext)
	dst := filepath.Join(uploadDir, filename)

	if err := c.SaveUploadedFile(file, dst); err != nil {
		return "", err
	}

	return baseURL(c) + "/uploads/Discountcode/" + filename, nil
}

func CreateDiscountCode(c *gin.Context) {
	var dto createDiscountDTO
	if err := c.ShouldBind(&dto); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid form data", "error": err.Error()})
		return
	}

	startsAt, err := parseTimePtr(dto.StartsAt)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid starts_at", "error": err.Error()})
		return
	}
	expiresAt, err := parseTimePtr(dto.ExpiresAt)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid expires_at", "error": err.Error()})
		return
	}

	imageURL, err := saveImageAndReturnURL(c)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "upload save failed", "error": err.Error()})
		return
	}

	item := entity.Discountcode{
		Name:       dto.Name,
		Amount:     dto.Amount,
		MinOrder:   dto.MinOrder,
		UsageLimit: dto.UsageLimit,
		StartsAt:   startsAt,
		ExpiresAt:  expiresAt,
		ImageURL:   imageURL,
	}

	if err := config.DB().Create(&item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "create failed", "error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": item})
}

func ListDiscountCodes(c *gin.Context) {
	var items []entity.Discountcode
	if err := config.DB().Order("created_at DESC").Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "query failed", "error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": items})
}

func UpdateDiscountCode(c *gin.Context) {
	id := c.Param("id")

	var code entity.Discountcode
	if err := config.DB().First(&code, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "not found"})
		return
	}

	var dto createDiscountDTO
	if err := c.ShouldBind(&dto); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid data", "error": err.Error()})
		return
	}

	startsAt, err := parseTimePtr(dto.StartsAt)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid starts_at", "error": err.Error()})
		return
	}
	expiresAt, err := parseTimePtr(dto.ExpiresAt)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid expires_at", "error": err.Error()})
		return
	}

	// อัปเดตรูปใหม่ถ้ามีส่งมา
	newURL, err := saveImageAndReturnURL(c)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "upload save failed", "error": err.Error()})
		return
	}

	code.Name = dto.Name
	code.Amount = dto.Amount
	code.MinOrder = dto.MinOrder
	code.UsageLimit = dto.UsageLimit
	code.StartsAt = startsAt
	code.ExpiresAt = expiresAt
	if newURL != "" {
		// (option) ลบไฟล์เดิมออกจากดิสก์ก็ได้ ถ้าอยาก
		// oldPath := strings.TrimPrefix(code.ImageURL, baseURL(c))
		// ถ้า ImageURL เป็น absolute ให้ตัด host ออกก่อน
		code.ImageURL = newURL
	}

	if err := config.DB().Save(&code).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "update failed", "error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": code})
}

func DeleteDiscountCode(c *gin.Context) {
	id := c.Param("id")
	if err := config.DB().Delete(&entity.Discountcode{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "delete failed", "error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

func GetAvailableDiscounts(c *gin.Context) {
    totalStr := c.Query("total")
    total, err := strconv.Atoi(totalStr)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid total"})
        return
    }

    db := config.DB()
    var discounts []entity.Discountcode
    if err := db.Where("min_order <= ?", total).Find(&discounts).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch discounts"})
        return
    }

    // Map ให้แน่ใจว่า frontend จะได้ field id ถูกต้อง
    result := make([]gin.H, len(discounts))
    for i, d := range discounts {
        result[i] = gin.H{
            "id":       d.ID,
            "name":     d.Name,
            "amount":   d.Amount,
            "min_order": d.MinOrder,
            "image_url": d.ImageURL,
        }
    }

    c.JSON(http.StatusOK, gin.H{"data": result})
}

type UpdateTotalInput struct {
    OrderID  uint    `json:"order_id"`
    Subtotal float64 `json:"subtotal"`  // ยอดรวมก่อน discount
    Discount float64 `json:"discount"`  // จำนวนส่วนลดจาก frontend
}


// PATCH /api/orders/update-total
func UpdateOrderTotal(c *gin.Context) {
    var input UpdateTotalInput
    if err := c.ShouldBindJSON(&input); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    db := config.DB()

    // โหลด order
    var order entity.Order
    if err := db.First(&order, input.OrderID).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
        return
    }

    // คำนวณ total โดยใช้ยอดจาก frontend
    total := input.Subtotal - input.Discount
    if total < 0 {
        total = 0
    }

    order.TotalPrice = total

    if err := db.Save(&order).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update order total"})
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "order_id":    order.ID,
        "total_price": order.TotalPrice,
    })
}
type DiscountUsageInput struct {
	OrderID        uint `json:"order_id"`
	DiscountcodeID uint `json:"discountcode_id"`
}

// CreateDiscountUsage handles POST /api/discount-usage
func CreateDiscountUsage(c *gin.Context) {
	// Log: เริ่มฟังก์ชัน
	fmt.Println("=== CreateDiscountUsage called ===")

	// ดึง member_id จาก context
	memberIDInterface, exists := c.Get("member_id")
	if !exists {
		fmt.Println("member_id not found in context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "member_id not found in context"})
		return
	}
	fmt.Println("member_idInterface:", memberIDInterface)

	// แปลง member_id เป็น uint รองรับ float64/int/uint
	var memberID uint
	switch v := memberIDInterface.(type) {
	case float64:
		memberID = uint(v)
	case int:
		memberID = uint(v)
	case uint:
		memberID = v
	default:
		fmt.Println("invalid member_id type:", v)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "invalid member_id type"})
		return
	}
	fmt.Println("Parsed memberID:", memberID)

	// รับ input จาก frontend
	var input DiscountUsageInput
	if err := c.ShouldBindJSON(&input); err != nil {
		fmt.Println("Failed to bind JSON:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	fmt.Println("Received input:", input)

	// ตรวจสอบ input ไม่เป็น 0
	if input.OrderID == 0 || input.DiscountcodeID == 0 {
		fmt.Println("Invalid input: order_id or discountcode_id is 0")
		c.JSON(http.StatusBadRequest, gin.H{"error": "order_id and discountcode_id must be provided"})
		return
	}

	// Log: ก่อนสร้าง DiscountUsage struct
	fmt.Println("Creating DiscountUsage struct...")

	// สร้าง DiscountUsage
	discountUsage := entity.DiscountUsage{
		MemberID:       memberID,
		DiscountcodeID: input.DiscountcodeID,
		OrderID:        input.OrderID,
		
	}
	fmt.Println("DiscountUsage struct:", discountUsage)

	// Log: ก่อนบันทึกลง DB
	fmt.Println("Saving DiscountUsage to DB...")

	// บันทึกลง DB
	if err := config.DB().Create(&discountUsage).Error; err != nil {
		fmt.Println("Failed to save discount usage:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Log: บันทึกสำเร็จ
	fmt.Println("DiscountUsage saved successfully:", discountUsage)

	// ส่ง response กลับ frontend
	c.JSON(http.StatusOK, gin.H{"data": discountUsage})
}