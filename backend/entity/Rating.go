package entity

import (
    "gorm.io/gorm"
)

type Rating struct {
	gorm.Model
	MemberID uint
	Score    int
	// ความสัมพันธ์แบบ 1:N (Feedback หลายอันมี rating นี้ได้)
	Feedbacks []Feedback `gorm:"foreignKey:RatingID"`
}