import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ainids_user')); } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem('ainids_token') || null);

  // Attach token to every request
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  const login = async (username, password) => {
    const res = await axios.post('http://localhost:8000/api/v1/auth/login/', { username, password });
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
    delete axios.defaults.headers.common['Authorization'];
  };

  const can = (perm) => user?.permissions?.includes(perm) ?? false;

  return (
    <AuthContext.Provider value={{ user, token, login, logout, can }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext); // eslint-disable-line
