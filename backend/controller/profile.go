// backend/controllers/profile.go
package controller

import (
	"errors"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"example.com/GROUB/config"
	"example.com/GROUB/entity"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

func ensureDirs() error {
	dirs := []string{
		"uploads/profile/avatars",
		"uploads/profile/covers",
	}
	for _, d := range dirs {
		if err := os.MkdirAll(d, 0755); err != nil {
			return err
		}
	}
	return nil
}

func sanitizeExt(ext string) (string, error) {
	ext = strings.ToLower(ext)
	switch ext {
	case ".jpg", ".jpeg", ".png", ".gif", ".webp":
		return ext, nil
	default:
		return "", errors.New("unsupported file type")
	}
}

func saveImageFromForm(c *gin.Context, formKey, subdir string) (string, error) {
	fh, err := c.FormFile(formKey)
	if err != nil {
		// ไม่มีไฟล์ ถือว่าไม่อัปโหลดในฟิลด์นั้น
		return "", nil
	}

	ext, err := sanitizeExt(filepath.Ext(fh.Filename))
	if err != nil {
		return "", err
	}

	filename := fmt.Sprintf("%s_%d%s", uuid.NewString(), time.Now().Unix(), ext)
	dst := filepath.Join("uploads", "profile", subdir, filename)

	if err := c.SaveUploadedFile(fh, dst); err != nil {
		return "", err
	}

	// path ที่ frontend ใช้ได้ (เพราะเราจะ Static("/uploads/profile", "./uploads/profile"))
	publicURL := fmt.Sprintf("/uploads/profile/%s/%s", subdir, filename)
	return publicURL, nil
}

type PeopleResp struct {
    FirstName string `json:"firstName"`
    LastName  string `json:"lastName"`
    Email     string `json:"email"`
    Phone     string `json:"phone"`
    Age       int    `json:"age"`
    BirthDay  string `json:"birthDay"`
    Address   string `json:"address"`
    Gender    string `json:"gender"`
}

type ProfileResp struct {
    ID            uint   `json:"id"`
    Username      string `json:"username"`
    Bio           string `json:"bio"`
    AvatarURL     string `json:"avatarUrl"`
    BackgroundURL string `json:"backgroundUrl"`
    MemberID      *uint  `json:"member_id"`

    FirstName string `json:"firstName,omitempty"`
    LastName  string `json:"lastName,omitempty"`
    Email     string `json:"email,omitempty"`
    Phone     string `json:"phone,omitempty"`
    Age       int    `json:"age,omitempty"`
    BirthDay  string `json:"birthDay,omitempty"`
    Address   string `json:"address,omitempty"`
    Gender    string `json:"gender,omitempty"`
}


// POST /api/profile
// multipart/form-data: username, bio, member_id (optional), avatar(file), cover(file)
func CreateOrUpdateProfile(c *gin.Context) {
    if err := ensureDirs(); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "cannot prepare upload dir"})
        return
    }

    username := strings.TrimSpace(c.PostForm("username"))
    bio := strings.TrimSpace(c.PostForm("bio"))
    if username == "" {
        c.JSON(http.StatusBadRequest, gin.H{"error": "username is required"})
        return
    }

    // ✅ member_id จาก JWT payload
    memberIDVal, exists := c.Get("member_id")
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
        return
    }
    memberID, ok := memberIDVal.(uint)
    if !ok {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "invalid member_id type"})
        return
    }

    avatarURL, err := saveImageFromForm(c, "avatar", "avatars")
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "avatar: " + err.Error()})
        return
    }
    coverURL, err := saveImageFromForm(c, "cover", "covers")
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "cover: " + err.Error()})
        return
    }

    db := config.DB()

    // ✅ ถ้ามี profile อยู่แล้ว → update
    var p entity.Profile
    if err := db.Where("member_id = ?", memberID).First(&p).Error; err == nil {
        p.Username = username
        p.Bio = bio
        if avatarURL != "" {
            p.AvatarURL = avatarURL
        }
        if coverURL != "" {
            p.BackgroundURL = coverURL
        }
        if err := db.Save(&p).Error; err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
            return
        }
        c.JSON(http.StatusOK, ProfileResp{
            ID:            p.ID,
            Username:      p.Username,
            Bio:           p.Bio,
            AvatarURL:     p.AvatarURL,
            BackgroundURL: p.BackgroundURL,
            MemberID:      p.MemberID,
        })
        return
    } else if !errors.Is(err, gorm.ErrRecordNotFound) {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    // ✅ ถ้ายังไม่มี → create
    newP := entity.Profile{
        Username:      username,
        Bio:           bio,
        AvatarURL:     avatarURL,
        BackgroundURL: coverURL,
        MemberID:      &memberID,
    }
    if err := db.Create(&newP).Error; err != nil {
        c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusCreated, ProfileResp{
        ID:            newP.ID,
        Username:      newP.Username,
        Bio:           newP.Bio,
        AvatarURL:     newP.AvatarURL,
        BackgroundURL: newP.BackgroundURL,
        MemberID:      newP.MemberID,
    })
}


// GET /api/profile/:memberId
func GetProfileByMember(c *gin.Context) {
    // ดึงจาก context (middleware ต้อง set ไว้แล้ว)
    memberIDVal, exists := c.Get("member_id")
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
        return
    }

    memberID, ok := memberIDVal.(uint) // หรือ float64 แล้วแต่ตอน set
    if !ok {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "invalid member_id type"})
        return
    }

    var p entity.Profile
    if err := config.DB().
        Preload("Member.People").
        Preload("Member.People.Gender").
        Where("member_id = ?", memberID).
        First(&p).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "profile not found"})
        return
    }

    resp := ProfileResp{
        ID:            p.ID,
        Username:      p.Username,
        Bio:           p.Bio,
        AvatarURL:     p.AvatarURL,
        BackgroundURL: p.BackgroundURL,
        MemberID:      p.MemberID,
    }

   if p.Member != nil && p.Member.People.ID != 0 {
    resp.FirstName = p.Member.People.FirstName
    resp.LastName  = p.Member.People.LastName
    resp.Email     = p.Member.People.Email
    resp.Phone     = p.Member.People.Phone
    resp.Age       = p.Member.People.Age
    resp.BirthDay  = p.Member.People.BirthDay.Format("2006-01-02")
    resp.Address   = p.Member.People.Address
    if p.Member.People.Gender.ID != 0 {
        resp.Gender = p.Member.People.Gender.Gender  // 🟢 ใช้ field Gender
    }
}



    c.JSON(http.StatusOK, resp)
}
func DeleteAccount(c *gin.Context) {
    memberIDVal, exists := c.Get("member_id")
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
        return
    }
    memberID := memberIDVal.(uint)

    db := config.DB()

    // หา Member ที่เกี่ยวข้อง
    var m entity.Member
    if err := db.Preload("People").First(&m, memberID).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "member not found"})
        return
    }

    // เริ่ม transaction ป้องกันการลบไม่ครบ
    tx := db.Begin()

    // ลบ People ก่อน (ถ้ามี)
    if m.PeopleID != 0 {
        if err := tx.Delete(&entity.People{}, m.PeopleID).Error; err != nil {
            tx.Rollback()
            c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
            return
        }
    }

    // ลบ Member
    if err := tx.Delete(&entity.Member{}, memberID).Error; err != nil {
        tx.Rollback()
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    tx.Commit()

    c.JSON(http.StatusOK, gin.H{"message": "account deleted successfully"})
}
