import { Outlet } from 'react-router-dom';
import { Box, ReactNode } from '@mui/material';
import Sidebar from '../components/Layout/Sidebar';
import Navbar from '../components/Layout/Navbar';

interface ShellProps {
  children?: ReactNode;
}

export default function Shell({ children }: ShellProps) {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <Box
          component="main"
          sx={{
            flex: 1,
            p: 3,
            bgcolor: 'background.default',
            overflow: 'auto'
          }}
        >
          {children || <Outlet />}
        </Box>
      </Box>
    </Box>
  );
}