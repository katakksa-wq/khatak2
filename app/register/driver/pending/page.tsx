'use client';

import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';

export default function DriverVerificationPendingPage() {
  const { t } = useLanguage();
  
  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="shadow-sm border-0">
            <Card.Body className="p-5 text-center">
              <div className="mb-4">
                <div className="bg-warning text-white rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: '80px', height: '80px' }}>
                  <FaExclamationTriangle size={40} />
                </div>
              </div>
              
              <h2 className="fw-bold mb-3">{t('driver.verificationPending')}</h2>
              
              <p className="mb-4">
                {t('driver.verificationPendingMessage')}
              </p>
              
              <div className="alert alert-info d-flex align-items-start mb-4">
                <FaInfoCircle className="me-2 mt-1 flex-shrink-0" />
                <div className="text-start">
                  {t('driver.verificationReviewMessage')}
                </div>
              </div>
              
              <div className="border rounded p-4 mb-4">
                <h5 className="mb-3">{t('driver.whatsNext')}</h5>
                <ul className="text-start">
                  <li className="mb-2">{t('driver.nextStep1')}</li>
                  <li className="mb-2">{t('driver.nextStep2')}</li>
                  <li className="mb-2">{t('driver.nextStep3')}</li>
                  <li className="mb-2">{t('driver.nextStep4')}</li>
                </ul>
              </div>
              
              <div className="d-grid gap-2">
                <Link href="/login" passHref>
                  <Button variant="primary">
                    {t('driver.goToLogin')}
                  </Button>
                </Link>
                <Link href="/" passHref>
                  <Button variant="outline-secondary">
                    {t('driver.returnToHome')}
                  </Button>
                </Link>
              </div>
            </Card.Body>
            <Card.Footer className="bg-light p-3 text-center">
              <p className="mb-0">
                <small>
                  {t('driver.needHelp')} <a href="mailto:support@example.com">{t('driver.contactSupport')}</a>
                </small>
              </p>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </Container>
  );
} 