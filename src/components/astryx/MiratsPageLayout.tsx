import React from 'react';
import { LayoutHeader, LayoutContent } from '@astryxdesign/core/Layout';
import { HStack, VStack } from '@astryxdesign/core/Stack';

interface MiratsPageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  breadcrumbs?: React.ReactNode;
  actions?: React.ReactNode;
  padding?: 0 | 0.5 | 1 | 1.5 | 2 | 3 | 4 | 5 | 6 | 8 | 10;
}

export function MiratsPageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  padding = 4
}: MiratsPageHeaderProps) {
  return (
    <LayoutHeader>
      <HStack align="center" justify="between" padding={padding}>
        <VStack gap={1}>
          {breadcrumbs && <div className="mb-1">{breadcrumbs}</div>}
          <div className="flex flex-col">
            {typeof title === 'string' ? (
              <h1 className="text-xl font-bold tracking-tight">{title}</h1>
            ) : (
              title
            )}
            {description && (
              <div className="text-sm text-muted-foreground">{description}</div>
            )}
          </div>
        </VStack>
        {actions && <HStack gap={2}>{actions}</HStack>}
      </HStack>
    </LayoutHeader>
  );
}

interface MiratsPageBodyProps {
  children: React.ReactNode;
  padding?: 0 | 0.5 | 1 | 1.5 | 2 | 3 | 4 | 5 | 6 | 8 | 10;
}

export function MiratsPageBody({
  children,
  padding = 6
}: MiratsPageBodyProps) {
  return (
    <LayoutContent padding={padding}>
      {children}
    </LayoutContent>
  );
}
