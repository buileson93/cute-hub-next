import React from 'react';
import { Divider as AstryxDivider } from '@astryxdesign/core/Divider';

interface MiratsDividerProps {
  orientation?: 'horizontal' | 'vertical';
  variant?: 'subtle' | 'strong';
  label?: string;
}

export function MiratsDivider({
  orientation = 'horizontal',
  variant = 'subtle',
  label
}: MiratsDividerProps) {
  return (
    <AstryxDivider
      orientation={orientation}
      variant={variant}
      label={label}
    />
  );
}
