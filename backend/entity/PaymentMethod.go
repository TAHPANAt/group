package entity

import (
	"gorm.io/gorm"
)

type PaymentMethod struct {
	gorm.Model

	Method		string		`json:"method"`
				
}