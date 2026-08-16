import React from 'react';
import { Divider as AstryxDivider } from '@astryxdesign/core/Divider';

interface MiratsDividerProps {
  className?: string;
}

/**
 * Wrapper for Astryx Divider to be used in MIRATS 2.0.
 */
export function MiratsDivider({ className }: MiratsDividerProps) {
  return (
    <div className={className}>
      <AstryxDivider />
    </div>
  );
}
