import fs from 'fs';
import path from 'path';

const SCAN_PATTERNS = [
  { name: 'Private Key (B64)', regex: /private_key_b64["']?\s*[:=]\s*["']?[A-Za-z0-9+/=]{40,}["']?/gi },
  { name: 'Supabase Service Role Key', regex: /sb_secret_[a-f0-9]{32,}/gi },
  { name: 'Generic Private Key Header', regex: /-----BEGIN (RSA|EC|PRIVATE) KEY-----/g },
  { name: 'Potential PII (Email in CSV)', regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, filter: (file) => file.endsWith('.csv') }
];

const IGNORE_PATHS = [
  'node_modules',
  '.git',
  'dist',
  '.vinxi',
  '.output',
  'scripts/security-scan.mjs'
];

async function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const findings = [];

  for (const pattern of SCAN_PATTERNS) {
    if (pattern.filter && !pattern.filter(filePath)) continue;
    
    const matches = content.match(pattern.regex);
    if (matches) {
      findings.push({ name: pattern.name, count: matches.length });
    }
  }

  return findings;
}

async function walk(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (IGNORE_PATHS.some(p => filePath.includes(p))) continue;
    
    if (fs.statSync(filePath).isDirectory()) {
      await walk(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  }
  return fileList;
}

async function run() {
  console.log('--- MIRATS Security Scanner ---');
  const allFiles = await walk('.');
  let totalFindings = 0;

  for (const file of allFiles) {
    const findings = await scanFile(file);
    if (findings.length > 0) {
      console.error(`[FAIL] ${file}:`);
      findings.forEach(f => console.error(`  - ${f.name} found (${f.count} times)`));
      totalFindings += findings.length;
    }
  }

  if (totalFindings > 0) {
    console.log(`\nScan completed: ${totalFindings} issues found.`);
    process.exit(1);
  } else {
    console.log('\nScan completed: No secrets or PII detected in source tree.');
    process.exit(0);
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
