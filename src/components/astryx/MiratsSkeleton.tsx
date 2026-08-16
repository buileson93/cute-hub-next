import React from 'react';
import { Skeleton as AstryxSkeleton } from '@astryxdesign/core/Skeleton';

interface MiratsSkeletonProps {
  width?: number | string;
  height?: number | string;
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  className?: string;
}

/**
 * Wrapper for Astryx Skeleton to be used in MIRATS 2.0.
 */
export function MiratsSkeleton({
  width,
  height,
  radius = 'md',
  className
}: MiratsSkeletonProps) {
  // Mapping radius to Astryx tokens
  let astryxRadius: any = 'rounded';
  if (radius === 'none') astryxRadius = 'none';
  if (radius === 'full') astryxRadius = 'rounded'; // Astryx might not have a full circle token yet, fallback to rounded

  return (
    <div className={className}>
      <AstryxSkeleton 
        width={width as any} 
        height={height as any} 
        radius={astryxRadius} 
      />
    </div>
  );
}
