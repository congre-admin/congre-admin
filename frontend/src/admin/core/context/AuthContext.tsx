import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { initializeCacheOnLogin } from '../../../hooks/useSession';
import { dataService } from '../../../services/dataService';
import { getSys, setSys, getConfig, getSession, setSession, clearAdminConfigs } from '../../../utils/settingsCache';

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
  setSession: (sessionToken: string, user: User, wrapped_mk?: string) => void;
  masterKey: string | null;
  wrapped_mk: string | null;
  sessionToken: string | null;
  apiUrl: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

async function fetchLinkedPublicSs(apiUrl: string, adminSsId: string): Promise<string | null> {
  try {
    const url = apiUrl.includes('script.google.com') 
      ? apiUrl.endsWith('/exec') ? apiUrl : `${apiUrl}/exec`
      : `https://script.google.com/macros/s/${apiUrl}/exec`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'getData',
        ssId: adminSsId,
        payload: { sheet: 'Configuracion' }
      }),
      mode: 'cors',
      redirect: 'follow',
    });
    
    const result = await response.json();
    const rows = result.data || [];
    const linkedRow = rows.find((r: any) => r.clave === 'ss_publico');
    
    if (linkedRow && linkedRow.valor) {
      return linkedRow.valor;
    }
    return null;
  } catch (err) {
    console.warn('Failed to fetch linked public SSID:', err);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [masterKey, setMasterKeyState] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [apiUrl, setApiUrl] = useState<string | null>(null);
  const [wrapped_mk, setWrappedMk] = useState<string | null>(null);

  useEffect(() => {
    const session = getSession();
    if (session) {
      setUser(session.userData);
      setSessionToken(session.sessionToken);
      
      const adminSsId = getSys('core_ss_id');
      if (adminSsId) {
        dataService.getData<{ clave: string; valor: any }[]>('Configuracion', adminSsId)
          .then(config => {
            const cfg: Record<string, string> = {};
            config.forEach(c => {
              cfg[c.clave] = typeof c.valor === 'object' ? JSON.stringify(c.valor) : c.valor;
            });
            const { setConfigs } = require('../../../utils/settingsCache');
            setConfigs(config);
          })
          .catch(() => {});
      }
    }
    setIsLoading(false);
  }, []);

  const setMasterKey = (mk: string) => {
    setMasterKeyState(mk);
  };

  const setSessionFn = (sessionToken: string, user: User, wrapped_mk?: string) => {
    setSession(sessionToken, user);
    setUser(user);
    setSessionToken(sessionToken);
    if (wrapped_mk) {
      setMasterKeyState(wrapped_mk);
      setWrappedMk(wrapped_mk);
    }
  };

  const login = async (username: string, totpCode?: string, authType?: string, password?: string) => {
    const apiUrl = getSys('gas_url');
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

    setSession(data.sessionToken, data.user);
    setUser(data.user);
    setSessionToken(data.sessionToken);
    setApiUrl(apiUrl);
    
    if (data.wrapped_mk) {
      setMasterKeyState(data.wrapped_mk);
      setWrappedMk(data.wrapped_mk);
    }

    const existingGasUrl = getSys('gas_url');
    const existingSsCore = getSys('core_ss_id');
    if (!existingGasUrl && apiUrl) {
      setSys('gas_url', apiUrl);
    }
    if (!existingSsCore) {
      const legacySsCore = getConfig('ss_core');
      if (legacySsCore) {
        setSys('core_ss_id', legacySsCore);
      }
    }

    const adminSsId = getSys('core_ss_id') || getConfig('ss_core');
    if (adminSsId && apiUrl) {
      try {
        const linkedPublicSs = await fetchLinkedPublicSs(apiUrl, adminSsId);
        if (linkedPublicSs) {
          setSys('public_ss_id', linkedPublicSs);
        }
      } catch (err) {
        console.warn('Failed to fetch linked public SSID:', err);
      }
    }

    try {
      await dataService.refreshModuleMap();
    } catch (err) {
      console.warn('Failed to refresh module map:', err);
    }

    try {
      await initializeCacheOnLogin();
    } catch (error) {
      console.error('Failed to initialize cache:', error);
    }
  };

  const logout = async () => {
    clearAdminConfigs();
    setUser(null);
    setMasterKeyState(null);
    setSessionToken(null);
    setWrappedMk(null);
    
    const publicSsId = getSys('public_ss_id');
    if (publicSsId) {
      try {
        const config = await dataService.getData<{ clave: string; valor: any }[]>('Configuracion', publicSsId);
        const { setConfigs } = require('../../../utils/settingsCache');
        setConfigs(config);
      } catch (err) {
        console.warn('Failed to load public config on logout:', err);
      }
    }
  };

  const validateSession = async () => {
    const session = getSession();
    if (!session) {
      setUser(null);
      return;
    }

    const storedApiUrl = getSys('gas_url');
    if (!storedApiUrl) {
      logout();
      return;
    }

    try {
      const data = await fetchApi(storedApiUrl, {
        method: 'POST',
        body: JSON.stringify({
          action: 'validateSession',
          sessionToken: session.sessionToken
        })
      });
      
      if (!data.valid) {
        logout();
      } else {
        setUser(session.userData);
        setSessionToken(session.sessionToken);
        setApiUrl(storedApiUrl);
        if (session.userData.wrapped_mk) {
          setMasterKeyState(session.userData.wrapped_mk);
          setWrappedMk(session.userData.wrapped_mk);
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
      setSession: setSessionFn,
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
    return {
      isAuthenticated: false,
      isLoading: false,
      login: async () => {},
      logout: async () => {},
      session: null,
      user: null,
      masterKey: null,
      wrapped_mk: null,
      sessionToken: null,
      apiUrl: null,
      validateSession: async () => {},
      setMasterKey: () => {},
      setSession: () => {},
    };
  }
  return context;
}