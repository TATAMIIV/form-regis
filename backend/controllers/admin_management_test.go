package controllers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v2"
)

func TestAdminManagement_Validation(t *testing.T) {
	app := fiber.New()
	app.Post("/api/admins", CreateAdmin)
	app.Put("/api/admins/:id", UpdateAdmin)
	app.Delete("/api/admins/:id", DeleteAdmin)
	app.Post("/api/admins/:id/reset-2fa", ResetAdmin2FA)

	tests := []struct {
		name         string
		method       string
		route        string
		body         interface{}
		expectedCode int
	}{
		// 1. Edge Case: Create Admin - Empty Body
		{
			name:         "CreateAdmin: Empty Body",
			method:       "POST",
			route:        "/api/admins",
			body:         map[string]string{},
			expectedCode: http.StatusBadRequest,
		},
		// 2. Edge Case: Create Admin - Missing Password
		{
			name:   "CreateAdmin: Missing Password",
			method: "POST",
			route:  "/api/admins",
			body: map[string]string{
				"username": "newadmin",
				"name":     "New Admin",
			},
			expectedCode: http.StatusBadRequest,
		},
		// 3. Edge Case: Create Admin - Password too short (< 6 chars)
		{
			name:   "CreateAdmin: Password Too Short",
			method: "POST",
			route:  "/api/admins",
			body: map[string]string{
				"username": "newadmin",
				"password": "123",
				"name":     "New Admin",
			},
			expectedCode: http.StatusBadRequest,
		},
		// 4. Edge Case: Update Admin - New password too short (< 6 chars)
		{
			name:   "UpdateAdmin: Password Too Short",
			method: "PUT",
			route:  "/api/admins/9999",
			body: map[string]string{
				"password": "123",
			},
			expectedCode: http.StatusBadRequest,
		},
		// 5. Edge Case: Delete Admin - Invalid non-numeric ID
		{
			name:         "DeleteAdmin: Non-numeric ID",
			method:       "DELETE",
			route:        "/api/admins/abc",
			body:         nil,
			expectedCode: http.StatusBadRequest,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			var bodyReader *bytes.Reader
			if tc.body != nil {
				bodyBytes, _ := json.Marshal(tc.body)
				bodyReader = bytes.NewReader(bodyBytes)
			} else {
				bodyReader = bytes.NewReader([]byte{})
			}
			req := httptest.NewRequest(tc.method, tc.route, bodyReader)
			req.Header.Set("Content-Type", "application/json")

			resp, err := app.Test(req, -1)
			if err != nil {
				t.Fatalf("Request error: %v", err)
			}

			if resp.StatusCode != tc.expectedCode {
				t.Errorf("Expected status %d, got %d", tc.expectedCode, resp.StatusCode)
			}
		})
	}
}

// Test Protection when an admin tries to delete their own account
func TestDeleteAdmin_SelfDeletionProtection(t *testing.T) {
	app := fiber.New()
	// Middleware mocking authenticated admin with ID 5
	app.Delete("/api/admins/:id", func(c *fiber.Ctx) error {
		c.Locals("admin_id", uint(5))
		return DeleteAdmin(c)
	})

	// Try deleting admin ID 5 (self)
	req := httptest.NewRequest("DELETE", "/api/admins/5", nil)
	resp, err := app.Test(req, -1)
	if err != nil {
		t.Fatalf("Request error: %v", err)
	}

	if resp.StatusCode != http.StatusBadRequest {
		t.Errorf("Expected self deletion to return 400 Bad Request, got status %d", resp.StatusCode)
	}
}
