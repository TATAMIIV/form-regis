package middleware

import (
	"os"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

func Protected() fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Missing authorization token",
			})
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid authorization token format",
			})
		}

		jwtSecret := os.Getenv("JWT_SECRET")
		if jwtSecret == "" {
			if os.Getenv("APP_ENV") == "production" {
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
					"error": "Server security configuration error",
				})
			}
			jwtSecret = "form-regis-default-jwt-secret-key"
		}

		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fiber.ErrUnauthorized
			}
			return []byte(jwtSecret), nil
		})

		if err != nil || !token.Valid {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid or expired token",
			})
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok || claims["purpose"] == "2fa_pending" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Unauthorized: 2FA verification required",
			})
		}

		c.Locals("admin_id", claims["admin_id"])
		c.Locals("username", claims["username"])

		return c.Next()
	}
}

// RequireAdminID restricts access to a specific admin ID (e.g. ID = 2 for SuperAdmin)
func RequireAdminID(allowedID uint) fiber.Handler {
	return func(c *fiber.Ctx) error {
		adminIDVal := c.Locals("admin_id")
		var adminID uint
		switch v := adminIDVal.(type) {
		case float64:
			adminID = uint(v)
		case int:
			adminID = uint(v)
		case uint:
			adminID = v
		}

		if adminID != allowedID {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "Forbidden: เข้าถึงได้เฉพาะผู้ดูแลระบบหลัก (ID: 2) เท่านั้น",
			})
		}

		return c.Next()
	}
}
