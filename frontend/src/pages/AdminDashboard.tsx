import React, { useEffect, useState } from 'react';
import { Layout, Typography, Table, Button, Modal, message, Card, Space } from 'antd';
import { EyeOutlined, MessageOutlined } from '@ant-design/icons';
import { applicantService } from '../services/api';
import type { ApplicantData } from '../types/applicant';
import ReviewStep from '../components/Form/ReviewStep';

const { Header, Content } = Layout;
const { Title } = Typography;

const AdminDashboard: React.FC = () => {
  const [applicants, setApplicants] = useState<ApplicantData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState<ApplicantData | null>(null);
  const [sendingLineMap, setSendingLineMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchApplicants();
  }, []);

  const fetchApplicants = async () => {
    try {
      setLoading(true);
      const data = await applicantService.getAllApplicants();
      setApplicants(data);
    } catch (error) {
      message.error('ไม่สามารถดึงข้อมูลผู้สมัครได้');
    } finally {
      setLoading(false);
    }
  };

  const showDetails = (record: ApplicantData) => {
    // Transform arrays back if needed, but since it's from DB, skills might be a string.
    // Let's create a display copy
    const displayRecord = { ...record };
    if (typeof displayRecord.driving_skills === 'string') {
      displayRecord.driving_skills = displayRecord.driving_skills.split(', ');
    }
    setSelectedApplicant(displayRecord);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedApplicant(null);
  };

  const handleSendToLine = async (record: ApplicantData) => {
    try {
      setSendingLineMap(prev => ({ ...prev, [record.id_card]: true }));
      await applicantService.sendToLine(record.id_card);
      message.success(`ส่งข้อมูลของ ${record.first_name} เข้า Line สำเร็จ!`);
    } catch (error: any) {
      message.error(error.message || 'เกิดข้อผิดพลาดในการส่งข้อมูลเข้า Line');
    } finally {
      setSendingLineMap(prev => ({ ...prev, [record.id_card]: false }));
    }
  };

  const columns = [
    {
      title: 'เลขบัตรประชาชน',
      dataIndex: 'id_card',
      key: 'id_card',
      width: 150,
    },
    {
      title: 'ชื่อ-นามสกุล',
      key: 'name',
      render: (_: any, record: ApplicantData) => `${record.first_name} ${record.last_name}`,
    },
    {
      title: 'เบอร์โทรศัพท์',
      dataIndex: 'phone',
      key: 'phone',
      width: 120,
    },
    {
      title: 'ตำแหน่งงานหลัก',
      dataIndex: 'position',
      key: 'position',
    },
    {
      title: 'สถานที่สอบ',
      dataIndex: 'exam_date_province',
      key: 'exam_date_province',
    },
    {
      title: 'จัดการ',
      key: 'action',
      width: 250,
      render: (_: any, record: ApplicantData) => (
        <Space>
          <Button 
            type="primary" 
            icon={<EyeOutlined />} 
            onClick={() => showDetails(record)}
            size="small"
          >
            ดูข้อมูลเต็ม
          </Button>
          <Button 
            type="default" 
            icon={<MessageOutlined />} 
            onClick={() => handleSendToLine(record)}
            size="small"
            loading={sendingLineMap[record.id_card]}
            style={{ color: '#00B900', borderColor: '#00B900' }}
          >
            ส่งเข้า Line
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Title level={4} style={{ color: '#F9F8F6', margin: 0, fontWeight: 'normal' }}>
          ระบบจัดการข้อมูลผู้สมัคร
        </Title>
      </Header>
      
      <Content style={{ padding: '24px' }}>
        <Card title="รายชื่อผู้สมัครทั้งหมด" bordered={false} style={{ boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <Table 
            columns={columns} 
            dataSource={applicants} 
            rowKey="id_card" 
            loading={loading}
            scroll={{ x: 800 }}
            pagination={{ pageSize: 10 }}
          />
        </Card>
      </Content>

      <Modal
        title="รายละเอียดผู้สมัคร (ข้อมูลทั้งหมด)"
        open={isModalVisible}
        onCancel={handleCloseModal}
        footer={[
          <Button key="close" onClick={handleCloseModal}>
            ปิด
          </Button>
        ]}
        width={800}
      >
        {selectedApplicant && <ReviewStep formData={selectedApplicant} />}
      </Modal>
    </Layout>
  );
};

export default AdminDashboard;
