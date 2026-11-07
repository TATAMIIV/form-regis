import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import RegistrationPage from './pages/RegistrationPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsersPage from './pages/AdminUsersPage';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import { ConfigProvider } from 'antd';
// นำเข้าโมดูลภาษาไทยสำหรับ Ant Design และ Dayjs
import thTH from 'antd/locale/th_TH';
import dayjs from 'dayjs';
import 'dayjs/locale/th';

// ตั้งค่า locale ภาษาไทยให้ Dayjs ทั้งหมดเพื่อแสดงชื่อเดือน/วัน/ปฏิทินเป็นภาษาไทย
dayjs.locale('th');

const App: React.FC = () => {
  return (
    <ConfigProvider
      locale={thTH}
      theme={{
        token: {
          colorPrimary: '#6B7280',
          colorBgBase: '#F9F8F6',
          colorTextBase: '#374151',
          borderRadius: 4,
        },
        components: {
          Card: { colorBgContainer: '#FFFFFF' },
          Layout: { headerBg: '#4B5563' }
        }
      }}
    >
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RegistrationPage />} />
          <Route path="/admin/login" element={<LoginPage />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute>
                <AdminUsersPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
};

export default App;
