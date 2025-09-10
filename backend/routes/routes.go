package routes

import (
	"time"

	// เปลี่ยนตามโมดูลคุณ

	"example.com/GROUB/middlewares"

	"example.com/GROUB/controller"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func SetupRouter() *gin.Engine {
	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins: []string{"http://localhost:5173", "http://localhost:3000", "http://localhost:8081"},
		// หรือ frontend origin ของคุณ
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization", "X-Requested-With", "X-User-Id"},
		ExposeHeaders:    []string{"Content-Length", "Authorization"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))
	// Serve static files
	r.Static("/uploads", "./uploads")

	api := r.Group("/api")
	{
		//upload
		// api.POST("/upload-logo",middlewares.auth ,controller.auth)
		api.POST("/register", controller.Register)
		api.POST("/login", controller.Login)
		api.POST("/upload-logo", controller.UploadLogo)
		api.POST("/upload-Product", controller.UploadProductImages)
		api.POST("/post-Product", controller.CreateProduct)
		api.POST("/seller-shop", middleware.Authz(), controller.CreateSellerAndShop)
		api.GET("/current-user", middleware.Authz(), controller.CurrentUser)
		api.GET("/ListMyProfile", middleware.Authz(), controller.ListMyProfile)
		api.GET("/ListMyPostProducts", middleware.Authz(), controller.ListMyPostProducts)
		api.GET("/listAllProducts", controller.ListAllProducts)
		api.GET("/listCategory", controller.ListCategoies)
		api.GET("/post-products/:id", middleware.Authz(), controller.GetPostProductByID)
		api.PUT("/UpdateShopProfile", middleware.Authz(), controller.UpdateShopProfile)
		api.PUT("/UpdateProduct", middleware.Authz(), controller.UpdateProduct)
		api.POST("/CreateCategory", controller.CreateCategory)
		api.GET("/shops/:sellerId/posts", controller.ListPostsBySeller)
		api.GET("/shops/:sellerId/profile", controller.GetShopProfileBySellerID)
		api.GET("/ListCShopCategory", controller.ListCShopCategory)
		api.POST("/CreateCShopCategory", controller.CreateCShopCategory)
		api.PUT("/categories/:id", controller.UpdateCategory)
		api.DELETE("/categories/:id", controller.DeleteCategory)

		// ShopCategory (หมวดหมู่ร้าน)
		api.PUT("/shopcategories/:id", controller.UpdateShopCategory)
		api.DELETE("/shopcategories/:id", controller.DeleteShopCategory)
		api.DELETE("/DeletePost/:id", middleware.Authz(), controller.SoftDeletePostWithProductAndImages)

		//api.POST("/profile", controller.CreateOrUpdateProfile)
		api.GET("/profile/:memberId", controller.GetProfileByMember)
		api.POST("/cart", middleware.Authz(), controller.CreateCart)
		api.GET("/cart", middleware.Authz(), controller.GetMyCart)
		// DELETE cart item by ProductID
		api.DELETE("/cart/item/product/:product_id", middleware.Authz(), controller.DeleteCartItemByProduct)
		// ดึง cart ของ user

		// Order / Checkout
		api.POST("/order", middleware.Authz(), controller.Checkout) // สร้าง order + order item
		api.GET("/orders/latest", middleware.Authz(), controller.GetLatestOrder)
		api.GET("/members/me",middleware.Authz(), controller.GetMyProfile)

		api.POST("/payments", controller.CreatePayment)
		api.GET("/payments/qrcode/:order_id", controller.GetPaymentQRCode)

		// ----------------- ส่วนของ DiscountCode -----------------FFFFFFAAAAMMMMMEEEEE
		api.GET("/discountcodes", controller.ListDiscountCodes)
		api.POST("/discountcodes", controller.CreateDiscountCode)
		api.POST("/discount-usage", middleware.Authz(), controller.CreateDiscountUsage)

		api.PUT("/discountcodes/:id", controller.UpdateDiscountCode)
		api.DELETE("/discountcodes/:id", controller.DeleteDiscountCode)
		api.GET("/discounts", controller.GetAvailableDiscounts)
		api.PATCH("/orders/update-total", controller.UpdateOrderTotal)

		// Profile & Account
		api.POST("/profile", middleware.Authz(), controller.CreateOrUpdateProfile)
		api.GET("/getprofile", middleware.Authz(), controller.GetProfileByMember)
		api.PUT("/people/update", middleware.Authz(), controller.UpdatePeople)
		api.DELETE("/account/delete", middleware.Authz(), controller.DeleteAccount)

		// Feedback
		api.POST("/feedback", middleware.Authz(), controller.CreateFeedback)
		api.GET("/feedbacks", controller.GetShowFeedbacks) // ✅ ใช้ GetShowFeedbacks เท่านั้น
		api.GET("/categories", controller.GetCategories)   // ✅ ดึงหมวดหมู่
		api.GET("/ratings", controller.GetRatings)         // ✅ ดึงดาว
		api.POST("/categories", controller.CreateCategoryFeedback)

		// Report
		api.POST("/reports", middleware.Authz(), controller.CreateReportProduct)
		api.GET("/reports", controller.GetReports)

		// ----------------- Messenger (DM) -----------------
		dm := api.Group("/dm")
		{
			// ไม่ครอบ Authz() เพื่อให้ dev auth แบบ Bearer uid:<id> ใช้งานได้
			dm.POST("/threads/open", controller.OpenThread)
			dm.GET("/threads", controller.ListThreads)
			dm.DELETE("/threads/:id", controller.DeleteThread)

			dm.GET("/threads/:id/posts", controller.ListPosts)
			dm.POST("/threads/:id/posts", controller.CreatePost)
			dm.PATCH("/posts/:id", controller.EditPost)
			dm.DELETE("/posts/:id", controller.DeletePost)

			dm.PATCH("/threads/:id/read", controller.MarkRead)
			dm.POST("/upload", controller.UploadFile)

		}
	}

	return r
}
