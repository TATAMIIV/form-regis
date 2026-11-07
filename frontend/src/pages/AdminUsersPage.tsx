import React, { useEffect, useState, useMemo } from 'react';
import {
  Layout,
  Typography,
  Table,
  Button,
  Modal,
  Form,
  Input,
  message,
  Card,
  Space,
  Tag,
  Tooltip,
  Popconfirm,
  Alert,
} from 'antd';
import {
  ArrowLeftOutlined,
  LogoutOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined,
  SafetyCertificateOutlined,
  LockOutlined,
  SyncOutlined,
  UserOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { adminAuthService, adminUserService } from '../services/api';
import type { AdminUser, AdminUserData, CreateAdminPayload, UpdateAdminPayload } from '../services/api';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

export const AdminUsersPage: React.FC = () => {
  const navigate = useNavigate();

  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [currentAdmin, setCurrentAdmin] = useState<AdminUserData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Search filter
  const [searchText, setSearchText] = useState<string>('');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);

  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();

  // Responsive state
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    adminAuthService.logout();
    message.info('ออกจากระบบแล้ว');
    navigate('/admin/login', { replace: true });
  };

  const fetchCurrentAdmin = async () => {
    try {
      const data = await adminAuthService.getMe();
      setCurrentAdmin(data);
    } catch {
      // Handled by ProtectedRoute
    }
  };

  const fetchAdmins = async (showSuccessMsg = false) => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const data = await adminUserService.getAllAdmins();
      setAdmins(data);
      if (showSuccessMsg) {
        message.success('รีเฟรชข้อมูลล่าสุดเรียบร้อยแล้ว');
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'UNAUTHORIZED') {
        message.error('Session หมดอายุ กรุณาเข้าสู่ระบบใหม่');
        navigate('/admin/login', { replace: true });
      } else {
        const msg = err instanceof Error ? err.message : 'ไม่สามารถดึงข้อมูลผู้ดูแลระบบได้';
        setErrorMessage(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentAdmin();
    fetchAdmins();
  }, []);

  // Filtered admins
  const filteredAdmins = useMemo(() => {
    if (!searchText.trim()) return admins;
    const term = searchText.toLowerCase().trim();
    return admins.filter(
      (a) =>
        a.username.toLowerCase().includes(term) ||
        a.name.toLowerCase().includes(term) ||
        String(a.id).includes(term)
    );
  }, [admins, searchText]);

  // Handle Create Admin
  const handleCreateAdmin = async (values: CreateAdminPayload) => {
    try {
      setActionLoading(true);
      await adminUserService.createAdmin(values);
      message.success(`สร้างผู้ดูแลระบบ "${values.username}" สำเร็จ`);
      setIsCreateModalOpen(false);
      createForm.resetFields();
      fetchAdmins();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการสร้างผู้ดูแลระบบ';
      message.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (admin: AdminUser) => {
    setEditingAdmin(admin);
    editForm.setFieldsValue({
      name: admin.name,
      password: '',
    });
    setIsEditModalOpen(true);
  };

  // Handle Update Admin
  const handleUpdateAdmin = async (values: UpdateAdminPayload) => {
    if (!editingAdmin) return;
    try {
      setActionLoading(true);
      await adminUserService.updateAdmin(editingAdmin.id, values);
      message.success(`แก้ไขข้อมูลผู้ดูแลระบบ "${editingAdmin.username}" สำเร็จ`);
      setIsEditModalOpen(false);
      setEditingAdmin(null);
      editForm.resetFields();
      fetchAdmins();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการแก้ไขข้อมูล';
      message.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Delete Admin
  const handleDeleteAdmin = async (id: number) => {
    try {
      setActionLoading(true);
      await adminUserService.deleteAdmin(id);
      message.success('ลบผู้ดูแลระบบเรียบร้อยแล้ว');
      fetchAdmins();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการลบ';
      message.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Reset 2FA
  const handleReset2FA = async (id: number, username: string) => {
    try {
      setActionLoading(true);
      const res = await adminUserService.reset2FA(id);
      message.success(res.message || `รีเซ็ต 2FA ของ ${username} สำเร็จ`);
      fetchAdmins();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการรีเซ็ต 2FA';
      message.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 70,
      sorter: (a: AdminUser, b: AdminUser) => a.id - b.id,
    },
    {
      title: 'ชื่อผู้ใช้งาน (Username)',
      dataIndex: 'username',
      key: 'username',
      width: 180,
      sorter: (a: AdminUser, b: AdminUser) => a.username.localeCompare(b.username),
      render: (val: string, record: AdminUser) => {
        const isCurrent = currentAdmin?.id === record.id;
        return (
          <Space>
            <Text strong style={{ color: '#1F2937' }}>
              {val}
            </Text>
            {isCurrent && <Tag color="blue">บัญชีของคุณ</Tag>}
          </Space>
        );
      },
    },
    {
      title: 'ชื่อ-นามสกุล',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: AdminUser, b: AdminUser) => a.name.localeCompare(b.name, 'th'),
    },
    {
      title: 'Google Authenticator (2FA)',
      dataIndex: 'totp_enabled',
      key: 'totp_enabled',
      width: 180,
      sorter: (a: AdminUser, b: AdminUser) => Number(b.totp_enabled) - Number(a.totp_enabled),
      render: (enabled: boolean) =>
        enabled ? (
          <Tag icon={<SafetyCertificateOutlined />} color="success" style={{ padding: '2px 8px' }}>
            เปิดใช้งานแล้ว
          </Tag>
        ) : (
          <Tag icon={<LockOutlined />} color="warning" style={{ padding: '2px 8px' }}>
            ยังไม่ตั้งค่า
          </Tag>
        ),
    },
    {
      title: 'วันที่สร้าง',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (val: string) => (val ? dayjs(val).format('DD/MM/YYYY HH:mm') : '-'),
    },
    {
      title: 'การจัดการ',
      key: 'actions',
      width: 160,
      render: (_: unknown, record: AdminUser) => {
        const isSelf = currentAdmin?.id === record.id;
        const isLastAdmin = admins.length <= 1;

        return (
          <Space size={6}>
            {/* Edit Button */}
            <Tooltip title="แก้ไขข้อมูล / รหัสผ่าน">
              <Button
                type="text"
                icon={<EditOutlined style={{ fontSize: 16 }} />}
                onClick={() => openEditModal(record)}
                size="small"
                style={{ color: '#1890ff' }}
                aria-label={`แก้ไข ${record.username}`}
              />
            </Tooltip>

            {/* Reset 2FA Button */}
            <Tooltip
              title={
                record.totp_enabled
                  ? 'รีเซ็ต Google Authenticator (บังคับสแกนใหม่)'
                  : 'ยังไม่ได้ตั้งค่า 2FA'
              }
            >
              <Popconfirm
                title="รีเซ็ต Google Authenticator"
                description={`คุณแน่ใจหรือไม่ว่าต้องการรีเซ็ต 2FA ของ "${record.username}"? ผู้ใช้จะต้องสแกน QR Code ใหม่เมื่อเข้าสู่ระบบ`}
                onConfirm={() => handleReset2FA(record.id, record.username)}
                okText="ยืนยันรีเซ็ต"
                cancelText="ยกเลิก"
                disabled={!record.totp_enabled || actionLoading}
              >
                <Button
                  type="text"
                  icon={<SyncOutlined style={{ fontSize: 15 }} />}
                  size="small"
                  disabled={!record.totp_enabled || actionLoading}
                  style={{ color: record.totp_enabled ? '#faad14' : '#d9d9d9' }}
                  aria-label={`รีเซ็ต 2FA ${record.username}`}
                />
              </Popconfirm>
            </Tooltip>

            {/* Delete Button */}
            <Tooltip
              title={
                isSelf
                  ? 'ไม่สามารถลบบัญชีของตนเองได้'
                  : isLastAdmin
                  ? 'ไม่สามารถลบผู้ดูแลระบบคนสุดท้ายได้'
                  : 'ลบผู้ดูแลระบบ'
              }
            >
              <span>
                <Popconfirm
                  title="ลบผู้ดูแลระบบ"
                  description={`คุณแน่ใจหรือไม่ว่าต้องการลบผู้ดูแลระบบ "${record.username}"?`}
                  onConfirm={() => handleDeleteAdmin(record.id)}
                  okText="ลบ"
                  cancelText="ยกเลิก"
                  okButtonProps={{ danger: true }}
                  disabled={isSelf || isLastAdmin || actionLoading}
                >
                  <Button
                    type="text"
                    icon={<DeleteOutlined style={{ fontSize: 16 }} />}
                    size="small"
                    danger
                    disabled={isSelf || isLastAdmin || actionLoading}
                    aria-label={`ลบ ${record.username}`}
                  />
                </Popconfirm>
              </span>
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* HEADER NAVBAR */}
      <Header
        style={{
          padding: isMobile ? '0 12px' : '0 24px',
          background: '#ffffff',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Space align="center" size={12}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/admin')}
            style={{ fontWeight: 500 }}
          >
            {isMobile ? 'กลับ' : 'กลับหน้าแดชบอร์ด'}
          </Button>
          <Title
            level={4}
            style={{
              color: '#1f1f1f',
              margin: 0,
              fontWeight: 600,
              fontSize: isMobile ? 15 : 18,
            }}
          >
            จัดการผู้ดูแลระบบ (Admin Users)
          </Title>
        </Space>

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

      {/* MAIN CONTENT */}
      <Content style={{ padding: isMobile ? '12px' : '20px 24px' }}>
        {errorMessage && (
          <Alert
            message="เกิดข้อผิดพลาด"
            description={errorMessage}
            type="error"
            showIcon
            closable
            action={
              <Button size="small" type="primary" onClick={() => fetchAdmins()}>
                ลองใหม่
              </Button>
            }
            style={{ marginBottom: 16 }}
          />
        )}

        <Card
          bordered={false}
          style={{
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            borderRadius: 8,
          }}
          styles={{ body: { padding: isMobile ? '12px' : '20px 24px' } }}
        >
          {/* TOP BAR: Search & Action Buttons */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: isMobile ? 'flex-start' : 'center',
              flexDirection: isMobile ? 'column' : 'row',
              gap: 12,
              marginBottom: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <Title level={5} style={{ margin: 0, whiteSpace: 'nowrap' }}>
                รายชื่อผู้ดูแลระบบ ({filteredAdmins.length} คน)
              </Title>
              <Tooltip title="ดึงข้อมูลล่าสุด">
                <Button
                  icon={<ReloadOutlined spin={loading} />}
                  onClick={() => fetchAdmins(true)}
                  loading={loading}
                  size={isMobile ? 'small' : 'middle'}
                  style={{ borderRadius: 6 }}
                >
                  รีเฟรช
                </Button>
              </Tooltip>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: isMobile ? '100%' : 'auto',
              }}
            >
              <Input
                placeholder="ค้นหาชื่อผู้ใช้ หรือชื่อ-นามสกุล..."
                prefix={<SearchOutlined style={{ color: '#9CA3AF' }} />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
                style={{
                  width: isMobile ? '100%' : 260,
                  borderRadius: 6,
                }}
              />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setIsCreateModalOpen(true)}
                style={{
                  borderRadius: 6,
                  background: '#4B5563',
                  borderColor: '#4B5563',
                  whiteSpace: 'nowrap',
                }}
              >
                เพิ่ม Admin
              </Button>
            </div>
          </div>

          {/* ADMINS TABLE */}
          <Table
            columns={columns}
            dataSource={filteredAdmins}
            rowKey="id"
            loading={loading}
            scroll={{ x: 750 }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50'],
              showTotal: (total) => `ทั้งหมด ${total} คน`,
            }}
          />
        </Card>
      </Content>

      {/* MODAL 1: CREATE ADMIN */}
      <Modal
        title="เพิ่มผู้ดูแลระบบคนใหม่"
        open={isCreateModalOpen}
        onCancel={() => {
          setIsCreateModalOpen(false);
          createForm.resetFields();
        }}
        footer={null}
        destroyOnClose
      >
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary" style={{ fontSize: 13 }}>
            ผู้ดูแลระบบที่สร้างใหม่ จะต้องสแกนลงทะเบียน Google Authenticator (2FA) ในการเข้าสู่ระบบครั้งแรก
          </Text>
        </div>

        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreateAdmin}
          requiredMark={false}
        >
          <Form.Item
            name="username"
            label="ชื่อผู้ใช้งาน (Username)"
            rules={[
              { required: true, message: 'กรุณากรอกชื่อผู้ใช้งาน' },
              { min: 3, message: 'ชื่อผู้ใช้งานต้องมีความยาวอย่างน้อย 3 ตัวอักษร' },
              {
                pattern: /^[a-zA-Z0-9_.-]+$/,
                message: 'อนุญาตเฉพาะตัวอักษรภาษาอังกฤษ ตัวเลข และเครื่องหมาย _ . -',
              },
            ]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#9CA3AF' }} />}
              placeholder="เช่น admin_hr"
              style={{ borderRadius: 6 }}
            />
          </Form.Item>

          <Form.Item
            name="name"
            label="ชื่อ-นามสกุล (Display Name)"
            rules={[{ required: true, message: 'กรุณากรอกชื่อ-นามสกุล' }]}
          >
            <Input placeholder="เช่น สมชาย ใจดี" style={{ borderRadius: 6 }} />
          </Form.Item>

          <Form.Item
            name="password"
            label="รหัสผ่าน (Password)"
            rules={[
              { required: true, message: 'กรุณากรอกรหัสผ่าน' },
              { min: 6, message: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร' },
            ]}
          >
            <Input.Password
              placeholder="รหัสผ่านอย่างน้อย 6 ตัวอักษร"
              style={{ borderRadius: 6 }}
            />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
            <Button
              onClick={() => {
                setIsCreateModalOpen(false);
                createForm.resetFields();
              }}
              disabled={actionLoading}
            >
              ยกเลิก
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={actionLoading}
              style={{ background: '#4B5563', borderColor: '#4B5563' }}
            >
              บันทึกสร้าง Admin
            </Button>
          </div>
        </Form>
      </Modal>

      {/* MODAL 2: EDIT ADMIN */}
      <Modal
        title={`แก้ไขข้อมูล: ${editingAdmin?.username || ''}`}
        open={isEditModalOpen}
        onCancel={() => {
          setIsEditModalOpen(false);
          setEditingAdmin(null);
          editForm.resetFields();
        }}
        footer={null}
        destroyOnClose
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleUpdateAdmin}
          requiredMark={false}
        >
          <Form.Item
            name="name"
            label="ชื่อ-นามสกุล (Display Name)"
            rules={[{ required: true, message: 'กรุณากรอกชื่อ-นามสกุล' }]}
          >
            <Input placeholder="ชื่อ-นามสกุล" style={{ borderRadius: 6 }} />
          </Form.Item>

          <Form.Item
            name="password"
            label="เปลี่ยนรหัสผ่านใหม่"
            help="เว้นว่างไว้หากไม่ต้องการเปลี่ยนรหัสผ่านเดิม"
            rules={[
              {
                validator: async (_, value) => {
                  if (value && value.length < 6) {
                    throw new Error('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
                  }
                },
              },
            ]}
          >
            <Input.Password
              placeholder="รหัสผ่านใหม่ (ไม่บังคับ)"
              style={{ borderRadius: 6 }}
            />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
            <Button
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingAdmin(null);
                editForm.resetFields();
              }}
              disabled={actionLoading}
            >
              ยกเลิก
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={actionLoading}
              style={{ background: '#4B5563', borderColor: '#4B5563' }}
            >
              บันทึกการแก้ไข
            </Button>
          </div>
        </Form>
      </Modal>
    </Layout>
  );
};

export default AdminUsersPage;

