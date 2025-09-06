package entity

import (
    "time"

    "gorm.io/gorm"
)

type Feedback struct {
	gorm.Model
	Message            string
	ScreenshotURL      string
	Timestamp          time.Time
	MemberID           uint
	CategoryFeedbackID uint
	RatingID           uint

	// ความสัมพันธ์
	Category CategoryFeedback `gorm:"foreignKey:CategoryFeedbackID;references:ID"`
	Rating   Rating           `gorm:"foreignKey:RatingID;references:ID"`
	Member   Member           `gorm:"foreignKey:MemberID;references:ID"`
}