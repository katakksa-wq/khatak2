'use client';

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

type TranslatedTextProps = {
  text: string;
  className?: string;
  tag?: keyof JSX.IntrinsicElements;
  translation?: boolean; // If true, treats the text as a translation key, otherwise treats it as direct text
  children?: React.ReactNode;
};

/**
 * A component to handle text translation
 * Use this to wrap any text that needs to be translated
 */
const TranslatedText: React.FC<TranslatedTextProps> = ({
  text,
  className,
  tag = 'span',
  translation = true,
  children,
}) => {
  const { t } = useLanguage();
  const Tag = tag;
  
  const translatedText = translation ? t(text) : text;
  
  return (
    <Tag className={className}>
      {translatedText}
      {children}
    </Tag>
  );
};

export default TranslatedText; 