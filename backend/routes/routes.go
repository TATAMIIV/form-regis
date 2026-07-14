package routes

import (
	"github.com/gofiber/fiber/v2"
	"github.com/jirayusmmmm/form-regis/backend/controllers"
)

func SetupRoutes(app *fiber.App) {
	app.Get("/", func(c *fiber.Ctx) error {
		return c.SendString("Job Registration API is running")
	})

	api := app.Group("/api")
	api.Get("/applicants", controllers.GetAllApplicants)
	api.Get("/applicants/:id_card", controllers.GetApplicantByIDCard)
	api.Post("/applicants", controllers.SaveApplicant)
	api.Post("/applicants/:id_card/send-line", controllers.SendLineNotification)
}
