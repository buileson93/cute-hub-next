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
  label?: string;
  type?: 'badge' | 'dot';
  isPulsing?: boolean;
  icon?: any;
  showLabelWithDot?: boolean;
  className?: string;
  children?: React.ReactNode;
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
  showLabelWithDot = true,
  className,
  children
}: MiratsStatusProps) {
  // Mapping Mirats variant to Astryx variant
  let astryxVariant = variant as any;
  if (variant === 'secondary') astryxVariant = 'neutral';
  if (variant === 'outline') astryxVariant = 'neutral';
  if (variant === 'default') astryxVariant = 'neutral';

  const finalLabel = label || (typeof children === 'string' ? children : '');

  const content = type === 'dot' ? (
    <HStack align="center" gap={2}>
      <AstryxStatusDot 
        variant={astryxVariant === 'info' ? 'accent' : (['success', 'warning', 'error', 'accent', 'neutral'].includes(astryxVariant) ? astryxVariant : 'neutral')} 
        label={finalLabel} 
        isPulsing={isPulsing} 
      />
      {showLabelWithDot && <Text type="body">{finalLabel || children}</Text>}
    </HStack>
  ) : (
    <AstryxBadge 
      variant={astryxVariant} 
      label={finalLabel} 
      icon={icon} 
    />
  );

  return <div className={className}>{content}</div>;
}
