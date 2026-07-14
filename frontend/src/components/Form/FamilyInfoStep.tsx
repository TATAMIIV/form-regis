import React from 'react';
import { Form, Input, Select, DatePicker, Typography } from 'antd';

const { Option } = Select;
const { Text } = Typography;

const FamilyInfoStep: React.FC = () => (
  <>
    <Form.Item name="marital_status" label="สถานภาพสมรส" rules={[{ required: true, message: 'เลือกสถานภาพสมรส' }]}>
      <Select placeholder="เลือกสถานภาพ">
        <Option value="โสด">โสด</Option>
        <Option value="สมรส">สมรส</Option>
        <Option value="หม้าย">หม้าย</Option>
        <Option value="หย่าร้าง">หย่าร้าง</Option>
      </Select>
    </Form.Item>

    <div style={{ marginTop: 24 }}><Text strong>ข้อมูลบิดา</Text></div>
    <Form.Item name="father_name_th" label="ชื่อ-นามสกุล บิดา (ภาษาไทย)" style={{ marginTop: 12 }}>
      <Input placeholder="ชื่อ-นามสกุล (ภาษาไทย)" />
    </Form.Item>
    <Form.Item name="father_name_en" label="ชื่อ-นามสกุล บิดา (ภาษาอังกฤษ)">
      <Input placeholder="ชื่อ-นามสกุล (ภาษาอังกฤษ)" />
    </Form.Item>
    <Form.Item name="father_dob" label="วัน เดือน ปีเกิด">
      <DatePicker format="DD/MM/YYYY" placeholder="เลือกวันที่" style={{ width: '100%' }} />
    </Form.Item>

    <div style={{ marginTop: 24 }}><Text strong>ข้อมูลมารดา</Text></div>
    <Form.Item name="mother_name_th" label="ชื่อ-นามสกุล มารดา (ภาษาไทย)" style={{ marginTop: 12 }}>
      <Input placeholder="ชื่อ-นามสกุล (ภาษาไทย)" />
    </Form.Item>
    <Form.Item name="mother_name_en" label="ชื่อ-นามสกุล มารดา (ภาษาอังกฤษ)">
      <Input placeholder="ชื่อ-นามสกุล (ภาษาอังกฤษ)" />
    </Form.Item>
    <Form.Item name="mother_dob" label="วัน เดือน ปีเกิด">
      <DatePicker format="DD/MM/YYYY" placeholder="เลือกวันที่" style={{ width: '100%' }} />
    </Form.Item>

    <div style={{ marginTop: 24 }}><Text strong>ข้อมูลคู่สมรส</Text></div>
    <Form.Item name="spouse_name_th" label="ชื่อ-นามสกุล คู่สมรส (ภาษาไทย)" style={{ marginTop: 12 }}>
      <Input placeholder="ชื่อ-นามสกุล (ภาษาไทย)" />
    </Form.Item>
    <Form.Item name="spouse_name_en" label="ชื่อ-นามสกุล คู่สมรส (ภาษาอังกฤษ)">
      <Input placeholder="ชื่อ-นามสกุล (ภาษาอังกฤษ)" />
    </Form.Item>
    <Form.Item name="spouse_dob" label="วัน เดือน ปีเกิด">
      <DatePicker format="DD/MM/YYYY" placeholder="เลือกวันที่" style={{ width: '100%' }} />
    </Form.Item>

    <div style={{ marginTop: 24 }}><Text strong>ข้อมูลบุตรคนที่ 1</Text></div>
    <Form.Item name="child1_name_th" label="ชื่อ-นามสกุล บุตรคนที่ 1 (ภาษาไทย)" style={{ marginTop: 12 }}>
      <Input placeholder="ชื่อ-นามสกุล (ภาษาไทย)" />
    </Form.Item>
    <Form.Item name="child1_name_en" label="ชื่อ-นามสกุล บุตรคนที่ 1 (ภาษาอังกฤษ)">
      <Input placeholder="ชื่อ-นามสกุล (ภาษาอังกฤษ)" />
    </Form.Item>
    <Form.Item name="child1_dob" label="วัน เดือน ปีเกิด">
      <DatePicker format="DD/MM/YYYY" placeholder="เลือกวันที่" style={{ width: '100%' }} />
    </Form.Item>

    <div style={{ marginTop: 24 }}><Text strong>ข้อมูลบุตรคนที่ 2</Text></div>
    <Form.Item name="child2_name_th" label="ชื่อ-นามสกุล บุตรคนที่ 2 (ภาษาไทย)" style={{ marginTop: 12 }}>
      <Input placeholder="ชื่อ-นามสกุล (ภาษาไทย)" />
    </Form.Item>
    <Form.Item name="child2_name_en" label="ชื่อ-นามสกุล บุตรคนที่ 2 (ภาษาอังกฤษ)">
      <Input placeholder="ชื่อ-นามสกุล (ภาษาอังกฤษ)" />
    </Form.Item>
    <Form.Item name="child2_dob" label="วัน เดือน ปีเกิด">
      <DatePicker format="DD/MM/YYYY" placeholder="เลือกวันที่" style={{ width: '100%' }} />
    </Form.Item>
  </>
);

export default FamilyInfoStep;
