#!/usr/bin/env node
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDir = path.join(__dirname, 'client');

console.log('Building from:', clientDir);

// Change to client directory and build with specific config
execSync(`cd ${clientDir} && npx vite build --outDir ../dist/public --emptyOutDir`, { 
  stdio: 'inherit',
  cwd: clientDir
});