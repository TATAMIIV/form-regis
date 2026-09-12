import React, { useState } from 'react';
import { Layout, Typography, Form, Button, Card, Steps, Modal, Space } from 'antd';
import { ExclamationCircleFilled } from '@ant-design/icons';
import { useRegistration } from '../hooks/useRegistration';
import PersonalInfoStep from '../components/Form/PersonalInfoStep';
import FamilyInfoStep from '../components/Form/FamilyInfoStep';
import ReviewStep from '../components/Form/ReviewStep';
import SuccessResult from '../components/Form/SuccessResult';

const { Header, Content, Footer } = Layout;
const { Title } = Typography;

const RegistrationPage: React.FC = () => {
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const {
    form,
    currentStep,
    formData,
    loading,
    isSuccess,
    isFetchingUser,
    handleNext,
    handlePrev,
    handleFetchUser,
    handleSubmit,
    handleReset,
    saveDraft
  } = useRegistration();

  const steps = [
    { title: 'ข้อมูลส่วนตัว' },
    { title: 'ข้อมูลครอบครัว' },
    { title: 'ยืนยันข้อมูล' },
  ];

  // ชื่อ Step ปัจจุบันสำหรับแสดงต่อท้าย Title บน Navbar
  const currentStepTitle = !isSuccess && steps[currentStep] ? ` (${steps[currentStep].title})` : '';

  return (
    <>
      <Layout style={{ minHeight: '100vh' }}>
        {/* 1. แถบ Navbar ค้างไว้ด้านบน (Sticky Navbar) พร้อมแสดงชื่อ Step ปัจจุบัน */}
        <Header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            padding: '0 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#4B5563',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          }}
        >
          <Title level={4} style={{ color: '#F9F8F6', margin: 0, fontWeight: 500, fontSize: '18px' }}>
            ฟอร์มสมัครงาน{currentStepTitle}
          </Title>
        </Header>

        {/* 2. เนื้อหาฟอร์มตรงกลาง */}
        <Content style={{ padding: '20px 15px 40px 15px' }}>
          <Card
            bordered={false}
            style={{
              maxWidth: '600px',
              margin: '0 auto',
              boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
              borderTop: '4px solid #6B7280'
            }}
          >
            {isSuccess ? (
              <SuccessResult onReset={handleReset} />
            ) : (
              <>
                <Steps
                  current={currentStep}
                  items={steps}
                  size="small"
                  labelPlacement="vertical"
                  style={{ marginBottom: 24 }}
                  responsive={false}
                />

                <Form
                  form={form}
                  layout="vertical"
                  initialValues={formData}
                  size="large"
                  onValuesChange={(changedValues) => {
                    saveDraft(changedValues);
                    if (changedValues.id_card) {
                      handleFetchUser(changedValues.id_card);
                    }
                  }}
                >
                  <div style={{ display: currentStep === 0 ? 'block' : 'none' }}>
                    <PersonalInfoStep isFetchingUser={isFetchingUser} />
                  </div>

                  <div style={{ display: currentStep === 1 ? 'block' : 'none' }}>
                    <FamilyInfoStep />
                  </div>

                  <div style={{ display: currentStep === 2 ? 'block' : 'none' }}>
                    <ReviewStep formData={formData} />
                  </div>
                </Form>
              </>
            )}
          </Card>
        </Content>

        {/* 3. แถบปุ่มควบคุมด้านล่างค้างไว้ (Sticky Footer) */}
        {!isSuccess && (
          <Footer
            style={{
              position: 'sticky',
              bottom: 0,
              zIndex: 1000,
              background: '#FFFFFF',
              borderTop: '1px solid #E5E7EB',
              boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.08)',
              padding: '12px 16px',
            }}
          >
            <div
              style={{
                maxWidth: '600px',
                margin: '0 auto',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {/* ฝั่งซ้าย: แสดงปุ่มย้อนกลับ (หรือปุ่มล้างแบบร่างถ้าเป็น Step 0) */}
              <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
                {currentStep > 0 ? (
                  <Button onClick={handlePrev}>
                    ย้อนกลับ
                  </Button>
                ) : (
                  <Button 
                    type="text" 
                    danger 
                    style={{ fontSize: 13, padding: '4px 8px' }}
                    onClick={() => setIsResetModalOpen(true)}
                  >
                    ล้างข้อมูลแบบร่าง
                  </Button>
                )}
              </div>

              {/* ฝั่งตรงกลาง: แสดงปุ่มล้างแบบร่างเฉพาะใน Step 1 (ข้อมูลครอบครัว) ตามที่ต้องการ */}
              <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                {currentStep === 1 && (
                  <Button 
                    type="text" 
                    danger 
                    style={{ fontSize: 13, padding: '4px 8px' }}
                    onClick={() => setIsResetModalOpen(true)}
                  >
                    ล้างข้อมูลแบบร่าง
                  </Button>
                )}
              </div>

              {/* ฝั่งขวา: แสดงปุ่มถัดไป หรือ ยืนยันการส่งข้อมูล */}
              <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
                {currentStep < steps.length - 1 ? (
                  <Button type="primary" onClick={handleNext}>
                    ถัดไป
                  </Button>
                ) : (
                  <Button type="primary" onClick={handleSubmit} loading={loading}>
                    ยืนยันการส่งข้อมูล
                  </Button>
                )}
              </div>
            </div>
          </Footer>
        )}

        {/* Modal ยืนยันการล้างแบบร่าง (แสดงตรงกลางหน้าจอพร้อมข้อความเตือนชัดเจน) */}
        <Modal
          title={
            <Space>
              <ExclamationCircleFilled style={{ color: '#ff4d4f' }} />
              <span>ยืนยันการล้างข้อมูลแบบร่าง</span>
            </Space>
          }
          open={isResetModalOpen}
          onCancel={() => setIsResetModalOpen(false)}
          onOk={() => {
            handleReset();
            setIsResetModalOpen(false);
          }}
          okText="ล้างข้อมูล"
          cancelText="ยกเลิก"
          okButtonProps={{ danger: true }}
          centered
        >
          <p style={{ marginTop: 12, color: '#4B5563', lineHeight: 1.6 }}>
            คุณต้องการลบข้อมูลที่กรอกค้างไว้ทั้งหมดเพื่อเริ่มใหม่ใช่หรือไม่?
            <br />
            <span style={{ fontSize: 13, color: '#ff4d4f' }}>
              * ข้อมูลทั้งหมดที่คุณเคยกรอกไว้จะถูกลบออกจากเครื่องและไม่สามารถกู้คืนได้
            </span>
          </p>
        </Modal>
      </Layout>
    </>
  );
};

export default RegistrationPage;
