import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const SRC_DIR = join(process.cwd(), 'src');
const ALLOWED_ISLANDS = [
  'AstryxProvider.tsx',
  'CayMindMap.tsx',
  'VisualKpiChart.tsx',
  'NodeEditorSheet.tsx'
];

interface Violation {
  file: string;
  rule: string;
  context: string;
}

const violations: Violation[] = [];

function checkFile(filePath: string) {
  const content = readFileSync(filePath, 'utf8');
  const relativePath = filePath.replace(process.cwd(), '');

  // Rule 1: No window/document at module scope (outside functions/useEffect)
  // This is a naive regex but catches common module-level assignments
  if (content.match(/^(const|let|var).+=\s*(window|document|requestAnimationFrame|localStorage)/m)) {
    violations.push({
      file: relativePath,
      rule: 'BROWSER_GLOBAL_MODULE_SCOPE',
      context: 'Detected browser global assignment at module scope.'
    });
  }

  // Rule 2: No .client.tsx imports in non-hydrated files
  if (relativePath.endsWith('.tsx') && !content.includes('useEffect') && content.includes('.client"')) {
    violations.push({
      file: relativePath,
      rule: 'UNGUARDED_CLIENT_IMPORT',
      context: 'Importing .client module without hydration guard.'
    });
  }

  // Rule 3: Missing aria-label on icon-only buttons
  // Look for buttons that only contain an Icon but no text or aria-label
  if (content.includes('<Button') && !content.includes('aria-label') && content.match(/<Button[^>]*>\s*<[A-Z][a-zA-Z]+Icon/)) {
    // This is a warning - not all buttons with icons are icon-only, but it's a good indicator
    violations.push({
      file: relativePath,
      rule: 'POSSIBLE_MISSING_A11Y_LABEL',
      context: 'Button with Icon but no aria-label detected.'
    });
  }
  
  // Rule 4: Hardcoded hex colors
  if (content.match(/#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})/g) && !filePath.includes('styles.css') && !filePath.includes('tailwind.config')) {
    const matches = content.match(/#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})/g);
    violations.push({
      file: relativePath,
      rule: 'HARDCODED_COLOR',
      context: `Found hardcoded hex: ${matches?.slice(0, 3).join(', ')}`
    });
  }
}

function walk(dir: string) {
  const files = readdirSync(dir);
  for (const file of files) {
    const path = join(dir, file);
    if (statSync(path).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
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

console.log('--- MIRATS UI Guardrails Audit ---');
walk(SRC_DIR);

if (violations.length === 0) {
  console.log('✅ No architecture violations found.');
} else {
  console.log(`Found ${violations.length} violations:`);
  violations.forEach(v => {
    console.log(`[${v.rule}] ${v.file}: ${v.context}`);
  });
  process.exit(1);
}
