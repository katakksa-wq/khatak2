'use client';

import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';
import Link from 'next/link';

export default function DriverVerificationPendingPage() {
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
              
              <h2 className="fw-bold mb-3">Verification Pending</h2>
              
              <p className="mb-4">
                Thank you for registering as a driver with our platform. Your application has been submitted and is now pending verification.
              </p>
              
              <div className="alert alert-info d-flex align-items-start mb-4">
                <FaInfoCircle className="me-2 mt-1 flex-shrink-0" />
                <div className="text-start">
                  Our admin team will review your information and documents. This typically takes 1-3 business days. You will receive an email notification once your account has been approved or if we need additional information.
                </div>
              </div>
              
              <div className="border rounded p-4 mb-4">
                <h5 className="mb-3">What happens next?</h5>
                <ul className="text-start">
                  <li className="mb-2">Your driver registration will be reviewed by our admin team</li>
                  <li className="mb-2">We may contact you for additional information if needed</li>
                  <li className="mb-2">Once approved, you'll receive an email with your account details</li>
                  <li className="mb-2">You can then log in and start accepting delivery assignments</li>
                </ul>
              </div>
              
              <div className="d-grid gap-2">
                <Link href="/login" passHref>
                  <Button variant="primary">
                    Go to Login Page
                  </Button>
                </Link>
                <Link href="/" passHref>
                  <Button variant="outline-secondary">
                    Return to Home
                  </Button>
                </Link>
              </div>
            </Card.Body>
            <Card.Footer className="bg-light p-3 text-center">
              <p className="mb-0">
                <small>
                  Need help? <a href="mailto:support@example.com">Contact Support</a>
                </small>
              </p>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </Container>
  );
} 