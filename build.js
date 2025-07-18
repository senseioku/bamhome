#!/usr/bin/env node
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Change to client directory and build
process.chdir(path.join(__dirname, 'client'));
execSync('vite build --outDir ../dist/public --emptyOutDir', { stdio: 'inherit' });