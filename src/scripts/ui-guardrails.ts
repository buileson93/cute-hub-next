import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const SRC_DIR = join(process.cwd(), 'src');

interface Violation {
  file: string;
  rule: string;
  context: string;
  severity: 'error' | 'warn';
}

const violations: Violation[] = [];

// Allowlist for browser-only or complex interactive islands
const ALLOWED_ISLANDS = [
  'CayMindMap.tsx',
  'VisualKpiChart.tsx',
  'NodeEditorSheet.tsx',
  'AstryxProvider.tsx',
  'AppShell.tsx',
  'AtcTowerScene.tsx',
  'Model3DViewer.tsx'
];

function checkFile(filePath: string) {
  const content = readFileSync(filePath, 'utf8');
  const relativePath = filePath.replace(process.cwd(), '');

  // Skip tests, scripts, and internal libs
  if (relativePath.includes('/__tests__/') || 
      relativePath.includes('/scripts/') || 
      relativePath.includes('/integrations/supabase/')) return;

  // Rule 1: No window/document/requestAnimationFrame at module scope
  if (content.match(/^(const|let|var|export const|export let).+=\s*(window|document|requestAnimationFrame|localStorage)/m)) {
    violations.push({
      file: relativePath,
      rule: 'BROWSER_GLOBAL_MODULE_SCOPE',
      context: 'Detected browser global assignment at module scope.',
      severity: 'error'
    });
  }

  // Rule 2: Static I/ClientOnly broad usage
  if (content.includes('<ClientOnly') && !ALLOWED_ISLANDS.some(island => relativePath.includes(island))) {
    violations.push({
      file: relativePath,
      rule: 'BROAD_CLIENT_ONLY_USAGE',
      context: 'ClientOnly used outside allowed interactive islands.',
      severity: 'warn'
    });
  }

  // Rule 3: Hardcoded hex colors (Exclude known tokens and styles)
  if (!filePath.includes('styles.css') && 
      !filePath.includes('status-tokens.ts') && 
      !filePath.includes('ui-density.ts') &&
      !filePath.includes('astryx-component-skins.css')) {
    const matches = content.match(/#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})/g);
    if (matches) {
      violations.push({
        file: relativePath,
        rule: 'HARDCODED_COLOR',
        context: `Found hardcoded hex: ${matches.slice(0, 3).join(', ')}`,
        severity: 'warn'
      });
    }
  }

  // Rule 4: No StyleX/runtime styling outside B-S skins
  if (content.includes('@stylexjs/stylex')) {
    violations.push({
      file: relativePath,
      rule: 'DIRECT_STYLEX_USAGE',
      context: 'Direct StyleX usage detected. Use Astryx B-S skins or tokens instead.',
      severity: 'error'
    });
  }
  
  // Rule 5: Missing a11y label on icon-only buttons
  if (content.includes('<Button') && 
      !content.includes('aria-label') && 
      content.match(/<Button[^>]*>\s*<[A-Z][a-zA-Z]+Icon/)) {
    violations.push({
      file: relativePath,
      rule: 'MISSING_A11Y_LABEL',
      context: 'Icon-only button missing aria-label.',
      severity: 'warn'
    });
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

console.log('--- MIRATS UI Guardrails Audit (P15) ---');
walk(SRC_DIR);

const errors = violations.filter(v => v.severity === 'error');
const warnings = violations.filter(v => v.severity === 'warn');

if (violations.length === 0) {
  console.log('✅ No architecture violations found.');
} else {
  console.log(`Found ${errors.length} errors and ${warnings.length} warnings:`);
  violations.forEach(v => {
    console.log(`[${v.severity.toUpperCase()}] [${v.rule}] ${v.file}: ${v.context}`);
  });
}

// Exit 1 only if there are architectural errors, allowing warnings for cleanup
if (errors.length > 0) {
  process.exit(1);
}

