'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import TranslatedText from '@/components/TranslatedText';
import Logo from '@/components/Logo';
import { FaStar, FaArrowRight, FaPlay, FaBox, FaTruck, FaCheckCircle, FaArrowUp, FaRocket } from 'react-icons/fa';

interface CTAButton {
  text: string;
  link: string;
}

interface HeroSection {
  title: string;
  subtitle: string;
  cta: {
    primary: CTAButton;
    secondary: CTAButton;
  };
}

interface Service {
  icon: string;
  title: string;
  description: string;
}

interface Step {
  step: number;
  title: string;
  description: string;
}

interface CTASection {
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
}

interface HomeContent {
  hero: HeroSection;
  services: Service[];
  howItWorks: Step[];
  cta: CTASection;
}

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  
  // Fallback content structure
  const fallbackContent: HomeContent = {
    hero: {
      title: 'Fast & Reliable Shipping Services',
      subtitle: 'We connect you with professional drivers to deliver your packages safely and on time.',
      cta: {
        primary: { text: 'Sign Up', link: '/register' },
        secondary: { text: 'Login', link: '/login' }
      }
    },
    services: [
      {
        icon: 'bi-box-seam',
        title: 'Package Shipping',
        description: 'Fast and secure delivery of your packages to any destination.'
      },
      {
        icon: 'bi-truck',
        title: 'Same-Day Delivery',
        description: 'Get your packages delivered on the same day within city limits.'
      },
      {
        icon: 'bi-geo-alt',
        title: 'Real-Time Tracking',
        description: 'Track your package\'s location in real-time throughout its journey.'
      }
    ],
    howItWorks: [
      {
        step: 1,
        title: 'Create an Order',
        description: 'Enter your package details and shipping information.'
      },
      {
        step: 2,
        title: 'Driver Assignment',
        description: 'A nearby driver accepts your delivery request.'
      },
      {
        step: 3,
        title: 'Package Delivery',
        description: 'Your package is picked up and delivered to its destination.'
      }
    ],
    cta: {
      title: 'Ready to Ship Your Package?',
      subtitle: 'Join thousands of satisfied customers who trust our shipping service.',
      buttonText: 'Get Started',
      buttonLink: '/register'
    }
  };
  
  const [content, setContent] = useState<HomeContent>(fallbackContent);
  const [loadingContent, setLoadingContent] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    if (!loading && user) {
      // Redirect to dashboard if user is logged in
      if (user.role === 'ADMIN') {
        router.replace('/admin/dashboard');
      } else {
        router.replace('/dashboard');
      }
      return;
    }

    // Only fetch content if user is not logged in
    const fetchContent = async () => {
      try {
        const response = await axios.get('/api/content/home');
        setContent(response.data);
      } catch (error) {
        console.error('Error fetching home content:', error);
        // Keep using fallback content if API fails
        console.log('Using fallback content');
      } finally {
        setLoadingContent(false);
      }
    };

    fetchContent();
  }, [user, loading, router]);

  // Show loading state while checking auth or fetching content
  if (loading || loadingContent) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // If user is logged in, they will be redirected, so we don't need to show the home page
  if (user) {
    return null;
  }

  // Content should always be available due to fallback
  if (!content) {
    return (
      <div className="container text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading content...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="homepage-container">
      {/* Modern Header */}
      <header className="modern-header">
        <div className="container">
          <nav className="d-flex justify-content-between align-items-center py-3">
            <div className="logo-container">
              <Logo showText width={120} height={120} />
            </div>
            <div className="header-actions d-flex align-items-center gap-3">
              <LanguageSwitcher />
              <Link href={content.hero.cta.primary.link || '/login'} className="btn btn-outline-primary btn-sm">
                <TranslatedText text="nav.login" />
              </Link>
              <Link href={content.hero.cta.secondary.link || '/register'} className="btn btn-primary btn-sm">
                <TranslatedText text="nav.signup" />
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section - Split Layout */}
      <section className="hero-modern">
        <div className="container">
          <div className="row align-items-center py-5">
            <div className="col-lg-6">
              <div className="hero-content">
                <div className="hero-badge mb-4">
                  <span className="badge-text">
                    <FaStar className="me-2" />
                    #1 Shipping Platform
                  </span>
                </div>
                <h1 className="hero-title mb-4">
                  <TranslatedText text="app.title" />
                  <span className="title-accent">.</span>
                </h1>
                <p className="hero-subtitle mb-5">
                  <TranslatedText text="homepage.subtitle" />
                </p>
                <div className="hero-actions d-flex flex-column flex-sm-row gap-3 mb-5">
                  <Link href={content.hero.cta.secondary.link || '/register'} className="btn btn-hero-primary btn-lg">
                    <TranslatedText text="nav.signup" />
                    <FaArrowRight className="ms-2" />
                  </Link>
                  <Link href={content.hero.cta.primary.link || '/login'} className="btn btn-hero-secondary btn-lg">
                    <FaPlay className="me-2" />
                    <TranslatedText text="nav.login" />
                  </Link>
                </div>
                <div className="hero-stats">
                  <div className="row text-center">
                    <div className="col-4">
                      <div className="stat-item">
                        <div className="stat-number">10K+</div>
                        <div className="stat-label">Happy Customers</div>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="stat-item">
                        <div className="stat-number">50+</div>
                        <div className="stat-label">Cities</div>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="stat-item">
                        <div className="stat-number">24/7</div>
                        <div className="stat-label">Support</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
                         <div className="col-lg-6">
               <div className="hero-visual">
                 <div className="hero-image-container">
                   <div className="floating-card card-1">
                     <FaBox />
                     <span>Package Ready</span>
                   </div>
                   <div className="floating-card card-2">
                     <FaTruck />
                     <span>On the way</span>
                   </div>
                   <div className="floating-card card-3">
                     <FaCheckCircle />
                     <span>Delivered</span>
                   </div>
                   <div className="hero-illustration">
                     <div className="shipping-graphic">
                       <div className="truck-icon">
                         <FaTruck style={{ fontSize: '4rem', color: 'white' }} />
                       </div>
                       <div className="route-line"></div>
                       <div className="package-icon">
                         <FaBox style={{ fontSize: '3rem', color: 'white' }} />
                       </div>
                     </div>
                   </div>
                 </div>
               </div>
             </div>
          </div>
        </div>
        <div className="hero-wave">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"></path>
          </svg>
        </div>
      </section>

      {/* Services Section - Card Grid */}
      <section className="services-modern py-5">
        <div className="container py-5">
          <div className="section-header text-center mb-5">
            <div className="section-badge mb-3">
              <span><TranslatedText text="services.title" /></span>
            </div>
            <h2 className="section-title mb-4">What We Offer</h2>
            <p className="section-subtitle">Comprehensive shipping solutions for all your needs</p>
          </div>
          <div className="row g-4">
            {content.services.map((service, index) => (
              <div className="col-lg-4 col-md-6" key={index}>
                <div className="service-card-modern">
                  <div className="service-icon-modern">
                    {index === 0 && <FaBox />}
                    {index === 1 && <FaTruck />}
                    {index === 2 && <FaCheckCircle />}
                  </div>
                  <div className="service-content">
                    <h3 className="service-title">
                      <TranslatedText text={`homepage.services.${index}.title`} />
                    </h3>
                    <p className="service-description">
                      <TranslatedText text={`homepage.services.${index}.description`} />
                    </p>
                  </div>
                  <div className="service-arrow">
                    <FaArrowUp />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Timeline */}
      <section className="process-modern py-5">
        <div className="container py-5">
          <div className="section-header text-center mb-5">
            <div className="section-badge mb-3">
              <span><TranslatedText text="howItWorks.title" /></span>
            </div>
            <h2 className="section-title mb-4">Simple Process</h2>
            <p className="section-subtitle">Get your package delivered in just 3 easy steps</p>
          </div>
          <div className="process-timeline">
            <div className="row">
              {content.howItWorks.map((step, index) => (
                <div className="col-lg-4" key={index}>
                  <div className="process-step">
                    <div className="step-number">{step.step}</div>
                    <div className="step-content">
                      <h3 className="step-title">
                        <TranslatedText text={`homepage.howItWorks.${index}.title`} />
                      </h3>
                      <p className="step-description">
                        <TranslatedText text={`homepage.howItWorks.${index}.description`} />
                      </p>
                    </div>
                                         {index < content.howItWorks.length - 1 && (
                       <div className="step-connector">
                         <FaArrowRight />
                       </div>
                     )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Modern Design */}
      <section className="cta-modern">
        <div className="container">
                     <div className="cta-content-modern text-center">
             <div className="cta-icon mb-4">
               <FaRocket />
             </div>
            <h2 className="cta-title mb-4">
              <TranslatedText text="homepage.cta.title" />
            </h2>
            <p className="cta-subtitle mb-5">
              <TranslatedText text="homepage.cta.subtitle" />
            </p>
                         <div className="cta-actions">
               <Link href={content.cta.buttonLink || '/register'} className="btn btn-cta-primary btn-lg me-3">
                 <TranslatedText text="homepage.cta.buttonText" />
                 <FaArrowRight className="ms-2" />
               </Link>
               <Link href="/login" className="btn btn-cta-secondary btn-lg">
                 <FaPlay className="me-2" />
                 <TranslatedText text="nav.login" />
               </Link>
             </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer-modern py-4">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-md-6">
              <div className="d-flex align-items-center">
                <Logo width={60} height={60} />
                <span className="footer-text ms-3">© 2024 Khatak. All rights reserved.</span>
              </div>
            </div>
            <div className="col-md-6 text-md-end mt-3 mt-md-0">
              <div className="footer-links">
                <Link href="/privacy" className="footer-link me-4">Privacy</Link>
                <Link href="/terms" className="footer-link me-4">Terms</Link>
                <Link href="/contact" className="footer-link">Contact</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 