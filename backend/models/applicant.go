package models

import (
	"time"

	"gorm.io/gorm"
)

type Applicant struct {
	ID                uint           `gorm:"primaryKey" json:"id"`
	
	// Step 1: Personal Info
	FirstName         string         `json:"first_name"`
	LastName          string         `json:"last_name"`
	IDCard            string         `json:"id_card"`
	Passport          string         `json:"passport"`
	Coordinator       string         `json:"coordinator"`
	Phone             string         `json:"phone"`
	Position          string         `json:"position"`
	Position2         string         `json:"position2"`
	ExamDateProvince  string         `json:"exam_date_province"`
	ShirtSize         string         `json:"shirt_size"`
	PantsSize         string         `json:"pants_size"`
	ShoeSize          string         `json:"shoe_size"`
	FinancialReady    string         `json:"financial_ready"`
	Height            string         `json:"height"`
	Weight            string         `json:"weight"`
	Age               string         `json:"age"`
	DrivingLicense    string         `json:"driving_license"`
	DrivingSkills     string         `json:"driving_skills"`
	EmergencyContact  string         `json:"emergency_contact"`
	EmergencyPhone    string         `json:"emergency_phone"`
	EmergencyRelation string         `json:"emergency_relation"`

	// Step 2: Family Info
	MaritalStatus     string         `json:"marital_status"`
	FatherNameTH      string         `json:"father_name_th"`
	FatherNameEN      string         `json:"father_name_en"`
	FatherDOB         string         `json:"father_dob"`
	MotherNameTH      string         `json:"mother_name_th"`
	MotherNameEN      string         `json:"mother_name_en"`
	MotherDOB         string         `json:"mother_dob"`
	SpouseNameTH      string         `json:"spouse_name_th"`
	SpouseNameEN      string         `json:"spouse_name_en"`
	SpouseDOB         string         `json:"spouse_dob"`
	Child1NameTH      string         `json:"child1_name_th"`
	Child1NameEN      string         `json:"child1_name_en"`
	Child1DOB         string         `json:"child1_dob"`
	Child2NameTH      string         `json:"child2_name_th"`
	Child2NameEN      string         `json:"child2_name_en"`
	Child2DOB         string         `json:"child2_dob"`

	CreatedAt         time.Time      `json:"created_at"`
	UpdatedAt         time.Time      `json:"updated_at"`
	DeletedAt         gorm.DeletedAt `gorm:"index" json:"-"`
	LineSentAt        *time.Time     `json:"line_sent_at"`
}
