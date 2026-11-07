package controllers

import (
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/jirayusmmmm/form-regis/backend/models"
	"github.com/jirayusmmmm/form-regis/backend/services"
)

func GetAllApplicants(c *fiber.Ctx) error {
	applicants, err := services.GetAllApplicants()
	if err != nil {
		log.Printf("Internal error in GetAllApplicants: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch applicants",
		})
	}
	return c.JSON(applicants)
}

func GetApplicantByIDCard(c *fiber.Ctx) error {
	idCard := c.Params("id_card")
	if len(idCard) != 13 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid ID card format",
		})
	}

	applicant, err := services.GetApplicantByIDCard(idCard)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Applicant not found",
		})
	}
	return c.JSON(applicant)
}

func SaveApplicant(c *fiber.Ctx) error {
	applicant := new(models.Applicant)
	if err := c.BodyParser(applicant); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Cannot parse JSON",
		})
	}

	// Basic validation for ID card
	if len(applicant.IDCard) != 13 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "เลขประจำตัวประชาชนต้องมี 13 หลัก",
		})
	}

	if err := services.SaveApplicant(applicant); err != nil {
		log.Printf("Internal error in SaveApplicant: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to save applicant data",
		})
	}

	return c.Status(fiber.StatusOK).JSON(applicant)
}
