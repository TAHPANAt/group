package entity

import "gorm.io/gorm"

type Profile struct {
	gorm.Model
	Username	string `json:"username"`
	Bio   	string
	AvatarURL	string
	BackgroundURL	string

	MemberID *uint   `gorm:"uniqueIndex:ux_shop_seller" json:"member_id"`
	Member   *Member `gorm:"foreignKey:member_id;references:ID"`
}