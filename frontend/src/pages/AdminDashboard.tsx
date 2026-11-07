import React, { useEffect, useState, useMemo } from 'react';
import { Layout, Typography, Table, Button, Modal, message, Card, Space, Row, Col, Progress, Input, Segmented, DatePicker, Tag, Tooltip, Pagination } from 'antd';
import { EyeOutlined, MessageOutlined, CheckCircleOutlined, SearchOutlined, EditOutlined, LogoutOutlined, CopyOutlined, ReloadOutlined, DownloadOutlined, TeamOutlined } from '@ant-design/icons';
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

  // Pagination state (10, 20, 50, 100 รายการต่อหน้า) จัดการให้เปลี่ยนจำนวนต่อหน้าได้จริง
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // เมื่อเงื่อนไข Filter เปลี่ยน ให้รีเซ็ตกลับหน้า 1 เสมอ
  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, timeFilter, dateRange, lineStatusFilter]);

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

  const fetchApplicants = async (forceRefresh = false) => {
    try {
      setLoading(true);
      const data = await applicantService.getAllApplicants(forceRefresh);
      setApplicants(data);
      if (forceRefresh) {
        message.success('รีเฟรชข้อมูลล่าสุดเรียบร้อยแล้ว');
      }
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
สถานที่สอบ: ${record.exam_date_province || '-'}
วันที่สอบ: ${record.exam_date || 'ไม่ระบุ'}
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

  // ฟังก์ชันส่งออกไฟล์ CSV พร้อม UTF-8 BOM สำหรับเปิดใน Excel ภาษาไทยไม่เพี้ยน
  const handleExportCSV = () => {
    if (filteredApplicants.length === 0) {
      message.warning('ไม่มีข้อมูลผู้สมัครที่ตรงกับเงื่อนไขให้ส่งออก');
      return;
    }

    const escapeCsv = (val: any): string => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const headers = [
      'วันที่สมัคร',
      'เลขประจำตัวประชาชน',
      'คำนำหน้า',
      'ชื่อ',
      'นามสกุล',
      'เบอร์โทรศัพท์',
      'ตำแหน่งหลัก',
      'ตำแหน่งรอง',
      'สถานที่สอบ',
      'วันที่สอบ',
      'สถานะ LINE',
      'เวลาที่ส่ง LINE',
      'ผู้ประสานงาน',
      'พาสปอร์ต',
      'ไซส์เสื้อ',
      'ไซส์กางเกง',
      'ไซส์รองเท้า',
      'ความพร้อมทางการเงิน',
      'ส่วนสูง (ซม.)',
      'น้ำหนัก (กก.)',
      'อายุ (ปี)',
      'ใบขับขี่',
      'อายุใบขับขี่ (ปี)',
      'ทักษะการขับขี่',
      'บุคคลติดต่อฉุกเฉิน',
      'ความสัมพันธ์',
      'เบอร์โทรฉุกเฉิน',
      'สถานภาพสมรส',
    ];

    const rows = filteredApplicants.map(a => [
      a.created_at ? dayjs(a.created_at).format('DD/MM/YYYY HH:mm') : '-',
      `'${a.id_card || ''}`, // ใส่เครื่องหมาย ' นำหน้าเพื่อให้ Excel มองเป็น Text ป้องกันตัวเลขกลายเป็น Scientific notation
      a.prefix || '',
      a.first_name || '',
      a.last_name || '',
      `'${a.phone || ''}`,
      a.position || '',
      a.position2 || '',
      a.exam_date_province || '',
      a.exam_date || '',
      a.line_sent_at ? 'ส่งแล้ว' : 'ยังไม่ส่ง',
      a.line_sent_at ? dayjs(a.line_sent_at).format('DD/MM/YYYY HH:mm') : '-',
      a.coordinator || '',
      a.passport || '',
      a.shirt_size || '',
      a.pants_size || '',
      a.shoe_size || '',
      a.financial_ready || '',
      a.height || '',
      a.weight || '',
      a.age || '',
      a.has_driving_license ? 'มี' : 'ไม่มี',
      a.driving_license_years || 0,
      Array.isArray(a.driving_skills) ? a.driving_skills.join(', ') : (a.driving_skills || ''),
      a.emergency_contact || '',
      a.emergency_relation || '',
      `'${a.emergency_phone || ''}`,
      a.marital_status || '',
    ].map(escapeCsv).join(','));

    // นำหน้าด้วย UTF-8 BOM (\uFEFF) เพื่อให้ Excel ทุกเวอร์ชันเปิดภาษาไทยได้ถูกต้อง 100%
    const csvContent = '\uFEFF' + [headers.map(escapeCsv).join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `รายชื่อผู้สมัคร_${dayjs().format('YYYYMMDD_HHmm')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    message.success(`ส่งออกข้อมูลสำเร็จ (${filteredApplicants.length} รายการ)`);
  };

  const columns = [
    {
      title: 'วันที่สมัคร',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 140,
      defaultSortOrder: 'descend' as const,
      sorter: (a: ApplicantData, b: ApplicantData) => {
        const timeA = a.created_at ? dayjs(a.created_at).valueOf() : 0;
        const timeB = b.created_at ? dayjs(b.created_at).valueOf() : 0;
        return timeA - timeB;
      },
      render: (val: string) => val ? dayjs(val).format('DD/MM/YYYY HH:mm') : '-',
    },
    {
      title: 'เลขบัตรประชาชน',
      dataIndex: 'id_card',
      key: 'id_card',
      width: 140,
    },
    {
      title: 'ชื่อ-นามสกุล',
      key: 'name',
      sorter: (a: ApplicantData, b: ApplicantData) => `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`, 'th'),
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
      sorter: (a: ApplicantData, b: ApplicantData) => (a.position || '').localeCompare(b.position || '', 'th'),
    },
    {
      title: 'สถานที่สอบ',
      dataIndex: 'exam_date_province',
      key: 'exam_date_province',
      render: (val: string) => val || '-',
    },
    {
      title: 'วันที่สอบ',
      dataIndex: 'exam_date',
      key: 'exam_date',
      sorter: (a: ApplicantData, b: ApplicantData) => (a.exam_date || '').localeCompare(b.exam_date || ''),
      render: (val: string) => val || '-',
    },
    {
      title: 'สถานะ LINE',
      key: 'line_status',
      width: 110,
      sorter: (a: ApplicantData, b: ApplicantData) => Number(!!b.line_sent_at) - Number(!!a.line_sent_at),
      render: (_: any, record: ApplicantData) => {
        const isSent = !!record.line_sent_at;
        if (isSent) {
          const sentTime = record.line_sent_at ? dayjs(record.line_sent_at).format('DD/MM/YYYY HH:mm') : '';
          return (
            <Tooltip title={`ส่งเข้า LINE เมื่อ: ${sentTime}`}>
              <Tag color="success" style={{ margin: 0, cursor: 'pointer' }}>ส่งแล้ว</Tag>
            </Tooltip>
          );
        }
        return <Tag color="warning" style={{ margin: 0 }}>ยังไม่ส่ง</Tag>;
      },
    },
    {
      title: 'จัดการ',
      key: 'action',
      width: 170,
      render: (_: any, record: ApplicantData) => {
        const isSent = !!record.line_sent_at;
        
        // Tooltip ป๊อปอัปบอกความหมายเมื่อเอาเมาส์ไปชี้แต่ละปุ่ม
        return (
          <Space size={4}>
            {/* ดูรายละเอียด */}
            <Tooltip title="ดูรายละเอียด">
              <Button 
                type="text" 
                icon={<EyeOutlined style={{ fontSize: 16 }} />} 
                onClick={() => showDetails(record)}
                size="small"
                style={{ color: '#1890ff' }}
              />
            </Tooltip>

            {/* แก้ไขข้อมูล */}
            <Tooltip title="แก้ไขข้อมูล">
              <Button 
                type="text" 
                icon={<EditOutlined style={{ fontSize: 16 }} />} 
                onClick={() => handleEdit(record)}
                size="small"
                style={{ color: '#52c41a' }}
              />
            </Tooltip>

            {/* ส่งเข้า LINE / สถานะส่งแล้ว (ปุ่ม disabled ต้องครอบ span เพื่อให้ tooltip ดัก mouse hover ได้) */}
            {isSent ? (
              <Tooltip title="ส่ง LINE แล้ว">
                <span style={{ display: 'inline-block', cursor: 'not-allowed' }}>
                  <Button 
                    type="text" 
                    icon={<CheckCircleOutlined style={{ fontSize: 16 }} />} 
                    size="small"
                    disabled
                    style={{ color: '#52c41a' }}
                  />
                </span>
              </Tooltip>
            ) : (
              <Tooltip title="ส่งเข้า LINE">
                <Button 
                  type="text" 
                  icon={<MessageOutlined style={{ fontSize: 16 }} />} 
                  onClick={() => handleSendToLine(record)}
                  size="small"
                  loading={sendingLineMap[record.id_card]}
                  style={{ color: '#00B900' }}
                />
              </Tooltip>
            )}

            {/* คัดลอกข้อความ */}
            <Tooltip title="คัดลอกข้อความ">
              <Button
                type="text"
                icon={<CopyOutlined style={{ fontSize: 16 }} />}
                onClick={() => handleCopyToLine(record)}
                size="small"
                style={{ color: '#faad14' }}
              />
            </Tooltip>
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

  // 1. สถิติยอดผู้สมัคร (วันนี้ / สัปดาห์นี้ / เดือนนี้)
  const statsCounts = useMemo(() => {
    const now = dayjs();
    let today = 0;
    let week = 0;
    let month = 0;

    applicants.forEach((a) => {
      if (!a.created_at) return;
      const d = dayjs(a.created_at);
      if (!d.isValid()) return;

      if (d.isSame(now, 'day')) today++;
      if (d.isSame(now, 'week')) week++;
      if (d.isSame(now, 'month')) month++;
    });

    return {
      today,
      week,
      month,
      total: applicants.length,
    };
  }, [applicants]);

  // 2. สถิติ 4 อันดับตำแหน่งงานหลักยอดนิยม
  const topPositions = useMemo(() => {
    const counts: Record<string, number> = {};
    applicants.forEach((a) => {
      const pos = (a.position || 'ไม่ระบุ').trim();
      if (pos) {
        counts[pos] = (counts[pos] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([position, count]) => ({
        position,
        count,
        percent: applicants.length > 0 ? Math.round((count / applicants.length) * 100) : 0,
      }));
  }, [applicants]);

  // 3. สถิติจำนวนผู้สมัครตามวันที่สอบ
  const examDateStats = useMemo(() => {
    const counts: Record<string, number> = {};
    applicants.forEach((a) => {
      const rawDate = (a.exam_date || 'ยังไม่ระบุ').trim();
      const date = rawDate || 'ยังไม่ระบุ';
      counts[date] = (counts[date] || 0) + 1;
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([examDate, count]) => ({
        examDate,
        count,
      }));
  }, [applicants]);

  // ฟังก์ชันแสดงผลการ์ดสถิติ 4 ใบในฟิลด์/แถวเดียวกันด้านบน (ย้ายจากฝั่งขวามาอยู่ด้านบนทั้งหมด)
  const renderStatsCards = () => (
    <Row gutter={[16, 16]}>
      {/* 1. โควต้าส่ง LINE (ไม่มี icon) */}
      <Col xs={24} sm={12} xl={6}>
        {lineQuota ? (
          <Card 
            bordered={true} 
            style={{ 
              borderRadius: 8,
              background: '#ffffff',
              borderColor: '#f0f0f0',
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
              height: '100%',
            }}
            styles={{ body: { padding: 16, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' } }}
          >
            <div>
              <Typography.Text type="secondary" style={{ fontSize: 13 }}>โควต้าส่ง LINE (เดือนนี้)</Typography.Text>
              <Title level={4} style={{ color: '#1f1f1f', margin: '2px 0 0 0' }}>
                {lineQuota.usage} <span style={{ fontSize: 14, fontWeight: 'normal', color: '#8c8c8c' }}>/ {lineQuota.limit === -1 ? 'ไม่จำกัด' : `${lineQuota.limit} ครั้ง`}</span>
              </Title>
            </div>
            {lineQuota.limit > 0 && (
              <div style={{ marginTop: 12 }}>
                <Progress 
                  percent={Math.round((lineQuota.usage / lineQuota.limit) * 100)} 
                  showInfo={false}
                  strokeColor="#00B900"
                  trailColor="#f5f5f5"
                  size="small"
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#8c8c8c', marginTop: 4 }}>
                  <span>ใช้ไป {Math.round((lineQuota.usage / lineQuota.limit) * 100)}%</span>
                  <span>คงเหลือ {lineQuota.limit - lineQuota.usage} ครั้ง</span>
                </div>
              </div>
            )}
          </Card>
        ) : (
          <Card bordered={true} style={{ borderRadius: 8, height: '100%' }} loading />
        )}
      </Col>

      {/* 2. สรุปยอดผู้สมัคร (วันนี้ / สัปดาห์นี้ / เดือนนี้) (ไม่มี icon/emoji) */}
      <Col xs={24} sm={12} xl={6}>
        <Card
          bordered={true}
          style={{
            borderRadius: 8,
            background: '#ffffff',
            borderColor: '#f0f0f0',
            boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
            height: '100%',
          }}
          styles={{ body: { padding: 16, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' } }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Typography.Text strong style={{ fontSize: 14, color: '#1F2937' }}>
              สรุปยอดผู้สมัคร
            </Typography.Text>
            <Tag color="blue" style={{ margin: 0 }}>ทั้งหมด {statsCounts.total} คน</Tag>
          </div>
          <Row gutter={6}>
            <Col span={8}>
              <div style={{ background: '#F0FDF4', borderRadius: 6, padding: '6px 2px', textAlign: 'center', border: '1px solid #DCFCE7' }}>
                <div style={{ fontSize: 11, color: '#166534', fontWeight: 500 }}>วันนี้</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#15803D' }}>{statsCounts.today}</div>
                <div style={{ fontSize: 10, color: '#166534' }}>คน</div>
              </div>
            </Col>
            <Col span={8}>
              <div style={{ background: '#EFF6FF', borderRadius: 6, padding: '6px 2px', textAlign: 'center', border: '1px solid #DBEAFE' }}>
                <div style={{ fontSize: 11, color: '#1E40AF', fontWeight: 500 }}>สัปดาห์นี้</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#2563EB' }}>{statsCounts.week}</div>
                <div style={{ fontSize: 10, color: '#1E40AF' }}>คน</div>
              </div>
            </Col>
            <Col span={8}>
              <div style={{ background: '#FAF5FF', borderRadius: 6, padding: '6px 2px', textAlign: 'center', border: '1px solid #F3E8FF' }}>
                <div style={{ fontSize: 11, color: '#6B21A8', fontWeight: 500 }}>เดือนนี้</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#7E22CE' }}>{statsCounts.month}</div>
                <div style={{ fontSize: 10, color: '#6B21A8' }}>คน</div>
              </div>
            </Col>
          </Row>
        </Card>
      </Col>

      {/* 3. สรุป 4 อันดับตำแหน่งงานหลักยอดนิยม (ไม่มี icon/emoji) */}
      <Col xs={24} sm={12} xl={6}>
        <Card
          bordered={true}
          style={{
            borderRadius: 8,
            background: '#ffffff',
            borderColor: '#f0f0f0',
            boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
            height: '100%',
          }}
          styles={{ body: { padding: 16 } }}
        >
          <div style={{ marginBottom: 8 }}>
            <Typography.Text strong style={{ fontSize: 14, color: '#1F2937' }}>
              4 ตำแหน่งงานหลักยอดนิยม
            </Typography.Text>
          </div>
          {topPositions.length === 0 ? (
            <div style={{ color: '#9CA3AF', fontSize: 12, textAlign: 'center', padding: '12px 0' }}>ยังไม่มีข้อมูลผู้สมัคร</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 110, overflowY: 'auto', paddingRight: 2 }}>
              {topPositions.map((item, index) => {
                const rankColors = ['#F59E0B', '#6B7280', '#B45309', '#9CA3AF'];
                return (
                  <div key={item.position}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, marginBottom: 2 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ 
                          width: 16, 
                          height: 16, 
                          borderRadius: '50%', 
                          background: rankColors[index] || '#E5E7EB', 
                          color: '#ffffff', 
                          fontSize: 10, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          fontWeight: 600
                        }}>
                          {index + 1}
                        </span>
                        <span style={{ fontWeight: 500, color: '#374151' }}>{item.position}</span>
                      </div>
                      <span style={{ fontWeight: 600, color: '#4B5563', fontSize: 11 }}>{item.count} คน</span>
                    </div>
                    <Progress 
                      percent={item.percent} 
                      size="small" 
                      strokeColor={index === 0 ? '#3B82F6' : '#9CA3AF'} 
                      trailColor="#F3F4F6"
                      showInfo={false}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </Col>

      {/* 4. สถิติตามวันที่สอบ (ไม่มี icon/emoji) */}
      <Col xs={24} sm={12} xl={6}>
        <Card
          bordered={true}
          style={{
            borderRadius: 8,
            background: '#ffffff',
            borderColor: '#f0f0f0',
            boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
            height: '100%',
          }}
          styles={{ body: { padding: 16 } }}
        >
          <div style={{ marginBottom: 8 }}>
            <Typography.Text strong style={{ fontSize: 14, color: '#1F2937' }}>
              สรุปตามวันที่สอบ
            </Typography.Text>
          </div>
          {examDateStats.length === 0 ? (
            <div style={{ color: '#9CA3AF', fontSize: 12, textAlign: 'center', padding: '12px 0' }}>ยังไม่มีข้อมูลวันที่สอบ</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 110, overflowY: 'auto', paddingRight: 2 }}>
              {examDateStats.map((item) => (
                <div 
                  key={item.examDate}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '4px 8px',
                    background: '#F9FAFB',
                    borderRadius: 6,
                    border: '1px solid #F3F4F6'
                  }}
                >
                  <span style={{ fontSize: 12, color: '#374151', display: 'flex', alignItems: 'center' }}>
                    {item.examDate}
                  </span>
                  <Tag color={item.examDate === 'ยังไม่ระบุ' ? 'default' : 'cyan'} style={{ margin: 0, fontWeight: 600, fontSize: 11 }}>
                    {item.count} คน
                  </Tag>
                </div>
              ))}
            </div>
          )}
        </Card>
      </Col>
    </Row>
  );

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
        <Space size={8}>
          <Button
            type="default"
            icon={<TeamOutlined />}
            onClick={() => navigate('/admin/users')}
            size={isMobile ? 'small' : 'middle'}
            style={{ borderRadius: 6, fontWeight: 500 }}
          >
            {isMobile ? 'Admin' : 'จัดการผู้ดูแลระบบ'}
          </Button>
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
        </Space>
      </Header>
      
      <Content style={{ padding: isMobile ? '12px' : '20px 24px' }}>
        {/* STATS CARDS AT TOP - แสดงทุกการ์ดในแถวเดียวกันด้านบน */}
        <div style={{ marginBottom: 16 }}>
          {renderStatsCards()}
        </div>

        {/* APPLICANT TABLE CARD - แสดงต่อจาก Section Card เต็มความกว้าง */}
        <Card 
          bordered={false} 
          style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)', borderRadius: 8, marginBottom: 16 }}
          styles={{ body: { padding: isMobile ? '12px' : 0 } }}
        >
              <div style={{ padding: isMobile ? '12px' : '20px 24px', borderBottom: isMobile ? 'none' : '1px solid #f0f0f0' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: isMobile ? 'flex-start' : 'center', 
                  flexDirection: isMobile ? 'column' : 'row',
                  gap: 12, 
                  marginBottom: 16 
                }}>
                  {/* ฝั่งซ้าย: จำนวนผู้สมัคร พร้อมปุ่มรีเฟรชและส่งออก Excel */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <Title level={5} style={{ margin: 0, whiteSpace: 'nowrap' }}>
                      รายชื่อผู้สมัคร ({filteredApplicants.length} คน)
                    </Title>
                    <Space size={6}>
                      <Tooltip title="ดึงข้อมูลล่าสุดจากระบบ">
                        <Button 
                          icon={<ReloadOutlined spin={loading} />} 
                          onClick={() => fetchApplicants(true)}
                          loading={loading}
                          size={isMobile ? 'small' : 'middle'}
                          style={{ borderRadius: 6 }}
                        >
                          รีเฟรช
                        </Button>
                      </Tooltip>
                      <Tooltip title="ดาวน์โหลดไฟล์ CSV สำหรับเปิดด้วย Excel ภาษาไทยไม่เพี้ยน">
                        <Button 
                          icon={<DownloadOutlined />} 
                          onClick={handleExportCSV}
                          size={isMobile ? 'small' : 'middle'}
                          style={{ borderRadius: 6, color: '#107c41', borderColor: '#107c41' }}
                        >
                          ส่งออก Excel (CSV)
                        </Button>
                      </Tooltip>
                    </Space>
                  </div>
                  
                  {/* ฝั่งขวา: รวมตัวกรองและกล่องค้นหาทั้งหมด ปรับไปอยู่ฝั่งขวาทั้งหมด */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: isMobile ? 'flex-start' : 'flex-end', 
                    alignItems: 'center', 
                    flexWrap: 'wrap', 
                    gap: 8,
                    width: isMobile ? '100%' : 'auto'
                  }}>
                    {/* ช่องค้นหา */}
                    <Input
                      placeholder="ค้นหาชื่อ, บัตร, เบอร์, ตำแหน่ง..."
                      prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                      allowClear
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      style={{ width: isMobile ? '100%' : 220, borderRadius: 6 }}
                    />

                    {/* ตัวกรองสถานะส่ง LINE */}
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

                    {/* ตัวกรองช่วงเวลา */}
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

                    {/* ช่วงวันที่แบบกำหนดเอง */}
                    {timeFilter === 'custom' && (
                      <DatePicker.RangePicker 
                        placeholder={['วันที่เริ่มต้น', 'วันที่สิ้นสุด']}
                        onChange={(dates: any) => setDateRange(dates)}
                        style={{ borderRadius: 6, width: isMobile ? '100%' : 220 }}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* DESKTOP TABLE VIEW */}
              {!isMobile ? (
                <Table 
                  columns={columns} 
                  dataSource={filteredApplicants} 
                  rowKey="id_card" 
                  loading={loading}
                  scroll={{ x: 1050 }}
                  pagination={{ 
                    current: currentPage,
                    pageSize: pageSize,
                    showSizeChanger: true,
                    pageSizeOptions: ['10', '20', '50', '100'],
                    showTotal: (total, range) => `แสดง ${range[0]}-${range[1]} จากทั้งหมด ${total} คน`,
                    onChange: (page, size) => {
                      setCurrentPage(page);
                      setPageSize(size);
                    },
                  }}
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
                    filteredApplicants
                      .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                      .map((record) => {
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
                              <div>🕒 <strong>วันที่สมัคร:</strong> {record.created_at ? dayjs(record.created_at).format('DD/MM/YYYY HH:mm') : '-'}</div>
                              <div>📞 <strong>เบอร์โทร:</strong> {record.phone || '-'}</div>
                              <div>💼 <strong>ตำแหน่ง:</strong> {record.position || '-'}</div>
                              <div>📍 <strong>สถานที่สอบ:</strong> {record.exam_date_province || '-'}</div>
                              <div>📅 <strong>วันที่สอบ:</strong> {record.exam_date || '-'}</div>
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
                  {filteredApplicants.length > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12, marginBottom: 8 }}>
                      <Pagination 
                        size="small"
                        current={currentPage}
                        pageSize={pageSize}
                        total={filteredApplicants.length}
                        showSizeChanger
                        pageSizeOptions={['10', '20', '50', '100']}
                        onChange={(page, size) => {
                          setCurrentPage(page);
                          setPageSize(size);
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
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
