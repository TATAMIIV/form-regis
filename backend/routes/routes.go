package routes

import (
	"github.com/gofiber/fiber/v2"
	"github.com/jirayusmmmm/form-regis/backend/controllers"
	"github.com/jirayusmmmm/form-regis/backend/middleware"
)

func SetupRoutes(app *fiber.App) {
	app.Get("/", func(c *fiber.Ctx) error {
		return c.SendString("Job Registration API is running")
	})

	api := app.Group("/api")

	// Public routes for job applicants
	api.Get("/applicants/:id_card", controllers.GetApplicantByIDCard)
	api.Post("/applicants", controllers.SaveApplicant)

	// Admin Auth routes
	api.Post("/admin/login", controllers.AdminLogin)
	api.Post("/admin/2fa/setup", controllers.Setup2FA)
	api.Post("/admin/2fa/verify", controllers.Verify2FA)

	// Protected Admin routes
	admin := api.Group("", middleware.Protected())
	admin.Get("/admin/me", controllers.GetMe)
	admin.Get("/applicants", controllers.GetAllApplicants)
	admin.Post("/applicants/:id_card/send-line", controllers.SendLineNotification)
	admin.Get("/line/quota", controllers.GetQuota)

	// Admin Users Management routes (Only Admin ID = 2)
	superAdmin := admin.Group("", middleware.RequireAdminID(2))
	superAdmin.Get("/admins", controllers.GetAllAdmins)
	superAdmin.Post("/admins", controllers.CreateAdmin)
	superAdmin.Put("/admins/:id", controllers.UpdateAdmin)
	superAdmin.Delete("/admins/:id", controllers.DeleteAdmin)
	superAdmin.Post("/admins/:id/reset-2fa", controllers.ResetAdmin2FA)
}
