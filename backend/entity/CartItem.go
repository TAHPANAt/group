package entity

import "gorm.io/gorm"

type CartItem struct {
	gorm.Model
	Quantity  int           `json:"quantity"`
	CartID    uint          `json:"cart_id" gorm:"constraint:OnDelete:CASCADE;"`
	ProductID uint          `json:"product_id"`
	Product   Product       `json:"product" gorm:"foreignKey:ProductID;references:ID"`
	OrderItems []OrderItem `gorm:"foreignKey:CartItemID" json:"order_items"`

}

