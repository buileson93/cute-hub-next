import React from 'react';
import { Theme } from '@astryxdesign/core/theme';
import { neutralTheme } from '@astryxdesign/theme-neutral/built';
import { Button } from '@astryxdesign/core/Button';
import { Badge } from '@astryxdesign/core/Badge';

/**
 * AstryxCompileProbe
 * 
 * MỤC TIÊU: Chứng minh khả năng compile với Astryx/StyleX.
 * KHÔNG được import vào ứng dụng thực tế trong Phase 1.
 */
export const AstryxCompileProbe = () => {
  return (
    <Theme theme={neutralTheme}>
      <div style={{ padding: '20px', display: 'flex', gap: '10px', flexDirection: 'column' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold' }}>Astryx Compile Probe</h1>
        
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Button 
            label="Astryx Pilot Button" 
            variant="primary" 
            onClick={() => console.log('Astryx button clicked')} 
          />
          
          <Badge 
            label="v0.4.2" 
            variant="info" 
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Button 
            label="Secondary Action" 
            variant="secondary" 
          />
          <Badge 
            label="Beta" 
            variant="purple" 
          />
        </div>
      </div>
    </Theme>
  );
};
