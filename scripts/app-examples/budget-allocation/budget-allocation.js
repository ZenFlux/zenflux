#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../../');

// Load configuration
const configPath = path.join(__dirname, 'config.json');
const config = JSON.parse(readFileSync(configPath, 'utf8'));

// Determine environment (default to development)
const environment = process.env.NODE_ENV || 'development';
const envConfig = config.environments[environment];

if (!envConfig) {
    console.error(`❌ Environment '${environment}' not found in configuration`);
    process.exit(1);
}

console.log(config.messages.starting);
console.log(`${config.messages.environment} ${environment}`);
console.log(config.messages.configLoaded);
console.log('📁 Root directory:', rootDir);

// Frontend process (Vite dev server)
const frontendProcess = spawn('bun', ['run', 'z-demos:budget-allocation:dev'], {
    cwd: path.join(rootDir, envConfig.frontend.cwd),
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, ...envConfig.frontend.env }
});

// Backend process (Nodemon with TypeScript watch)
const backendProcess = spawn('bun', ['run', 'demos:budget-allocation-server-start:dev'], {
    cwd: path.join(rootDir, envConfig.backend.cwd),
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, ...envConfig.backend.env }
});

// Handle process cleanup
process.on('SIGINT', () => {
    console.log(`\n${config.messages.shutdown}`);
    frontendProcess.kill('SIGINT');
    backendProcess.kill('SIGINT');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log(`\n${config.messages.shutdown}`);
    frontendProcess.kill('SIGTERM');
    backendProcess.kill('SIGTERM');
    process.exit(0);
});

// Handle process errors
frontendProcess.on('error', (error) => {
    console.error(`${config.messages.frontendError}`, error);
});

backendProcess.on('error', (error) => {
    console.error(`${config.messages.backendError}`, error);
});

frontendProcess.on('exit', (code) => {
    console.log(`${config.messages.frontendExited} ${code}`);
});

backendProcess.on('exit', (code) => {
    console.log(`${config.messages.backendExited} ${code}`);
});

console.log(config.messages.bothStarting);
console.log(`${config.messages.frontendAvailable}: http://${envConfig.frontend.host}:${envConfig.frontend.port}`);
console.log(`${config.messages.backendAvailable}: http://${envConfig.backend.host}:${envConfig.backend.port}`);
console.log(config.messages.pressToStop);
