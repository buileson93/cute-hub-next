import React from 'react';
import { EmptyState as AstryxEmptyState } from '@astryxdesign/core/EmptyState';

interface MiratsEmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  isCompact?: boolean;
}

export function MiratsEmptyState({
  title,
  description,
  icon,
  actions,
  isCompact = false
}: MiratsEmptyStateProps) {
  return (
    <AstryxEmptyState
      title={title}
      description={description}
      icon={icon}
      actions={actions}
      isCompact={isCompact}
    />
  );
}
