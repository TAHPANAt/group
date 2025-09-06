package entity

import (
    
    "gorm.io/gorm")

type Member struct {
    gorm.Model
    UserName string    `json:"username" gorm:"uniqueIndex;column:user_name"`
    Password string    `json:"password" gorm:"column:password"`

    Cart	Cart    `json:"cart" gorm:"foreignKey:MemberID;references:ID"`


    PeopleID uint   // FK -> People.ID
    People   People // Relation


    Seller   Seller `gorm:"foreignKey:MemberID;references:ID"`
    Orders        []Order        `json:"orders"`        // 1 member มีได้หลาย order
    DiscountUsages []DiscountUsage `json:"discount_usages"` // track การใช้โค้ดส่วนลด
}

