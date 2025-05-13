'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { Container, Row, Col, Form, Button, Card } from 'react-bootstrap';
import { FaPhone, FaLock } from 'react-icons/fa';
import Logo from '@/components/Logo';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useLanguage } from '@/contexts/LanguageContext';
import TranslatedText from '@/components/TranslatedText';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(phone, password);
      toast.success('تم تسجيل الدخول بنجاح');
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'فشل تسجيل الدخول');
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
                <h2 className="h4 mb-0"><TranslatedText text="auth.login" /></h2>
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
                
                <Form.Group className="mb-4">
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
                      placeholder={t('auth.passwordPlaceholder')}
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
                        <TranslatedText text="auth.loggingIn" />
                      </>
                    ) : (
                      <TranslatedText text="auth.login" />
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
            <Card.Footer className="bg-light p-3 p-md-4">
              <div className="text-center">
                <p className="mb-2">
                  <TranslatedText text="auth.noAccount" /> <Link href="/register"><TranslatedText text="auth.signup" /></Link>
                </p>
              </div>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </Container>
  );
} 