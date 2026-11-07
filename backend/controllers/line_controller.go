package controllers

import (
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/jirayusmmmm/form-regis/backend/repositories"
	"github.com/jirayusmmmm/form-regis/backend/services"
)

func SendLineNotification(c *fiber.Ctx) error {
	idCard := c.Params("id_card")
	
	applicant, err := services.GetApplicantByIDCard(idCard)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Applicant not found"})
	}

	if err := services.SendLineNotification(&applicant); err != nil {
		log.Printf("Internal error in SendLineNotification: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to send LINE notification",
		})
	}

	if err := repositories.UpdateLineSentStatus(idCard); err != nil {
		log.Printf("Internal error in UpdateLineSentStatus: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update notification status",
		})
	}

	return c.JSON(fiber.Map{"message": "Line notification sent successfully"})
}

func GetQuota(c *fiber.Ctx) error {
	quota, err := services.GetLineQuota()
	if err != nil {
		log.Printf("Internal error in GetQuota: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch LINE quota",
		})
	}
	return c.JSON(quota)
}

