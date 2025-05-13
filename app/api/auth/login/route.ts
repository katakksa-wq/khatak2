import { NextRequest, NextResponse } from 'next/server';

// Sample user data for demonstration
// In a real application, this would be retrieved from a database
const USERS = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@example.com',
    phone: '+966500000000',
    password: 'admin123', // In a real app, this would be hashed
    role: 'ADMIN',
    isActive: true,
    isConfirmed: true,
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Client User',
    email: 'client@example.com',
    phone: '+966500000001',
    password: 'client123', // In a real app, this would be hashed
    role: 'CLIENT',
    isActive: true,
    isConfirmed: true,
    createdAt: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Driver User',
    email: 'driver@example.com',
    phone: '+966500000002',
    password: 'driver123', // In a real app, this would be hashed
    role: 'DRIVER',
    isActive: true,
    isConfirmed: true,
    createdAt: new Date().toISOString()
  }
];

// Helper function to generate a token
const generateToken = (userId: string, role: string): string => {
  const timestamp = Date.now();
  return `Bearer ${Buffer.from(`${userId}:${role}:${timestamp}`).toString('base64')}`;
};

// Helper function to check if a string is an email
const isEmail = (identifier: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(identifier);
};

// Helper function to check if a string is a phone number
const isPhoneNumber = (identifier: string): boolean => {
  // This is a simple check. In a real app, you'd use a more sophisticated validation
  // that matches your expected phone number format (e.g., +966XXXXXXXXX)
  const phoneRegex = /^\+?[0-9]{10,15}$/;
  return phoneRegex.test(identifier);
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.katakksa.com'}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Login failed' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 