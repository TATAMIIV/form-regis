import React, { useEffect, useState, useMemo } from 'react';
import { Layout, Typography, Table, Button, Modal, message, Card, Space, Row, Col, Progress, Input, Segmented, DatePicker } from 'antd';
import { EyeOutlined, MessageOutlined, CheckCircleOutlined, SearchOutlined, EditOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(isBetween);
import { applicantService } from '../services/api';
import type { ApplicantData } from '../types/applicant';
import ReviewStep from '../components/Form/ReviewStep';
import EditApplicantDrawer from '../components/Form/EditApplicantDrawer';

const { Header, Content } = Layout;
const { Title } = Typography;

const AdminDashboard: React.FC = () => {
  const [applicants, setApplicants] = useState<ApplicantData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState<ApplicantData | null>(null);
  const [sendingLineMap, setSendingLineMap] = useState<Record<string, boolean>>({});
  const [lineQuota, setLineQuota] = useState<{usage: number, limit: number} | null>(null);
  
  // Filters
  const [searchText, setSearchText] = useState('');
  const [timeFilter, setTimeFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [lineStatusFilter, setLineStatusFilter] = useState<string>('all');

  // Edit Drawer
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingApplicant, setEditingApplicant] = useState<ApplicantData | null>(null);

  useEffect(() => {
    fetchApplicants();
    fetchQuota();
  }, []);

  const fetchQuota = async () => {
    try {
      const data = await applicantService.getLineQuota();
      setLineQuota(data);
    } catch (error) {
      console.error('Failed to fetch LINE quota', error);
    }
  };

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

  const handleEdit = (record: ApplicantData) => {
    setEditingApplicant(record);
    setIsEditDrawerOpen(true);
  };

  const handleCloseEditDrawer = () => {
    setIsEditDrawerOpen(false);
    setEditingApplicant(null);
  };

  const handleEditSuccess = () => {
    handleCloseEditDrawer();
    fetchApplicants(); // Refresh data
  };

  const handleSendToLine = async (record: ApplicantData) => {
    try {
      setSendingLineMap(prev => ({ ...prev, [record.id_card]: true }));
      await applicantService.sendToLine(record.id_card);
      message.success(`ส่งข้อมูลของ ${record.first_name} เข้า Line สำเร็จ!`);
      // Update local state to reflect the sent status
      setApplicants(prev => prev.map(a => 
        a.id_card === record.id_card 
          ? { ...a, line_sent_at: new Date().toISOString() } 
          : a
      ));
      // Refresh quota
      fetchQuota();
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
      render: (_: any, record: ApplicantData) => {
        const isSent = !!record.line_sent_at;
        const sentTime = isSent ? new Date(record.line_sent_at!).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '';
        
        return (
          <Space>
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              onClick={() => showDetails(record)}
              size="small"
              style={{ color: '#1890ff' }}
            >
              ดู
            </Button>
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => handleEdit(record)}
              size="small"
              style={{ color: '#8c8c8c' }}
            >
              แก้ไข
            </Button>
            {isSent ? (
              <Button 
                type="text" 
                icon={<CheckCircleOutlined />} 
                size="small"
                disabled
                style={{ color: '#52c41a' }}
              >
                {sentTime}
              </Button>
            ) : (
              <Button 
                type="text" 
                icon={<MessageOutlined />} 
                onClick={() => handleSendToLine(record)}
                size="small"
                loading={sendingLineMap[record.id_card]}
                style={{ color: '#00B900' }}
              >
                ส่ง
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  const filteredApplicants = useMemo(() => {
    return applicants.filter((applicant) => {
      // 1. Text Search Filter
      const searchStr = searchText.toLowerCase();
      const matchSearch = 
        !searchText || 
        (applicant.first_name || '').toLowerCase().includes(searchStr) ||
        (applicant.last_name || '').toLowerCase().includes(searchStr) ||
        (applicant.id_card || '').toLowerCase().includes(searchStr) ||
        (applicant.phone || '').toLowerCase().includes(searchStr) ||
        (applicant.position || '').toLowerCase().includes(searchStr);

      if (!matchSearch) return false;

      // 2. Line Status Filter
      if (lineStatusFilter === 'sent' && !applicant.line_sent_at) return false;
      if (lineStatusFilter === 'unsent' && applicant.line_sent_at) return false;

      // 3. Time Filter
      if (timeFilter === 'all' || !applicant.created_at) return true;
      
      const createdDate = dayjs(applicant.created_at);
      const now = dayjs();

      switch (timeFilter) {
        case 'today':
          return createdDate.isSame(now, 'day');
        case 'week':
          return createdDate.isSame(now, 'week');
        case 'month':
          return createdDate.isSame(now, 'month');
        case 'year':
          return createdDate.isSame(now, 'year');
        case 'custom':
          if (dateRange && dateRange[0] && dateRange[1]) {
            const startUnix = dateRange[0].startOf('day').unix();
            const endUnix = dateRange[1].endOf('day').unix();
            const currentUnix = createdDate.unix();
            return currentUnix >= startUnix && currentUnix <= endUnix;
          }
          // If custom is selected but no date range is picked yet, show nothing (or show all, but showing all might confuse them)
          return false;
        default:
          return true;
      }
    });
  }, [applicants, searchText, timeFilter, dateRange, lineStatusFilter]);

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Header style={{ padding: '0 24px', background: '#ffffff', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Title level={4} style={{ color: '#1f1f1f', margin: 0, fontWeight: 600 }}>
          ระบบจัดการข้อมูลผู้สมัคร
        </Title>
      </Header>
      
      <Content style={{ padding: '24px' }}>
        <Row gutter={24}>
          <Col xs={24} lg={17}>
            <Card 
              bordered={false} 
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)', borderRadius: 8, marginBottom: 24 }}
              styles={{ body: { padding: 0 } }}
            >
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0f0f0' }}>
                <Row justify="space-between" align="middle" gutter={[16, 16]}>
                  <Col>
                    <Title level={5} style={{ margin: 0 }}>รายชื่อผู้สมัคร ({filteredApplicants.length} คน)</Title>
                  </Col>
                  <Col>
                    <Space size="middle" wrap>
                      <Segmented
                        options={[
                          { label: 'ทั้งหมด', value: 'all' },
                          { label: 'ส่งแล้ว', value: 'sent' },
                          { label: 'ยังไม่ส่ง', value: 'unsent' },
                        ]}
                        value={lineStatusFilter}
                        onChange={(val) => setLineStatusFilter(val as string)}
                      />
                      <Segmented
                        options={[
                          { label: 'ทั้งหมด', value: 'all' },
                          { label: 'วันนี้', value: 'today' },
                          { label: 'สัปดาห์นี้', value: 'week' },
                          { label: 'เดือนนี้', value: 'month' },
                          { label: 'ปีนี้', value: 'year' },
                          { label: 'กำหนดเอง', value: 'custom' },
                        ]}
                        value={timeFilter}
                        onChange={(val) => setTimeFilter(val as string)}
                      />
                      {timeFilter === 'custom' && (
                        <DatePicker.RangePicker 
                          onChange={(dates: any) => setDateRange(dates)}
                          style={{ borderRadius: 6 }}
                        />
                      )}
                      <Input
                        placeholder="ค้นหาชื่อ, บัตร, เบอร์, ตำแหน่ง..."
                        prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                        allowClear
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        style={{ width: 250, borderRadius: 6 }}
                      />
                    </Space>
                  </Col>
                </Row>
              </div>
              
              <Table 
                columns={columns} 
                dataSource={filteredApplicants} 
                rowKey="id_card" 
                loading={loading}
                scroll={{ x: 800 }}
                pagination={{ pageSize: 10 }}
                style={{ padding: '0 12px 12px 12px' }}
              />
            </Card>
          </Col>
          <Col xs={24} lg={7}>
            {lineQuota && (
              <Card 
                bordered={true} 
                style={{ 
                  borderRadius: 8,
                  background: '#ffffff',
                  borderColor: '#f0f0f0',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <Typography.Text type="secondary" style={{ fontSize: 14 }}>โควต้าส่ง LINE (เดือนนี้)</Typography.Text>
                    <Title level={3} style={{ color: '#1f1f1f', margin: '4px 0 0 0' }}>
                      {lineQuota.usage} <span style={{ fontSize: 16, fontWeight: 'normal', color: '#8c8c8c' }}>/ {lineQuota.limit === -1 ? '∞' : lineQuota.limit} ครั้ง</span>
                    </Title>
                  </div>
                  <MessageOutlined style={{ fontSize: 32, color: '#d9d9d9' }} />
                </div>
                {lineQuota.limit > 0 && (
                  <Progress 
                    percent={Math.round((lineQuota.usage / lineQuota.limit) * 100)} 
                    showInfo={false}
                    strokeColor="#8c8c8c"
                    trailColor="#f5f5f5"
                    size="small"
                    style={{ marginTop: 16 }}
                  />
                )}
              </Card>
            )}
          </Col>
        </Row>
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

      <EditApplicantDrawer
        open={isEditDrawerOpen}
        onClose={handleCloseEditDrawer}
        applicant={editingApplicant}
        onSuccess={handleEditSuccess}
      />
    </Layout>
  );
};

export default AdminDashboard;
