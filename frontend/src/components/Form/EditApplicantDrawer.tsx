import React, { useEffect, useState } from 'react';
import { Drawer, Form, Input, Button, Row, Col, Select, message, Space } from 'antd';
import { applicantService } from '../../services/api';
import type { ApplicantData } from '../../types/applicant';

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
            <Form.Item name="first_name" label="ชื่อ (First Name)" rules={[{ required: true, message: 'กรุณากรอกชื่อ' }]}>
              <Input placeholder="กรอกชื่อ" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="last_name" label="นามสกุล (Last Name)" rules={[{ required: true, message: 'กรุณากรอกนามสกุล' }]}>
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
            <Form.Item name="position" label="ตำแหน่งหลัก" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="position2" label="ตำแหน่งรอง">
              <Input />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item name="exam_date_province" label="สถานที่สอบ">
              <Input />
            </Form.Item>
          </Col>
        </Row>

        <h3 style={{ marginTop: 24, marginBottom: 16 }}>ข้อมูลทั่วไป</h3>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="shirt_size" label="ไซส์เสื้อ">
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="pants_size" label="ไซส์กางเกง">
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="shoe_size" label="ไซส์รองเท้า">
              <Input />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="height" label="ส่วนสูง (ซม.)">
              <Input type="number" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="weight" label="น้ำหนัก (กก.)">
              <Input type="number" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="age" label="อายุ (ปี)">
              <Input type="number" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="driving_license" label="ใบขับขี่">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="driving_skills" label="ทักษะการขับรถ">
              <Input />
            </Form.Item>
          </Col>
        </Row>

        <h3 style={{ marginTop: 24, marginBottom: 16 }}>ข้อมูลติดต่อฉุกเฉิน</h3>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="emergency_contact" label="ชื่อผู้ติดต่อ">
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="emergency_relation" label="ความสัมพันธ์">
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="emergency_phone" label="เบอร์โทร">
              <Input />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Drawer>
  );
};

export default EditApplicantDrawer;
