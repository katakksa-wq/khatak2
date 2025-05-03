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
    // Parse the request body
    const body = await request.json();
    const { identifier, password } = body;

    // Validate required fields
    if (!identifier || !password) {
      return NextResponse.json(
        { status: 'error', message: 'Identifier and password are required' },
        { status: 400 }
      );
    }

    // Determine if identifier is an email or phone number
    let user;

    if (isEmail(identifier)) {
      // Find user by email
      user = USERS.find(u => u.email.toLowerCase() === identifier.toLowerCase());
    } else if (isPhoneNumber(identifier)) {
      // Find user by phone
      user = USERS.find(u => u.phone === identifier);
    } else {
      return NextResponse.json(
        { status: 'error', message: 'Invalid identifier format. Please provide a valid email or phone number' },
        { status: 400 }
      );
    }

    // Check if user exists and password is correct
    if (!user || user.password !== password) {
      return NextResponse.json(
        { status: 'error', message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { status: 'error', message: 'Your account is deactivated. Please contact support.' },
        { status: 403 }
      );
    }

    // Generate token
    const token = generateToken(user.id, user.role);

    // Omit password from the returned user object
    const { password: _, ...safeUser } = user;

    // Return user and token
    return NextResponse.json({
      status: 'success',
      data: {
        user: safeUser,
        token: token
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);

    return NextResponse.json(
      { status: 'error', message: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 