package services

import (
	"github.com/jirayusmmmm/form-regis/backend/models"
	"github.com/jirayusmmmm/form-regis/backend/repositories"
)

func GetAllApplicants() ([]models.Applicant, error) {
	return repositories.FindAll()
}

func GetApplicantByIDCard(idCard string) (models.Applicant, error) {
	return repositories.FindByIDCard(idCard)
}

func SaveApplicant(applicant *models.Applicant) error {
	existing, err := repositories.FindByIDCard(applicant.IDCard)
	if err == nil {
		// Exists, update it
		applicant.ID = existing.ID
		return repositories.Update(applicant)
	} else {
		// Does not exist, create new
		return repositories.Create(applicant)
	}
}
