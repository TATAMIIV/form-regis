package main

import (
	"log"
	"os"

	"github.com/jirayusmmmm/form-regis/backend/config"
	"github.com/jirayusmmmm/form-regis/backend/models"
	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	_ = godotenv.Load("../../.env")
	_ = godotenv.Load(".env")

	config.ConnectDB()

	username := "JirayusVich"
	password := "1212312121"
	name := "Jirayus Vich"

	if len(os.Args) > 1 {
		username = os.Args[1]
	}
	if len(os.Args) > 2 {
		password = os.Args[2]
	}
	if len(os.Args) > 3 {
		name = os.Args[3]
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		log.Fatalf("Failed to hash password: %v", err)
	}

	var admin models.Admin
	result := config.DB.Where("username = ?", username).First(&admin)
	if result.Error == nil {
		// Admin exists, update password
		admin.Password = string(hashedPassword)
		admin.Name = name
		if err := config.DB.Save(&admin).Error; err != nil {
			log.Fatalf("Failed to update admin: %v", err)
		}
		log.Printf("Admin '%s' updated successfully with ID %d", username, admin.ID)
	} else {
		// Admin does not exist, create new
		newAdmin := models.Admin{
			Username: username,
			Password: string(hashedPassword),
			Name:     name,
		}
		if err := config.DB.Create(&newAdmin).Error; err != nil {
			log.Fatalf("Failed to create admin: %v", err)
		}
		log.Printf("Admin '%s' created successfully with ID %d", username, newAdmin.ID)
	}
}

