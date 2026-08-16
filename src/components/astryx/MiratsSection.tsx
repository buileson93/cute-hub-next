import React from 'react';
import { Section as AstryxSection } from '@astryxdesign/core/Section';

interface MiratsSectionProps {
  children: React.ReactNode;
  padding?: 0 | 0.5 | 1 | 1.5 | 2 | 3 | 4 | 5 | 6 | 8 | 10;
  className?: string;
}

/**
 * Wrapper for Astryx Section to be used in MIRATS 2.0.
 */
export function MiratsSection({ 
  children, 
  padding = 4, 
  className 
}: MiratsSectionProps) {
  return (
    <div className={className}>
      <AstryxSection padding={padding}>
        {children}
      </AstryxSection>
    </div>
  );
}
