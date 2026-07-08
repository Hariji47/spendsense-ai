import React, { createContext, useState, useEffect } from 'react';
import { getMe, login as apiLogin, register as apiRegister } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      fetchUser();
    } else {
      localStorage.removeItem('token');
      setUser(null);
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async (currentToken) => {
    try {
      setLoading(true);
      // We can pass currentToken or let the interceptor pick it up from localStorage
      const { data } = await getMe();
      setUser(data);
    } catch (error) {
      console.error('Failed to fetch user', error);
      setToken(null);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const { data } = await apiLogin(email, password);
    localStorage.setItem('token', data.access_token);
    setToken(data.access_token);
    await fetchUser();
  };

  const register = async (email, password, fullName) => {
    const { data } = await apiRegister(email, password, fullName);
    localStorage.setItem('token', data.access_token);
    setToken(data.access_token);
    await fetchUser();
  };

  const logout = () => {
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};
