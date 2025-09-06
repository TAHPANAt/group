package entity

import (
	"gorm.io/gorm"
	"time"
)

// ==================== Report ====================
type Report struct {
    gorm.Model
    ProductID    uint      `json:"product_id"`      // สินค้าที่ถูกรายงาน
    TargetType   string    `json:"targetType"`      // ประเภทเป้าหมาย (product / seller)
    MemberID     uint      `json:"member_id"`       // คนที่รีพอร์ต
    SellerID     uint      `json:"seller_id"`       // คนขายที่ถูกรีพอร์ต
    ReportTypeID uint      `json:"report_type_id"`  // ประเภทการรีพอร์ต
    CreatedAt    time.Time `json:"created_at"`

    // belongsTo
    Product    Product    `gorm:"foreignKey:ProductID;references:ID"`
    ReportType ReportType `gorm:"foreignKey:ReportTypeID;references:ID"`
    Member     Member     `gorm:"foreignKey:MemberID;references:ID"`   // ✅ ผู้รีพอร์ต
    Seller     Seller     `gorm:"foreignKey:SellerID;references:ID"`   // ✅ คนขายที่ถูกรีพอร์ต
}