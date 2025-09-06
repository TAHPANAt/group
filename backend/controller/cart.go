package controller

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"example.com/GROUB/config"
	"example.com/GROUB/entity"
)

type CartItemInput struct {
	ProductID uint `json:"product_id"`
	Quantity  int  `json:"quantity"`
}

type CartRequest struct {
	CartItems []CartItemInput `json:"cart_items"`
}

func CreateCart(c *gin.Context) {
	memberIDInterface, exists := c.Get("member_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	memberID := memberIDInterface.(uint)

	var req CartRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB()

	// หา cart เดิมของ member
	var cart entity.Cart
	if err := db.Where("member_id = ?", memberID).First(&cart).Error; err != nil {
		cart = entity.Cart{MemberID: memberID}
		if err := db.Create(&cart).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create cart"})
			return
		}
	}

	// อัปเดตหรือเพิ่ม cart_items
	for _, item := range req.CartItems {
		var existingItem entity.CartItem
		err := db.Where("cart_id = ? AND product_id = ?", cart.ID, item.ProductID).First(&existingItem).Error

		if err == nil {
			existingItem.Quantity = item.Quantity
			if err := db.Save(&existingItem).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update cart item"})
				return
			}
		} else {
			newItem := entity.CartItem{
				CartID:    cart.ID,
				ProductID: item.ProductID,
				Quantity:  item.Quantity,
			}
			if err := db.Create(&newItem).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add cart item"})
				return
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Cart updated successfully",
		"cart_id": cart.ID,
	})
}

// GET /api/cart
func GetMyCart(c *gin.Context) {
	memberID, ok := c.Get("member_id")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return
	}

	var cart entity.Cart
	if err := config.DB().
		Preload("CartItems.Product.ProductImage").
		First(&cart, "member_id = ?", memberID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "cart not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": cart})
}

// DELETE /api/cart/item/product/:product_id
func DeleteCartItemByProduct(c *gin.Context) {
	memberIDInterface, exists := c.Get("member_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	memberID := memberIDInterface.(uint)

	productID := c.Param("product_id")
	db := config.DB()

	var cart entity.Cart
	if err := db.Where("member_id = ?", memberID).First(&cart).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Cart not found"})
		return
	}

	if err := db.Where("cart_id = ? AND product_id = ?", cart.ID, productID).Delete(&entity.CartItem{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete cart item"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Cart item deleted successfully"})
}

// GET /cart
func GetCart(c *gin.Context) {
	memberID := c.GetUint("member_id")
	db := config.DB()

	var cart entity.Cart
	if err := db.Preload("CartItems.Product.ProductImage").
		First(&cart, "member_id = ?", memberID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "cart not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": cart})
}

// Checkout
func Checkout(c *gin.Context) {
	memberID := c.GetUint("member_id")
	db := config.DB()

	type OrderItemInput struct {
		ProductID uint    `json:"product_id"` // มาจาก frontend (จริงๆคือ ProductID)
		Quantity  int     `json:"quantity"`
		Price     float64 `json:"price"`
	}
	type CheckoutRequest struct {
		OrderItems []OrderItemInput `json:"order_items"`
	}

	var req CheckoutRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if len(req.OrderItems) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no items selected"})
		return
	}

	// สร้าง order
	order := entity.Order{
		MemberID:   memberID,
		Status:     "pending",
		TotalPrice: 0,
	}
	if err := db.Create(&order).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create order"})
		return
	}

	var total float64
	var cartItemIDsToDelete []uint

	for _, oi := range req.OrderItems {
		// หา CartItem จริง
		var cartItem entity.CartItem
		if err := db.Joins("JOIN carts ON carts.id = cart_items.cart_id").
			Where("carts.member_id = ? AND cart_items.product_id = ?", memberID, oi.ProductID).
			First(&cartItem).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("cart item not found for product %d", oi.ProductID)})
			return
		}

		orderItem := entity.OrderItem{
			OrderID:    order.ID,
			ProductID:  oi.ProductID,
			Quantity:   oi.Quantity,
			Price:      float64(oi.Quantity) * oi.Price,
			CartItemID: cartItem.ID, // ใช้ ID จริง
		}
		if err := db.Create(&orderItem).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create order item"})
			return
		}

		total += orderItem.Price
		cartItemIDsToDelete = append(cartItemIDsToDelete, cartItem.ID)
	}

	// update total price
	order.TotalPrice = total
	if err := db.Save(&order).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update order total"})
		return
	}

	

	c.JSON(http.StatusOK, gin.H{
		"message": "order created successfully",
		"order":   order,
	})
}
