'use client';

import React, { ReactNode } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * A Higher Order Component (HOC) that automatically translates strings in the children tree
 * @param Component The component to wrap
 * @returns A wrapped component with auto-translation
 */
function withAutoTranslation<P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> {
  return (props: P) => {
    const { t } = useLanguage();

    // Helper function to process children and translate strings
    const processChildren = (children: ReactNode): ReactNode => {
      if (!children) return children;

      if (typeof children === 'string') {
        // Don't translate if it looks like a translation key
        if (children.includes('.') && /^[a-zA-Z0-9.]+$/.test(children)) {
          return t(children);
        }
        return children;
      }

      if (Array.isArray(children)) {
        return children.map((child, index) => processChildren(child));
      }

      if (React.isValidElement(children)) {
        const childProps = { ...children.props };
        
        // Process the props that might contain strings
        Object.keys(childProps).forEach((propName) => {
          if (typeof childProps[propName] === 'string') {
            // Don't translate props that should remain unchanged
            if (!['key', 'id', 'name', 'href', 'src', 'type', 'className'].includes(propName)) {
              childProps[propName] = processChildren(childProps[propName]);
            }
          } else if (propName === 'children') {
            childProps.children = processChildren(childProps.children);
          }
        });

        return React.cloneElement(children, childProps);
      }

      return children;
    };

    // @ts-ignore - TypeScript doesn't know about the children prop
    const newProps = { ...props, children: processChildren(props.children) };
    return <Component {...newProps} />;
  };
}

export default withAutoTranslation; 