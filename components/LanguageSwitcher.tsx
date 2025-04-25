'use client';

import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from 'react-bootstrap';

interface LanguageSwitcherProps {
  className?: string;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ className }) => {
  const { language, setLanguage, t } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  return (
    <Button 
      onClick={toggleLanguage} 
      variant="outline-secondary" 
      size="sm" 
      className={className}
    >
      {t('language.switch')}
    </Button>
  );
};

export default LanguageSwitcher; 