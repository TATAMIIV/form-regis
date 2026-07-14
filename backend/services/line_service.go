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

func SendLineNotification(applicant *models.Applicant) error {
	token := strings.TrimSpace(os.Getenv("LINE_CHANNEL_ACCESS_TOKEN"))
	groupID := strings.TrimSpace(os.Getenv("LINE_GROUP_ID"))

	if token == "" || groupID == "" || groupID == "รอใส่ไอดีกลุ่มตรงนี้" {
		return errors.New("รอการตั้งค่า LINE Group ID ก่อนครับ")
	}

	messageText := fmt.Sprintf(
		"🔔 แจ้งเตือน: มีการส่งข้อมูลผู้สมัครใหม่\n\n"+
			"👤 ชื่อ-นามสกุล: %s %s\n"+
			"🪪 บัตรประชาชน: %s\n"+
			"📘 พาสปอร์ต: %s\n"+
			"📞 เบอร์โทร: %s\n"+
			"💼 ตำแหน่งหลัก: %s\n"+
			"💼 ตำแหน่งรอง: %s\n"+
			"📍 สถานที่สอบ: %s\n"+
			"🧑‍💼 ผู้ประสานงาน: %s\n"+
			"👕 ไซส์เสื้อ: %s | 👖 กางเกง: %s | 👟 รองเท้า: %s\n"+
			"💰 ความพร้อมเรื่องเงิน: %s\n"+
			"📏 ส่วนสูง: %s ซม. | ⚖️ น้ำหนัก: %s กก. | 🎂 อายุ: %s ปี\n"+
			"🚗 ใบขับขี่: %s\n"+
			"🏎️ ทักษะการขับรถ: %s\n\n"+
			"🚨 ผู้ติดต่อฉุกเฉิน:\n- %s (%s)\n- โทร: %s\n\n"+
			"👨‍👩‍👦 ข้อมูลครอบครัว:\n- สถานภาพ: %s\n"+
			"- บิดา: %s (เกิด: %s)\n"+
			"- มารดา: %s (เกิด: %s)\n"+
			"- คู่สมรส: %s (เกิด: %s)\n"+
			"- บุตรคนที่ 1: %s (เกิด: %s)\n"+
			"- บุตรคนที่ 2: %s (เกิด: %s)\n\n"+
			"✅ ท่านสามารถตรวจสอบข้อมูลเต็มรูปแบบได้ในหน้าเว็บ Admin ครับ",
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
		func() string { if applicant.FatherNameTH == "" { return "-" }; return applicant.FatherNameTH }(),
		func() string { if applicant.FatherDOB == "" { return "-" }; return applicant.FatherDOB }(),
		func() string { if applicant.MotherNameTH == "" { return "-" }; return applicant.MotherNameTH }(),
		func() string { if applicant.MotherDOB == "" { return "-" }; return applicant.MotherDOB }(),
		func() string { if applicant.SpouseNameTH == "" { return "-" }; return applicant.SpouseNameTH }(),
		func() string { if applicant.SpouseDOB == "" { return "-" }; return applicant.SpouseDOB }(),
		func() string { if applicant.Child1NameTH == "" { return "-" }; return applicant.Child1NameTH }(),
		func() string { if applicant.Child1DOB == "" { return "-" }; return applicant.Child1DOB }(),
		func() string { if applicant.Child2NameTH == "" { return "-" }; return applicant.Child2NameTH }(),
		func() string { if applicant.Child2DOB == "" { return "-" }; return applicant.Child2DOB }(),
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
