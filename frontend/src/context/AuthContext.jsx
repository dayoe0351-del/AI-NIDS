import { createContext, useContext, useState } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ainids_user')); } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem('ainids_token') || null);

  const login = async (username, password) => {
    const res = await api.post('/auth/login/', { username, password });
    const { access, user: userData } = res.data;
    setToken(access);
    setUser(userData);
    localStorage.setItem('ainids_token', access);
    localStorage.setItem('ainids_user', JSON.stringify(userData));
    return userData;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('ainids_token');
    localStorage.removeItem('ainids_user');
  };

  const can = (perm) => user?.permissions?.includes(perm) ?? false;

  return (
    <AuthContext.Provider value={{ user, token, login, logout, can }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext); // eslint-disable-line
