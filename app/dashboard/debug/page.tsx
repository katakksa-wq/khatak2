'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/authService';

const DebugPage = () => {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [apiEndpoint, setApiEndpoint] = useState('/api/orders');
  const [testResult, setTestResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    // Load user and token from localStorage
    const userStr = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
      } catch (err) {
        console.error('Error parsing user data:', err);
      }
    }
    
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);
  
  const testEndpoint = async () => {
    if (!token) {
      setTestResult('No authentication token found.');
      return;
    }
    
    setLoading(true);
    setTestResult('');
    
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://api.kataakksa.com:5000';
      const url = `${baseUrl}${apiEndpoint}`;
      
      console.log('Testing endpoint:', url);
      console.log('Using token:', token.substring(0, 20) + '...');
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`
        }
      });
      
      console.log('Response status:', response.status);
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        setTestResult(JSON.stringify(data, null, 2));
      } else {
        setTestResult(`Response status: ${response.status}, Content-Type: ${contentType}`);
      }
    } catch (err) {
      console.error('Error testing endpoint:', err);
      setTestResult(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };
  
  const testCreateOrder = async () => {
    if (!token) {
      setTestResult('No authentication token found.');
      return;
    }
    
    setLoading(true);
    setTestResult('');
    
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://api.kataakksa.com:5000';
      const url = `${baseUrl}/api/orders`;
      
      console.log('Testing create order endpoint:', url);
      
      // Sample order data
      const orderData = {
        pickupAddress: {
          street: '123 Test St',
          city: 'Testville',
          state: 'TS',
          zipCode: '12345',
          country: 'USA'
        },
        deliveryAddress: {
          street: '456 Sample Ave',
          city: 'Exampletown',
          state: 'EX',
          zipCode: '67890',
          country: 'USA'
        },
        packageDetails: {
          weight: '5',
          dimensions: '10x10x10',
          description: 'Test package for debugging'
        }
      };
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
      });
      
      console.log('Response status:', response.status);
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        setTestResult(JSON.stringify(data, null, 2));
      } else {
        setTestResult(`Response status: ${response.status}, Content-Type: ${contentType}`);
      }
    } catch (err) {
      console.error('Error testing create order:', err);
      setTestResult(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">API Debug Page</h1>
      
      <div className="bg-gray-100 p-4 rounded mb-4">
        <h2 className="text-lg font-semibold mb-2">Authentication</h2>
        <div>
          <p><strong>User:</strong> {user ? JSON.stringify(user, null, 2) : 'Not logged in'}</p>
          <p><strong>Token:</strong> {token ? `${token.substring(0, 15)}...` : 'No token'}</p>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded shadow mb-4">
        <h2 className="text-lg font-semibold mb-2">Test API Endpoint</h2>
        <div className="flex mb-4">
          <input
            type="text"
            value={apiEndpoint}
            onChange={(e) => setApiEndpoint(e.target.value)}
            className="flex-grow p-2 border rounded mr-2"
            placeholder="/api/orders"
          />
          <button
            onClick={testEndpoint}
            className="bg-blue-500 text-white px-4 py-2 rounded"
            disabled={loading}
          >
            {loading ? 'Testing...' : 'Test GET'}
          </button>
        </div>
        
        <div className="flex space-x-2 mb-4">
          <button
            onClick={testCreateOrder}
            className="bg-green-500 text-white px-4 py-2 rounded"
            disabled={loading}
          >
            {loading ? 'Testing...' : 'Test Create Order'}
          </button>
          
          <button
            onClick={() => setApiEndpoint('/api/debug')}
            className="bg-purple-500 text-white px-4 py-2 rounded"
          >
            Set Debug Endpoint
          </button>
          
          <button
            onClick={() => setApiEndpoint('/api/debug/orders')}
            className="bg-indigo-500 text-white px-4 py-2 rounded"
          >
            Set Orders Debug
          </button>
        </div>
      </div>
      
      {testResult && (
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Result</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
            {testResult}
          </pre>
        </div>
      )}
    </div>
  );
};

export default DebugPage; 