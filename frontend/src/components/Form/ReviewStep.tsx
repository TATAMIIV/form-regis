import React from 'react';
import { Descriptions } from 'antd';
import type { ApplicantData } from '../../types/applicant';

interface Props {
  formData: ApplicantData;
}

const ReviewStep: React.FC<Props> = ({ formData }) => (
  <Descriptions title="ตรวจสอบความถูกต้อง" layout="horizontal" bordered size="small" column={1}>
    <Descriptions.Item label="ชื่อ-นามสกุล">{`${formData.first_name || ''} ${formData.last_name || ''}`}</Descriptions.Item>
    <Descriptions.Item label="เลขบัตรปชช.">{formData.id_card || '-'}</Descriptions.Item>
    <Descriptions.Item label="Passport">{formData.passport || '-'}</Descriptions.Item>
    <Descriptions.Item label="สาย/ผู้ดูแล">{formData.coordinator || '-'}</Descriptions.Item>
    <Descriptions.Item label="ตำแหน่งหลัก">{formData.position || '-'}</Descriptions.Item>
    <Descriptions.Item label="ตำแหน่งรอง">{formData.position2 || '-'}</Descriptions.Item>
    <Descriptions.Item label="เบอร์โทร">{formData.phone || '-'}</Descriptions.Item>
    <Descriptions.Item label="สถานที่สอบ">{formData.exam_date_province || '-'}</Descriptions.Item>
    <Descriptions.Item label="ไซส์ เสื้อ/กางเกง/รองเท้า">{`${formData.shirt_size || '-'} / ${formData.pants_size || '-'} / ${formData.shoe_size || '-'}`}</Descriptions.Item>
    <Descriptions.Item label="การเงิน">{formData.financial_ready || '-'}</Descriptions.Item>
    <Descriptions.Item label="ส่วนสูง/น้ำหนัก/อายุ">{`${formData.height || '-'} ซม. / ${formData.weight || '-'} กก. / ${formData.age || '-'} ปี`}</Descriptions.Item>
    <Descriptions.Item label="ใบขับขี่">
      {formData.has_driving_license === 'มี' ? `มี (${formData.driving_license_years || 0} ปี)` : 'ไม่มี'}
    </Descriptions.Item>
    <Descriptions.Item label="ทักษะการขับรถ">
      {Array.isArray(formData.driving_skills) ? formData.driving_skills.join(', ') : '-'}
    </Descriptions.Item>
    <Descriptions.Item label="ติดต่อฉุกเฉิน">{`${formData.emergency_contact || '-'} (${formData.emergency_relation || '-'}) - ${formData.emergency_phone || '-'}`}</Descriptions.Item>
    <Descriptions.Item label="สถานภาพสมรส">{formData.marital_status || '-'}</Descriptions.Item>
    <Descriptions.Item label="บิดา (ไทย/Eng/DOB)">
      {`${formData.father_name_th || 'ไม่ระบุ'} / ${formData.father_name_en || 'ไม่ระบุ'} / ${formData.father_dob || 'ไม่ระบุ'}`}
    </Descriptions.Item>
    <Descriptions.Item label="มารดา (ไทย/Eng/DOB)">
      {`${formData.mother_name_th || 'ไม่ระบุ'} / ${formData.mother_name_en || 'ไม่ระบุ'} / ${formData.mother_dob || 'ไม่ระบุ'}`}
    </Descriptions.Item>
    <Descriptions.Item label="คู่สมรส (ไทย/Eng/DOB)">
      {`${formData.spouse_name_th || 'ไม่ระบุ'} / ${formData.spouse_name_en || 'ไม่ระบุ'} / ${formData.spouse_dob || 'ไม่ระบุ'}`}
    </Descriptions.Item>
    <Descriptions.Item label="บุตรคนที่ 1 (ไทย/Eng/DOB)">
      {`${formData.child1_name_th || 'ไม่ระบุ'} / ${formData.child1_name_en || 'ไม่ระบุ'} / ${formData.child1_dob || 'ไม่ระบุ'}`}
    </Descriptions.Item>
    <Descriptions.Item label="บุตรคนที่ 2 (ไทย/Eng/DOB)">
      {`${formData.child2_name_th || 'ไม่ระบุ'} / ${formData.child2_name_en || 'ไม่ระบุ'} / ${formData.child2_dob || 'ไม่ระบุ'}`}
    </Descriptions.Item>
  </Descriptions>
);

export default ReviewStep;
