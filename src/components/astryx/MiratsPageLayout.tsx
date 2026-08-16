import React from 'react';
import { 
  Layout, 
  LayoutHeader, 
  LayoutContent,
  HStack,
  VStack
} from '@astryxdesign/core/Layout';

interface MiratsPageHeaderProps {
  title: string | React.ReactNode;
  description?: string;
  breadcrumbs?: React.ReactNode;
  actions?: React.ReactNode;
  padding?: 0 | 0.5 | 1 | 1.5 | 2 | 3 | 4 | 5 | 6 | 8 | 10;
  icon?: any; // Accepting Lucide icons or any node
}

/**
 * Wrapper for Astryx LayoutHeader to be used in MIRATS 2.0.
 * Replaces legacy PageHeader component.
 */
export function MiratsPageHeader({ 
  title, 
  description, 
  breadcrumbs,
  actions,
  padding = 4,
  icon: Icon
}: MiratsPageHeaderProps) {
  return (
    <LayoutHeader>
      <HStack align="center" justify="between" padding={padding}>
        <HStack align="center" gap={3}>
          {Icon && (
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Icon className="w-5 h-5 block" />
            </div>
          )}
          <VStack gap={1}>
            {breadcrumbs && <div className="mb-1">{breadcrumbs}</div>}
            <div className="flex flex-col">
              {/* Using raw tags for now until MiratsHeading is used directly */}
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
        </HStack>
        {actions && <HStack gap={2}>{actions}</HStack>}
      </HStack>
    </LayoutHeader>
  );
}

interface MiratsPageBodyProps {
  children: React.ReactNode;
  padding?: 0 | 0.5 | 1 | 1.5 | 2 | 3 | 4 | 5 | 6 | 8 | 10;
  className?: string; // Support for legacy transition
}

/**
 * Wrapper for Astryx LayoutContent to be used in MIRATS 2.0.
 * Replaces legacy PageBody component.
 */
export function MiratsPageBody({ 
  children, 
  padding = 4,
  className 
}: MiratsPageBodyProps) {
  return (
    <LayoutContent padding={padding} className={className}>
      {children}
    </LayoutContent>
  );
}

interface MiratsPageProps {
  children: React.ReactNode;
}

/**
 * Root Layout wrapper.
 */
export function MiratsPage({ children }: MiratsPageProps) {
  return (
    <Layout>
      {children}
    </Layout>
  );
}
