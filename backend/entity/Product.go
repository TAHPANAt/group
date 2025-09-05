// entity/product.go
package entity

import "gorm.io/gorm"

type Product struct {
	gorm.Model

	Name        string `json:"name"`
	Description string `json:"description"`
	Price       int    `json:"price"`
	Quantity    int    `json:"quantity"`
	SellerID    uint   `json:"seller_id"`

	CartItems []CartItem `json:"cart_items" gorm:"foreignKey:ProductID;references:ID"`

	// 👉 ให้ React เข้าถึง product.ProductImage[0].image_path ได้
	 ProductImage []ProductImage `gorm:"foreignKey:Product_ID;constraint:OnDelete:CASCADE;" json:"ProductImage"`
}
