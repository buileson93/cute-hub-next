import React from 'react';
import { EmptyState as AstryxEmptyState } from '@astryxdesign/core/EmptyState';

interface MiratsEmptyStateProps {
  title: string;
  description?: string;
  icon?: any;
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Wrapper for Astryx EmptyState to be used in MIRATS 2.0.
 */
export function MiratsEmptyState({
  title,
  description,
  icon,
  actions,
  className
}: MiratsEmptyStateProps) {
  return (
    <div className={className}>
      <AstryxEmptyState
        title={title}
        description={description}
        icon={icon}
        actions={actions}
      />
    </div>
  );
}
