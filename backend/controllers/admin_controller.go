package controllers

import (
	"errors"
	"log"
	"os"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/jirayusmmmm/form-regis/backend/config"
	"github.com/jirayusmmmm/form-regis/backend/models"
	"github.com/pquerna/otp/totp"
	"golang.org/x/crypto/bcrypt"
)

type LoginInput struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type Setup2FAInput struct {
	TempToken string `json:"temp_token"`
	Secret    string `json:"secret"`
	Code      string `json:"code"`
}

type Verify2FAInput struct {
	TempToken string `json:"temp_token"`
	Code      string `json:"code"`
}

func getJWTSecret() string {
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		if os.Getenv("APP_ENV") == "production" {
			log.Fatal("CRITICAL SECURITY ERROR: JWT_SECRET environment variable is missing in production")
		}
		jwtSecret = "form-regis-default-jwt-secret-key"
	}
	return jwtSecret
}

func generateAdminToken(admin *models.Admin) (string, error) {
	claims := jwt.MapClaims{
		"admin_id": admin.ID,
		"username": admin.Username,
		"name":     admin.Name,
		"role":     "admin",
		"exp":      time.Now().Add(time.Hour * 8).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(getJWTSecret()))
}

func generateTempToken(admin *models.Admin) (string, error) {
	claims := jwt.MapClaims{
		"admin_id": admin.ID,
		"username": admin.Username,
		"name":     admin.Name,
		"purpose":  "2fa_pending",
		"exp":      time.Now().Add(time.Minute * 5).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(getJWTSecret()))
}

func parseAndValidateTempToken(tokenString string) (jwt.MapClaims, error) {
	token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(getJWTSecret()), nil
	})
	if err != nil || !token.Valid {
		return nil, errors.New("Token ไม่ถูกต้องหรือหมดอายุ")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || claims["purpose"] != "2fa_pending" {
		return nil, errors.New("Token ไม่ถูกต้องสำหรับขั้นตอนนี้")
	}

	return claims, nil
}

func AdminLogin(c *fiber.Ctx) error {
	var input LoginInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request payload",
		})
	}

	if input.Username == "" || input.Password == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Username and password are required",
		})
	}

	var admin models.Admin
	if err := config.DB.Where("username = ?", input.Username).First(&admin).Error; err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Invalid username or password",
		})
	}

	if err := bcrypt.CompareHashAndPassword([]byte(admin.Password), []byte(input.Password)); err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Invalid username or password",
		})
	}

	tempToken, err := generateTempToken(&admin)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to generate temporary session token",
		})
	}

	if !admin.TotpEnabled {
		key, err := totp.Generate(totp.GenerateOpts{
			Issuer:      "JobRegistrationAdmin",
			AccountName: admin.Username,
		})
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to generate 2FA secret",
			})
		}

		return c.JSON(fiber.Map{
			"require_2fa":   true,
			"is_totp_setup": false,
			"temp_token":    tempToken,
			"qr_code_url":   key.URL(),
			"secret":        key.Secret(),
			"username":      admin.Username,
		})
	}

	return c.JSON(fiber.Map{
		"require_2fa":   true,
		"is_totp_setup": true,
		"temp_token":    tempToken,
		"username":      admin.Username,
	})
}

func Setup2FA(c *fiber.Ctx) error {
	var input Setup2FAInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request payload",
		})
	}

	if input.TempToken == "" || input.Secret == "" || input.Code == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Temp token, secret, and code are required",
		})
	}

	claims, err := parseAndValidateTempToken(input.TempToken)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	adminIDVal, ok := claims["admin_id"]
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Invalid token claims",
		})
	}

	var adminID uint
	switch v := adminIDVal.(type) {
	case float64:
		adminID = uint(v)
	case int:
		adminID = uint(v)
	case uint:
		adminID = v
	default:
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Invalid admin ID in token",
		})
	}

	var admin models.Admin
	if err := config.DB.First(&admin, adminID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Admin not found",
		})
	}

	isValid := totp.Validate(input.Code, input.Secret)
	if !isValid {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "รหัสยืนยันไม่ถูกต้อง หรือหมดอายุ กรุณาลองใหม่อีกครั้ง",
		})
	}

	admin.TotpSecret = input.Secret
	admin.TotpEnabled = true
	if err := config.DB.Save(&admin).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to save 2FA configuration",
		})
	}

	tokenString, err := generateAdminToken(&admin)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to generate token",
		})
	}

	return c.JSON(fiber.Map{
		"message": "2FA setup successful",
		"token":   tokenString,
		"admin": fiber.Map{
			"id":       admin.ID,
			"username": admin.Username,
			"name":     admin.Name,
		},
	})
}

