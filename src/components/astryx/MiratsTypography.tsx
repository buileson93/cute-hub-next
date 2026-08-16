import React from 'react';
import { Heading as AstryxHeading, Text as AstryxText } from '@astryxdesign/core/Text';

interface MiratsHeadingProps {
  children: React.ReactNode;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  type?: 'display' | 'heading' | 'title' | 'label';
}

export function MiratsHeading({
  children,
  level = 2,
  type = 'heading'
}: MiratsHeadingProps) {
  return (
    <AstryxHeading level={level} type={type as any}>
      {children}
    </AstryxHeading>
  );
}

interface MiratsTextProps {
  children: React.ReactNode;
  type?: 'body' | 'label' | 'supporting' | 'code';
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
}

export function MiratsText({
  children,
  type = 'body',
  weight = 'regular'
}: MiratsTextProps) {
  return (
    <AstryxText type={type as any} weight={weight as any}>
      {children}
    </AstryxText>
  );
}
