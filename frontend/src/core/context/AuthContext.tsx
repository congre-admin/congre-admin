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
  login: (username: string, totpCode?: string, authType?: string, password?: string) => Promise<void>;
  logout: () => void;
  validateSession: () => Promise<void>;
  setMasterKey: (mk: string) => void;
  masterKey: string | null;
  wrapped_mk: string | null;
  sessionToken: string | null;
  apiUrl: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL_KEY = 'congre_admin_api_url';
const SESSION_TOKEN_KEY = 'congre_admin_session_token';
const USER_DATA_KEY = 'congre_admin_user_data';

async function fetchApi(url: string, options?: RequestInit) {
  const response = await fetch(url, {
    ...options,
    mode: 'cors',
    redirect: 'follow',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
      ...options?.headers,
    },
  });
  return response.json();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [masterKey, setMasterKeyState] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [apiUrl, setApiUrl] = useState<string | null>(null);
  const [wrapped_mk, setWrappedMk] = useState<string | null>(null);

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

  const login = async (username: string, totpCode?: string, authType?: string, password?: string) => {
    const apiUrl = localStorage.getItem(API_URL_KEY);
    if (!apiUrl) {
      throw new Error('API URL no configurada');
    }

    const payload: Record<string, string> = { username };
    if (password) payload.password = password;
    if (totpCode) payload.code = totpCode;
    if (authType) payload.authType = authType;

    const data = await fetchApi(apiUrl, {
      method: 'POST',
      body: JSON.stringify({
        action: 'login',
        payload
      })
    });
    
    if (!data.success) {
      throw new Error(data.error || 'Error en el login');
    }

    localStorage.setItem(SESSION_TOKEN_KEY, data.sessionToken);
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(data.user));
    setUser(data.user);
    setSessionToken(data.sessionToken);
    setApiUrl(apiUrl);
    
    if (data.wrapped_mk) {
      setMasterKeyState(data.wrapped_mk);
      setWrappedMk(data.wrapped_mk);
    }
  };

  const logout = () => {
    localStorage.removeItem(SESSION_TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
    setUser(null);
    setMasterKeyState(null);
    setSessionToken(null);
    setWrappedMk(null);
  };

  const validateSession = async () => {
    const token = localStorage.getItem(SESSION_TOKEN_KEY);
    if (!token) {
      setUser(null);
      return;
    }

    const storedApiUrl = localStorage.getItem(API_URL_KEY);
    if (!storedApiUrl) {
      logout();
      return;
    }

    try {
      const data = await fetchApi(storedApiUrl, {
        method: 'POST',
        body: JSON.stringify({
          action: 'validateSession',
          sessionToken: token
        })
      });
      
      if (!data.valid) {
        logout();
      } else {
        const userData = localStorage.getItem(USER_DATA_KEY);
        if (userData) {
          const parsed = JSON.parse(userData);
          setUser(parsed);
          setSessionToken(token);
          setApiUrl(storedApiUrl);
          if (parsed.wrapped_mk) {
            setMasterKeyState(parsed.wrapped_mk);
            setWrappedMk(parsed.wrapped_mk);
          }
        }
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
      masterKey,
      wrapped_mk,
      sessionToken,
      apiUrl
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