import React from 'react';
import { Section as AstryxSection } from '@astryxdesign/core/Section';

interface MiratsSectionProps {
  children: React.ReactNode;
  variant?: 'section' | 'transparent' | 'muted';
  padding?: 0 | 0.5 | 1 | 1.5 | 2 | 3 | 4 | 5 | 6 | 8 | 10;
  dividers?: Array<'top' | 'bottom' | 'start' | 'end'>;
}

export function MiratsSection({
  children,
  variant = 'section',
  padding = 4,
  dividers
}: MiratsSectionProps) {
  return (
    <AstryxSection
      variant={variant}
      padding={padding}
      dividers={dividers}
    >
      {children}
    </AstryxSection>
  );
}
