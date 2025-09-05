package entity

import (
	"gorm.io/gorm"
)

type Order struct {
	gorm.Model

	MemberID		uint				`json:"member_id"`
	Member			*Member				`gorm:"foreignKey:MemberID" json:"member"`

	OrderItems		[]OrderItem 		`gorm:"foreignKey:OrderID" json:"order_items"`

	TotalPrice		float64				`json:"total_price"`

	Status			string				`json:"status"`

//	DiscountCodes	[]DiscountCode 		`gorm:"many2many:order_discounts" json:"discount_codes"`
}