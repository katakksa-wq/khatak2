'use client';

import React from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import './driver-registration.css';

export default function DriverRegistrationLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
} 