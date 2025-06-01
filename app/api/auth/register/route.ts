import { NextRequest, NextResponse } from 'next/server';

// Validation function for registration data
function validateRegistrationData(data: any) {
  const requiredFields = ['phone', 'password', 'name'];
  const missingFields = requiredFields.filter(field => !data[field]);
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }

  // Validate phone number format - updated to accept Saudi format
  const phoneRegex = /^\+966[5][0-9]{8}$/;
  if (!phoneRegex.test(data.phone)) {
    throw new Error('Invalid phone number format. Please use Saudi number format: +966XXXXXXXXX');
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
    
    // Use localhost for development, production URL for production
    const apiUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:5000' 
      : (process.env.NEXT_PUBLIC_API_URL || 'https://api.katakksa.com');
    
    console.log('Making registration request to:', `${apiUrl}/api/auth/register`);
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    const response = await fetch(`${apiUrl}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(body)
    });

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Non-JSON response received:', {
        status: response.status,
        contentType,
        url: `${apiUrl}/api/auth/register`
      });
      
      return NextResponse.json(
        { 
          message: `Server returned non-JSON response. Status: ${response.status}`,
          details: 'Please check if the backend server is running on the correct port.'
        },
        { status: 502 }
      );
    }

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