package entity

import (
	"gorm.io/gorm"
)

type OrderItem struct {
	gorm.Model

	OrderID			uint		`json:"order_id"`
	Order			*Order		`gorm:"foreignKey:OrderID" json:"order"`

	ProductID		uint		`json:"product_id"`
	Product			*Product	`gorm:"foreignKey:ProductID" json:"product"`	

	Quantity		int			`json:"quantity"`

	Price    float64 `json:"price"`

	CartItemID uint `json:"cart_item_id"`          // FK ไปยัง CartItem
	CartItem   *CartItem `gorm:"foreignKey:CartItemID" json:"cart_item"`
}