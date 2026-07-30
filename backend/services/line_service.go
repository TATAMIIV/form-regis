package services

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/jirayusmmmm/form-regis/backend/models"
)

func formatFamilyMember(nameTH, nameEN, dob string) string {
	th := strings.TrimSpace(nameTH)
	en := strings.TrimSpace(nameEN)
	d := strings.TrimSpace(dob)

	isTHValid := th != "" && th != "-" && th != "ไม่ระบุ"
	isENValid := en != "" && en != "-" && en != "ไม่ระบุ"

	var nameStr string
	if isTHValid && isENValid {
		nameStr = fmt.Sprintf("%s (%s)", th, en)
	} else if isTHValid {
		nameStr = th
	} else if isENValid {
		nameStr = en
	} else {
		nameStr = "ไม่ระบุ"
	}

	if d == "" {
		d = "ไม่ระบุ"
	}

	return fmt.Sprintf("%s (ปีเกิด: %s)", nameStr, d)
}

func SendLineNotification(applicant *models.Applicant) error {
	token := strings.TrimSpace(os.Getenv("LINE_CHANNEL_ACCESS_TOKEN"))
	groupID := strings.TrimSpace(os.Getenv("LINE_GROUP_ID"))

	if token == "" || groupID == "" || groupID == "รอใส่ไอดีกลุ่มตรงนี้" {
		return errors.New("รอการตั้งค่า LINE Group ID ก่อนครับ")
	}

	messageText := fmt.Sprintf(
		"[ระบบแจ้งเตือนการรับสมัครงาน]\n"+
			"ได้รับข้อมูลผู้สมัครใหม่เรียบร้อยแล้ว\n\n"+
			"--- ข้อมูลส่วนบุคคล ---\n"+
			"ชื่อ-สกุล: %s %s\n"+
			"เลขประจำตัวประชาชน: %s\n"+
			"หนังสือเดินทาง: %s\n"+
			"เบอร์โทรศัพท์: %s\n\n"+
			"--- ข้อมูลการสมัคร ---\n"+
			"ตำแหน่งที่สมัคร (หลัก): %s\n"+
			"ตำแหน่งที่สมัคร (รอง): %s\n"+
			"สถานที่สอบ: %s\n"+
			"ผู้ประสานงาน: %s\n\n"+
			"--- ข้อมูลทั่วไป ---\n"+
			"ขนาดเครื่องแต่งกาย: เสื้อ %s | กางเกง %s | รองเท้า %s\n"+
			"ความพร้อมทางการเงิน: %s\n"+
			"ข้อมูลร่างกาย: ส่วนสูง %s ซม. | น้ำหนัก %s กก. | อายุ %s ปี\n"+
			"ใบอนุญาตขับขี่: %s\n"+
			"ทักษะการขับขี่: %s\n\n"+
			"--- บุคคลที่ติดต่อได้ในกรณีฉุกเฉิน ---\n"+
			"ชื่อ-สกุล: %s (%s)\n"+
			"เบอร์โทรศัพท์: %s\n\n"+
			"--- ข้อมูลครอบครัว ---\n"+
			"สถานภาพ: %s\n"+
			"บิดา: %s\n"+
			"มารดา: %s\n"+
			"คู่สมรส: %s\n"+
			"บุตรลำดับที่ 1: %s\n"+
			"บุตรลำดับที่ 2: %s\n\n"+
			"หมายเหตุ: ท่านสามารถตรวจสอบรายละเอียดข้อมูลฉบับเต็มได้ผ่านระบบ Admin Dashboard",
		applicant.FirstName, applicant.LastName,
		applicant.IDCard,
		func() string { if applicant.Passport == "" { return "-" }; return applicant.Passport }(),
		applicant.Phone,
		applicant.Position,
		func() string { if applicant.Position2 == "" { return "-" }; return applicant.Position2 }(),
		applicant.ExamDateProvince,
		func() string { if applicant.Coordinator == "" { return "-" }; return applicant.Coordinator }(),
		func() string { if applicant.ShirtSize == "" { return "-" }; return applicant.ShirtSize }(),
		func() string { if applicant.PantsSize == "" { return "-" }; return applicant.PantsSize }(),
		func() string { if applicant.ShoeSize == "" { return "-" }; return applicant.ShoeSize }(),
		func() string { if applicant.FinancialReady == "" { return "-" }; return applicant.FinancialReady }(),
		func() string { if applicant.Height == "" { return "-" }; return applicant.Height }(),
		func() string { if applicant.Weight == "" { return "-" }; return applicant.Weight }(),
		func() string { if applicant.Age == "" { return "-" }; return applicant.Age }(),
		func() string { if applicant.DrivingLicense == "" { return "-" }; return applicant.DrivingLicense }(),
		func() string { if applicant.DrivingSkills == "" { return "-" }; return applicant.DrivingSkills }(),
		func() string { if applicant.EmergencyContact == "" { return "-" }; return applicant.EmergencyContact }(),
		func() string { if applicant.EmergencyRelation == "" { return "-" }; return applicant.EmergencyRelation }(),
		func() string { if applicant.EmergencyPhone == "" { return "-" }; return applicant.EmergencyPhone }(),
		func() string { if applicant.MaritalStatus == "" { return "-" }; return applicant.MaritalStatus }(),
		formatFamilyMember(applicant.FatherNameTH, applicant.FatherNameEN, applicant.FatherDOB),
		formatFamilyMember(applicant.MotherNameTH, applicant.MotherNameEN, applicant.MotherDOB),
		formatFamilyMember(applicant.SpouseNameTH, applicant.SpouseNameEN, applicant.SpouseDOB),
		formatFamilyMember(applicant.Child1NameTH, applicant.Child1NameEN, applicant.Child1DOB),
		formatFamilyMember(applicant.Child2NameTH, applicant.Child2NameEN, applicant.Child2DOB),
	)

	payload := map[string]interface{}{
		"to": groupID,
		"messages": []map[string]interface{}{
			{
				"type": "text",
				"text": messageText,
			},
		},
	}

	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	req, err := http.NewRequest("POST", "https://api.line.me/v2/bot/message/push", bytes.NewBuffer(jsonPayload))
	if err != nil {
		return err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		var errorResponse map[string]interface{}
		json.NewDecoder(resp.Body).Decode(&errorResponse)
		return fmt.Errorf("failed to send line message, status: %d, response: %v", resp.StatusCode, errorResponse)
	}

	return nil
}

