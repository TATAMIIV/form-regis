package services

import (
	"time"

	"github.com/jirayusmmmm/form-regis/backend/models"
	"github.com/jirayusmmmm/form-regis/backend/repositories"
)

func GetAllApplicants() ([]models.Applicant, error) {
	cacheKey := "applicants_all"
	if cached, found := Cache.Get(cacheKey); found {
		if applicants, ok := cached.([]models.Applicant); ok {
			return applicants, nil
		}
	}

	applicants, err := repositories.FindAll()
	if err != nil {
		return nil, err
	}

	Cache.Set(cacheKey, applicants, 2*time.Minute)
	return applicants, nil
}

func GetApplicantByIDCard(idCard string) (models.Applicant, error) {
	cacheKey := "applicant_" + idCard
	if cached, found := Cache.Get(cacheKey); found {
		if applicant, ok := cached.(models.Applicant); ok {
			return applicant, nil
		}
	}

	applicant, err := repositories.FindByIDCard(idCard)
	if err != nil {
		return applicant, err
	}

	Cache.Set(cacheKey, applicant, 5*time.Minute)
	return applicant, nil
}

func SaveApplicant(applicant *models.Applicant) error {
	var saveErr error
	existing, err := repositories.FindByIDCard(applicant.IDCard)
	if err == nil {
		// Exists, update it
		applicant.ID = existing.ID
		saveErr = repositories.Update(applicant)
	} else {
		// Does not exist, create new
		saveErr = repositories.Create(applicant)
	}

	if saveErr == nil {
		// Invalidate cache
		Cache.Delete("applicants_all")
		Cache.Delete("applicant_" + applicant.IDCard)
	}

	return saveErr
}
