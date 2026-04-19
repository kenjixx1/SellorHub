const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const targetDirs = [
  path.join(projectRoot, 'backend', 'app'),
  path.join(projectRoot, 'frontend', 'src')
];

console.log('Project Root:', projectRoot);

const patterns = {
  css: { multi: /\/\*[\s\S]*?\*\//g },
  js: { multi: /\/\*[\s\S]*?\*\//g, single: /((?<!:)\/\/.*$)/gm },
  py: { doc: /("""[\s\S]*?"""|'''[\s\S]*?''')/g, single: /(?<!['"])#.*$/gm }
};

function walk(dir, callback) {
  console.log('Walking:', dir);
  if (!fs.existsSync(dir)) {
    console.error('Dir not found:', dir);
    return;
  }
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    if (fs.statSync(dirPath).isDirectory()) {
      if (f !== '__pycache__' && f !== 'node_modules') walk(dirPath, callback);
    } else {
      callback(dirPath);
    }
  });
}

function cleanFile(filePath) {
  const ext = path.extname(filePath);
  if (!['.py', '.tsx', '.ts', '.css', '.js'].includes(ext)) return;

  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  if (ext === '.css') {
    content = content.replace(patterns.css.multi, '');
  } else if (['.tsx', '.ts', '.js'].includes(ext)) {
    content = content.replace(patterns.js.multi, '');
    content = content.replace(patterns.js.single, '');
  } else if (ext === '.py') {
    content = content.replace(patterns.py.doc, '');
    content = content.replace(patterns.py.single, '');
  }

  content = content.replace(/\n\s*\n\s*\n/g, '\n\n');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Cleaned: ${filePath}`);
  }
}

targetDirs.forEach(dir => walk(dir, cleanFile));
console.log('Done.');
