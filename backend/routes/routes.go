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
		AllowOrigins: []string{"http://localhost:5173", "http://localhost:3000"},
		// หรือ frontend origin ของคุณ
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
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

		api.POST("/profile", controller.CreateOrUpdateProfile)
		api.GET("/profile/:memberId", controller.GetProfileByMember)
		api.POST("/cart", middleware.Authz(), controller.CreateCart)
		api.GET("/cart", middleware.Authz(), controller.GetMyCart)
		// DELETE cart item by ProductID
		api.DELETE("/cart/item/product/:product_id", middleware.Authz(), controller.DeleteCartItemByProduct)
		// ดึง cart ของ user

		// Order / Checkout
		api.POST("/order", middleware.Authz(), controller.Checkout) // สร้าง order + order item
		api.GET("/orders/latest", middleware.Authz(), controller.GetLatestOrder)

		api.POST("/payments", controller.CreatePayment)
		api.GET("/payments/qrcode/:order_id", controller.GetPaymentQRCode)
	}

	return r
}
