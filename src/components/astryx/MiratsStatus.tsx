import React from 'react';
import { Badge as AstryxBadge } from '@astryxdesign/core/Badge';
import { StatusDot as AstryxStatusDot } from '@astryxdesign/core/StatusDot';
import { HStack } from '@astryxdesign/core/Layout';
import { Text } from '@astryxdesign/core/Text';

export type MiratsStatusVariant = 
  | 'neutral' | 'info' | 'success' | 'warning' | 'error' 
  | 'blue' | 'cyan' | 'gray' | 'green' | 'orange' | 'pink' | 'purple' | 'red' | 'teal' | 'yellow'
  | 'secondary' | 'outline' | 'default';

interface MiratsStatusProps {
  variant: MiratsStatusVariant;
  label: string;
  type?: 'badge' | 'dot';
  isPulsing?: boolean;
  icon?: any;
  showLabelWithDot?: boolean;
  className?: string; // Support for legacy transition
}

/**
 * Unified wrapper for Astryx Badge and StatusDot.
 * Maps MIRATS domain variants to Astryx semantic variants.
 */
export function MiratsStatus({
  variant,
  label,
  type = 'badge',
  isPulsing = false,
  icon,
  showLabelWithDot = true
}: MiratsStatusProps) {
  // Mapping Mirats variant to Astryx variant
  let astryxVariant = variant as any;
  if (variant === 'secondary') astryxVariant = 'neutral';
  if (variant === 'outline') astryxVariant = 'neutral';
  if (variant === 'default') astryxVariant = 'neutral';

  if (type === 'dot') {
    const dotVariant = astryxVariant === 'info' ? 'accent' : 
                      (['success', 'warning', 'error', 'accent', 'neutral'].includes(astryxVariant) ? astryxVariant : 'neutral');
    
    return (
      <HStack align="center" gap={2}>
        <AstryxStatusDot 
          variant={dotVariant} 
          label={label} 
          isPulsing={isPulsing} 
        />
        {showLabelWithDot && <Text type="body">{label}</Text>}
      </HStack>
    );
  }

  return (
    <AstryxBadge 
      variant={astryxVariant} 
      label={label} 
      icon={icon} 
    />
  );
}
