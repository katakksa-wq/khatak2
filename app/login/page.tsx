'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaUser, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import TranslatedText from '@/components/TranslatedText';
import Logo from '@/components/Logo';

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();
  const { t } = useLanguage();
  const [credentials, setCredentials] = useState({
    identifier: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [id]: value
    }));
    // Clear error when user starts typing again
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError('');

    try {
      await login(credentials.identifier, credentials.password);
      // The AuthContext will handle the navigation
    } catch (err) {
      console.error('Login error:', err);
      
      // Provide more user-friendly error messages with translations
      let errorMessage = t('auth.loginFailed');
      
      if (err instanceof Error) {
        // Handle specific error messages
        if (err.message.includes('Email/phone and password are required')) {
          errorMessage = t('auth.requiredCredentials');
        } else if (err.message.includes('Invalid credentials')) {
          errorMessage = t('auth.invalidCredentials');
        } else if (err.message.includes('deactivated')) {
          errorMessage = t('auth.accountDeactivated');
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container px-4">
      <div className="row justify-content-center align-items-center min-vh-100 py-4">
        <div className="col-12 col-sm-10 col-md-8 col-lg-6 col-xl-5">
          <div className="text-end mb-3">
            <LanguageSwitcher />
          </div>

          <div className="card shadow-sm border-0">
            <div className="card-body p-3 p-md-4">
              <div className="text-center mb-4">
                <div className="d-flex justify-content-center">
                  <Logo width={240} height={240} className="mb-3" />
                </div>
                <h2 className="fw-bold"><TranslatedText text="auth.login" /></h2>
                <p className="text-muted">
                  <TranslatedText text="auth.loginDescription" />
                </p>
              </div>

              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="identifier" className="form-label"><TranslatedText text="auth.identifier" /></label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <FaUser />
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      id="identifier"
                      placeholder={t('auth.identifierPlaceholder')}
                      value={credentials.identifier}
                      onChange={handleInputChange}
                      required
                      disabled={loading}
                    />
                  </div>
                  <small className="form-text text-muted">
                    <TranslatedText text="auth.identifierHelp" />
                  </small>
                </div>

                <div className="mb-4">
                  <label htmlFor="password" className="form-label"><TranslatedText text="auth.password" /></label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <FaLock />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-control"
                      id="password"
                      placeholder={t('auth.passwordPlaceholder')}
                      value={credentials.password}
                      onChange={handleInputChange}
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={t(showPassword ? 'auth.hidePassword' : 'auth.showPassword')}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                <div className="d-grid gap-2">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        <TranslatedText text="loading.message" />
                      </>
                    ) : (
                      <TranslatedText text="auth.login" />
                    )}
                  </button>
                </div>

                <div className="text-center mt-3">
                  <p className="mb-0">
                    <TranslatedText text="auth.dontHaveAccount" />{' '}
                    <Link href="/register" className="text-primary">
                      <TranslatedText text="auth.registerHere" />
                    </Link>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 