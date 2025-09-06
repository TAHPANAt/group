package config

import (
	"fmt"
	"log"

	"example.com/GROUB/entity"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var db *gorm.DB

func DB() *gorm.DB {
	return db
}

func ConnectionDB() {

	database, err := gorm.Open(sqlite.Open("groub.db?cache=shared"), &gorm.Config{})
	if err != nil {
		panic("failed to connect database")
	}
	fmt.Println("connected database")
	db = database
}

func SetupDatabase() {
	db.AutoMigrate(
		&entity.Seller{},
		&entity.Cart{},
		&entity.CartItem{},
		&entity.Category{},
		&entity.DiscountUsage{},
		&entity.Discountcode{},
		&entity.Report{},
		&entity.ReportType{},

		
		&entity.Order{},
		&entity.OrderItem{},
		&entity.Post_a_New_Product{},
		&entity.Product{},
		&entity.Feedback{},
		&entity.CategoryFeedback{},
		&entity.Rating{},
		&entity.ProductImage{},
		&entity.ShopAddress{},
		&entity.ShopCategory{},
		&entity.ShopProfile{},
		&entity.Member{},
		&entity.Gender{},
		&entity.Payment{},
		&entity.PaymentMethod{},
		&entity.People{},
		&entity.Profile{},
		
	)
	categories := []entity.ShopCategory{
		{CategoryName: "เสื้อผ้าแฟชั่น"},
		{CategoryName: "อิเล็กทรอนิก"},
		{CategoryName: "อาหาร"},
		{CategoryName: "ของใช้จำเป็น"},
		{CategoryName: "เกมมิ่งเกียร์"},
	}

	for _, cat := range categories {
		result := db.FirstOrCreate(&cat, entity.ShopCategory{CategoryName: cat.CategoryName})
		if result.Error != nil {
			log.Println("เพิ่มหมวดหมู่ล้มเหลว:", result.Error)
		} else {
			fmt.Println("เพิ่มหมวดหมู่:", cat.CategoryName)
		}
	}

	


	categoriesProduct := []entity.Category{
		{Name: "เสื้อผ้าแฟชั่น"},
		{Name: "อิเล็กทรอนิก"},
		{Name: "อาหาร"},
		{Name: "ของใช้จำเป็น"},
		{Name: "เกมมิ่งเกียร์"},
	}

	for _, cat := range categoriesProduct {
		result := db.FirstOrCreate(&cat, entity.Category{Name: cat.Name})
		if result.Error != nil {
			log.Println("เพิ่ม Category สินค้าล้มเหลว:", result.Error)
		} else {
			fmt.Println("เพิ่ม Category สินค้า:", cat.Name)
		}
	}

	genders := []entity.Gender{
		{Gender: "ชาย"},
		{Gender: "หญิง"},
		
	}

	for _, g := range genders {
		result := db.FirstOrCreate(&g, entity.Gender{Gender: g.Gender})
		if result.Error != nil {
			log.Println("เพิ่มเพศล้มเหลว:", result.Error)
		} else {
			fmt.Println("เพิ่มเพศ:", g.Gender)
		}
	}

	// เพิ่ม demo ข้อมูล PaymentMethod
	paymentMethods := []entity.PaymentMethod{
		{Method: "QR Code"},
		{Method: "เก็บเงินปลายทาง"},
	}

	for _, pm := range paymentMethods {
		result := db.FirstOrCreate(&pm, entity.PaymentMethod{Method: pm.Method})
		if result.Error != nil {
			log.Println("เพิ่ม PaymentMethod ล้มเหลว:", result.Error)
		} else {
			fmt.Println("เพิ่ม PaymentMethod:", pm.Method)
		}
	}
	// ====== เมสเซ็นเจอร์: จัดลำดับ parent -> child ======
	if err := db.AutoMigrate(
		&entity.FriendLink{},
		&entity.DMThread{}, // parent
		&entity.DMPost{},   // child of DMThread
		&entity.DMFile{},   // child of DMPost
	); err != nil {
		log.Fatal("AutoMigrate (dm) failed:", err)
	}

	// เติมคอลัมน์ LastMessageAt ถ้ายังไม่มี (กัน ORDER BY last_message_at ล้ม)
	m := db.Migrator()
	if !m.HasColumn(&entity.DMThread{}, "LastMessageAt") && !m.HasColumn(&entity.DMThread{}, "last_message_at") {
		_ = m.AddColumn(&entity.DMThread{}, "LastMessageAt")
	}

	// ====== DEMO Rating ======
	ratings := []entity.Rating{
		{Score: 1},
		{Score: 2},
		{Score: 3},
		{Score: 4},
		{Score: 5},
	}
	for _, r := range ratings {
		db.FirstOrCreate(&r, entity.Rating{Score: r.Score})
	}

	// ====== DEMO ReportType ======
	reportTypes := []entity.ReportType{
		{Name: "สแปม", Description: "โฆษณาหรือข้อความรบกวน"},
		{Name: "ไม่เหมาะสม", Description: "เนื้อหาไม่เหมาะสม"},
		{Name: "อื่นๆ", Description: "รายงานเหตุผลอื่น"},
	}
	for _, rt := range reportTypes {
		result := db.FirstOrCreate(&rt, entity.ReportType{Name: rt.Name})
		if result.Error != nil {
			log.Println("เพิ่ม ReportType ล้มเหลว:", result.Error)
		} else {
			fmt.Println("เพิ่ม ReportType:", rt.Name)
		}
	}

}
