'use client';

import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert } from 'react-bootstrap';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaUser, FaLock, FaEnvelope, FaTruck, FaPhone } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import TranslatedText from '@/components/TranslatedText';
import Logo from '@/components/Logo';
import { toast } from 'react-hot-toast';

export default function RegisterPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { register } = useAuth();
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (password !== confirmPassword) {
        throw new Error('كلمات المرور غير متطابقة');
      }

      await register(phone, password);
      toast.success('تم إنشاء الحساب بنجاح');
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'فشل إنشاء الحساب');
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
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label><TranslatedText text="auth.phone" /></Form.Label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <FaPhone />
                    </span>
                    <Form.Control
                      type="tel"
                      name="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={t('auth.phonePlaceholder')}
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
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
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
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
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