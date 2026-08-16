import React from 'react';
import { Badge as AstryxBadge } from '@astryxdesign/core/Badge';
import { StatusDot as AstryxStatusDot } from '@astryxdesign/core/StatusDot';
import { HStack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';

export type MiratsStatusVariant = 'success' | 'warning' | 'error' | 'info' | 'accent' | 'neutral';

interface MiratsStatusProps {
  variant: MiratsStatusVariant;
  label: string;
  type?: 'badge' | 'dot';
  isPulsing?: boolean;
  icon?: React.ReactNode;
  showLabelWithDot?: boolean;
}

/**
 * Unified status component for MIRATS 2.0.
 * Can render as a Badge or a StatusDot based on the type prop.
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
  // Astryx Badge supports: neutral, info, success, warning, error, plus color variants
  // Astryx StatusDot supports: success, warning, error, accent, neutral
  
  const astryxVariant = variant as any;

  if (type === 'dot') {
    return (
      <HStack align="center" gap={2}>
        <AstryxStatusDot 
          variant={astryxVariant === 'info' ? 'accent' : astryxVariant} 
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
