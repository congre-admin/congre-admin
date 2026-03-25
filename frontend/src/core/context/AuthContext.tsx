import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  username: string;
  perfilId: string;
  wrapped_mk?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, code: string, authType: string) => Promise<void>;
  logout: () => void;
  validateSession: () => Promise<void>;
  setMasterKey: (mk: string) => void;
  masterKey: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL_KEY = 'congre_admin_api_url';
const SS_ID_KEY = 'congre_admin_ss_id';
const SESSION_TOKEN_KEY = 'congre_admin_session_token';
const USER_DATA_KEY = 'congre_admin_user_data';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [masterKey, setMasterKeyState] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem(USER_DATA_KEY);
    const token = localStorage.getItem(SESSION_TOKEN_KEY);
    
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const setMasterKey = (mk: string) => {
    setMasterKeyState(mk);
  };

  const login = async (username: string, code: string, authType: string) => {
    const apiUrl = localStorage.getItem(API_URL_KEY);
    if (!apiUrl) {
      throw new Error('API URL no configurada');
    }

    const response = await fetch(`${apiUrl}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'login',
        payload: { username, code, authType }
      })
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Error en el login');
    }

    localStorage.setItem(SESSION_TOKEN_KEY, data.sessionToken);
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(data.user));
    setUser(data.user);
    
    if (data.wrapped_mk) {
      setMasterKeyState(data.wrapped_mk);
    }
  };

  const logout = () => {
    localStorage.removeItem(SESSION_TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
    setUser(null);
    setMasterKeyState(null);
  };

  const validateSession = async () => {
    const token = localStorage.getItem(SESSION_TOKEN_KEY);
    if (!token) {
      setUser(null);
      return;
    }

    const apiUrl = localStorage.getItem(API_URL_KEY);
    if (!apiUrl) {
      logout();
      return;
    }

    try {
      const response = await fetch(`${apiUrl}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'validateSession',
          sessionToken: token
        })
      });

      const data = await response.json();
      
      if (!data.valid) {
        logout();
      }
    } catch {
      logout();
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      validateSession,
      setMasterKey,
      masterKey
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}