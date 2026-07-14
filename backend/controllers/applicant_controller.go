package controllers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/jirayusmmmm/form-regis/backend/models"
	"github.com/jirayusmmmm/form-regis/backend/services"
)

func GetAllApplicants(c *fiber.Ctx) error {
	applicants, err := services.GetAllApplicants()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(applicants)
}

func GetApplicantByIDCard(c *fiber.Ctx) error {
	idCard := c.Params("id_card")
	applicant, err := services.GetApplicantByIDCard(idCard)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Applicant not found"})
	}
	return c.JSON(applicant)
}

func SaveApplicant(c *fiber.Ctx) error {
	applicant := new(models.Applicant)
	if err := c.BodyParser(applicant); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Cannot parse JSON"})
	}

	if err := services.SaveApplicant(applicant); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	
	return c.Status(200).JSON(applicant)
}
