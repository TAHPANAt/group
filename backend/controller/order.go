package controller

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"example.com/GROUB/config"
	"example.com/GROUB/entity"
)

type CreateOrderPayload struct {
    MemberID   uint `json:"member_id"`
    OrderItems []struct {
        CartItemID uint    `json:"cart_item_id"`
        ProductID  uint    `json:"product_id"`
        Quantity   int     `json:"quantity"`
        Price      float64 `json:"price"`
    } `json:"order_items"`
}





// GET /api/orders/latest
func GetLatestOrder(c *gin.Context) {
    memberID := c.GetUint("member_id")
    db := config.DB()

    var order entity.Order
    if err := db.
        Preload("OrderItems.Product.ProductImage"). // preload product + images
        Where("member_id = ?", memberID).
        Order("created_at DESC").
        First(&order).Error; err != nil {  // ✅ First จะเอา order แรก (ล่าสุด)
        c.JSON(http.StatusNotFound, gin.H{"error": "no order found"})
        return
    }

    c.JSON(http.StatusOK, gin.H{"data": order})
}
