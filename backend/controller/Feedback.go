package controller

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"example.com/GROUB/config"
	"example.com/GROUB/entity"
	"github.com/gin-gonic/gin"
	"github.com/gin-gonic/gin/binding"
)

// ==================== Struct ====================
type FeedbackRequest struct {
	Message            string `form:"message"`
	CategoryFeedbackID string `form:"categoryId"` // ✅ รับจากฟอร์ม field = categoryId
	RatingID           string `form:"ratingId"`
}

// ==================== Create Feedback ====================
func CreateFeedback(c *gin.Context) {
	var req FeedbackRequest

	if err := c.ShouldBindWith(&req, binding.FormMultipart); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":  "invalid form-data",
			"detail": err.Error(),
		})
		return
	}

	// ✅ member_id จาก middleware
	memberIDVal, exists := c.Get("member_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	memberID := memberIDVal.(uint)

	// ✅ string → uint
	var catID, rateID uint
	fmt.Sscanf(req.CategoryFeedbackID, "%d", &catID)
	fmt.Sscanf(req.RatingID, "%d", &rateID)

	// ✅ Upload Screenshot
	var screenshotPath string
	if file, err := c.FormFile("screenshot"); err == nil {
		uploadDir := "uploads/feedback"
		os.MkdirAll(uploadDir, 0755)
		filename := time.Now().Format("20060102150405") + "_" + filepath.Base(file.Filename)
		dst := filepath.Join(uploadDir, filename)
		if err := c.SaveUploadedFile(file, dst); err == nil {
			screenshotPath = "/" + dst
		}
	}

	// ✅ บันทึก Feedback
	feedback := entity.Feedback{
		Message:            req.Message,
		ScreenshotURL:      screenshotPath,
		Timestamp:          time.Now(),
		MemberID:           memberID,
		CategoryFeedbackID: catID,
		RatingID:           rateID,
	}

	if err := config.DB().Create(&feedback).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, feedback)
}

// ==================== Get Feedbacks ====================
func GetFeedbacks(c *gin.Context) {
	var feedbacks []entity.Feedback
	if err := config.DB().
		Preload("Rating").
		Preload("Category").
		Preload("Member").
		Find(&feedbacks).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, feedbacks)
}

// ==================== Get Ratings ====================
func GetRatings(c *gin.Context) {
	var ratings []entity.Rating
	if err := config.DB().Find(&ratings).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, ratings)
}

// ==================== Get Categories ====================
func GetCategories(c *gin.Context) {
	var categories []entity.CategoryFeedback
	db := config.DB()

	if err := db.Find(&categories).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// ✅ preload defaults
	if len(categories) == 0 {
		defaults := []entity.CategoryFeedback{
			{Type_Feedback: "คำชม", Description: "Feedback เชิงบวก"},
			{Type_Feedback: "บัค", Description: "รายงานปัญหาที่พบ"},
			{Type_Feedback: "อื่นๆ", Description: "ข้อเสนอแนะทั่วไป"},
		}
		db.Create(&defaults)
		categories = defaults
	}

	c.JSON(http.StatusOK, categories)
}

// ==================== Create Category ====================
func CreateCategoryFeedback(c *gin.Context) {
	var category entity.CategoryFeedback

	if err := c.ShouldBindJSON(&category); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	if category.Type_Feedback == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Type_Feedback is required"})
		return
	}

	if err := config.DB().Create(&category).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, category)
}
type FeedbackResponse struct {
	ID         uint   `json:"id"`
	Message    string `json:"message"`
	Screenshot string `json:"screenshot"`
	Timestamp  string `json:"timestamp"`
	Member     string `json:"member"`
	Category   string `json:"category"`
	Rating     int    `json:"rating"`
}

// GET /api/feedbacks
func GetShowFeedbacks(c *gin.Context) {
	var feedbacks []entity.Feedback
	if err := config.DB().
		Preload("Member").
		Preload("Category").
		Preload("Rating").
		Find(&feedbacks).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var res []FeedbackResponse
	for _, f := range feedbacks {
		res = append(res, FeedbackResponse{
			ID:         f.ID,
			Message:    f.Message,
			Screenshot: f.ScreenshotURL,
			Timestamp:  f.Timestamp.Format("2006-01-02 15:04"),
			Member:     f.Member.UserName,
			Category:   f.Category.Type_Feedback,
			Rating:     f.Rating.Score,
		})
	}

	c.JSON(http.StatusOK, gin.H{"data": res})
}