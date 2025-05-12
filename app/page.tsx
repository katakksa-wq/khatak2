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
  const [content, setContent] = useState<HomeContent | null>(null);
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

  if (!content) {
    return (
      <div className="container text-center py-5">
        <div className="alert alert-warning" role="alert">
          No content available. Redirecting...
        </div>
        <Link href="/login" className="btn btn-primary">
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <main className="container-fluid p-0">
      {/* Header with language switcher */}
      <header className="bg-light py-2">
        <div className="container d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <Logo showText width={140} height={140} />
          </div>
          <LanguageSwitcher />
        </div>
      </header>
      
      {/* Hero Section */}
      <section className="bg-primary text-white text-center py-4 py-md-5">
        <div className="container py-3 py-md-5">
          <div className="text-center mb-4">
            <Logo width={280} height={280} className="mb-3" />
          </div>
          <h1 className="display-5 display-md-4 fw-bold mb-3 mb-md-4"><TranslatedText text="app.title" /></h1>
          <p className="lead mb-4">
            <TranslatedText text="homepage.subtitle" />
          </p>
          <div className="d-flex flex-column flex-sm-row justify-content-center gap-2 gap-sm-3">
            <Link href={content?.hero.cta.primary.link || '/login'} className="btn btn-light btn-lg px-4">
              <TranslatedText text="nav.login" />
            </Link>
            <Link href={content?.hero.cta.secondary.link || '/signup'} className="btn btn-outline-light btn-lg px-4">
              <TranslatedText text="nav.signup" />
            </Link>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-4 py-md-5">
        <div className="container">
          <h2 className="text-center mb-4 mb-md-5"><TranslatedText text="services.title" /></h2>
          <div className="row g-3 g-md-4">
            {content?.services.map((service, index) => (
              <div className="col-12 col-sm-6 col-md-4" key={index}>
                <div className="card h-100 border-0 shadow-sm">
                  <div className="card-body text-center p-3 p-md-4">
                    <div className="mb-3">
                      <i className={`bi ${service.icon} text-primary`} style={{ fontSize: '2.5rem' }}></i>
                    </div>
                    <h3 className="card-title h5"><TranslatedText text={`homepage.services.${index}.title`} /></h3>
                    <p className="card-text">
                      <TranslatedText text={`homepage.services.${index}.description`} />
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-4 py-md-5 bg-light">
        <div className="container">
          <h2 className="text-center mb-4 mb-md-5"><TranslatedText text="howItWorks.title" /></h2>
          <div className="row justify-content-center">
            <div className="col-lg-10">
              <div className="d-flex flex-column flex-sm-row gap-4">
                {content?.howItWorks.map((step, index) => (
                  <div className="text-center mb-3 mb-sm-0" key={index}>
                    <div className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '60px', height: '60px' }}>
                      <span className="fs-4">{step.step}</span>
                    </div>
                    <h3 className="h5"><TranslatedText text={`homepage.howItWorks.${index}.title`} /></h3>
                    <p className="mb-0"><TranslatedText text={`homepage.howItWorks.${index}.description`} /></p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-4 py-md-5 bg-primary text-white">
        <div className="container text-center">
          <h2 className="mb-3 mb-md-4"><TranslatedText text="homepage.cta.title" /></h2>
          <p className="lead mb-3 mb-md-4"><TranslatedText text="homepage.cta.subtitle" /></p>
          <Link href={content?.cta.buttonLink || '/signup'} className="btn btn-light btn-lg px-4">
            <TranslatedText text="homepage.cta.buttonText" />
          </Link>
        </div>
      </section>
    </main>
  );
} 