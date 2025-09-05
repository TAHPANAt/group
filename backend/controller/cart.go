package controller

import (
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

	// ✅ 1. หา cart เดิมของ member
	var cart entity.Cart
	if err := db.Where("member_id = ?", memberID).First(&cart).Error; err != nil {
		// ถ้ายังไม่มี → สร้างใหม่
		cart = entity.Cart{MemberID: memberID}
		if err := db.Create(&cart).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create cart"})
			return
		}
	}

	// ✅ 2. อัปเดตหรือเพิ่ม cart_items ทีละชิ้น
	for _, item := range req.CartItems {
		var existingItem entity.CartItem
		err := db.Where("cart_id = ? AND product_id = ?", cart.ID, item.ProductID).First(&existingItem).Error

		if err == nil {
			// ✅ มีอยู่แล้ว → อัปเดต quantity ใหม่ (ทับ)
			existingItem.Quantity = item.Quantity
			if err := db.Save(&existingItem).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update cart item"})
				return
			}
		} else {
			// ✅ ยังไม่มี → เพิ่มใหม่
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
	// member_id มาจาก middleware Authz
	memberID, ok := c.Get("member_id")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
		return
	}

	var cart entity.Cart
	if err := config.DB().
		Preload("CartItems.Product.ProductImage"). // ✅ preload product + images
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

    // หา cart ของ user
    var cart entity.Cart
    if err := db.Where("member_id = ?", memberID).First(&cart).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "Cart not found"})
        return
    }

    // ลบ cart_item ตาม product_id
    if err := db.Where("cart_id = ? AND product_id = ?", cart.ID, productID).Delete(&entity.CartItem{}).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete cart item"})
        return
    }

    c.JSON(http.StatusOK, gin.H{"message": "Cart item deleted successfully"})
}

// GET /cart
func GetCart(c *gin.Context) {
	memberID := c.GetUint("member_id") // เอามาจาก context

	db := config.DB()

	var cart entity.Cart
	if err := db.
		Preload("CartItems.Product.ProductImage"). // ✅ preload product + product image
		First(&cart, "member_id = ?", memberID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "cart not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": cart})
}


// Checkout รับรายการสินค้าที่เลือกจาก frontend มาสร้าง order
func Checkout(c *gin.Context) {
    memberID := c.GetUint("member_id")
    db := config.DB()

    // ✅ 1. struct สำหรับ payload
    type OrderItemInput struct {
        CartItemID uint    `json:"cart_item_id"`
        ProductID  uint    `json:"product_id"`
        Quantity   int     `json:"quantity"`
        Price      float64 `json:"price"`
    }
    type CheckoutRequest struct {
        OrderItems []OrderItemInput `json:"order_items"`
    }

    // ✅ 2. อ่าน payload
    var req CheckoutRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    if len(req.OrderItems) == 0 {
        c.JSON(http.StatusBadRequest, gin.H{"error": "no items selected"})
        return
    }

    // ✅ 3. สร้าง order ใหม่
    order := entity.Order{
        MemberID:   memberID,
        Status:     "pending",
        TotalPrice: 0,
    }
    if err := db.Create(&order).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create order"})
        return
    }

    // ✅ 4. เพิ่ม order items และคำนวณ total
    var total float64
    for _, oi := range req.OrderItems {
        orderItem := entity.OrderItem{
            OrderID:    order.ID,
            ProductID:  oi.ProductID,
            Quantity:   oi.Quantity,
            Price:      float64(oi.Quantity) * oi.Price,
            CartItemID: oi.CartItemID,
        }
        total += orderItem.Price

        if err := db.Create(&orderItem).Error; err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create order item"})
            return
        }

        // ✅ 5. ลบ item ที่สั่งซื้อออกจาก cart
        if err := db.Where("id = ? AND cart_id IN (SELECT id FROM carts WHERE member_id = ?)", oi.CartItemID, memberID).
            Delete(&entity.CartItem{}).Error; err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to remove cart item"})
            return
        }
    }

    // ✅ 6. update total price
    order.TotalPrice = total
    if err := db.Save(&order).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update order total"})
        return
    }

    // ✅ 7. response กลับไป
    c.JSON(http.StatusOK, gin.H{
        "message": "order created successfully",
        "order":   order,
    })
}
