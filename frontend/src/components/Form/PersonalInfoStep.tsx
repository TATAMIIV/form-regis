import React from 'react';
import { Form, Input, Select, Radio, Typography, Spin } from 'antd';
import { UserOutlined, IdcardOutlined, PhoneOutlined } from '@ant-design/icons';

const { Option } = Select;
const { Text } = Typography;

interface Props {
  isFetchingUser: boolean;
}

const PersonalInfoStep: React.FC<Props> = ({ isFetchingUser }) => (
  <>
    <div style={{ display: 'flex', gap: 10 }}>
      <Form.Item name="first_name" label="ชื่อ" rules={[{ required: true, message: 'ระบุชื่อ' }]} style={{ flex: 1 }}>
        <Input placeholder="ชื่อจริง" prefix={<UserOutlined style={{ color: '#9CA3AF' }} />} />
      </Form.Item>
      <Form.Item name="last_name" label="นามสกุล" rules={[{ required: true, message: 'ระบุนามสกุล' }]} style={{ flex: 1 }}>
        <Input placeholder="นามสกุล" />
      </Form.Item>
    </div>

    <Form.Item name="id_card" label="เลขบัตรปชช." rules={[{ required: true, message: 'ระบุเลขบัตรประชาชน' }]}>
      <Input placeholder="เลขบัตร 13 หลัก" maxLength={13} suffix={isFetchingUser ? <Spin size="small" /> : <IdcardOutlined style={{ color: '#9CA3AF' }} />} />
    </Form.Item>

    <Form.Item name="passport" label="เลข Passport" rules={[{ required: true, message: 'ระบุเลข Passport (หากไม่มีให้ใส่ "ไม่มี")' }]}>
      <Input placeholder="เลข Passport" />
    </Form.Item>

    <Form.Item name="coordinator" label="สาย/ผู้ดูแล" initialValue="เล็ก/พี่กร">
      <Input disabled />
    </Form.Item>

    <Form.Item name="phone" label="เบอร์โทรศัพท์" rules={[
      { required: true, message: 'ระบุเบอร์โทรศัพท์' },
      { len: 10, message: 'เบอร์โทรศัพท์ต้องมี 10 หลัก' },
      { pattern: /^[0-9]+$/, message: 'กรุณากรอกเฉพาะตัวเลข' }
    ]}>
      <Input placeholder="08XXXXXXXX" maxLength={10} prefix={<PhoneOutlined style={{ color: '#9CA3AF' }} />} />
    </Form.Item>

    <Form.Item name="position" label="ตำแหน่งงานหลัก" rules={[{ required: true, message: 'เลือกตำแหน่งงานหลัก' }]}>
      <Select placeholder="เลือกตำแหน่งงานหลัก">
        <Option value="ช่างแอร์">ช่างแอร์</Option>
        <Option value="ช่างโซล่าเซลล์">ช่างโซล่าเซลล์</Option>
        <Option value="ช่างปูนก่อ">ช่างปูนก่อ</Option>
        <Option value="ช่างปูนฉาบ">ช่างปูนฉาบ</Option>
        <Option value="ช่างไม้">ช่างไม้</Option>
        <Option value="ช่างเหล็ก">ช่างเหล็ก</Option>
        <Option value="ช่างเชื่อม">ช่างเชื่อม</Option>
        <Option value="ช่างไฟฟ้า">ช่างไฟฟ้า</Option>
        <Option value="ช่างประปา">ช่างประปา</Option>
        <Option value="ช่างกระเบื้อง">ช่างกระเบื้อง</Option>
      </Select>
    </Form.Item>

    <Form.Item name="position2" label="ตำแหน่งงานรอง" rules={[{ required: true, message: 'เลือกตำแหน่งงานรอง' }]}>
      <Select placeholder="เลือกตำแหน่งงานรอง">
        <Option value="ช่างแอร์">ช่างแอร์</Option>
        <Option value="ช่างโซล่าเซลล์">ช่างโซล่าเซลล์</Option>
        <Option value="ช่างปูนก่อ">ช่างปูนก่อ</Option>
        <Option value="ช่างปูนฉาบ">ช่างปูนฉาบ</Option>
        <Option value="ช่างไม้">ช่างไม้</Option>
        <Option value="ช่างเหล็ก">ช่างเหล็ก</Option>
        <Option value="ช่างเชื่อม">ช่างเชื่อม</Option>
        <Option value="ช่างไฟฟ้า">ช่างไฟฟ้า</Option>
        <Option value="ช่างประปา">ช่างประปา</Option>
        <Option value="ช่างกระเบื้อง">ช่างกระเบื้อง</Option>
      </Select>
    </Form.Item>

    <Form.Item name="exam_date_province" label="สถานที่สอบ" rules={[{ required: true, message: 'ระบุสถานที่สอบ' }]}>
      <Input placeholder="จังหวัด" />
    </Form.Item>

    <div style={{ display: 'flex', gap: 10 }}>
      <Form.Item name="shirt_size" label="ไซส์เสื้อ" rules={[{ required: true, message: 'ระบุไซส์เสื้อ' }]} style={{ flex: 1 }}>
        <Input placeholder="เช่น S, M, L" />
      </Form.Item>
      <Form.Item name="pants_size" label="ไซส์กางเกง" rules={[{ required: true, message: 'ระบุไซส์กางเกง' }]} style={{ flex: 1 }}>
        <Input placeholder="เช่น 32" />
      </Form.Item>
      <Form.Item name="shoe_size" label="ไซส์รองเท้า" rules={[{ required: true, message: 'ระบุไซส์รองเท้า' }]} style={{ flex: 1 }}>
        <Input placeholder="เช่น 42" />
      </Form.Item>
    </div>

    <Form.Item name="financial_ready" label="การเงิน" rules={[{ required: true, message: 'ระบุความพร้อมทางการเงิน' }]}>
      <Radio.Group>
        <Radio value="พร้อม">พร้อม</Radio>
        <Radio value="ไม่พร้อม">ไม่พร้อม</Radio>
      </Radio.Group>
    </Form.Item>

    <div style={{ display: 'flex', gap: 10 }}>
      <Form.Item name="height" label="ส่วนสูง (ซม.)" rules={[{ required: true, message: 'ระบุส่วนสูง' }]} style={{ flex: 1 }}>
        <Input type="number" placeholder="ซม." />
      </Form.Item>
      <Form.Item name="weight" label="น้ำหนัก (กก.)" rules={[{ required: true, message: 'ระบุน้ำหนัก' }]} style={{ flex: 1 }}>
        <Input type="number" placeholder="กก." />
      </Form.Item>
      <Form.Item name="age" label="อายุ (ปี)" rules={[{ required: true, message: 'ระบุอายุ' }]} style={{ flex: 1 }}>
        <Input type="number" placeholder="ปี" />
      </Form.Item>
    </div>

    <Form.Item name="has_driving_license" label="ใบขับขี่" rules={[{ required: true, message: 'ระบุข้อมูลใบขับขี่' }]}>
      <Radio.Group>
        <Radio value="มี">มี</Radio>
        <Radio value="ไม่มี">ไม่มี</Radio>
      </Radio.Group>
    </Form.Item>

    <Form.Item
      noStyle
      shouldUpdate={(prevValues, currentValues) => prevValues.has_driving_license !== currentValues.has_driving_license}
    >
      {({ getFieldValue }) =>
        getFieldValue('has_driving_license') === 'มี' ? (
          <Form.Item name="driving_license_years" label="จำนวนปีที่มีใบขับขี่" rules={[{ required: true, message: 'ระบุจำนวนปี' }]}>
            <Input type="number" placeholder="เช่น 2, 5" suffix="ปี" />
          </Form.Item>
        ) : null
      }
    </Form.Item>

    <Form.Item name="driving_skills" label="ทักษะการขับรถ (เลือกได้มากกว่า 1)" rules={[{ required: true, message: 'ระบุทักษะการขับรถ' }]}>
      <Select mode="multiple" placeholder="เลือกทักษะการขับรถ" allowClear>
        <Option value="รถยนต์">รถยนต์</Option>
        <Option value="รถแบคโฮ">รถแบคโฮ</Option>
        <Option value="รถไถ">รถไถ</Option>
        <Option value="รถโฟล์คลิฟท์">รถโฟล์คลิฟท์</Option>
        <Option value="รถขุดเจาะ">รถขุดเจาะ</Option>
        <Option value="รถบรรทุก">รถบรรทุก</Option>
      </Select>
    </Form.Item>

    <div style={{ marginTop: 24 }}>
      <Text strong>ผู้ติดต่อฉุกเฉิน</Text>
    </div>
    <Form.Item name="emergency_contact" label="ชื่อผู้ติดต่อฉุกเฉิน" rules={[{ required: true, message: 'ระบุชื่อผู้ติดต่อ' }]} style={{ marginTop: 12 }}>
      <Input placeholder="ชื่อ-นามสกุล" />
    </Form.Item>
    <div style={{ display: 'flex', gap: 10 }}>
      <Form.Item name="emergency_relation" label="ความสัมพันธ์" rules={[{ required: true, message: 'ระบุความสัมพันธ์' }]} style={{ flex: 1 }}>
        <Input placeholder="เช่น บิดา, มารดา, พี่ชาย" />
      </Form.Item>
      <Form.Item name="emergency_phone" label="เบอร์ติดต่อฉุกเฉิน" rules={[{ required: true, message: 'ระบุเบอร์ติดต่อฉุกเฉิน' }]} style={{ flex: 1 }}>
        <Input placeholder="08XXXXXXXX" maxLength={10} />
      </Form.Item>
    </div>
  </>
);

export default PersonalInfoStep;
