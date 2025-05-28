import { NextRequest, NextResponse } from 'next/server';

// Validation function for registration data
function validateRegistrationData(data: any) {
  const requiredFields = ['phone', 'password', 'name'];
  const missingFields = requiredFields.filter(field => !data[field]);
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }

  // Validate phone number format
  const phoneRegex = /^\+?[0-9]{10,15}$/;
  if (!phoneRegex.test(data.phone)) {
    throw new Error('Invalid phone number format');
  }

  // Validate password length
  if (data.password.length < 6) {
    throw new Error('Password must be at least 6 characters long');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate registration data
    validateRegistrationData(body);
    
    console.log('Making registration request to:', `${process.env.NEXT_PUBLIC_API_URL || 'https://api.katakksa.com'}/api/auth/register`);
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.katakksa.com'}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    console.log('Registration response:', {
      status: response.status,
      data: data
    });

    if (!response.ok) {
      return NextResponse.json(
        { 
          message: data.message || 'Registration failed',
          details: data.details || null
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Registration error:', {
      message: error.message,
      stack: error.stack,
      body: request.body
    });
    
    return NextResponse.json(
      { 
        message: error.message || 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: error.message ? 400 : 500 }
    );
  }
} 