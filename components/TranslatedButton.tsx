'use client';

import React from 'react';
import { Button as BootstrapButton, ButtonProps } from 'react-bootstrap';
import { useLanguage } from '@/contexts/LanguageContext';

interface TranslatedButtonProps extends ButtonProps {
  translationKey?: string;
}

/**
 * A button component that ensures its content is properly translated
 */
const TranslatedButton: React.FC<TranslatedButtonProps> = ({
  children,
  translationKey,
  ...props
}) => {
  const { t } = useLanguage();
  
  // If a translation key is provided, use it for translation
  // Otherwise, use the children content for translation if it's a string
  const content = translationKey
    ? t(translationKey)
    : typeof children === 'string' && children.includes('.')
    ? t(children)
    : children;
  
  return (
    <BootstrapButton {...props}>
      {content}
    </BootstrapButton>
  );
};

export default TranslatedButton; 