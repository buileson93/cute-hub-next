import React from 'react';
import { Theme } from '@astryxdesign/core/theme';
import { vatmTheme } from '@/styles/theme-vatm';
import { Button } from '@astryxdesign/core/Button';
import { Badge } from '@astryxdesign/core/Badge';

/**
 * AstryxCompileProbe
 * 
 * MỤC TIÊU: Chứng minh khả năng compile với Astryx/StyleX và Theme VATM.
 * KHÔNG được import vào ứng dụng thực tế trong Phase 3.
 */
export const AstryxCompileProbe = () => {
  return (
    <Theme theme={vatmTheme}>
      <div style={{ padding: '24px', display: 'flex', gap: '16px', flexDirection: 'column', backgroundColor: 'var(--color-background-surface)', borderRadius: 'var(--radius-container)' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--color-text-primary)', fontFamily: 'var(--font-family-heading)' }}>
          VATM Theme Foundation Probe
        </h1>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Button 
            label="VATM Primary Button" 
            variant="primary" 
            onClick={() => console.log('VATM button clicked')} 
          />
          
          <Badge 
            label="MIRATS 2.0 Blue" 
            variant="info" 
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Button 
            label="Graphite Secondary" 
            variant="secondary" 
          />
          <Badge 
            label="Warning Orange" 
            variant="warning" 
          />
        </div>

        <div style={{ marginTop: '16px', padding: '12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-element)' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 'semibold', marginBottom: '8px' }}>Token Inspector</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '12px', fontFamily: 'var(--font-family-code)' }}>
            <span>--color-accent:</span> <span style={{ color: 'var(--color-accent)' }}>#1C51E0</span>
            <span>--color-warning:</span> <span style={{ color: 'var(--color-warning)' }}>#FF8F00</span>
            <span>--radius-element:</span> <span>8px</span>
            <span>--radius-container:</span> <span>16px</span>
            <span>--duration-medium:</span> <span>200ms</span>
          </div>
        </div>
      </div>
    </Theme>
  );
};
