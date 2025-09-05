package controller

import (
	"fmt"
	"net/http"
	"time"

	"example.com/GROUB/config"
	"example.com/GROUB/entity"
	"github.com/gin-gonic/gin"
)

// สร้าง Payment โดยใช้ PaymentMethodID
func CreatePayment(c *gin.Context) {
	type PaymentPayload struct {
		OrderID         uint `json:"order_id"`
		PaymentMethodID uint `json:"payment_method_id"` // 1 = QR, 2 = COD
	}

	var payload PaymentPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB()

	// ดึง order
	var order entity.Order
	if err := db.Where("id = ?", payload.OrderID).First(&order).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}

	// ดึง PaymentMethod
	var pm entity.PaymentMethod
	if err := db.Where("id = ?", payload.PaymentMethodID).First(&pm).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payment method"})
		return
	}

	// สร้าง status
	var statusValue string
	if pm.Method == "เก็บเงินปลายทาง" {
		statusValue = "COD"
	} else if pm.Method == "QR Code" {
		statusValue = fmt.Sprintf("ORDER:%d;AMOUNT:%.2f;%d", order.ID, order.TotalPrice, time.Now().Unix())
	} else {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payment method"})
		return
	}

	// สร้าง Payment
	payment := entity.Payment{
		OrderID:         order.ID,
		PaymentMethodID: pm.ID,
		Status:          statusValue,
	}

	if err := db.Create(&payment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"payment_id": payment.ID,
		"status":     payment.Status,
	})
}

// ดึง QR Code ของคำสั่งซื้อ
func GetPaymentQRCode(c *gin.Context) {
	orderID := c.Param("order_id")
	db := config.DB()

	var payment entity.Payment
	if err := db.Preload("Order").Where("order_id = ?", orderID).First(&payment).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Payment not found"})
		return
	}

	// ถ้า status เริ่มต้นด้วย "ORDER:" แปลว่าเป็น QR
	if len(payment.Status) < 6 || payment.Status[:6] != "ORDER:" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No QR payment available"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"order_id":     payment.OrderID,
		"qr_code":      payment.Status,
		"total_amount": payment.Order.TotalPrice,
	})
}
