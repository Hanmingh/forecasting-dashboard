import React, { useState, useEffect, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { ACCESS_TOKEN } from './constants';

interface ProtectedRouteProps {
  children: ReactNode;
}

interface JwtPayload {
  exp: number;
  [key: string]: unknown;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [status, setStatus] = useState<'loading' | 'authorized' | 'unauthorized'>('loading');

  useEffect(() => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (!token) {
      setStatus('unauthorized');
      return;
    }
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      if (decoded.exp * 1000 < Date.now()) {
        setStatus('unauthorized');
      } else {
        setStatus('authorized');
      }
    } catch {
      setStatus('unauthorized');
    }
  }, []);

  if (status === 'loading') {
    return <div>Loading...</div>;
  }
  if (status === 'unauthorized') {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export default ProtectedRoute;