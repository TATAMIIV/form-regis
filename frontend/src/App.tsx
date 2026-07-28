import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import RegistrationPage from './pages/RegistrationPage';
import AdminDashboard from './pages/AdminDashboard';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import { ConfigProvider } from 'antd';

const App: React.FC = () => {
  return (
    <ConfigProvider
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
};

export default App;