func Verify2FA(c *fiber.Ctx) error {
	var input Verify2FAInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request payload",
		})
	}

	if input.TempToken == "" || input.Code == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Temp token and code are required",
		})
	}

	claims, err := parseAndValidateTempToken(input.TempToken)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	adminIDVal, ok := claims["admin_id"]
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Invalid token claims",
		})
	}

	var adminID uint
	switch v := adminIDVal.(type) {
	case float64:
		adminID = uint(v)
	case int:
		adminID = uint(v)
	case uint:
		adminID = v
	default:
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Invalid admin ID in token",
		})
	}

	var admin models.Admin
	if err := config.DB.First(&admin, adminID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Admin not found",
		})
	}

	if !admin.TotpEnabled || admin.TotpSecret == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "ยังไม่ได้เปิดใช้งาน 2FA สำหรับบัญชีนี้",
		})
	}

	isValid := totp.Validate(input.Code, admin.TotpSecret)
	if !isValid {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "รหัสยืนยันไม่ถูกต้อง หรือหมดอายุ",
		})
	}

	tokenString, err := generateAdminToken(&admin)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to generate token",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Login successful",
		"token":   tokenString,
		"admin": fiber.Map{
			"id":       admin.ID,
			"username": admin.Username,
			"name":     admin.Name,
		},
	})
}

func GetMe(c *fiber.Ctx) error {
	adminID := c.Locals("admin_id")
	var admin models.Admin
	if err := config.DB.First(&admin, adminID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Admin not found",
		})
	}

	return c.JSON(fiber.Map{
		"id":       admin.ID,
		"username": admin.Username,
		"name":     admin.Name,
	})
}

type CreateAdminInput struct {
	Username string `json:"username"`
	Password string `json:"password"`
	Name     string `json:"name"`
}

type UpdateAdminInput struct {
	Name     string `json:"name"`
	Password string `json:"password"`
}

