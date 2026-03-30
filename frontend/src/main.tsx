import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import PublicApp from './public/App';
import AdminApp from './admin/AdminApp';
import { AuthProvider } from './admin/core/context/AuthContext';
import { theme } from './core/theme/theme';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/admin/*" element={
            <AuthProvider>
              <AdminApp />
            </AuthProvider>
          } />
          <Route path="/*" element={<PublicApp />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);
