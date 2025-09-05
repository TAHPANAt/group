package entity

import (
	"gorm.io/gorm"
)

type Payment struct {
	gorm.Model

	OrderID         uint           `json:"order_id"`
	Order           *Order         `gorm:"foreignKey:OrderID" json:"order"`

	PaymentMethodID uint           `json:"payment_method_id"`
	PaymentMethod   *PaymentMethod `gorm:"foreignKey:PaymentMethodID" json:"payment_method"`

	Status          string         `json:"status"` // waiting, completed, etc.
}
