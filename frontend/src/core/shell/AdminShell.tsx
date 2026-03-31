import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';
import Sidebar from '../components/Layout/Sidebar';
import Navbar from '../components/Layout/Navbar';

export default function AdminShell() {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar isAdmin />
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Navbar isAdmin />
        <Box
          component="main"
          sx={{
            flex: 1,
            p: 3,
            bgcolor: 'background.default',
            overflow: 'auto'
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
