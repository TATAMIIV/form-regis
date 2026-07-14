package repositories

import (
	"github.com/jirayusmmmm/form-regis/backend/config"
	"github.com/jirayusmmmm/form-regis/backend/models"
)

func FindAll() ([]models.Applicant, error) {
	var applicants []models.Applicant
	result := config.DB.Find(&applicants)
	return applicants, result.Error
}

func FindByIDCard(idCard string) (models.Applicant, error) {
	var applicant models.Applicant
	result := config.DB.Where("id_card = ?", idCard).First(&applicant)
	return applicant, result.Error
}

func Create(applicant *models.Applicant) error {
	result := config.DB.Create(applicant)
	return result.Error
}

func Update(applicant *models.Applicant) error {
	result := config.DB.Save(applicant)
	return result.Error
}
