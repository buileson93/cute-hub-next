import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const SRC_DIR = 'src';
const ROUTES_DIR = 'src/routes';
const COMPONENTS_DIR = 'src/components';
const LIB_DIR = 'src/lib/mirats';
const OUTPUT_FILE = 'docs/ui/u5-baseline.json';

const EXCLUDE_FILES = ['routeTree.gen.ts', 'integrations/supabase/types.ts'];

function getFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const name = path.join(dir, file);
    if (fs.statSync(name).isDirectory()) {
      getFiles(name, fileList);
    } else {
      fileList.push(name);
    }
  });
  return fileList;
}

const allFiles = getFiles(SRC_DIR);
const filteredFiles = allFiles.filter(f => !EXCLUDE_FILES.some(ex => f.endsWith(ex)));

const fileLines = filteredFiles.map(f => ({
  file: f,
  lines: fs.readFileSync(f, 'utf8').split('\n').length
})).sort((a, b) => b.lines - a.lines);

const top30LargeFiles = fileLines.slice(0, 30);

const componentsMap = {};
const duplicateComponents = [];
allFiles.filter(f => f.endsWith('.tsx')).forEach(f => {
  const name = path.basename(f);
  if (!componentsMap[name]) componentsMap[name] = [];
  componentsMap[name].push(f);
});
for (const name in componentsMap) {
  if (componentsMap[name].length > 1) {
    duplicateComponents.push({ name, paths: componentsMap[name] });
  }
}

const filesOver800 = fileLines.filter(f => f.lines > 800).length;
const filesOver1200 = fileLines.filter(f => f.lines > 1200).length;

function getDirStats(parentDir) {
  if (!fs.existsSync(parentDir)) return {};
  const subDirs = fs.readdirSync(parentDir).filter(f => fs.statSync(path.join(parentDir, f)).isDirectory());
  const stats = {};
  subDirs.forEach(sub => {
    const files = getFiles(path.join(parentDir, sub));
    const counts = files.map(f => fs.readFileSync(f, 'utf8').split('\n').length);
    if (counts.length > 0) {
      stats[sub] = {
        avg: Math.round(counts.reduce((a, b) => a + b, 0) / counts.length),
        max: Math.max(...counts),
        count: files.length
      };
    }
  });
  return stats;
}
const componentsStats = getDirStats(COMPONENTS_DIR);
const libStats = getDirStats(LIB_DIR);

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const allDeps = Object.keys(pkg.dependencies || {});
const unusedDeps = [];
allDeps.forEach(dep => {
  try {
    const count = execSync(`grep -r "from ['\\"]${dep}['\\"]" src/ | head -n 1 | wc -l`, { encoding: 'utf8' }).trim();
    if (count === "0") unusedDeps.push(dep);
  } catch (e) {
    unusedDeps.push(dep);
  }
});

const routeFiles = getFiles(ROUTES_DIR).filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));
const routeArchitectureViolations = routeFiles.filter(f => {
  const content = fs.readFileSync(f, 'utf8');
  return /useQuery\(|supabase\./.test(content);
}).length;

const result = {
  timestamp: new Date().toISOString(),
  commit: execSync('git rev-parse HEAD').toString().trim(),
  overview: {
    totalLines: fileLines.reduce((a, b) => a + b.lines, 0),
    totalRoutes: routeFiles.length,
    totalComponentsTsx: allFiles.filter(f => f.endsWith('.tsx')).length,
    totalLibMiratsFiles: getFiles(LIB_DIR).length
  },
  top30LargeFiles,
  unusedExports: "Requires knip analysis",
  circularDependencies: "Requires madge analysis",
  duplicateComponents,
  fileThresholds: { over800: filesOver800, over1200: filesOver1200 },
  directoryStats: { components: componentsStats, libMirats: libStats },
  unusedDependencies: unusedDeps,
  routeArchitectureViolationsCount: routeArchitectureViolations
};

fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2));
console.log('Audit complete. Baseline saved to ' + OUTPUT_FILE);
