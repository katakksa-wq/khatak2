'use client';

import { useState, useRef } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert, ProgressBar } from 'react-bootstrap';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaUser, FaLock, FaEnvelope, FaPhone, FaCar, FaIdCard, FaCamera } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';

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
        setError('Maximum 2 driver photos allowed');
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
        setError('Maximum 4 car photos allowed');
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
      setError('Passwords do not match');
      return;
    }
    
    // Validate required fields
    if (!formData.plateNumber) {
      setError('License plate number is required');
      return;
    }
    
    if (!licenseCopy) {
      setError('A copy of your driver license is required');
      return;
    }
    
    if (carPhotos.length === 0) {
      setError('At least one car photo is required');
      return;
    }
    
    if (driverPhotos.length === 0) {
      setError('At least one driver photo is required');
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
      
      // Upload insurance document if available
      const insuranceFormData = new FormData();
      if (carPhotos.length > 1) {
        insuranceFormData.append('insuranceDocument', carPhotos[1]);
        insuranceFormData.append('tempId', tempRegistrationId);
      }
      
      // Upload documents to temporary storage
      try {
        setUploadProgress(30);
        
        // Upload license document
        const licenseResponse = await fetch('/api/uploads/license', {
          method: 'POST',
          body: licenseFormData
        });
        
        if (!licenseResponse.ok) {
          throw new Error('Failed to upload license document');
        }
        const licenseData = await licenseResponse.json();
        console.log('License document upload response:', licenseData);
        
        setUploadProgress(50);
        
        // Upload car photo
        const carPhotoResponse = await fetch('/api/uploads/registration', {
          method: 'POST',
          body: carPhotoFormData
        });
        
        if (!carPhotoResponse.ok) {
          throw new Error('Failed to upload car photo');
        }
        const carPhotoData = await carPhotoResponse.json();
        console.log('Car photo upload response:', carPhotoData);
        
        setUploadProgress(70);
        
        // Upload driver photo
        const driverPhotoResponse = await fetch('/api/uploads/driver-photo', {
          method: 'POST',
          body: driverPhotoFormData
        });
        
        if (!driverPhotoResponse.ok) {
          throw new Error('Failed to upload driver photo');
        }
        const driverPhotoData = await driverPhotoResponse.json();
        console.log('Driver photo upload response:', driverPhotoData);
        
        // Upload insurance document if available
        let insuranceData = null;
        if (carPhotos.length > 1) {
          const insuranceResponse = await fetch('/api/uploads/insurance', {
            method: 'POST',
            body: insuranceFormData
          });
          
          if (!insuranceResponse.ok) {
            throw new Error('Failed to upload insurance document');
          }
          insuranceData = await insuranceResponse.json();
        }
        
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
            // Use the correct property path from the responses
            licenseDocumentUrl: licenseData.documentUrl,
            registrationDocumentUrl: carPhotoData.documentUrl,
            driverPhotoUrl: driverPhotoData.documentUrl,
            insuranceDocumentUrl: insuranceData?.documentUrl || null,
            tempRegistrationId
          }
        );
        
        setUploadProgress(100);
        
        // Redirect to pending approval page
        router.replace('/register/driver/pending');
        
      } catch (uploadError) {
        console.error('Error uploading documents:', uploadError);
        setError('Failed to upload documents. Please try again.');
        setLoading(false);
        return;
      }
    } catch (err) {
      console.error('Error during registration:', err);
      setError('Registration failed. Please try again.');
      setLoading(false);
    }
  };
  
  // Navigate to next or previous step
  const nextStep = () => {
    if (step === 1) {
      // Validate step 1
      if (!formData.firstName || !formData.lastName || !formData.email || 
          !formData.password || !formData.confirmPassword || !formData.phone) {
        setError('Please fill in all required fields');
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
              <h2 className="h4 mb-0">Driver Registration</h2>
            </Card.Header>
            <Card.Body className="p-4">
              {error && <Alert variant="danger">{error}</Alert>}
              
              <div className="mb-4">
                <div className="d-flex justify-content-between mb-2">
                  <div className={`step-indicator ${step >= 1 ? 'active' : ''}`}>
                    <span className="step-number">1</span>
                    <span className="step-text">Account Information</span>
                  </div>
                  <div className={`step-indicator ${step >= 2 ? 'active' : ''}`}>
                    <span className="step-number">2</span>
                    <span className="step-text">Vehicle Details</span>
                  </div>
                  <div className={`step-indicator ${step >= 3 ? 'active' : ''}`}>
                    <span className="step-number">3</span>
                    <span className="step-text">Required Documents</span>
                  </div>
                </div>
                <ProgressBar now={(step / 3) * 100} className="mb-4" />
              </div>
              
              <Form onSubmit={handleSubmit}>
                {step === 1 && (
                  <>
                    <h3 className="h5 mb-3">Personal Information</h3>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>First Name</Form.Label>
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
                              placeholder="Enter first name"
                              required
                            />
                          </div>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Last Name</Form.Label>
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
                              placeholder="Enter last name"
                              required
                            />
                          </div>
                        </Form.Group>
                      </Col>
                    </Row>
                    
                    <Form.Group className="mb-3">
                      <Form.Label>Email Address</Form.Label>
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
                          placeholder="Enter email"
                          required
                        />
                      </div>
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                      <Form.Label>Phone Number</Form.Label>
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
                          placeholder="Enter phone number"
                          required
                        />
                      </div>
                    </Form.Group>
                    
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Password</Form.Label>
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
                              placeholder="Create a password"
                              required
                            />
                          </div>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Confirm Password</Form.Label>
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
                              placeholder="Confirm password"
                              required
                            />
                          </div>
                        </Form.Group>
                      </Col>
                    </Row>
                    
                    <div className="d-flex justify-content-end mt-4">
                      <Button type="button" variant="primary" onClick={nextStep}>
                        Next: Vehicle Details
                      </Button>
                    </div>
                  </>
                )}
                
                {step === 2 && (
                  <>
                    <h3 className="h5 mb-3">Vehicle Information</h3>
                    <Form.Group className="mb-3">
                      <Form.Label>License Plate Number</Form.Label>
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
                          placeholder="Enter license plate number"
                          required
                        />
                      </div>
                    </Form.Group>
                    
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Car Make</Form.Label>
                          <Form.Control
                            type="text"
                            name="carMake"
                            id="carMake"
                            value={formData.carMake}
                            onChange={handleChange}
                            placeholder="e.g. Toyota, Honda"
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Car Model</Form.Label>
                          <Form.Control
                            type="text"
                            name="carModel"
                            id="carModel"
                            value={formData.carModel}
                            onChange={handleChange}
                            placeholder="e.g. Camry, Civic"
                            required
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Year</Form.Label>
                          <Form.Control
                            type="number"
                            name="carYear"
                            id="carYear"
                            value={formData.carYear}
                            onChange={handleChange}
                            placeholder="e.g. 2020"
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Color</Form.Label>
                          <Form.Control
                            type="text"
                            name="carColor"
                            id="carColor"
                            value={formData.carColor}
                            onChange={handleChange}
                            placeholder="e.g. Black, White"
                            required
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    
                    <div className="d-flex justify-content-between mt-4">
                      <Button type="button" variant="outline-secondary" onClick={prevStep}>
                        Back
                      </Button>
                      <Button type="button" variant="primary" onClick={nextStep}>
                        Next: Required Documents
                      </Button>
                    </div>
                  </>
                )}
                
                {step === 3 && (
                  <>
                    <h3 className="h5 mb-3">Required Documents</h3>
                    
                    <Form.Group className="mb-4">
                      <Form.Label>Driver Photos (Selfie/Portrait)</Form.Label>
                      <div className="d-flex mb-2">
                        <Button 
                          variant="outline-primary" 
                          className="me-2"
                          onClick={() => driverPhotoInputRef.current?.click()}
                        >
                          <FaCamera className="me-2" />
                          Upload Driver Photo
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
                          {driverPhotos.length}/2 photos
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
                        Please provide a clear photo of your face (like a selfie) with good lighting.
                      </small>
                    </Form.Group>
                    
                    <Form.Group className="mb-4">
                      <Form.Label>Car Photos</Form.Label>
                      <div className="d-flex mb-2">
                        <Button 
                          variant="outline-primary" 
                          className="me-2"
                          onClick={() => carPhotoInputRef.current?.click()}
                        >
                          <FaCar className="me-2" />
                          Upload Car Photos
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
                          {carPhotos.length}/4 photos
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
                        Please provide photos of your car from different angles (front, back, and sides).
                      </small>
                    </Form.Group>
                    
                    <Form.Group className="mb-4">
                      <Form.Label>Driver's License Copy</Form.Label>
                      <div className="d-flex mb-2">
                        <Button 
                          variant="outline-primary" 
                          className="me-2"
                          onClick={() => licenseInputRef.current?.click()}
                        >
                          <FaIdCard className="me-2" />
                          Upload License
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
                        Please provide a clear photo or scan of your valid driver's license.
                      </small>
                    </Form.Group>
                    
                    {loading && (
                      <div className="mb-3">
                        <p className="mb-1">Uploading documents...</p>
                        <ProgressBar now={uploadProgress} label={`${uploadProgress}%`} />
                      </div>
                    )}
                    
                    <div className="d-flex justify-content-between mt-4">
                      <Button type="button" variant="outline-secondary" onClick={prevStep}>
                        Back
                      </Button>
                      <Button 
                        type="submit" 
                        variant="success" 
                        disabled={loading}
                      >
                        {loading ? 'Registering...' : 'Complete Registration'}
                      </Button>
                    </div>
                  </>
                )}
              </Form>
            </Card.Body>
            <Card.Footer className="bg-light text-center">
              <p className="mb-0">
                Already have an account? <Link href="/login">Login here</Link>
              </p>
              <p className="mt-2 mb-0 text-muted small">
                Looking to register as a customer? <Link href="/register">Register here</Link>
              </p>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </Container>
  );
} 