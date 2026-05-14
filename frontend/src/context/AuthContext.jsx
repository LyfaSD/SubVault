import { createContext, useContext, useState, useEffect } from 'react';
import { auth as authApi } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }
    authApi.me()
      .then(({ user }) => setUser(user))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const { token, user } = await authApi.login(email, password);
    localStorage.setItem('token', token);
    setUser(user);
    return user;
  };

  const register = async (name, email, password) => {
    const { token, user } = await authApi.register(name, email, password);
    localStorage.setItem('token', token);
    setUser(user);
    return user;
  };

  const logout = () => { localStorage.removeItem('token'); setUser(null); };

  const updateBalance = (newBalance) => setUser((prev) => ({ ...prev, balance: newBalance }));

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateBalance }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
