package models

import (
	"time"

	"gorm.io/gorm"
)

type Admin struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	Username  string         `gorm:"uniqueIndex;not null" json:"username"`
	Password    string         `gorm:"not null" json:"-"`
	Name        string         `json:"name"`
	TotpSecret  string         `gorm:"type:varchar(255)" json:"-"`
	TotpEnabled bool           `gorm:"default:false" json:"totp_enabled"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}
