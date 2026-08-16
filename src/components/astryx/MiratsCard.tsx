import React from 'react';
import { Card as AstryxCard } from '@astryxdesign/core/Card';
import { type StyleXStyles } from '@astryxdesign/core';

interface MiratsCardProps {
  children: React.ReactNode;
  padding?: 0 | 0.5 | 1 | 1.5 | 2 | 3 | 4 | 5 | 6 | 8 | 10;
  className?: string; // For legacy Tailwind compatibility if absolutely needed, but preferred via props
  elevation?: 'none' | 'low' | 'med' | 'high';
  xstyle?: StyleXStyles;
}

/**
 * Wrapper for Astryx Card to be used in MIRATS 2.0.
 * Replaces legacy shadcn Card or custom div containers.
 */
export function MiratsCard({ 
  children, 
  padding = 4, 
  elevation = 'low',
  xstyle 
}: MiratsCardProps) {
  return (
    <AstryxCard padding={padding} elevation={elevation} xstyle={xstyle}>
      {children}
    </AstryxCard>
  );
}
