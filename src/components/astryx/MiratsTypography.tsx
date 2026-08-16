import React from 'react';
import { Heading as AstryxHeading, Text as AstryxText } from '@astryxdesign/core/Text';

interface MiratsHeadingProps {
  children: React.ReactNode;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  type?: 'display' | 'heading' | 'title' | 'label';
  className?: string;
}

export function MiratsHeading({
  children,
  level = 2,
  type = 'heading',
  className
}: MiratsHeadingProps) {
  return (
    <div className={className}>
      <AstryxHeading level={level} type={type as any}>
        {children}
      </AstryxHeading>
    </div>
  );
}

interface MiratsTextProps {
  children: React.ReactNode;
  type?: 'body' | 'label' | 'supporting' | 'code';
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
  className?: string;
}

export function MiratsText({
  children,
  type = 'body',
  weight = 'regular',
  className
}: MiratsTextProps) {
  return (
    <div className={className}>
      <AstryxText type={type as any} weight={weight as any}>
        {children}
      </AstryxText>
    </div>
  );
}
