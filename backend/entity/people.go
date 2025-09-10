package entity

import (
    "time"
    "gorm.io/gorm"
)

type People struct {
    gorm.Model
    FirstName string    `json:"first_name"`
    LastName  string    `json:"last_name"`
    Email     string    `json:"email"`
    Age       int       `json:"age"`
    Phone     string    `json:"phone"`
    BirthDay  time.Time `json:"birth_day"`
    Address   string    `json:"address"`

    GenderID uint   `json:"gender_id"`
    Gender   Gender `json:"gender"`
}
