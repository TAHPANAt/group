package entity

import (
    
    "gorm.io/gorm")

type Member struct {
    gorm.Model
    UserName string
    Password string
    PeopleID uint   // FK -> People.ID
    People   People // Relation
    Seller   Seller `gorm:"foreignKey:MemberID;references:ID"`
}

