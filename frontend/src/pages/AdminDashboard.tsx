import React, { useEffect, useState, useMemo } from 'react';
import { Layout, Typography, Table, Button, Modal, message, Card, Space, Row, Col, Progress, Input, Segmented, DatePicker } from 'antd';
import { EyeOutlined, MessageOutlined, CheckCircleOutlined, SearchOutlined, EditOutlined, LogoutOutlined, CopyOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { useNavigate } from 'react-router-dom';

dayjs.extend(isBetween);
import { applicantService, adminAuthService } from '../services/api';
import type { ApplicantData } from '../types/applicant';
import ReviewStep from '../components/Form/ReviewStep';
import EditApplicantDrawer from '../components/Form/EditApplicantDrawer';

const { Header, Content } = Layout;
const { Title } = Typography;

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [applicants, setApplicants] = useState<ApplicantData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState<ApplicantData | null>(null);
  const [sendingLineMap, setSendingLineMap] = useState<Record<string, boolean>>({});
  const [lineQuota, setLineQuota] = useState<{usage: number, limit: number} | null>(null);

  // Logout handler
  const handleLogout = () => {
    adminAuthService.logout();
    message.info('ออกจากระบบแล้ว');
    navigate('/admin/login', { replace: true });
  };
  
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
    } catch (error: any) {
      if (error.message === 'UNAUTHORIZED') {
        message.error('Session หมดอายุ กรุณาเข้าสู่ระบบใหม่');
        navigate('/admin/login', { replace: true });
      } else {
        message.error('ไม่สามารถดึงข้อมูลผู้สมัครได้');
      }
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

  const handleCopyToLine = (record: ApplicantData) => {
    const text = `[ระบบแจ้งเตือนการรับสมัครงาน]
ได้รับข้อมูลผู้สมัครใหม่เรียบร้อยแล้ว

--- ข้อมูลส่วนบุคคล ---
ชื่อ-สกุล: ${record.first_name || ''} ${record.last_name || ''}
เลขประจำตัวประชาชน: ${record.id_card || ''}
หนังสือเดินทาง: ${record.passport || 'ไม่ระบุ'}
เบอร์โทรศัพท์: ${record.phone || ''}

--- ข้อมูลการสมัคร ---
ตำแหน่งที่สมัคร (หลัก): ${record.position || ''}
ตำแหน่งที่สมัคร (รอง): ${record.position2 || 'ไม่ระบุ'}
สถานที่สอบ: ${record.exam_date_province || ''}
ผู้ประสานงาน: ${record.coordinator || 'ไม่ระบุ'}

--- ข้อมูลทั่วไป ---
ขนาดเครื่องแต่งกาย: เสื้อ ${record.shirt_size || ''} | กางเกง ${record.pants_size || ''} | รองเท้า ${record.shoe_size || ''}
ความพร้อมทางการเงิน: ${record.financial_ready || 'ไม่ระบุ'}
ข้อมูลร่างกาย: ส่วนสูง ${record.height || ''} ซม. | น้ำหนัก ${record.weight || ''} กก. | อายุ ${record.age || ''} ปี
ใบอนุญาตขับขี่: ${record.has_driving_license ? `มี (${record.driving_license_years || 0} ปี)` : 'ไม่มี'}
ทักษะการขับขี่: ${Array.isArray(record.driving_skills) ? record.driving_skills.join(', ') : (record.driving_skills || 'ไม่ระบุ')}

--- บุคคลที่ติดต่อได้ในกรณีฉุกเฉิน ---
ชื่อ-สกุล: ${record.emergency_contact || ''} (${record.emergency_relation || ''})
เบอร์โทรศัพท์: ${record.emergency_phone || ''}

--- ข้อมูลครอบครัว ---
สถานภาพ: ${record.marital_status || ''}
บิดา: ${record.father_name_th || ''} (${record.father_name_en || ''}) (ปีเกิด: ${record.father_dob || 'ไม่ระบุ'})
มารดา: ${record.mother_name_th || ''} (${record.mother_name_en || ''}) (ปีเกิด: ${record.mother_dob || 'ไม่ระบุ'})
คู่สมรส: ${record.spouse_name_th || 'ไม่ระบุ'} (${record.spouse_name_en || 'ไม่ระบุ'}) (ปีเกิด: ${record.spouse_dob || 'ไม่ระบุ'})
บุตรลำดับที่ 1: ${record.child1_name_th || 'ไม่ระบุ'} (ปีเกิด: ${record.child1_dob || 'ไม่ระบุ'})
บุตรลำดับที่ 2: ${record.child2_name_th || 'ไม่ระบุ'} (ปีเกิด: ${record.child2_dob || 'ไม่ระบุ'})

หมายเหตุ: ท่านสามารถตรวจสอบรายละเอียดข้อมูลฉบับเต็มได้ผ่านระบบ Admin Dashboard`;

    navigator.clipboard.writeText(text)
      .then(() => message.success('คัดลอกข้อความสำเร็จ สามารถนำไปวางใน LINE ได้เลย'))
      .catch(() => message.error('คัดลอกข้อความไม่สำเร็จ'));
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
            <Button
              type="text"
              icon={<CopyOutlined />}
              onClick={() => handleCopyToLine(record)}
              size="small"
              style={{ color: '#faad14' }}
              title="คัดลอก"
            >
              คัดลอก
            </Button>
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

  // Responsive Window Size Hook
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Header style={{ padding: isMobile ? '0 12px' : '0 24px', background: '#ffffff', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Title level={4} style={{ color: '#1f1f1f', margin: 0, fontWeight: 600, fontSize: isMobile ? 15 : 18 }}>
          {isMobile ? 'HR Recruitment' : 'ระบบจัดการข้อมูลผู้สมัคร (HR Recruitment)'}
        </Title>
        <Button
          type="text"
          danger
          icon={<LogoutOutlined />}
          onClick={handleLogout}
          size={isMobile ? 'small' : 'middle'}
          style={{ fontWeight: 500 }}
        >
          {isMobile ? 'ออก' : 'ออกจากระบบ'}
        </Button>
      </Header>
      
      <Content style={{ padding: isMobile ? '12px' : '24px' }}>
        <Row gutter={[16, 16]}>
          {/* QUOTA CARD FIRST ON MOBILE */}
          {isMobile && lineQuota && (
            <Col xs={24}>
              <Card 
                bordered={true} 
                style={{ 
                  borderRadius: 8,
                  background: '#ffffff',
                  borderColor: '#f0f0f0',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                  marginBottom: 8
                }}
                styles={{ body: { padding: 12 } }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <Typography.Text type="secondary" style={{ fontSize: 13 }}>โควต้าส่ง LINE (เดือนนี้)</Typography.Text>
                    <Title level={4} style={{ color: '#1f1f1f', margin: '2px 0 0 0' }}>
                      {lineQuota.usage} <span style={{ fontSize: 14, fontWeight: 'normal', color: '#8c8c8c' }}>/ {lineQuota.limit === -1 ? '∞' : lineQuota.limit} ครั้ง</span>
                    </Title>
                  </div>
                  <MessageOutlined style={{ fontSize: 24, color: '#00B900' }} />
                </div>
              </Card>
            </Col>
          )}

          <Col xs={24} lg={17}>
            <Card 
              bordered={false} 
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)', borderRadius: 8, marginBottom: 16 }}
              styles={{ body: { padding: isMobile ? '12px' : 0 } }}
            >
              <div style={{ padding: isMobile ? '8px 0' : '20px 24px', borderBottom: isMobile ? 'none' : '1px solid #f0f0f0' }}>
                <Row justify="space-between" align="middle" gutter={[12, 12]}>
                  <Col xs={24} sm={12}>
                    <Title level={5} style={{ margin: 0 }}>รายชื่อผู้สมัคร ({filteredApplicants.length} คน)</Title>
                  </Col>
                  <Col xs={24}>
                    <Input
                      placeholder="ค้นหาชื่อ, บัตร, เบอร์, ตำแหน่ง..."
                      prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                      allowClear
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      style={{ width: '100%', borderRadius: 6, marginBottom: 12 }}
                    />
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <Segmented
                          options={[
                            { label: 'ทั้งหมด', value: 'all' },
                            { label: 'ส่งแล้ว', value: 'sent' },
                            { label: 'ยังไม่ส่ง', value: 'unsent' },
                          ]}
                          value={lineStatusFilter}
                          onChange={(val) => setLineStatusFilter(val as string)}
                          size={isMobile ? 'small' : 'middle'}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', overflowX: 'auto' }}>
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
                          size={isMobile ? 'small' : 'middle'}
                        />
                      </div>
                      {timeFilter === 'custom' && (
                        <DatePicker.RangePicker 
                          onChange={(dates: any) => setDateRange(dates)}
                          style={{ borderRadius: 6, width: '100%' }}
                        />
                      )}
                    </div>
                  </Col>
                </Row>
              </div>
              
              {/* DESKTOP TABLE VIEW */}
              {!isMobile ? (
                <Table 
                  columns={columns} 
                  dataSource={filteredApplicants} 
                  rowKey="id_card" 
                  loading={loading}
                  scroll={{ x: 800 }}
                  pagination={{ pageSize: 10 }}
                  style={{ padding: '0 12px 12px 12px' }}
                />
              ) : (
                /* MOBILE CARD LIST VIEW */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
                  {loading ? (
                    <Card loading />
                  ) : filteredApplicants.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 24, color: '#8c8c8c' }}>ไม่พบข้อมูลผู้สมัคร</div>
                  ) : (
                    filteredApplicants.map((record) => {
                      const isSent = !!record.line_sent_at;
                      const sentTime = isSent ? new Date(record.line_sent_at!).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '';
                      return (
                        <Card 
                          key={record.id_card}
                          size="small"
                          style={{ borderRadius: 8, borderColor: '#e8e8e8', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                            <div>
                              <Typography.Text strong style={{ fontSize: 16 }}>{record.first_name} {record.last_name}</Typography.Text>
                              <div style={{ fontSize: 13, color: '#666' }}>เลขบัตร: {record.id_card}</div>
                            </div>
                            <span style={{ 
                              fontSize: 12, 
                              padding: '2px 8px', 
                              borderRadius: 12, 
                              background: isSent ? '#F6FFED' : '#FFF7E6',
                              color: isSent ? '#52C41A' : '#FA8C16',
                              border: `1px solid ${isSent ? '#B7EB8F' : '#FFD591'}` 
                            }}>
                              {isSent ? `ส่งแล้ว (${sentTime})` : 'ยังไม่ส่ง LINE'}
                            </span>
                          </div>

                          <div style={{ fontSize: 13, color: '#444', marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <div>📞 <strong>เบอร์โทร:</strong> {record.phone || '-'}</div>
                            <div>💼 <strong>ตำแหน่ง:</strong> {record.position || '-'}</div>
                            <div>📍 <strong>สถานที่สอบ:</strong> {record.exam_date_province || '-'}</div>
                          </div>

                          <div style={{ display: 'flex', gap: 8, borderTop: '1px solid #f0f0f0', paddingTop: 8 }}>
                            <Button 
                              type="default" 
                              icon={<EyeOutlined />} 
                              onClick={() => showDetails(record)}
                              size="small"
                              style={{ flex: 1, borderRadius: 6, color: '#1890ff', borderColor: '#91d5ff' }}
                            >
                              ดูรายละเอียด
                            </Button>
                            <Button 
                              type="default" 
                              icon={<EditOutlined />} 
                              onClick={() => handleEdit(record)}
                              size="small"
                              style={{ flex: 1, borderRadius: 6 }}
                            >
                              แก้ไข
                            </Button>
                            {!isSent ? (
                              <Button 
                                type="primary" 
                                icon={<MessageOutlined />} 
                                onClick={() => handleSendToLine(record)}
                                size="small"
                                loading={sendingLineMap[record.id_card]}
                                style={{ flex: 1, borderRadius: 6, background: '#00B900', borderColor: '#00B900' }}
                              >
                                ส่ง LINE
                              </Button>
                            ) : (
                              <Button 
                                disabled
                                icon={<CheckCircleOutlined />} 
                                size="small"
                                style={{ flex: 1, borderRadius: 6 }}
                              >
                                ส่งแล้ว
                              </Button>
                            )}
                            <Button 
                              type="default" 
                              icon={<CopyOutlined />} 
                              onClick={() => handleCopyToLine(record)}
                              size="small"
                              style={{ flex: 1, borderRadius: 6, color: '#faad14', borderColor: '#ffe58f', background: '#fffbe6' }}
                            >
                              คัดลอก
                            </Button>
                          </div>
                        </Card>
                      );
                    })
                  )}
                </div>
              )}
            </Card>
          </Col>

          {/* DESKTOP QUOTA CARD */}
          {!isMobile && (
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
          )}
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
        style={{ maxWidth: '95vw', top: 16 }}
        styles={{ body: { padding: isMobile ? 8 : 16, maxHeight: '80vh', overflowY: 'auto' } }}
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
