import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, Organization } from '../types';

interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  isAuthenticated: boolean;
  token: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (fullName: string, email: string, orgName: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'ricoz_auth_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Restore stored session on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (data && data.user && data.organization) {
          setUser(data.user);
          setOrganization(data.organization);
          setToken(data.token || 'jwt_session_' + Date.now());
        }
      }
    } catch {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // In production, hits POST /api/v1/auth/signin
    if (!email || !password) {
      return { success: false, error: 'Email and password are required.' };
    }

    if (password.length < 6) {
      return { success: false, error: 'Invalid credentials. Password must be at least 6 characters.' };
    }

    // Lookup existing or create real session
    const existing = localStorage.getItem(AUTH_STORAGE_KEY);
    let orgId = 'org_' + Math.random().toString(36).substring(2, 10);
    let orgName = email.split('@')[1]?.split('.')[0]?.toUpperCase() || 'Enterprise Fleet';
    let apiKey = 'rcz_live_' + Math.random().toString(36).substring(2, 18);
    let fullName = email.split('@')[0].replace('.', ' ').replace(/^./, (str) => str.toUpperCase());

    if (existing) {
      try {
        const parsed = JSON.parse(existing);
        if (parsed.user?.email === email) {
          orgId = parsed.user.orgId;
          orgName = parsed.user.orgName;
          apiKey = parsed.user.apiKey;
          fullName = parsed.user.fullName;
        }
      } catch {}
    }

    const authenticatedUser: User = {
      id: 'usr_' + Math.random().toString(36).substring(2, 10),
      email,
      fullName,
      role: 'admin',
      orgId,
      orgName,
      apiKey,
      createdAt: new Date().toISOString(),
    };

    const org: Organization = {
      id: orgId,
      name: orgName,
      apiKey,
      createdAt: new Date().toISOString(),
    };

    const sessionToken = 'jwt_token_' + Math.random().toString(36).substring(2, 15);

    setUser(authenticatedUser);
    setOrganization(org);
    setToken(sessionToken);

    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({
        user: authenticatedUser,
        organization: org,
        token: sessionToken,
      })
    );

    // Set cookie for Next.js middleware simulation
    document.cookie = `ricoz_token=${sessionToken}; path=/; max-age=604800; SameSite=Lax`;

    return { success: true };
  };

  const signup = async (
    fullName: string,
    email: string,
    orgName: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    // In production, hits POST /api/v1/auth/signup
    if (!fullName || !email || !orgName || !password) {
      return { success: false, error: 'All fields are required.' };
    }

    if (password.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters with numbers and symbols.' };
    }

    const orgId = 'org_' + Math.random().toString(36).substring(2, 10);
    const apiKey = 'rcz_live_' + Array.from({ length: 24 }, () => Math.random().toString(36)[2]).join('');
    const sessionToken = 'jwt_token_' + Math.random().toString(36).substring(2, 15);

    const newUser: User = {
      id: 'usr_' + Math.random().toString(36).substring(2, 10),
      email,
      fullName,
      role: 'admin',
      orgId,
      orgName,
      apiKey,
      createdAt: new Date().toISOString(),
    };

    const newOrg: Organization = {
      id: orgId,
      name: orgName,
      apiKey,
      createdAt: new Date().toISOString(),
    };

    setUser(newUser);
    setOrganization(newOrg);
    setToken(sessionToken);

    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({
        user: newUser,
        organization: newOrg,
        token: sessionToken,
      })
    );

    // Set cookie for Next.js middleware
    document.cookie = `ricoz_token=${sessionToken}; path=/; max-age=604800; SameSite=Lax`;

    return { success: true };
  };

  const logout = () => {
    setUser(null);
    setOrganization(null);
    setToken(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    document.cookie = 'ricoz_token=; path=/; max-age=0;';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        isAuthenticated: !!user,
        token,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
