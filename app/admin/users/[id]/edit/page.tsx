'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaUserTag, FaSave, FaArrowLeft } from 'react-icons/fa';
import { apiClient } from '@/utils/apiClient';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'react-toastify';
import Link from 'next/link';

interface UserFormData {
  name: string;
  email: string;
  phone: string;
  role: 'ADMIN' | 'CLIENT' | 'DRIVER';
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

export default function EditUserPage() {
  const { id } = useParams();
  const router = useRouter();
  const { t } = useLanguage();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    phone: '',
    role: 'CLIENT',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    }
  });
  
  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError('');
        
        const response = await apiClient.get(`/api/admin/users/${id}`);
        
        if (response.status === 'success' && response.data) {
          // Properly type the userData
          const userData = response.data as {
            id: string;
            name?: string;
            email?: string;
            phone?: string;
            phoneNumber?: string;
            role?: 'ADMIN' | 'CLIENT' | 'DRIVER';
            address?: {
              street?: string;
              city?: string;
              state?: string;
              zipCode?: string;
              country?: string;
            };
          };
          
          setFormData({
            name: userData.name || '',
            email: userData.email || '',
            phone: userData.phone || userData.phoneNumber || '',
            role: userData.role || 'CLIENT',
            address: {
              street: userData.address?.street || '',
              city: userData.address?.city || '',
              state: userData.address?.state || '',
              zipCode: userData.address?.zipCode || '',
              country: userData.address?.country || '',
            }
          });
        } else {
          throw new Error(response.message || 'Failed to fetch user data');
        }
      } catch (err: any) {
        console.error('Error fetching user:', err);
        setError(err.message || 'Failed to fetch user data');
        toast.error(err.message || 'Failed to fetch user data');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchUserData();
    }
  }, [id]);
  
  // Handle form field changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('address.')) {
      // Handle address fields
      const addressField = name.split('.')[1];
      setFormData({
        ...formData,
        address: {
          ...formData.address,
          [addressField]: value
        }
      });
    } else {
      // Handle regular fields
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError('');
      
      // Validation
      if (!formData.name.trim()) {
        throw new Error(t('admin.users.fieldRequired'));
      }
      
      if (!formData.email.trim()) {
        throw new Error(t('admin.users.fieldRequired'));
      }
      
      if (!formData.phone.trim()) {
        throw new Error(t('admin.users.fieldRequired'));
      }
      
      // Call API to update user
      const response = await apiClient.put(`/api/admin/users/${id}`, formData);
      
      if (response.status === 'success') {
        toast.success(t('admin.users.userUpdated'));
        router.push('/admin/users');
      } else {
        throw new Error(response.message || t('admin.users.updateFailed'));
      }
    } catch (err: any) {
      console.error('Error updating user:', err);
      setError(err.message || t('admin.users.updateFailed'));
      toast.error(err.message || t('admin.users.updateFailed'));
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <div className="container py-5">
        <div className="d-flex justify-content-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">{t('button.loading')}</span>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">{t('admin.users.editUser')}</h1>
        <Link href="/admin/users" className="btn btn-outline-secondary">
          <FaArrowLeft className="me-2" /> {t('button.back')}
        </Link>
      </div>
      
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row mb-3">
              <div className="col-md-6">
                <label htmlFor="name" className="form-label">{t('admin.users.name')}</label>
                <div className="input-group">
                  <span className="input-group-text">
                    <FaUser />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    id="name"
                    name="name"
                    placeholder={t('admin.users.name')}
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              <div className="col-md-6">
                <label htmlFor="email" className="form-label">{t('admin.users.email')}</label>
                <div className="input-group">
                  <span className="input-group-text">
                    <FaEnvelope />
                  </span>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    name="email"
                    placeholder={t('admin.users.email')}
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            </div>
            
            <div className="row mb-3">
              <div className="col-md-6">
                <label htmlFor="phone" className="form-label">{t('admin.users.phone')}</label>
                <div className="input-group">
                  <span className="input-group-text">
                    <FaPhone />
                  </span>
                  <input
                    type="tel"
                    className="form-control"
                    id="phone"
                    name="phone"
                    placeholder={t('admin.users.phone')}
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              <div className="col-md-6">
                <label htmlFor="role" className="form-label">{t('admin.users.role')}</label>
                <div className="input-group">
                  <span className="input-group-text">
                    <FaUserTag />
                  </span>
                  <select
                    className="form-select"
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                  >
                    <option value="CLIENT">{t('admin.users.roleClient')}</option>
                    <option value="DRIVER">{t('admin.users.roleDriver')}</option>
                    <option value="ADMIN">{t('admin.users.roleAdmin')}</option>
                  </select>
                </div>
              </div>
            </div>
            
            <h5 className="mt-4 mb-3">{t('admin.users.addressInfo')}</h5>
            
            <div className="mb-3">
              <label htmlFor="address.street" className="form-label">{t('admin.users.streetAddress')}</label>
              <div className="input-group">
                <span className="input-group-text">
                  <FaMapMarkerAlt />
                </span>
                <input
                  type="text"
                  className="form-control"
                  id="address.street"
                  name="address.street"
                  placeholder={t('admin.users.streetAddress')}
                  value={formData.address.street}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            <div className="row mb-3">
              <div className="col-md-6">
                <label htmlFor="address.city" className="form-label">{t('admin.users.city')}</label>
                <input
                  type="text"
                  className="form-control"
                  id="address.city"
                  name="address.city"
                  placeholder={t('admin.users.city')}
                  value={formData.address.city}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="col-md-6">
                <label htmlFor="address.state" className="form-label">{t('admin.users.state')}</label>
                <input
                  type="text"
                  className="form-control"
                  id="address.state"
                  name="address.state"
                  placeholder={t('admin.users.state')}
                  value={formData.address.state}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            <div className="row mb-3">
              <div className="col-md-6">
                <label htmlFor="address.zipCode" className="form-label">{t('admin.users.zipCode')}</label>
                <input
                  type="text"
                  className="form-control"
                  id="address.zipCode"
                  name="address.zipCode"
                  placeholder={t('admin.users.zipCode')}
                  value={formData.address.zipCode}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="col-md-6">
                <label htmlFor="address.country" className="form-label">{t('admin.users.country')}</label>
                <input
                  type="text"
                  className="form-control"
                  id="address.country"
                  name="address.country"
                  placeholder={t('admin.users.country')}
                  value={formData.address.country}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            <div className="d-flex justify-content-end mt-4">
              <button
                type="button"
                className="btn btn-outline-secondary me-2"
                onClick={() => router.push('/admin/users')}
              >
                {t('button.cancel')}
              </button>
              
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    {t('button.saving')}
                  </>
                ) : (
                  <>
                    <FaSave className="me-2" /> {t('admin.users.saveChanges')}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 