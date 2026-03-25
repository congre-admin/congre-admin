import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './core/context/AuthContext';
import SetupWizard from './modules/setup/views/SetupWizard';
import Login from './modules/setup/views/Login';
import Shell from './core/shell/Shell';
import Dashboard from './modules/dashboard/views/Dashboard';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <div>Cargando...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function App() {
  return (
    <Routes>
      <Route path="/setup" element={<SetupWizard />} />
      <Route path="/login" element={<Login />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <Shell />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        {/* Future modules:
        <Route path="personas" element={<PersonasModule />} />
        <Route path="admin" element={<AdminModule />} />
        */}
      </Route>
    </Routes>
  );
}

export default App;