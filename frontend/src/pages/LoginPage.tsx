import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Layout, Alert, QRCode, Space, Divider, Tag } from 'antd';
import {
  UserOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  QrcodeOutlined,
  KeyOutlined,
  ArrowLeftOutlined,
  CopyOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { adminAuthService } from '../services/api';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

type LoginStep = 'credentials' | '2fa_setup' | '2fa_verify';

export const LoginPage: React.FC = () => {
  const [step, setStep] = useState<LoginStep>('credentials');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 2FA session data
  const [tempToken, setTempToken] = useState<string>('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [otpCode, setOtpCode] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/admin';

  // Step 1: Submit Username & Password
  const onFinishCredentials = async (values: { username: string; password: string }) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await adminAuthService.login(values.username, values.password);
      if (res.require_2fa) {
        setTempToken(res.temp_token || '');
        setUsername(res.username || values.username);
        setOtpCode('');

        if (!res.is_totp_setup) {
          // Admin needs to register Google Authenticator
          setQrCodeUrl(res.qr_code_url || '');
          setSecret(res.secret || '');
          setStep('2fa_setup');
        } else {
          // Admin already has 2FA configured
          setStep('2fa_verify');
        }
      } else if (res.token) {
        // Direct login fallback if 2FA is not required
        message.success('เข้าสู่ระบบสำเร็จ');
        navigate(from, { replace: true });
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง';
      setErrorMessage(errMsg);
      message.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: First-time 2FA Setup
  const onFinishSetup2FA = async () => {
    if (otpCode.length !== 6) {
      setErrorMessage('กรุณากรอกรหัสยืนยัน 6 หลัก');
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    try {
      await adminAuthService.setup2FA(tempToken, secret, otpCode);
      message.success('ตั้งค่าและเข้าสู่ระบบสำเร็จ');
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'รหัสยืนยันไม่ถูกต้อง หรือหมดอายุ';
      setErrorMessage(errMsg);
      message.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Returning 2FA Verification
  const onFinishVerify2FA = async () => {
    if (otpCode.length !== 6) {
      setErrorMessage('กรุณากรอกรหัสยืนยัน 6 หลัก');
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    try {
      await adminAuthService.verify2FA(tempToken, otpCode);
      message.success('เข้าสู่ระบบสำเร็จ');
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'รหัสยืนยันไม่ถูกต้อง หรือหมดอายุ';
      setErrorMessage(errMsg);
      message.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Reset to credentials step
  const handleBackToLogin = () => {
    setStep('credentials');
    setTempToken('');
    setQrCodeUrl('');
    setSecret('');
    setOtpCode('');
    setErrorMessage(null);
  };

  const handleCopySecret = async () => {
    if (secret) {
      try {
        await navigator.clipboard.writeText(secret);
        setCopied(true);
        message.success('คัดลอกรหัสลับแล้ว');
        setTimeout(() => setCopied(false), 2000);
      } catch {
        message.error('ไม่สามารถคัดลอกได้');
      }
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#F9F8F6' }}>
      <Header
        style={{
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#4B5563',
        }}
      >
        <Title level={4} style={{ color: '#F9F8F6', margin: 0, fontWeight: 'normal' }}>
          ระบบจัดการหลังบ้าน
        </Title>
      </Header>

      <Content
        style={{
          padding: '40px 15px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Card
          bordered={false}
          style={{
            width: step === '2fa_setup' ? 460 : 420,
            maxWidth: '100%',
            borderRadius: 8,
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
            borderTop: '4px solid #4B5563',
            background: '#FFFFFF',
            transition: 'all 0.3s ease',
          }}
        >
          {errorMessage && (
            <Alert
              message={errorMessage}
              type="error"
              showIcon
              closable
              onClose={() => setErrorMessage(null)}
              style={{ marginBottom: 20 }}
            />
          )}

          {/* STEP 1: Username & Password */}
          {step === 'credentials' && (
            <>
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <div style={{ fontSize: 44, color: '#4B5563', marginBottom: 12 }}>
                  <SafetyCertificateOutlined />
                </div>
                <Title level={3} style={{ margin: 0, color: '#1F2937', fontWeight: 600 }}>
                  เข้าสู่ระบบ Admin
                </Title>
                <Text style={{ color: '#6B7280', fontSize: 14 }}>สำหรับเจ้าหน้าที่</Text>
              </div>

              <Form
                name="admin_login"
                initialValues={{ remember: true }}
                onFinish={onFinishCredentials}
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
                    autoComplete="username"
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
                    autoComplete="current-password"
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
                      fontSize: 16,
                    }}
                  >
                    เข้าสู่ระบบ
                  </Button>
                </Form.Item>
              </Form>
            </>
          )}

          {/* STEP 2: First-time 2FA Setup */}
          {step === '2fa_setup' && (
            <>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 40, color: '#4B5563', marginBottom: 8 }}>
                  <QrcodeOutlined />
                </div>
                <Title level={3} style={{ margin: 0, color: '#1F2937', fontWeight: 600 }}>
                  ตั้งค่า Google Authenticator
                </Title>
                <div style={{ marginTop: 6 }}>
                  <Tag color="blue">บัญชี: {username}</Tag>
                </div>
                <Text style={{ color: '#6B7280', fontSize: 13, display: 'block', marginTop: 8 }}>
                  กรุณาสแกน QR Code ด้านล่างนี้ด้วยแอป <strong>Google Authenticator</strong> บนมือถือเพื่อเชื่อมต่อบัญชี
                </Text>
              </div>

              {/* QR Code Container */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '16px',
                  background: '#F9FAFB',
                  borderRadius: 8,
                  border: '1px solid #E5E7EB',
                  marginBottom: 16,
                }}
              >
                {qrCodeUrl ? (
                  <QRCode value={qrCodeUrl} size={180} bordered={false} />
                ) : (
                  <div style={{ height: 180, display: 'flex', alignItems: 'center' }}>
                    <Text type="secondary">กำลังสร้าง QR Code...</Text>
                  </div>
                )}
              </div>

              {/* Manual Secret Key */}
              <div style={{ marginBottom: 20, textAlign: 'center' }}>
                <Text style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 4 }}>
                  หากไม่สามารถสแกนได้ ให้กรอกรหัสลับนี้ในแอป:
                </Text>
                <Space direction="horizontal" align="center" style={{ justifyContent: 'center' }}>
                  <Text code style={{ fontSize: 14, letterSpacing: '1px' }}>
                    {secret}
                  </Text>
                  <Button
                    size="small"
                    icon={copied ? <CheckOutlined /> : <CopyOutlined />}
                    onClick={handleCopySecret}
                    aria-label="คัดลอกรหัสลับ"
                  >
                    {copied ? 'คัดลอกแล้ว' : 'คัดลอก'}
                  </Button>
                </Space>
              </div>

              <Divider style={{ margin: '16px 0' }} />

              {/* OTP Input Form */}
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <Text strong style={{ display: 'block', marginBottom: 8, color: '#374151' }}>
                  กรอกรหัสยืนยัน 6 หลักจากแอป
                </Text>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                  <Input.OTP
                    length={6}
                    value={otpCode}
                    onChange={(text) => setOtpCode(text)}
                    size="large"
                    disabled={loading}
                    autoFocus
                  />
                </div>

                <Button
                  type="primary"
                  onClick={onFinishSetup2FA}
                  loading={loading}
                  disabled={otpCode.length !== 6}
                  block
                  style={{
                    height: 44,
                    borderRadius: 6,
                    background: '#4B5563',
                    borderColor: '#4B5563',
                    fontWeight: 600,
                    fontSize: 16,
                    marginBottom: 8,
                  }}
                >
                  ยืนยันและเปิดใช้งาน 2FA
                </Button>

                <Button
                  type="link"
                  icon={<ArrowLeftOutlined />}
                  onClick={handleBackToLogin}
                  disabled={loading}
                  style={{ color: '#6B7280' }}
                >
                  ย้อนกลับไปหน้าเข้าสู่ระบบ
                </Button>
              </div>
            </>
          )}

          {/* STEP 3: Returning 2FA Verification */}
          {step === '2fa_verify' && (
            <>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ fontSize: 44, color: '#4B5563', marginBottom: 12 }}>
                  <KeyOutlined />
                </div>
                <Title level={3} style={{ margin: 0, color: '#1F2937', fontWeight: 600 }}>
                  ยืนยันตัวตนสองชั้น (2FA)
                </Title>
                <div style={{ marginTop: 6, marginBottom: 8 }}>
                  <Tag color="blue">บัญชี: {username}</Tag>
                </div>
                <Text style={{ color: '#6B7280', fontSize: 14 }}>
                  กรุณากรอกรหัส 6 หลักจากแอป <strong>Google Authenticator</strong>
                </Text>
              </div>

              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
                  <Input.OTP
                    length={6}
                    value={otpCode}
                    onChange={(text) => setOtpCode(text)}
                    size="large"
                    disabled={loading}
                    autoFocus
                  />
                </div>

                <Button
                  type="primary"
                  onClick={onFinishVerify2FA}
                  loading={loading}
                  disabled={otpCode.length !== 6}
                  block
                  style={{
                    height: 44,
                    borderRadius: 6,
                    background: '#4B5563',
                    borderColor: '#4B5563',
                    fontWeight: 600,
                    fontSize: 16,
                    marginBottom: 8,
                  }}
                >
                  เข้าสู่ระบบ
                </Button>

                <Button
                  type="link"
                  icon={<ArrowLeftOutlined />}
                  onClick={handleBackToLogin}
                  disabled={loading}
                  style={{ color: '#6B7280' }}
                >
                  เข้าสู่ระบบด้วยบัญชีอื่น
                </Button>
              </div>
            </>
          )}
        </Card>
      </Content>
    </Layout>
  );
};

export default LoginPage;
