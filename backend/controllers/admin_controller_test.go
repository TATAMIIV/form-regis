package controllers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/jirayusmmmm/form-regis/backend/models"
	"github.com/pquerna/otp/totp"
)

// Scenario 1: Happy Path - Token Generation and Parsing
func TestTempTokenLifecycle_HappyPath(t *testing.T) {
	// Arrange
	admin := &models.Admin{
		ID:       1,
		Username: "admin_test",
		Name:     "Test Admin",
	}

	// Act
	tokenStr, err := generateTempToken(admin)
	if err != nil {
		t.Fatalf("Failed to generate temp token: %v", err)
	}

	claims, err := parseAndValidateTempToken(tokenStr)

	// Assert
	if err != nil {
		t.Fatalf("Expected valid temp token, got error: %v", err)
	}
	if claims["purpose"] != "2fa_pending" {
		t.Errorf("Expected purpose '2fa_pending', got '%v'", claims["purpose"])
	}
	if claims["username"] != "admin_test" {
		t.Errorf("Expected username 'admin_test', got '%v'", claims["username"])
	}
}

// Scenario 2: Error Path - Invalid / Tampered Temp Token
func TestParseTempToken_ErrorPath(t *testing.T) {
	// 1. Arrange: Malformed token
	malformedToken := "invalid.jwt.token"

	// Act
	_, err := parseAndValidateTempToken(malformedToken)

	// Assert
	if err == nil {
		t.Error("Expected error for malformed token, got nil")
	}

	// 2. Arrange: Token with wrong purpose (e.g., standard admin token)
	adminClaims := jwt.MapClaims{
		"admin_id": 1,
		"username": "admin_test",
		"role":     "admin",
		"exp":      time.Now().Add(time.Hour).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, adminClaims)
	tokenStr, _ := token.SignedString([]byte(getJWTSecret()))

	// Act
	_, err = parseAndValidateTempToken(tokenStr)

	// Assert
	if err == nil {
		t.Error("Expected error for token with non-2fa purpose, got nil")
	}
}

// Scenario 3: Happy Path & Edge Cases for TOTP Generation and Validation
func TestTOTPValidation(t *testing.T) {
	// Arrange
	key, err := totp.Generate(totp.GenerateOpts{
		Issuer:      "JobRegistrationAdmin",
		AccountName: "admin_test",
	})
	if err != nil {
		t.Fatalf("Failed to generate TOTP key: %v", err)
	}
	secret := key.Secret()

	// 1. Happy Path: Current valid code
	validCode, err := totp.GenerateCode(secret, time.Now())
	if err != nil {
		t.Fatalf("Failed to generate valid TOTP code: %v", err)
	}

	// Act & Assert
	if !totp.Validate(validCode, secret) {
		t.Errorf("Expected TOTP code %s to be valid for secret %s", validCode, secret)
	}

	// 2. Edge Case: Empty code
	if totp.Validate("", secret) {
		t.Error("Expected empty code to be invalid, got true")
	}

	// 3. Error Path: Wrong 6-digit code
	wrongCode := "000000"
	if validCode == wrongCode {
		wrongCode = "999999"
	}
	if totp.Validate(wrongCode, secret) {
		t.Errorf("Expected wrong code %s to be rejected", wrongCode)
	}

	// 4. Edge Case: Expired code (generated from 10 minutes ago)
	expiredCode, err := totp.GenerateCode(secret, time.Now().Add(-10*time.Minute))
	if err == nil {
		if totp.Validate(expiredCode, secret) {
			t.Error("Expected 10-minute old TOTP code to be expired and invalid")
		}
	}
}

// Scenario 4: HTTP Handler Input Validation Tests
func TestHandlerInputValidations(t *testing.T) {
	app := fiber.New()
	app.Post("/api/admin/login", AdminLogin)
	app.Post("/api/admin/2fa/setup", Setup2FA)
	app.Post("/api/admin/2fa/verify", Verify2FA)

	tests := []struct {
		name         string
		route        string
		body         interface{}
		expectedCode int
	}{
		{
			name:         "Login: Empty Body",
			route:        "/api/admin/login",
			body:         map[string]string{},
			expectedCode: http.StatusBadRequest,
		},
		{
			name:         "Login: Missing Password",
			route:        "/api/admin/login",
			body:         map[string]string{"username": "admin"},
			expectedCode: http.StatusBadRequest,
		},
		{
			name:         "Setup2FA: Missing Fields",
			route:        "/api/admin/2fa/setup",
			body:         map[string]string{"temp_token": "some_token"},
			expectedCode: http.StatusBadRequest,
		},
		{
			name: "Setup2FA: Invalid Temp Token",
			route: "/api/admin/2fa/setup",
			body: map[string]string{
				"temp_token": "invalid_token",
				"secret":     "JBSWY3DPEHPK3PXP",
				"code":       "123456",
			},
			expectedCode: http.StatusUnauthorized,
		},
		{
			name:         "Verify2FA: Missing Code",
			route:        "/api/admin/2fa/verify",
			body:         map[string]string{"temp_token": "some_token"},
			expectedCode: http.StatusBadRequest,
		},
		{
			name: "Verify2FA: Invalid Temp Token",
			route: "/api/admin/2fa/verify",
			body: map[string]string{
				"temp_token": "invalid_token",
				"code":       "123456",
			},
			expectedCode: http.StatusUnauthorized,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			// Arrange
			bodyBytes, _ := json.Marshal(tc.body)
			req := httptest.NewRequest("POST", tc.route, bytes.NewReader(bodyBytes))
			req.Header.Set("Content-Type", "application/json")

			// Act
			resp, err := app.Test(req, -1)
			if err != nil {
				t.Fatalf("Request error: %v", err)
			}

			// Assert
			if resp.StatusCode != tc.expectedCode {
				t.Errorf("Expected status %d, got %d", tc.expectedCode, resp.StatusCode)
			}
		})
	}
}

