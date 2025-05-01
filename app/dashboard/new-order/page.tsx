'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useOrders } from '@/contexts/OrderContext';
import { Address } from '@/services/orderService';
import { PackageDetails } from '@/types';
import { FaBox, FaMapMarkerAlt, FaTruck, FaMapMarked, FaMobileAlt, FaMoneyBillWave } from 'react-icons/fa';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from './styles.module.css';

// Local interface for form state (strings instead of numbers for inputs)
interface PackageDetailsForm {
  weight: string;
  dimensions: string;
  description: string;
  fragile: boolean;
}

// We'll modify the form to store our custom fields
const NewOrderPage = () => {
  const router = useRouter();
  const { t } = useLanguage();
  const { createOrder, loading: contextLoading, error: contextError } = useOrders();
  const userInitiatedSubmit = useRef(false);
  const mapRef = useRef<HTMLDivElement>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    pickupAddress: {
      street: '',
      city: '',
      state: '',
      country: 'KSA'
    },
    deliveryAddress: {
      street: '',
      city: '',
      state: '',
      country: 'KSA',
      recipientMobileNumber: '' // Added recipient mobile number
    },
    packageDetails: {
      weight: '',
      dimensions: '',
      description: '',
      fragile: false
    },
    customPrice: '', // For manual price entry
    mapLocation: {
      lat: 0,
      lng: 0,
      address: ''
    }
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formStep, setFormStep] = useState(1); // 1 = pickup, 2 = delivery, 3 = package details, 4 = map location
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Track whether we've seen contextLoading become true
  const hasStartedLoading = useRef(false);
  
  // Flag to determine if we're submitting the final form
  const [isFinalSubmit, setIsFinalSubmit] = useState(false);
  
  // Reset all loading states
  const resetLoadingStates = useCallback(() => {
    setLoading(false);
    setIsSubmitting(false);
    console.log('Force resetting loading states');
  }, []);
  
  // Reset loading states when component mounts
  useEffect(() => {
    resetLoadingStates();
  }, [resetLoadingStates]);
  
  // Reset loading state when changing steps
  useEffect(() => {
    console.log(`Step changed to ${formStep}, resetting loading states`);
    resetLoadingStates();
  }, [formStep, resetLoadingStates]);

  // Monitor context loading state
  useEffect(() => {
    console.log('Context loading state changed:', contextLoading);
    if (contextLoading) {
      hasStartedLoading.current = true;
    } else if (hasStartedLoading.current && !contextLoading) {
      // Context loading has completed
      hasStartedLoading.current = false;
      // Only reset if we're not in the final submit
      if (!isFinalSubmit) {
        resetLoadingStates();
      }
    }
  }, [contextLoading, resetLoadingStates, isFinalSubmit]);

  // Initialize map when step 4 is active
  useEffect(() => {
    if (formStep === 4 && mapRef.current) {
      // This would be where you'd initialize a map component
      console.log('Map step active, would initialize map here');
    }
  }, [formStep]);
  
  // Handle field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    // Determine which section to update
    if (name.startsWith('pickup.')) {
      const fieldName = name.replace('pickup.', '');
      setFormData(prev => ({
        ...prev,
        pickupAddress: {
          ...prev.pickupAddress,
          [fieldName]: value
        }
      }));
    } else if (name.startsWith('delivery.')) {
      const fieldName = name.replace('delivery.', '');
      setFormData(prev => ({
        ...prev,
        deliveryAddress: {
          ...prev.deliveryAddress,
          [fieldName]: value
        }
      }));
    } else if (name.startsWith('package.')) {
      const fieldName = name.replace('package.', '');
      setFormData(prev => ({
        ...prev,
        packageDetails: {
          ...prev.packageDetails,
          [fieldName]: type === 'checkbox' ? checked : value
        }
      }));
    } else if (name === 'customPrice') {
      setFormData(prev => ({
        ...prev,
        customPrice: value
      }));
    }
  };

  // Mock function to simulate map location selection
  const handleMapLocationSelect = (location: { lat: number, lng: number, address: string }) => {
    setFormData(prev => ({
      ...prev,
      mapLocation: location
    }));
  };
  
  // Move to next step
  const nextStep = () => {
    if (formStep === 1) {
      // Validate pickup address
      if (!formData.pickupAddress.street || !formData.pickupAddress.city || !formData.pickupAddress.state) {
        setError(t('orders.fillPickupFields'));
        return;
      }
      setError(null);
      setFormStep(2);
    } else if (formStep === 2) {
      // Validate delivery address including recipient mobile
      if (!formData.deliveryAddress.street || !formData.deliveryAddress.city || 
          !formData.deliveryAddress.state || !formData.deliveryAddress.recipientMobileNumber) {
        setError(t('orders.fillDeliveryFields'));
        return;
      }
      
      // Validate mobile number format
      const phoneRegex = /^\d{10,15}$/;
      if (!phoneRegex.test(formData.deliveryAddress.recipientMobileNumber.replace(/\D/g, ''))) {
        setError(t('orders.invalidMobile'));
        return;
      }
      
      setError(null);
      setFormStep(3);
    } else if (formStep === 3) {
      // Validate package details and custom price
      if (!formData.packageDetails.weight || !formData.customPrice) {
        setError(t('orders.fillPackageDetails'));
        return;
      }
      
      // Validate price is a number
      if (isNaN(parseFloat(formData.customPrice)) || parseFloat(formData.customPrice) <= 0) {
        setError(t('orders.invalidPrice'));
        return;
      }
      
      setError(null);
      setFormStep(4);
    }
  };
  
  // Move to previous step
  const prevStep = () => {
    setError(null);
    setFormStep(formStep - 1);
    resetLoadingStates();
  };
  
  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Set userInitiatedSubmit to true when user clicks the submit button
    userInitiatedSubmit.current = true;
    
    // Set final submit flag to true
    setIsFinalSubmit(true);
    
    // Debug submission states
    console.log('Submit pressed, current states:', {
      loading,
      contextLoading,
      isSubmitting,
      formStep,
      userInitiated: userInitiatedSubmit.current
    });
    
    // Don't allow submission if already processing
    if (loading || isSubmitting) {
      console.log('Submission already in progress, ignoring');
      return;
    }
    
    // Clear previous errors
    setError(null);
    setLoading(true);
    setIsSubmitting(true);
    
    try {
      // Validate all required fields from all steps
      if (!formData.pickupAddress.street || !formData.pickupAddress.city || 
          !formData.deliveryAddress.street || !formData.deliveryAddress.city ||
          !formData.deliveryAddress.recipientMobileNumber || !formData.packageDetails.weight || 
          !formData.customPrice || !formData.mapLocation.address) {
        throw new Error('Please complete all required fields in all steps');
      }
      
      // Prepare package details
      const packageDetailsForAPI: PackageDetails = {
        weight: parseFloat(formData.packageDetails.weight) || 0,
        description: formData.packageDetails.description || '',
        fragile: formData.packageDetails.fragile
      };
      
      // Parse dimensions if provided
      if (formData.packageDetails.dimensions) {
        const dimensions = formData.packageDetails.dimensions.split('x').map(d => parseFloat(d.trim()));
        if (dimensions.length === 3 && dimensions.every(d => !isNaN(d))) {
          packageDetailsForAPI.dimensions = {
            length: dimensions[0],
            width: dimensions[1],
            height: dimensions[2]
          };
        }
      }
      
      // Create API-compatible address objects
      const pickupAddressForAPI: Address = {
        street: formData.pickupAddress.street,
        city: formData.pickupAddress.city,
        state: formData.pickupAddress.state,
        country: formData.pickupAddress.country,
        zipCode: '' // Empty string since we don't collect this
      };
      
      const deliveryAddressForAPI: Address = {
        street: formData.deliveryAddress.street,
        city: formData.deliveryAddress.city,
        state: formData.deliveryAddress.state,
        country: formData.deliveryAddress.country,
        zipCode: '', // Empty string since we don't collect this
        latitude: formData.mapLocation.lat,
        longitude: formData.mapLocation.lng
      };
      
      // Create special notes for API
      const notes = `Recipient Mobile: ${formData.deliveryAddress.recipientMobileNumber}\nMap Address: ${formData.mapLocation.address}`;
      
      console.log('Creating order with data:', {
        pickupAddress: pickupAddressForAPI,
        deliveryAddress: deliveryAddressForAPI,
        packageDetails: packageDetailsForAPI,
        notes,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        price: parseFloat(formData.customPrice)
      });
      
      // Create the order
      const newOrder = await createOrder({
        pickupAddress: pickupAddressForAPI,
        deliveryAddress: deliveryAddressForAPI,
        packageDetails: {
          ...packageDetailsForAPI,
          description: packageDetailsForAPI.description + 
            `\nRecipient Mobile: ${formData.deliveryAddress.recipientMobileNumber}\nMap Address: ${formData.mapLocation.address}`
        },
        status: 'PENDING',
        paymentStatus: 'PENDING',
        price: parseFloat(formData.customPrice)
      });
      
      console.log('Order creation response:', newOrder);
      
      if (newOrder) {
        alert(`Order created successfully! Your tracking number is: ${newOrder.trackingNumber || newOrder.id?.substring(0, 8) || 'N/A'}`);
        router.push('/dashboard/current-orders');
      } else {
        throw new Error('Failed to create order. Please try again.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      console.error('Error creating order:', err);
    } finally {
      setIsSubmitting(false);
      setLoading(false);
      // Reset userInitiatedSubmit after submission is complete
      userInitiatedSubmit.current = false;
      // Reset final submit flag
      setIsFinalSubmit(false);
    }
  };
  
  // Progress indicator for multi-step form
  const ProgressIndicator = () => (
    <div className={styles.mb6}>
      <div className={styles.progressStep}>
        <div className={`${styles.progressCircle} ${formStep >= 1 ? styles.progressCircleActive : ''}`}>1</div>
        <div className={`${styles.progressCircle} ${formStep >= 2 ? styles.progressCircleActive : ''}`}>2</div>
        <div className={`${styles.progressCircle} ${formStep >= 3 ? styles.progressCircleActive : ''}`}>3</div>
        <div className={`${styles.progressCircle} ${formStep >= 4 ? styles.progressCircleActive : ''}`}>4</div>
      </div>
      <div className={styles.progress}>
        <div 
          className={styles.progressBar}
          role="progressbar"
          style={{ width: `${(formStep / 4) * 100}%` }}
          aria-valuenow={formStep}
          aria-valuemin={1}
          aria-valuemax={4}
        ></div>
      </div>
      <div className={styles.progressStep}>
        <div className={`${styles.progressLabel} ${formStep >= 1 ? styles.progressLabelActive : ''}`}>{t('orders.pickup')}</div>
        <div className={`${styles.progressLabel} ${formStep >= 2 ? styles.progressLabelActive : ''}`}>{t('orders.delivery')}</div>
        <div className={`${styles.progressLabel} ${formStep >= 3 ? styles.progressLabelActive : ''}`}>{t('orders.package')}</div>
        <div className={`${styles.progressLabel} ${formStep >= 4 ? styles.progressLabelActive : ''}`}>{t('orders.location')}</div>
      </div>
    </div>
  );
  
  // Render form based on current step
  const renderForm = () => {
    switch (formStep) {
      case 1:
        return renderPickupForm();
        
      case 2:
        return renderDeliveryForm();
        
      case 3:
        return renderPackageDetailsForm();
        
      case 4:
        return renderMapLocationForm();
        
      default:
        return null;
    }
  };
  
  // Render pickup address form
  const renderPickupForm = () => (
    <div className="card shadow-sm">
      <div className="card-header bg-primary bg-opacity-10">
        <h4 className="card-title mb-0">
          <FaMapMarkerAlt className="me-2" /> {t('orders.pickupAddress')}
        </h4>
      </div>
      <div className="card-body">
        <div className="mb-3">
          <label htmlFor="pickup.street" className="form-label">{t('orders.street')}</label>
          <input
            type="text"
            className="form-control"
            id="pickup.street"
            name="pickup.street"
            value={formData.pickupAddress.street}
            onChange={handleChange}
            required
          />
        </div>
        <div className="row mb-3">
          <div className="col-md-6">
            <label htmlFor="pickup.city" className="form-label">{t('orders.city')}</label>
            <input
              type="text"
              className="form-control"
              id="pickup.city"
              name="pickup.city"
              value={formData.pickupAddress.city}
              onChange={handleChange}
              required
            />
          </div>
          <div className="col-md-6">
            <label htmlFor="pickup.state" className="form-label">{t('orders.state')}</label>
            <input
              type="text"
              className="form-control"
              id="pickup.state"
              name="pickup.state"
              value={formData.pickupAddress.state}
              onChange={handleChange}
              required
            />
          </div>
        </div>
      </div>
    </div>
  );
  
  // Render delivery address form
  const renderDeliveryForm = () => (
    <div className="card shadow-sm">
      <div className="card-header bg-primary bg-opacity-10">
        <h4 className="card-title mb-0">
          <FaMapMarkerAlt className="me-2" /> {t('orders.deliveryAddress')}
        </h4>
      </div>
      <div className="card-body">
        <div className="mb-3">
          <label htmlFor="delivery.street" className="form-label">{t('orders.street')}</label>
          <input
            type="text"
            className="form-control"
            id="delivery.street"
            name="delivery.street"
            value={formData.deliveryAddress.street}
            onChange={handleChange}
            required
          />
        </div>
        <div className="row mb-3">
          <div className="col-md-6">
            <label htmlFor="delivery.city" className="form-label">{t('orders.city')}</label>
            <input
              type="text"
              className="form-control"
              id="delivery.city"
              name="delivery.city"
              value={formData.deliveryAddress.city}
              onChange={handleChange}
              required
            />
          </div>
          <div className="col-md-6">
            <label htmlFor="delivery.state" className="form-label">{t('orders.state')}</label>
            <input
              type="text"
              className="form-control"
              id="delivery.state"
              name="delivery.state"
              value={formData.deliveryAddress.state}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        <div className="mb-3">
          <label htmlFor="recipient-mobile" className="form-label">
            <FaMobileAlt className="me-1" /> {t('orders.recipientMobile')}
          </label>
          <input
            type="tel"
            className="form-control"
            id="recipient-mobile"
            name="delivery.recipientMobileNumber"
            value={formData.deliveryAddress.recipientMobileNumber}
            onChange={handleChange}
            required
          />
        </div>
      </div>
    </div>
  );
  
  // Render package details form
  const renderPackageDetailsForm = () => (
    <div className="card shadow-sm">
      <div className="card-header bg-primary bg-opacity-10">
        <h4 className="card-title mb-0">
          {t('orders.packageDetails')}
        </h4>
      </div>
      <div className="card-body">
        <div className="row mb-3">
          <div className="col-md-6">
            <label htmlFor="package.weight" className="form-label">{t('orders.weight')}</label>
            <input
              type="number"
              className="form-control"
              id="package.weight"
              name="package.weight"
              value={formData.packageDetails.weight}
              onChange={handleChange}
              required
            />
          </div>
          <div className="col-md-6">
            <label htmlFor="package.dimensions" className="form-label">{t('orders.dimensions')}</label>
            <input
              type="text"
              className="form-control"
              id="package.dimensions"
              name="package.dimensions"
              value={formData.packageDetails.dimensions}
              onChange={handleChange}
            />
          </div>
        </div>
        <div className="mb-3">
          <label htmlFor="package.description" className="form-label">{t('orders.description')}</label>
          <textarea
            className="form-control"
            id="package.description"
            name="package.description"
            value={formData.packageDetails.description}
            onChange={handleChange}
          ></textarea>
        </div>
        <div className="form-check mb-3">
          <input
            type="checkbox"
            className="form-check-input"
            id="package.fragile"
            name="package.fragile"
            checked={formData.packageDetails.fragile}
            onChange={handleChange}
          />
          <label className="form-check-label" htmlFor="package.fragile">
            {t('orders.fragile')}
          </label>
        </div>
        <div className="mb-3">
          <label htmlFor="custom-price" className="form-label">
            <FaMoneyBillWave className="me-1" /> {t('orders.price')} (ريال سعودي)
          </label>
          <input
            type="number"
            className="form-control"
            id="custom-price"
            name="customPrice"
            value={formData.customPrice}
            onChange={handleChange}
            required
            placeholder={t('orders.enterPrice')}
          />
        </div>
      </div>
    </div>
  );
  
  // Render map location form
  const renderMapLocationForm = () => (
    <div className="card shadow-sm">
      <div className="card-header bg-primary bg-opacity-10">
        <h4 className="card-title mb-0">
          {t('orders.deliveryLocation')}
        </h4>
      </div>
      <div className="card-body">
        <div className="alert alert-info mb-4">
          <FaMapMarked className="me-2" />
          {t('orders.selectLocation')}
        </div>
        
        <div 
          ref={mapRef}
          className="border rounded mb-4"
          style={{ height: '300px', backgroundColor: '#f8f9fa' }}
        >
          <div className="d-flex justify-content-center align-items-center h-100 text-muted">
            {t('orders.mapPlaceholder')}
            <br />
            {t('orders.mapIntegration')}
          </div>
        </div>
        
        <div className="mb-4">
          <label className="form-label">{t('orders.selectedLocation')}</label>
          <input
            type="text"
            className="form-control"
            value={formData.mapLocation.address || t('orders.noLocationSelectedYet')}
            readOnly
          />
        </div>
        
        <div className="mb-4">
          <button
            type="button"
            className="btn btn-outline-secondary me-2"
            onClick={() => handleMapLocationSelect({
              lat: 37.7749,
              lng: -122.4194,
              address: formData.deliveryAddress.street + ', ' + 
                       formData.deliveryAddress.city + ', ' +
                       formData.deliveryAddress.state
            })}
          >
            {t('orders.useDeliveryAddress')}
          </button>
          
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => handleMapLocationSelect({
              lat: 37.7833,
              lng: -122.4167,
              address: 'Custom location selected on map'
            })}
          >
            {t('orders.simulateMapSelection')}
          </button>
        </div>
        
        <div className="alert alert-warning">
          <small>
            <strong>{t('orders.note')}:</strong> {t('orders.realImplementation')}
          </small>
        </div>
      </div>
    </div>
  );
  
  // Final form submit button (only shown on last step)
  const renderSubmitButton = () => {
    if (formStep === 4) {
      return (
        <button 
          type="submit" 
          className={`btn btn-primary btn-lg ${styles.submitBtn}`}
          disabled={loading || isSubmitting || (isFinalSubmit && contextLoading)}
          onClick={() => { userInitiatedSubmit.current = true; }} // Set flag on click
        >
          {loading || isSubmitting || (isFinalSubmit && contextLoading) ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              {t('orders.processing')}
            </>
          ) : (
            t('orders.createOrder')
          )}
        </button>
      );
    }
    return null;
  };
  
  return (
    <div className="container mt-4 mb-5">
      <h2 className="mb-4">{t('orders.createNewOrder')}</h2>
      
      <ProgressIndicator />
      
      {(error || contextError) && (
        <div className="alert alert-danger mb-4">
          {error || contextError}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        {renderForm()}
        
        <div className="d-flex justify-content-between mt-4">
          {formStep > 1 && (
            <button 
              type="button" 
              className="btn btn-outline-secondary"
              onClick={prevStep}
              disabled={loading || isSubmitting || (isFinalSubmit && contextLoading)}
            >
              {t('orders.previous')}
            </button>
          )}
          
          {formStep < 4 ? (
            <button 
              type="button" 
              className={`btn btn-primary ${formStep === 1 ? 'ms-auto' : ''}`}
              onClick={nextStep}
              disabled={loading || isSubmitting || (isFinalSubmit && contextLoading)}
            >
              {t('orders.next')}
            </button>
          ) : (
            renderSubmitButton()
          )}
        </div>
      </form>
    </div>
  );
};

export default NewOrderPage; 