type AdminResponse struct {
	ID          uint      `json:"id"`
	Username    string    `json:"username"`
	Name        string    `json:"name"`
	TotpEnabled bool      `json:"totp_enabled"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// GetAllAdmins returns list of all admins without sensitive fields
func GetAllAdmins(c *fiber.Ctx) error {
	if config.DB == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Database not initialized",
		})
	}

	var admins []models.Admin
	if err := config.DB.Order("id asc").Find(&admins).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch admin users",
		})
	}

	response := make([]AdminResponse, len(admins))
	for i, a := range admins {
		response[i] = AdminResponse{
			ID:          a.ID,
			Username:    a.Username,
			Name:        a.Name,
			TotpEnabled: a.TotpEnabled,
			CreatedAt:   a.CreatedAt,
			UpdatedAt:   a.UpdatedAt,
		}
	}

	return c.JSON(response)
}

// CreateAdmin creates a new admin user
func CreateAdmin(c *fiber.Ctx) error {
	var input CreateAdminInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request payload",
		})
	}

	if input.Username == "" || input.Password == "" || input.Name == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "กรุณากรอกข้อมูลให้ครบทุกช่อง (Username, Password, Name)",
		})
	}

	if len(input.Password) < 6 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร",
		})
	}

	if config.DB == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Database not initialized",
		})
	}

	var existing models.Admin
	if err := config.DB.Where("username = ?", input.Username).First(&existing).Error; err == nil {
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{
			"error": "ชื่อผู้ใช้งานนี้มีอยู่ในระบบแล้ว กรุณาเลือกชื่ออื่น",
		})
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to hash password",
		})
	}

	newAdmin := models.Admin{
		Username:    input.Username,
		Password:    string(hashedPassword),
		Name:        input.Name,
		TotpEnabled: false,
		TotpSecret:  "",
	}

	if err := config.DB.Create(&newAdmin).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create admin user",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(AdminResponse{
		ID:          newAdmin.ID,
		Username:    newAdmin.Username,
		Name:        newAdmin.Name,
		TotpEnabled: newAdmin.TotpEnabled,
		CreatedAt:   newAdmin.CreatedAt,
		UpdatedAt:   newAdmin.UpdatedAt,
	})
}

// UpdateAdmin updates an admin's display name or password
func UpdateAdmin(c *fiber.Ctx) error {
	adminID := c.Params("id")
	var input UpdateAdminInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request payload",
		})
	}

	if input.Password != "" && len(input.Password) < 6 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร",
		})
	}

	if config.DB == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Database not initialized",
		})
	}

	var admin models.Admin
	if err := config.DB.First(&admin, adminID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "ไม่พบผู้ดูแลระบบที่ต้องการแก้ไข",
		})
	}

	if input.Name != "" {
		admin.Name = input.Name
	}

	if input.Password != "" {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to hash password",
			})
		}
		admin.Password = string(hashedPassword)
	}

	if err := config.DB.Save(&admin).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update admin user",
		})
	}

	return c.JSON(AdminResponse{
		ID:          admin.ID,
		Username:    admin.Username,
		Name:        admin.Name,
		TotpEnabled: admin.TotpEnabled,
		CreatedAt:   admin.CreatedAt,
		UpdatedAt:   admin.UpdatedAt,
	})
}

// DeleteAdmin deletes an admin with protection against deleting self or the last admin
func DeleteAdmin(c *fiber.Ctx) error {
	targetIDStr := c.Params("id")
	targetID, err := strconv.ParseUint(targetIDStr, 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid admin ID",
		})
	}

	currentAdminIDVal := c.Locals("admin_id")
	var currentAdminID uint
	switch v := currentAdminIDVal.(type) {
	case float64:
		currentAdminID = uint(v)
	case int:
		currentAdminID = uint(v)
	case uint:
		currentAdminID = v
	}

	// Protection 1: Cannot delete oneself
	if uint(targetID) == currentAdminID {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "ไม่อนุญาตให้ลบบัญชีผู้ใช้งานของตนเองที่กำลังล็อกอินอยู่",
		})
	}

	if config.DB == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Database not initialized",
		})
	}

	var targetAdmin models.Admin
	if err := config.DB.First(&targetAdmin, targetID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "ไม่พบผู้ดูแลระบบที่ต้องการลบ",
		})
	}

	// Protection 2: Cannot delete the last remaining admin
	var count int64
	if err := config.DB.Model(&models.Admin{}).Count(&count).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to verify admin count",
		})
	}
	if count <= 1 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "ไม่อนุญาตให้ลบผู้ดูแลระบบคนสุดท้ายในระบบ",
		})
	}

	if err := config.DB.Delete(&targetAdmin).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete admin user",
		})
	}

	return c.JSON(fiber.Map{
		"message": "ลบผู้ดูแลระบบเรียบร้อยแล้ว",
	})
}

// ResetAdmin2FA resets an admin's Google Authenticator 2FA settings
func ResetAdmin2FA(c *fiber.Ctx) error {
	adminID := c.Params("id")

	if config.DB == nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Database not initialized",
		})
	}

	var admin models.Admin
	if err := config.DB.First(&admin, adminID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "ไม่พบผู้ดูแลระบบที่ต้องการรีเซ็ต 2FA",
		})
	}

	admin.TotpSecret = ""
	admin.TotpEnabled = false
	if err := config.DB.Save(&admin).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to reset 2FA configuration",
		})
	}

	return c.JSON(fiber.Map{
		"message": "รีเซ็ต Google Authenticator สำเร็จ ผู้ดูแลระบบจะต้องสแกนลงทะเบียนใหม่เมื่อเข้าสู่ระบบครั้งถัดไป",
		"admin": AdminResponse{
			ID:          admin.ID,
			Username:    admin.Username,
			Name:        admin.Name,
			TotpEnabled: admin.TotpEnabled,
			CreatedAt:   admin.CreatedAt,
			UpdatedAt:   admin.UpdatedAt,
		},
	})
}
