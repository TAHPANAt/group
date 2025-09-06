package controller

import (
	"net/http"
	"time"

	"example.com/GROUB/config"
	"example.com/GROUB/entity"
	"github.com/gin-gonic/gin"
	
)

// PUT /api/people/update
// PUT /api/people/update
func UpdatePeople(c *gin.Context) {
    memberIDVal, exists := c.Get("member_id")
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
        return
    }
    memberID := memberIDVal.(uint)

    var body struct {
        FirstName string `json:"firstName"`
        LastName  string `json:"lastName"`
        Email     string `json:"email"`
        Phone     string `json:"phone"`
        Age       int    `json:"age"`
        BirthDay  string `json:"birthDay"`
        Address   string `json:"address"`
        Gender    string `json:"gender"`
    }
    if err := c.ShouldBindJSON(&body); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    db := config.DB()

    // ✅ หา Member พร้อม preload People
    var m entity.Member
    if err := db.Preload("People").First(&m, memberID).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "member not found"})
        return
    }

    var p entity.People
    if m.PeopleID != 0 {
        // มี People อยู่แล้ว → ใช้อันนี้
        p = m.People
    } else {
        // ยังไม่มี People → สร้างใหม่ แล้วผูกกับ Member
        p = entity.People{}
        if err := db.Create(&p).Error; err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
            return
        }
        m.PeopleID = p.ID
        if err := db.Save(&m).Error; err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
            return
        }
    }

    // ✅ อัปเดตข้อมูล People
    p.FirstName = body.FirstName
    p.LastName = body.LastName
    p.Email = body.Email
    p.Phone = body.Phone
    p.Age = body.Age
    p.Address = body.Address

    if body.BirthDay != "" {
        if t, err := time.Parse("2006-01-02", body.BirthDay); err == nil {
            p.BirthDay = t
        }
    }

    if body.Gender == "ชาย" {
        p.GenderID = 1
    } else if body.Gender == "หญิง" {
        p.GenderID = 2
    }

    if err := db.Save(&p).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, p)
}