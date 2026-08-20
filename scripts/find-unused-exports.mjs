import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const LIB_DIR = 'src/lib/mirats';
function getFiles(dir, fileList = []) {
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

const files = getFiles(LIB_DIR).filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));
const unused = [];

console.log(`Checking ${files.length} files in ${LIB_DIR}...`);

files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const exportMatches = content.matchAll(/export (const|function|interface|type|class|enum) (\w+)/g);
  for (const match of exportMatches) {
    const name = match[2];
    try {
      // Tìm xem tên này có được import ở file khác không (loại trừ file hiện tại)
      const count = execSync(`grep -r "${name}" src/ --exclude="${f}" | wc -l`).toString().trim();
      if (parseInt(count) === 0) {
        unused.push({ name, file: f });
      }
    } catch (e) {}
  }
});

console.log(JSON.stringify(unused, null, 2));
