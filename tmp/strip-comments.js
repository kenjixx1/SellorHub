const fs = require('fs');
const path = require('path');

const dirs = [
  'frontend/src/css',
  'frontend/src/pages'
];
const extraFiles = ['frontend/src/main.tsx', 'frontend/src/index.css'];

const cssRegex = /\/\*[\s\S]*?\*\//g;
// JS regex: Multi-line comments, then single-line comments (ignoring those preceded by : to avoid URLs)
const multiLineRegex = /\/\*[\s\S]*?\*\//g;
const singleLineRegex = /((?<!:)\/\/.*$)/gm;

function processFile(file) {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  const ext = path.extname(file);

  if (ext === '.css') {
    content = content.replace(cssRegex, '');
  } else if (ext === '.tsx' || ext === '.ts' || ext === '.js') {
    content = content.replace(multiLineRegex, '');
    content = content.replace(singleLineRegex, '');
  }

  // Final cleanup: remove excessive empty lines
  content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  fs.writeFileSync(file, content, 'utf8');
  console.log(`Cleaned: ${file}`);
}

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    processFile(path.join(dir, f));
  });
});

extraFiles.forEach(processFile);
