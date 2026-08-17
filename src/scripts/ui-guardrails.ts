import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const SRC_DIR = join(process.cwd(), 'src');

interface Violation {
  file: string;
  rule: string;
  context: string;
}

const violations: Violation[] = [];

function checkFile(filePath: string) {
  const content = readFileSync(filePath, 'utf8');
  const relativePath = filePath.replace(process.cwd(), '');

  // Skip tests and scripts
  if (relativePath.includes('/__tests__/') || relativePath.includes('/scripts/')) return;

  // Rule 1: No window/document/requestAnimationFrame at module scope
  if (content.match(/^(const|let|var|export const|export let).+=\s*(window|document|requestAnimationFrame|localStorage)/m)) {
    violations.push({
      file: relativePath,
      rule: 'BROWSER_GLOBAL_MODULE_SCOPE',
      context: 'Detected browser global assignment at module scope.'
    });
  }

  // Rule 2: Static I/ClientOnly broad usage (Warning)
  if (content.includes('<ClientOnly') && !relativePath.includes('CayMindMap') && !relativePath.includes('VisualKpiChart')) {
    violations.push({
      file: relativePath,
      rule: 'BROAD_CLIENT_ONLY_USAGE',
      context: 'ClientOnly used outside allowed interactive islands.'
    });
  }

  // Rule 3: Hardcoded hex colors (Exclude known tokens and styles)
  if (!filePath.includes('styles.css') && !filePath.includes('status-tokens.ts') && !filePath.includes('ui-density.ts')) {
    const matches = content.match(/#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})/g);
    if (matches) {
      violations.push({
        file: relativePath,
        rule: 'HARDCODED_COLOR',
        context: `Found hardcoded hex: ${matches.slice(0, 3).join(', ')}`
      });
    }
  }
}

function walk(dir: string) {
  const files = readdirSync(dir);
  for (const file of files) {
    const path = join(dir, file);
    if (statSync(path).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
        walk(path);
      }
    } else {
      const ext = extname(path);
      if (['.ts', '.tsx'].includes(ext)) {
        checkFile(path);
      }
    }
  }
}

console.log('--- MIRATS UI Guardrails Audit (Refined) ---');
walk(SRC_DIR);

if (violations.length === 0) {
  console.log('✅ No architecture violations found.');
} else {
  console.log(`Found ${violations.length} violations:`);
  violations.forEach(v => {
    console.log(`[${v.rule}] ${v.file}: ${v.context}`);
  });
  // We don't exit 1 yet as we are in the "reporting" phase of P15
}
