package config

import (
	"fmt"
	"log"
	"os"

	"github.com/jirayusmmmm/form-regis/backend/models"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDB() {
	host := os.Getenv("DB_HOST")
	user := os.Getenv("DB_USER")
	password := os.Getenv("DB_PASSWORD")
	dbname := os.Getenv("DB_NAME")
	port := os.Getenv("DB_PORT")

	if host == "" {
		// Fallback for local development if not running in docker
		host = "127.0.0.1"
		user = "postgres"
		password = "password"
		dbname = "form_regis_db"
		port = "5433"
	}

	sslmode := os.Getenv("DB_SSLMODE")
	if sslmode == "" {
		sslmode = "disable"
	}

	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=%s TimeZone=UTC",
		host, user, password, dbname, port, sslmode)

	db, err := gorm.Open(postgres.New(postgres.Config{
		DSN:                  dsn,
		PreferSimpleProtocol: true, // Disables implicit prepared statements for Supabase PgBouncer compatibility
	}), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database. \n", err)
	}

	log.Println("Connected to Database")
	db.AutoMigrate(&models.Applicant{}, &models.Admin{})
	seedDefaultAdmin(db)
	DB = db
}

func seedDefaultAdmin(db *gorm.DB) {
	var count int64
	db.Model(&models.Admin{}).Count(&count)
	if count == 0 {
		username := os.Getenv("ADMIN_USERNAME")
		if username == "" {
			username = "admin"
		}
		password := os.Getenv("ADMIN_PASSWORD")
		if password == "" {
			password = "admin123"
		}

		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
		if err != nil {
			log.Printf("Failed to hash default admin password: %v", err)
			return
		}

		admin := models.Admin{
			Username: username,
			Password: string(hashedPassword),
			Name:     "HR Administrator",
		}

		if err := db.Create(&admin).Error; err != nil {
			log.Printf("Failed to seed default admin: %v", err)
		} else {
			log.Printf("Default admin created successfully with username '%s'", username)
		}
	}
}
