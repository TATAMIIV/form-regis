import React from 'react';
import { Layout, Typography, Form, Button, Card, Steps } from 'antd';
import { useRegistration } from '../hooks/useRegistration';
import PersonalInfoStep from '../components/Form/PersonalInfoStep';
import FamilyInfoStep from '../components/Form/FamilyInfoStep';
import ReviewStep from '../components/Form/ReviewStep';
import SuccessResult from '../components/Form/SuccessResult';

const { Header, Content } = Layout;
const { Title } = Typography;

const RegistrationPage: React.FC = () => {
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

  return (
    <>
      <Layout style={{ minHeight: '100vh' }}>
        <Header style={{ padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Title level={4} style={{ color: '#F9F8F6', margin: 0, fontWeight: 'normal' }}>
            ฟอร์มสมัครงาน
          </Title>
        </Header>
        <Content style={{ padding: '20px 15px' }}>
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

                  <div style={{ marginTop: 32, display: 'flex', justifyContent: 'space-between' }}>
                    {currentStep > 0 && (
                      <Button style={{ margin: '0 8px' }} onClick={handlePrev}>
                        ย้อนกลับ
                      </Button>
                    )}
                    {currentStep < steps.length - 1 && (
                      <Button type="primary" onClick={handleNext} style={{ marginLeft: 'auto' }}>
                        ถัดไป
                      </Button>
                    )}
                    {currentStep === steps.length - 1 && (
                      <Button type="primary" onClick={handleSubmit} loading={loading} style={{ marginLeft: 'auto' }}>
                        ยืนยันการส่งข้อมูล
                      </Button>
                    )}
                  </div>
                </Form>
              </>
            )}
          </Card>
        </Content>
      </Layout>
    </>
  );
};

export default RegistrationPage;
