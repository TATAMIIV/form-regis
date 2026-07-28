import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Layout } from 'antd';
import { UserOutlined, LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { adminAuthService } from '../services/api';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

export const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/admin';

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      await adminAuthService.login(values.username, values.password);
      message.success('เข้าสู่ระบบสำเร็จ');
      navigate(from, { replace: true });
    } catch (err: any) {
      message.error(err.message || 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#F9F8F6' }}>
      <Header style={{ padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#4B5563' }}>
        <Title level={4} style={{ color: '#F9F8F6', margin: 0, fontWeight: 'normal' }}>
          ระบบจัดการหลังบ้าน
        </Title>
      </Header>

      <Content style={{ padding: '40px 15px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Card
          bordered={false}
          style={{
            width: 420,
            maxWidth: '100%',
            borderRadius: 8,
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
            borderTop: '4px solid #4B5563',
            background: '#FFFFFF'
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 44, color: '#4B5563', marginBottom: 12 }}>
              <SafetyCertificateOutlined />
            </div>
            <Title level={3} style={{ margin: 0, color: '#1F2937', fontWeight: 600 }}>
              เข้าสู่ระบบ Admin
            </Title>
            <Text style={{ color: '#6B7280', fontSize: 14 }}>
              สำหรับเจ้าหน้าที่
            </Text>
          </div>

          <Form
            name="admin_login"
            initialValues={{ remember: true }}
            onFinish={onFinish}
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="username"
              rules={[{ required: true, message: 'กรุณากรอกชื่อผู้ใช้งาน' }]}
            >
              <Input
                prefix={<UserOutlined style={{ color: '#9CA3AF' }} />}
                placeholder="ชื่อผู้ใช้งาน (Username)"
                style={{ borderRadius: 6 }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: 'กรุณากรอกรหัสผ่าน' }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#9CA3AF' }} />}
                placeholder="รหัสผ่าน (Password)"
                style={{ borderRadius: 6 }}
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 8, marginTop: 16 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                style={{
                  height: 44,
                  borderRadius: 6,
                  background: '#4B5563',
                  borderColor: '#4B5563',
                  fontWeight: 600,
                  fontSize: 16
                }}
              >
                เข้าสู่ระบบ
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Content>
    </Layout>
  );
};

export default LoginPage;
