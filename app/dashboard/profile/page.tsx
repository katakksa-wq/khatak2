'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaUser, FaEnvelope, FaPhone, FaEdit, FaSave } from 'react-icons/fa';
import { apiClient } from '@/utils/apiClient';
import { authService } from '@/services/authService';
import { User } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ProfilePage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  useEffect(() => {
    const userData = authService.getUser();
    if (!userData) {
      router.push('/login');
      return;
    }

    setUser(userData);
    setFormData({
      name: userData.name,
      email: userData.email,
      phone: userData.phone
    });
    setLoading(false);
  }, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');

      const response = await apiClient.patch<{ data: User }>(`/api/users/${user.id}`, formData);

      if (response.status === 'success' && response.data) {
        // Update local storage with new user data
        const updatedUser = {
          ...user,
          ...response.data.data
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setSuccessMessage(t('profile.updateSuccess'));
        setIsEditing(false);
      } else {
        throw new Error(response.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="mb-0">{t('user.profile')}</h2>
                <button
                  className="btn btn-outline-primary"
                  onClick={() => setIsEditing(!isEditing)}
                  disabled={loading}
                >
                  {isEditing ? (
                    <>
                      <FaSave className="me-2" />
                      {t('button.cancel')}
                    </>
                  ) : (
                    <>
                      <FaEdit className="me-2" />
                      {t('profile.editProfile')}
                    </>
                  )}
                </button>
              </div>

              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              {successMessage && (
                <div className="alert alert-success" role="alert">
                  {successMessage}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="name" className="form-label">{t('auth.name')}</label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <FaUser />
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      required
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="email" className="form-label">{t('auth.email')}</label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <FaEnvelope />
                    </span>
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      required
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="phone" className="form-label">{t('auth.phone')}</label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <FaPhone />
                    </span>
                    <input
                      type="tel"
                      className="form-control"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      required
                    />
                  </div>
                </div>

                {isEditing && (
                  <div className="d-grid">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          {t('profile.saving')}
                        </>
                      ) : (
                        <>
                          <FaSave className="me-2" />
                          {t('button.save')}
                        </>
                      )}
                    </button>
                  </div>
                )}
              </form>

              <div className="mt-4">
                <h5>Account Information</h5>
                <div className="table-responsive">
                  <table className="table table-borderless">
                    <tbody>
                      <tr>
                        <th style={{ width: '150px' }}>Role</th>
                        <td>
                          <span className="badge bg-primary">
                            {user?.role}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <th>Member Since</th>
                        <td>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</td>
                      </tr>
                      <tr>
                        <th>Status</th>
                        <td>
                          <span className={`badge bg-${user?.isConfirmed ? 'success' : 'warning'}`}>
                            {user?.isConfirmed ? 'Verified' : 'Pending Verification'}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 