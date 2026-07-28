package main

import (
	"log"
	"os"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/limiter"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/jirayusmmmm/form-regis/backend/config"
	"github.com/jirayusmmmm/form-regis/backend/routes"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	config.ConnectDB()

	app := fiber.New()

	// Recover Middleware to catch panics
	app.Use(recover.New())

	allowedOrigin := os.Getenv("ALLOWED_ORIGIN")
	if allowedOrigin == "" {
		allowedOrigin = "*"
	}

	app.Use(cors.New(cors.Config{
		AllowOrigins: allowedOrigin,
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
	}))

	// Rate limiter for admin login (Max 5 attempts per minute)
	loginLimiter := limiter.New(limiter.Config{
		Max:        5,
		Expiration: 1 * time.Minute,
		LimitReached: func(c *fiber.Ctx) error {
			return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
				"error": "พยายามเข้าสู่ระบบมากเกินไป กรุณารอ 1 นาทีก่อนลองใหม่อีกครั้ง",
			})
		},
	})
	app.Use("/api/admin/login", loginLimiter)

	// Rate limiter for public applicant submission (Max 10 submissions per minute)
	submitLimiter := limiter.New(limiter.Config{
		Max:        10,
		Expiration: 1 * time.Minute,
		LimitReached: func(c *fiber.Ctx) error {
			return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
				"error": "มีการยิงส่งข้อมูลถี่เกินไป กรุณารอสักครู่แล้วลองใหม่อีกครั้ง",
			})
		},
	})
	app.Use("/api/applicants", submitLimiter)

	routes.SetupRoutes(app)

	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}

	log.Printf("Starting server on port %s", port)
	log.Fatal(app.Listen(":" + port))
}