type LineQuotaResponse struct {
	Usage int `json:"usage"`
	Limit int `json:"limit"`
}

func GetLineQuota() (*LineQuotaResponse, error) {
	token := strings.TrimSpace(os.Getenv("LINE_CHANNEL_ACCESS_TOKEN"))
	if token == "" {
		return nil, errors.New("missing LINE token")
	}

	client := &http.Client{}
	
	// Get Usage
	reqUsage, _ := http.NewRequest("GET", "https://api.line.me/v2/bot/message/quota/consumption", nil)
	reqUsage.Header.Set("Authorization", "Bearer "+token)
	respUsage, err := client.Do(reqUsage)
	if err != nil {
		return nil, err
	}
	defer respUsage.Body.Close()

	var usageData struct {
		TotalUsage int `json:"totalUsage"`
	}
	if respUsage.StatusCode == http.StatusOK {
		json.NewDecoder(respUsage.Body).Decode(&usageData)
	}

	// Get Quota Limit
	reqQuota, _ := http.NewRequest("GET", "https://api.line.me/v2/bot/message/quota", nil)
	reqQuota.Header.Set("Authorization", "Bearer "+token)
	respQuota, err := client.Do(reqQuota)
	if err != nil {
		return nil, err
	}
	defer respQuota.Body.Close()

	var quotaData struct {
		Type  string `json:"type"`
		Value int    `json:"value"`
	}
	if respQuota.StatusCode == http.StatusOK {
		json.NewDecoder(respQuota.Body).Decode(&quotaData)
	}

	limit := quotaData.Value
	if quotaData.Type == "none" {
		limit = -1 // Unlimited
	}

	return &LineQuotaResponse{
		Usage: usageData.TotalUsage,
		Limit: limit,
	}, nil
}

