import React, { useEffect, useState } from 'react';
import { Drawer, Form, Input, Button, Row, Col, message, Space, DatePicker, Select } from 'antd';
import dayjs from 'dayjs';
import { applicantService } from '../../services/api';
import type { ApplicantData } from '../../types/applicant';
import { THAI_PROVINCES } from '../../constants/provinces';

interface EditApplicantDrawerProps {
  open: boolean;
  onClose: () => void;
  applicant: ApplicantData | null;
  onSuccess: () => void;
}

const EditApplicantDrawer: React.FC<EditApplicantDrawerProps> = ({ open, onClose, applicant, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && applicant) {
      // Create a copy for form so we don't mutate original
      const formValues = { ...applicant };
      // If driving skills is an array, join it or handle it based on how the form needs it.
      // Usually it's better to keep it as string if the backend expects string.
      if (Array.isArray(formValues.driving_skills)) {
        formValues.driving_skills = formValues.driving_skills.join(', ');
      }
      // แปลงวันที่สอบเดิมเป็น Dayjs เพื่อให้ DatePicker แสดงผลได้ถูกต้อง ถ้าไม่มีหรือผิดรูปแบบจะปลอดภัยไม่ error
      if (formValues.exam_date && formValues.exam_date !== '-' && formValues.exam_date !== 'ไม่ระบุ') {
        const parsedDate = dayjs(formValues.exam_date, 'DD/MM/YYYY');
        formValues.exam_date = parsedDate.isValid() ? parsedDate : undefined;
      } else {
        formValues.exam_date = undefined;
      }
      form.setFieldsValue(formValues);
    } else {
      form.resetFields();
    }
  }, [open, applicant, form]);

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      // Merge id and other immutable fields back
      const submitData = { ...applicant, ...values };
      // แปลงวันที่สอบกลับเป็นสตริง DD/MM/YYYY ก่อนส่งบันทึกหลังบ้าน
      if (submitData.exam_date && typeof submitData.exam_date.format === 'function') {
        submitData.exam_date = submitData.exam_date.format('DD/MM/YYYY');
      } else if (!submitData.exam_date) {
        submitData.exam_date = '';
      }
      await applicantService.saveApplicant(submitData);
      message.success('อัปเดตข้อมูลสำเร็จ!');
      onSuccess();
    } catch (error: any) {
      message.error(error.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      title={`แก้ไขข้อมูล: ${applicant?.first_name || ''} ${applicant?.last_name || ''}`}
      width={720}
      onClose={onClose}
      open={open}
      styles={{ body: { paddingBottom: 80 } }}
      extra={
        <Space>
          <Button onClick={onClose}>ยกเลิก</Button>
          <Button onClick={() => form.submit()} type="primary" loading={loading}>
            บันทึกการแก้ไข
          </Button>
        </Space>
      }
    >
      <Form layout="vertical" form={form} onFinish={handleSubmit}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="first_name" label="ชื่อ" rules={[{ required: true, message: 'กรุณากรอกชื่อ' }]}>
              <Input placeholder="กรอกชื่อจริง" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="last_name" label="นามสกุล" rules={[{ required: true, message: 'กรุณากรอกนามสกุล' }]}>
              <Input placeholder="กรอกนามสกุล" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="id_card" label="รหัสบัตรประชาชน (ไม่อนุญาตให้แก้)" rules={[{ required: true }]}>
              <Input disabled />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="phone" label="เบอร์โทรศัพท์" rules={[{ required: true }]}>
              <Input placeholder="กรอกเบอร์โทรศัพท์" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="position" label="ตำแหน่งหลัก" rules={[{ required: true, message: 'กรุณากรอกตำแหน่งหลัก' }]}>
              <Input placeholder="ระบุตำแหน่งหลัก" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="position2" label="ตำแหน่งรอง">
              <Input placeholder="ระบุตำแหน่งรอง (ถ้ามี)" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="exam_date_province" label="สถานที่สอบ">
              <Select
                showSearch
                placeholder="เลือกหรือพิมพ์ค้นหาจังหวัด"
                optionFilterProp="children"
                filterOption={(input, option) =>
                  String(option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                }
                allowClear
              >
                {THAI_PROVINCES.map((province) => (
                  <Select.Option key={province} value={province}>
                    {province}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="exam_date" label="วันที่สอบ">
              <DatePicker format="DD/MM/YYYY" placeholder="เลือกวันที่สอบ" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <h3 style={{ marginTop: 24, marginBottom: 16 }}>ข้อมูลทั่วไป</h3>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="shirt_size" label="ไซส์เสื้อ">
              <Input placeholder="เช่น S, M, L, XL" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="pants_size" label="ไซส์กางเกง">
              <Input placeholder="เช่น 30, 32, 34" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="shoe_size" label="ไซส์รองเท้า">
              <Input placeholder="เช่น 40, 42" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="height" label="ส่วนสูง (ซม.)">
              <Input type="number" placeholder="ซม." />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="weight" label="น้ำหนัก (กก.)">
              <Input type="number" placeholder="กก." />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="age" label="อายุ (ปี)">
              <Input type="number" placeholder="ปี" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="driving_license" label="ใบขับขี่">
              <Input placeholder="เช่น มี (2 ปี) หรือ ไม่มี" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="driving_skills" label="ทักษะการขับรถ">
              <Input placeholder="เช่น รถยนต์, รถบรรทุก" />
            </Form.Item>
          </Col>
        </Row>

        <h3 style={{ marginTop: 24, marginBottom: 16 }}>ข้อมูลติดต่อฉุกเฉิน</h3>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="emergency_contact" label="ชื่อผู้ติดต่อ">
              <Input placeholder="ชื่อ-สกุล ผู้ติดต่อ" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="emergency_relation" label="ความสัมพันธ์">
              <Input placeholder="เช่น บิดา, มารดา, พี่ชาย" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="emergency_phone" label="เบอร์โทร">
              <Input placeholder="08XXXXXXXX" />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Drawer>
  );
};

export default EditApplicantDrawer;
