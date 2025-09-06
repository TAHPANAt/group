package entity

type CategoryFeedback struct {
	ID            uint   `gorm:"primaryKey" json:"id"`
	Type_Feedback string `json:"typeFeedback"` // 👈 เพิ่ม json tag ให้ส่งเป็น camelCase
	Description   string `json:"description"`
}