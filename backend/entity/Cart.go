package entity

import "gorm.io/gorm"

type Cart struct {
	gorm.Model
	MemberID  uint       `json:"member_id"`
	CartItems []CartItem `json:"cart_items" gorm:"foreignKey:CartID;references:ID"`
}
