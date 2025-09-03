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

type ProfileResp struct {
	ID            uint   `json:"id"`
	Username      string `json:"username"`
	Bio           string `json:"bio"`
	AvatarURL     string `json:"avatarUrl"`
	BackgroundURL string `json:"backgroundUrl"`
	MemberID      *uint  `json:"member_id"`
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
	memberIDStr := strings.TrimSpace(c.PostForm("member_id"))
	if username == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "username is required"})
		return
	}

	var memberIDParsed *uint
	if memberIDStr != "" {
		var tmp uint
		if _, err := fmt.Sscanf(memberIDStr, "%d", &tmp); err == nil {
			memberIDParsed = &tmp
		}
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

	// ถ้ามี member_id และ Profile ของ member นี้มีอยู่แล้ว → อัปเดตแทน
	var p entity.Profile
	if memberIDParsed != nil {
		err := db.Where("member_id = ?", *memberIDParsed).First(&p).Error
		if err == nil {
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
			// error อื่นๆ
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	// create ใหม่
	newP := entity.Profile{
		Username:      username,
		Bio:           bio,
		AvatarURL:     avatarURL,
		BackgroundURL: coverURL,
		MemberID:      memberIDParsed,
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
	memberID := c.Param("memberId")
	var p entity.Profile
	if err := config.DB().Where("member_id = ?", memberID).First(&p).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "profile not found"})
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
}
