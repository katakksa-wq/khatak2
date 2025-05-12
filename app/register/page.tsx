'use client';

import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert } from 'react-bootstrap';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaUser, FaLock, FaEnvelope, FaTruck } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import TranslatedText from '@/components/TranslatedText';
import Logo from '@/components/Logo';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      setError(t('auth.passwordsDoNotMatch'));
      return;
    }

    if (formData.password.length < 6) {
      setError(t('auth.passwordTooShort'));
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await register(formData.email, formData.password, {
        firstName: formData.firstName, 
        lastName: formData.lastName,
        role: 'CLIENT'
      });
      
      // AuthContext will handle navigation based on user role
    } catch (err: any) {
      setError(err.message || t('auth.registrationFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-3 py-md-5 px-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <Logo showText width={100} height={100} />
        <LanguageSwitcher />
      </div>
      
      <Row className="justify-content-center">
        <Col xs={12} sm={11} md={10} lg={8} xl={6}>
          <Card className="shadow-sm">
            <Card.Header className="bg-primary text-white">
              <div className="d-flex align-items-center">
                <Logo width={64} height={64} className="me-2" />
                <h2 className="h4 mb-0"><TranslatedText text="auth.signup" /></h2>
              </div>
            </Card.Header>
            <Card.Body className="p-3 p-md-4">
              {error && <Alert variant="danger">{error}</Alert>}
              
              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col xs={12} md={6} className="mb-3">
                    <Form.Group>
                      <Form.Label><TranslatedText text="auth.firstName" /></Form.Label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <FaUser />
                        </span>
                        <Form.Control
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          placeholder={t('auth.firstNamePlaceholder')}
                          required
                        />
                      </div>
                    </Form.Group>
                  </Col>
                  <Col xs={12} md={6} className="mb-3">
                    <Form.Group>
                      <Form.Label><TranslatedText text="auth.lastName" /></Form.Label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <FaUser />
                        </span>
                        <Form.Control
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          placeholder={t('auth.lastNamePlaceholder')}
                          required
                        />
                      </div>
                    </Form.Group>
                  </Col>
                </Row>
                
                <Form.Group className="mb-3">
                  <Form.Label><TranslatedText text="auth.email" /></Form.Label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <FaEnvelope />
                    </span>
                    <Form.Control
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder={t('auth.emailPlaceholder')}
                      required
                    />
                  </div>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label><TranslatedText text="auth.password" /></Form.Label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <FaLock />
                    </span>
                    <Form.Control
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder={t('auth.createPassword')}
                      required
                    />
                  </div>
                </Form.Group>
                
                <Form.Group className="mb-4">
                  <Form.Label><TranslatedText text="auth.confirmPassword" /></Form.Label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <FaLock />
                    </span>
                    <Form.Control
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder={t('auth.confirmPasswordPlaceholder')}
                      required
                    />
                  </div>
                </Form.Group>
                
                <div className="d-grid mb-3">
                  <Button 
                    type="submit" 
                    variant="primary" 
                    size="lg"
                    disabled={loading}
                    className="py-2"
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        <TranslatedText text="auth.createAccount" />
                      </>
                    ) : (
                      <TranslatedText text="auth.signup" />
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
            <Card.Footer className="bg-light p-3 p-md-4">
              <div className="text-center">
                <p className="mb-2">
                  <TranslatedText text="auth.alreadyHaveAccount" /> <Link href="/login"><TranslatedText text="auth.login" /></Link>
                </p>
                <div className="driver-registration-card mt-3 mb-2 p-3 border rounded bg-light">
                  <div className="d-flex flex-column flex-sm-row align-items-center justify-content-between gap-2">
                    <div>
                      <h5 className="mb-0"><TranslatedText text="driver.becomeDriver" /></h5>
                      <p className="text-muted mb-0 small"><TranslatedText text="driver.earnMoney" /></p>
                    </div>
                    <Link href="/register/driver" passHref>
                      <Button variant="outline-primary" className="d-flex align-items-center w-100 w-sm-auto justify-content-center">
                        <FaTruck className="me-2" /> <TranslatedText text="driver.registration" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </Container>
  );
} 