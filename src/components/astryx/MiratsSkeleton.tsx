import React from 'react';
import { Skeleton as AstryxSkeleton } from '@astryxdesign/core/Skeleton';

interface MiratsSkeletonProps {
  width?: number | string;
  height?: number | string;
  radius?: 'none' | 0 | 1 | 2 | 3 | 4 | 'rounded';
  index?: number;
}

export function MiratsSkeleton({
  width = '100%',
  height = '100%',
  radius = 3,
  index = 0
}: MiratsSkeletonProps) {
  return (
    <AstryxSkeleton
      width={width}
      height={height}
      radius={radius}
      index={index}
    />
  );
}
