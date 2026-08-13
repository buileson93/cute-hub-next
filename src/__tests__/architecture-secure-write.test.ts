import { describe, it, expect, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Kiểm thử chống hồi quy: Secure Write Pipeline', () => {
  it('Không được cập nhật trực tiếp cột "ten" từ components hoặc routes', () => {
    const rootDir = path.resolve(__dirname, '../../');
    const foldersToScan = ['src/components', 'src/routes'];
    
    const forbiddenPatterns = [
      /\.update\(\{\s*ten\s*:/,
      /\.update\(\{\s*ten_thiet_bi\s*:/,
    ];

    const violations: string[] = [];

    function scan(dir: string) {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
          scan(fullPath);
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          for (const pattern of forbiddenPatterns) {
            if (pattern.test(content)) {
              // Ngoại lệ cho các hàm legacy hoặc wrapper đã được duyệt (nếu có)
              // Hiện tại ta siết chặt: 0 vi phạm.
              violations.push(`${fullPath} contains direct name update`);
            }
          }
        }
      }
    }

    foldersToScan.forEach(folder => {
      const fullPath = path.join(rootDir, folder);
      if (fs.existsSync(fullPath)) scan(fullPath);
    });

    if (violations.length > 0) {
      console.error('Phát hiện vi phạm quy tắc Secure Write Pipeline:');
      violations.forEach(v => console.error(`- ${v}`));
    }

    expect(violations.length, 'Phát hiện code cập nhật tên trực tiếp bên ngoài lib!').toBe(0);
  });
});
