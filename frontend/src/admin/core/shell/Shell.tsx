import { Outlet } from 'react-router-dom';
import { Box, ReactNode } from '@mui/material';
import Sidebar from '../components/Layout/Sidebar';

interface ShellProps {
  children?: ReactNode;
}

export default function Shell({ children }: ShellProps) {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <Box
        component="main"
        sx={{
          flex: 1,
          p: 3,
          bgcolor: 'background.default',
          overflow: 'auto',
          minHeight: '100vh',
        }}
      >
        {children || <Outlet />}
      </Box>
    </Box>
  );
}
