package controllers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/jirayusmmmm/form-regis/backend/services"
)

func SendLineNotification(c *fiber.Ctx) error {
	idCard := c.Params("id_card")
	
	applicant, err := services.GetApplicantByIDCard(idCard)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Applicant not found"})
	}

	if err := services.SendLineNotification(&applicant); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"message": "Line notification sent successfully"})
}
