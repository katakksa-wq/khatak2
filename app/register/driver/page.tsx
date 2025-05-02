'use client';

import { useState, useRef } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert, ProgressBar } from 'react-bootstrap';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaUser, FaLock, FaEnvelope, FaPhone, FaCar, FaIdCard, FaCamera } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

// Components for image preview
const ImagePreview = ({ file, onRemove }: { file: File; onRemove: () => void }) => {
  const [preview, setPreview] = useState<string>('');

  // Create preview when file changes
  useState(() => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  });

  return (
    <div className="position-relative mb-2">
      <img 
        src={preview} 
        alt={file.name} 
        className="img-thumbnail" 
        style={{ width: '100%', height: '150px', objectFit: 'cover' }} 
      />
      <Button 
        variant="danger" 
        size="sm" 
        className="position-absolute top-0 end-0 m-1" 
        onClick={onRemove}
      >
        ×
      </Button>
    </div>
  );
};

export default function DriverRegistrationPage() {
  const { register } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    plateNumber: '',
    carMake: '',
    carModel: '',
    carYear: '',
    carColor: '',
  });
  
  // File upload state
  const [driverPhotos, setDriverPhotos] = useState<File[]>([]);
  const [carPhotos, setCarPhotos] = useState<File[]>([]);
  const [licenseCopy, setLicenseCopy] = useState<File | null>(null);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [step, setStep] = useState(1);
  
  // Refs for file inputs
  const driverPhotoInputRef = useRef<HTMLInputElement>(null);
  const carPhotoInputRef = useRef<HTMLInputElement>(null);
  const licenseInputRef = useRef<HTMLInputElement>(null);
  
  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  // Handle driver photo upload
  const handleDriverPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newPhotos = Array.from(e.target.files);
      if (driverPhotos.length + newPhotos.length <= 2) {
        setDriverPhotos([...driverPhotos, ...newPhotos]);
      } else {
        setError(t('driver.maxDriverPhotosError'));
      }
    }
  };
  
  // Handle car photo upload
  const handleCarPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newPhotos = Array.from(e.target.files);
      if (carPhotos.length + newPhotos.length <= 4) {
        setCarPhotos([...carPhotos, ...newPhotos]);
      } else {
        setError(t('driver.maxCarPhotosError'));
      }
    }
  };
  
  // Handle license upload
  const handleLicenseUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setLicenseCopy(e.target.files[0]);
    }
  };
  
  // Remove a driver photo
  const removeDriverPhoto = (index: number) => {
    setDriverPhotos(driverPhotos.filter((_, i) => i !== index));
  };
  
  // Remove a car photo
  const removeCarPhoto = (index: number) => {
    setCarPhotos(carPhotos.filter((_, i) => i !== index));
  };
  
  // Remove license copy
  const removeLicense = () => {
    setLicenseCopy(null);
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError(t('auth.passwordsDoNotMatch'));
      return;
    }
    
    // Validate required fields
    if (!formData.plateNumber) {
      setError(t('driver.plateNumberRequired'));
      return;
    }
    
    if (!licenseCopy) {
      setError(t('driver.licenseRequired'));
      return;
    }
    
    if (carPhotos.length === 0) {
      setError(t('driver.carPhotoRequired'));
      return;
    }
    
    if (driverPhotos.length === 0) {
      setError(t('driver.driverPhotoRequired'));
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setUploadProgress(10);
      
      // Step 1: Upload documents to temporary storage
      setUploadProgress(20);
      
      // Create a temporary unique ID for this registration
      const tempRegistrationId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create FormData objects for each document
      const licenseFormData = new FormData();
      licenseFormData.append('licenseDocument', licenseCopy);
      licenseFormData.append('tempId', tempRegistrationId);
      
      const carPhotoFormData = new FormData();
      carPhotoFormData.append('registrationDocument', carPhotos[0]);
      carPhotoFormData.append('tempId', tempRegistrationId);
      
      const driverPhotoFormData = new FormData();
      driverPhotoFormData.append('backgroundCheckDocument', driverPhotos[0]);
      driverPhotoFormData.append('tempId', tempRegistrationId);
      
      // Upload documents to temporary storage
      try {
        setUploadProgress(30);
        
        // Upload license document
        const licenseResponse = await fetch('/api/driver/upload/license', {
          method: 'POST',
          body: licenseFormData
        });
        
        if (!licenseResponse.ok) {
          throw new Error(t('driver.uploadLicenseError'));
        }
        const licenseData = await licenseResponse.json();
        console.log('License document upload response:', licenseData);
        
        setUploadProgress(50);
        
        // Upload car photo
        const carPhotoResponse = await fetch('/api/driver/upload/registration', {
          method: 'POST',
          body: carPhotoFormData
        });
        
        if (!carPhotoResponse.ok) {
          throw new Error(t('driver.uploadCarPhotoError'));
        }
        const carPhotoData = await carPhotoResponse.json();
        console.log('Car photo upload response:', carPhotoData);
        
        setUploadProgress(70);
        
        // Upload driver photo
        const driverPhotoResponse = await fetch('/api/driver/upload/driver-photo', {
          method: 'POST',
          body: driverPhotoFormData
        });
        
        if (!driverPhotoResponse.ok) {
          throw new Error(t('driver.uploadDriverPhotoError'));
        }
        const driverPhotoData = await driverPhotoResponse.json();
        console.log('Driver photo upload response:', driverPhotoData);
        
        setUploadProgress(90);
        
        // Step 2: Register the user with document references
        const response = await register(
          formData.email,
          formData.password,
          {
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone,
            role: 'DRIVER',
            plateNumber: formData.plateNumber,
            carMake: formData.carMake,
            carModel: formData.carModel,
            carYear: formData.carYear,
            carColor: formData.carColor,
            // Directly include document URLs for the backend
            licenseDocumentUrl: licenseData.data?.documentUrl || licenseData.documentUrl,
            registrationDocumentUrl: carPhotoData.data?.documentUrl || carPhotoData.documentUrl,
            driverPhotoUrl: driverPhotoData.data?.documentUrl || driverPhotoData.documentUrl,
            // Keep driver documents for compatibility
            driverDocuments: {
              licenseDocument: licenseData.data?.documentUrl || licenseData.documentUrl,
              registrationDocument: carPhotoData.data?.documentUrl || carPhotoData.documentUrl,
              backgroundCheckDocument: driverPhotoData.data?.documentUrl || driverPhotoData.documentUrl
            },
            tempRegistrationId
          }
        );
        
        setUploadProgress(100);
        
        // Redirect to pending approval page
        router.replace('/register/driver/pending');
        
      } catch (uploadError) {
        console.error('Error uploading documents:', uploadError);
        setError(t('driver.uploadError'));
        setLoading(false);
        return;
      }
    } catch (err) {
      console.error('Error during registration:', err);
      setError(t('auth.registrationFailed'));
      setLoading(false);
    }
  };
  
  // Navigate to next or previous step
  const nextStep = () => {
    if (step === 1) {
      // Validate step 1
      if (!formData.firstName || !formData.lastName || !formData.email || 
          !formData.password || !formData.confirmPassword || !formData.phone) {
        setError(t('auth.fillAllFields'));
        return;
      }
    }
    setError('');
    setStep(prev => prev + 1);
  };
  
  const prevStep = () => {
    setError('');
    setStep(prev => prev - 1);
  };
  
  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8} lg={7}>
          <Card className="shadow-sm">
            <Card.Header className="bg-primary text-white">
              <h2 className="h4 mb-0">{t('driver.registration')}</h2>
            </Card.Header>
            <Card.Body className="p-4">
              {error && <Alert variant="danger">{error}</Alert>}
              
              <div className="mb-4">
                <div className="d-flex justify-content-between mb-2">
                  <div className={`step-indicator ${step >= 1 ? 'active' : ''}`}>
                    <span className="step-number">1</span>
                    <span className="step-text">{t('auth.accountInformation')}</span>
                  </div>
                  <div className={`step-indicator ${step >= 2 ? 'active' : ''}`}>
                    <span className="step-number">2</span>
                    <span className="step-text">{t('driver.vehicleInfo')}</span>
                  </div>
                  <div className={`step-indicator ${step >= 3 ? 'active' : ''}`}>
                    <span className="step-number">3</span>
                    <span className="step-text">{t('driver.documents')}</span>
                  </div>
                </div>
                <ProgressBar now={(step / 3) * 100} className="mb-4" />
              </div>
              
              <Form onSubmit={handleSubmit}>
                {step === 1 && (
                  <>
                    <h3 className="h5 mb-3">{t('driver.personalInfo')}</h3>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>{t('auth.firstName')}</Form.Label>
                          <div className="input-group">
                            <span className="input-group-text">
                              <FaUser />
                            </span>
                            <Form.Control
                              type="text"
                              name="firstName"
                              id="firstName"
                              value={formData.firstName}
                              onChange={handleChange}
                              placeholder={t('auth.firstNamePlaceholder')}
                              required
                            />
                          </div>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>{t('auth.lastName')}</Form.Label>
                          <div className="input-group">
                            <span className="input-group-text">
                              <FaUser />
                            </span>
                            <Form.Control
                              type="text"
                              name="lastName"
                              id="lastName"
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
                      <Form.Label>{t('auth.email')}</Form.Label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <FaEnvelope />
                        </span>
                        <Form.Control
                          type="email"
                          name="email"
                          id="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder={t('auth.emailPlaceholder')}
                          required
                        />
                      </div>
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                      <Form.Label>{t('auth.phone')}</Form.Label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <FaPhone />
                        </span>
                        <Form.Control
                          type="tel"
                          name="phone"
                          id="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder={t('auth.phonePlaceholder')}
                          required
                        />
                      </div>
                    </Form.Group>
                    
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>{t('auth.password')}</Form.Label>
                          <div className="input-group">
                            <span className="input-group-text">
                              <FaLock />
                            </span>
                            <Form.Control
                              type="password"
                              name="password"
                              id="password"
                              value={formData.password}
                              onChange={handleChange}
                              placeholder={t('auth.passwordPlaceholder')}
                              required
                            />
                          </div>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>{t('auth.confirmPassword')}</Form.Label>
                          <div className="input-group">
                            <span className="input-group-text">
                              <FaLock />
                            </span>
                            <Form.Control
                              type="password"
                              name="confirmPassword"
                              id="confirmPassword"
                              value={formData.confirmPassword}
                              onChange={handleChange}
                              placeholder={t('auth.confirmPasswordPlaceholder')}
                              required
                            />
                          </div>
                        </Form.Group>
                      </Col>
                    </Row>
                    
                    <div className="d-flex justify-content-end mt-4">
                      <Button type="button" variant="primary" onClick={nextStep}>
                        {t('button.next')}: {t('driver.vehicleInfo')}
                      </Button>
                    </div>
                  </>
                )}
                
                {step === 2 && (
                  <>
                    <h3 className="h5 mb-3">{t('driver.vehicleInfo')}</h3>
                    <Form.Group className="mb-3">
                      <Form.Label>{t('driver.licensePlate')}</Form.Label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <FaCar />
                        </span>
                        <Form.Control
                          type="text"
                          name="plateNumber"
                          id="plateNumber"
                          value={formData.plateNumber}
                          onChange={handleChange}
                          placeholder={t('driver.licensePlatePlaceholder')}
                          required
                        />
                      </div>
                    </Form.Group>
                    
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>{t('driver.make')}</Form.Label>
                          <Form.Control
                            type="text"
                            name="carMake"
                            id="carMake"
                            value={formData.carMake}
                            onChange={handleChange}
                            placeholder={t('driver.makePlaceholder')}
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>{t('driver.model')}</Form.Label>
                          <Form.Control
                            type="text"
                            name="carModel"
                            id="carModel"
                            value={formData.carModel}
                            onChange={handleChange}
                            placeholder={t('driver.modelPlaceholder')}
                            required
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>{t('driver.year')}</Form.Label>
                          <Form.Control
                            type="number"
                            name="carYear"
                            id="carYear"
                            value={formData.carYear}
                            onChange={handleChange}
                            placeholder={t('driver.yearPlaceholder')}
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>{t('driver.color')}</Form.Label>
                          <Form.Control
                            type="text"
                            name="carColor"
                            id="carColor"
                            value={formData.carColor}
                            onChange={handleChange}
                            placeholder={t('driver.colorPlaceholder')}
                            required
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    
                    <div className="d-flex justify-content-between mt-4">
                      <Button type="button" variant="outline-secondary" onClick={prevStep}>
                        {t('button.back')}
                      </Button>
                      <Button type="button" variant="primary" onClick={nextStep}>
                        {t('button.next')}: {t('driver.documents')}
                      </Button>
                    </div>
                  </>
                )}
                
                {step === 3 && (
                  <>
                    <h3 className="h5 mb-3">{t('driver.documents')}</h3>
                    
                    <Form.Group className="mb-4">
                      <Form.Label>{t('driver.driverPhotos')}</Form.Label>
                      <div className="d-flex mb-2">
                        <Button 
                          variant="outline-primary" 
                          className="me-2"
                          onClick={() => driverPhotoInputRef.current?.click()}
                        >
                          <FaCamera className="me-2" />
                          {t('driver.uploadDriverPhoto')}
                        </Button>
                        <Form.Control
                          type="file"
                          ref={driverPhotoInputRef}
                          id="driverPhoto"
                          onChange={handleDriverPhotoUpload}
                          accept="image/*"
                          className="d-none"
                        />
                        <small className="text-muted d-flex align-items-center">
                          {driverPhotos.length}/2 {t('driver.photos')}
                        </small>
                      </div>
                      <div className="photo-preview-container">
                        <Row>
                          {driverPhotos.map((photo, index) => (
                            <Col xs={6} key={index}>
                              <ImagePreview 
                                file={photo} 
                                onRemove={() => removeDriverPhoto(index)} 
                              />
                            </Col>
                          ))}
                        </Row>
                      </div>
                      <small className="text-muted">
                        {t('driver.photoInstructions')}
                      </small>
                    </Form.Group>
                    
                    <Form.Group className="mb-4">
                      <Form.Label>{t('driver.carPhotos')}</Form.Label>
                      <div className="d-flex mb-2">
                        <Button 
                          variant="outline-primary" 
                          className="me-2"
                          onClick={() => carPhotoInputRef.current?.click()}
                        >
                          <FaCar className="me-2" />
                          {t('driver.uploadCarPhotos')}
                        </Button>
                        <Form.Control
                          type="file"
                          ref={carPhotoInputRef}
                          id="carPhoto"
                          onChange={handleCarPhotoUpload}
                          accept="image/*"
                          multiple
                          className="d-none"
                        />
                        <small className="text-muted d-flex align-items-center">
                          {carPhotos.length}/4 {t('driver.photos')}
                        </small>
                      </div>
                      <div className="photo-preview-container">
                        <Row>
                          {carPhotos.map((photo, index) => (
                            <Col xs={6} md={3} key={index}>
                              <ImagePreview 
                                file={photo} 
                                onRemove={() => removeCarPhoto(index)} 
                              />
                            </Col>
                          ))}
                        </Row>
                      </div>
                      <small className="text-muted">
                        {t('driver.carPhotoInstructions')}
                      </small>
                    </Form.Group>
                    
                    <Form.Group className="mb-4">
                      <Form.Label>{t('driver.license')}</Form.Label>
                      <div className="d-flex mb-2">
                        <Button 
                          variant="outline-primary" 
                          className="me-2"
                          onClick={() => licenseInputRef.current?.click()}
                        >
                          <FaIdCard className="me-2" />
                          {t('driver.uploadLicense')}
                        </Button>
                        <Form.Control
                          type="file"
                          ref={licenseInputRef}
                          id="licenseDocument"
                          onChange={handleLicenseUpload}
                          accept="image/*,.pdf"
                          className="d-none"
                        />
                      </div>
                      {licenseCopy && (
                        <div className="photo-preview-container mb-2">
                          {licenseCopy.type.includes('image') ? (
                            <ImagePreview file={licenseCopy} onRemove={removeLicense} />
                          ) : (
                            <div className="p-3 border rounded d-flex justify-content-between align-items-center">
                              <div>
                                <FaIdCard className="me-2" />
                                {licenseCopy.name}
                              </div>
                              <Button 
                                variant="danger" 
                                size="sm"
                                onClick={removeLicense}
                              >
                                ×
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                      <small className="text-muted">
                        {t('driver.licenseInstructions')}
                      </small>
                    </Form.Group>
                    
                    {loading && (
                      <div className="mb-3">
                        <p className="mb-1">{t('driver.uploadingDocuments')}</p>
                        <ProgressBar now={uploadProgress} label={`${uploadProgress}%`} />
                      </div>
                    )}
                    
                    <div className="d-flex justify-content-between mt-4">
                      <Button type="button" variant="outline-secondary" onClick={prevStep}>
                        {t('button.back')}
                      </Button>
                      <Button 
                        type="submit" 
                        variant="success" 
                        disabled={loading}
                      >
                        {loading ? t('auth.registering') : t('auth.completeRegistration')}
                      </Button>
                    </div>
                  </>
                )}
              </Form>
            </Card.Body>
            <Card.Footer className="bg-light text-center">
              <p className="mb-0">
                {t('auth.alreadyHaveAccount')} <Link href="/login">{t('auth.loginHere')}</Link>
              </p>
              <p className="mt-2 mb-0 text-muted small">
                {t('auth.registerAsCustomer')} <Link href="/register">{t('auth.registerHere')}</Link>
              </p>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </Container>
  );
} 