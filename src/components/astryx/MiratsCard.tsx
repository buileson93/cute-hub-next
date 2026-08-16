import React from 'react';
import { Card as AstryxCard } from '@astryxdesign/core/Card';

interface MiratsCardProps {
  children: React.ReactNode;
  padding?: 0 | 0.5 | 1 | 1.5 | 2 | 3 | 4 | 5 | 6 | 8 | 10;
  className?: string;
  id?: string; // Support for legacy transition
  elevation?: 'none' | 'low' | 'med' | 'high';
  xstyle?: any; // Falling back to any to avoid StyleX import issues for now
}

/**
 * Wrapper for Astryx Card to be used in MIRATS 2.0.
 * Replaces legacy shadcn Card or custom div containers.
 */
export function MiratsCard({ 
  children, 
  padding = 4, 
  elevation = 'low',
  className,
  id,
  xstyle 
}: MiratsCardProps) {
  return (
    <div className={className} id={id}>
      <AstryxCard padding={padding} elevation={elevation} xstyle={xstyle}>
        {children}
      </AstryxCard>
    </div>
  );
}
