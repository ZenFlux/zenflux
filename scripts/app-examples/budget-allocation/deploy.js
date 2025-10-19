#!/usr/bin/env node

import { Client } from 'ssh2';
import { readFileSync, readdirSync, statSync, existsSync, mkdirSync, copyFileSync, writeFileSync, rmSync } from 'fs';
import os from 'os';
import path from 'path';
import { mkdtempSync } from 'fs';
import { join, relative } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import { zFindRootPackageJsonPath } from "@zenflux/utils/src/workspace";

// Load environment variables from root .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '../../');

// Try to load .env file, but don't fail if it doesn't exist

const workspaceRootPath = path.dirname( zFindRootPackageJsonPath() );
const envPath = join(workspaceRootPath, '.env');
if (existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log('📄 Loaded environment variables from .env file');
} else {
    console.log('⚠️  No .env file found. Using system environment variables.');
}

const {
    DEPLOY_BUDGET_ALLOCATION_SSH_HOST,
    DEPLOY_BUDGET_ALLOCATION_SSH_PORT,
    DEPLOY_BUDGET_ALLOCATION_SSH_USER,
    DEPLOY_BUDGET_ALLOCATION_SSH_PASS,
    DEPLOY_BUDGET_ALLOCATION_SSH_PWD,
    DEPLOY_BUDGET_ALLOCATION_PUBLIC_URL
} = process.env;

// Validate environment variables
const requiredEnvVars = [
    'DEPLOY_BUDGET_ALLOCATION_SSH_HOST',
    'DEPLOY_BUDGET_ALLOCATION_SSH_PORT', 
    'DEPLOY_BUDGET_ALLOCATION_SSH_USER',
    'DEPLOY_BUDGET_ALLOCATION_SSH_PWD'
];

for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        console.error(`❌ Missing required environment variable: ${envVar}`);
        process.exit(1);
    }
}

console.log('🚀 Starting budget allocation deployment...');
console.log(`📡 Target: ${DEPLOY_BUDGET_ALLOCATION_SSH_USER}@${DEPLOY_BUDGET_ALLOCATION_SSH_HOST}:${DEPLOY_BUDGET_ALLOCATION_SSH_PORT}`);
console.log(`📁 Destination: ${DEPLOY_BUDGET_ALLOCATION_SSH_PWD}`);

// Build the budget allocation first
console.log('\n🔨 Building budget allocation...');
import { execSync } from 'child_process';

try {
    const buildCommand = `cd ${workspaceRootPath}/apps-example/budget-allocation && bun run z-demos:budget-allocation:build`;
    execSync(buildCommand, { 
        stdio: 'inherit',
        cwd: workspaceRootPath 
    });
    console.log('✅ Build completed successfully');
} catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
}

// Function to recursively get all files in a directory
function getAllFiles(dirPath, arrayOfFiles = []) {
    const files = readdirSync(dirPath);
    
    files.forEach(file => {
        const fullPath = join(dirPath, file);
        if (statSync(fullPath).isDirectory()) {
            arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
        } else {
            arrayOfFiles.push(fullPath);
        }
    });
    
    return arrayOfFiles;
}

// Ensure remote directory exists by creating each segment
function ensureRemoteDir(sftp, remoteDir, cb) {
    const norm = remoteDir.replace(/\\/g, '/');
    const parts = norm.split('/').filter(Boolean);
    let built = norm.startsWith('/') ? '/' : '';

    function step(index) {
        if (index >= parts.length) return cb();
        built += (built.endsWith('/') ? '' : '/') + parts[index];
        sftp.stat(built, (err) => {
            if (err) {
                sftp.mkdir(built, (mkErr) => {
                    // 4 == already exists in some SFTP servers; ignore
                    if (mkErr && mkErr.code && mkErr.code !== 4) {
                        // Try to continue even if "already exists" semantics differ
                    }
                    step(index + 1);
                });
            } else {
                step(index + 1);
            }
        });
    }

    step(0);
}

// Upload files via SFTP (dist + public + vendor if present)
function uploadFiles() {
    return new Promise((resolve, reject) => {
        const conn = new Client();
        
        conn.on('ready', () => {
            console.log('\n📤 Connected to server, starting upload...');
            
            conn.sftp((err, sftp) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                const distPath = join(workspaceRootPath, 'apps-example/budget-allocation/dist');
                const publicPath = join(workspaceRootPath, 'apps-example/budget-allocation/public');

                const uploads = [];

                // Upload dist folder (main build output)
                if (existsSync(distPath) && statSync(distPath).isDirectory()) {
                    const distFiles = getAllFiles(distPath);
                    console.log(`📦 dist: ${distFiles.length} files`);
                    distFiles.forEach((file) => {
                        const relativePath = relative(distPath, file);
                        const remotePath = join(DEPLOY_BUDGET_ALLOCATION_SSH_PWD, relativePath).replace(/\\/g, '/');
                        uploads.push({ file, relativePath, remotePath });
                    });
                }

                // Upload public folder (static assets)
                if (existsSync(publicPath) && statSync(publicPath).isDirectory()) {
                    const publicFiles = getAllFiles(publicPath);
                    console.log(`📁 public: ${publicFiles.length} files`);
                    publicFiles.forEach((file) => {
                        const relativePath = relative(publicPath, file);
                        const remotePath = join(DEPLOY_BUDGET_ALLOCATION_SSH_PWD, relativePath).replace(/\\/g, '/');
                        uploads.push({ file, relativePath, remotePath });
                    });
                }

                const totalFiles = uploads.length;
                let uploadedCount = 0;
                let processedCount = 0;

                if (totalFiles === 0) {
                    console.log('❌ No files found to upload (dist/public)');
                    conn.end();
                    reject(new Error('No files to upload'));
                    return;
                }

                console.log(`📤 Total files to upload: ${totalFiles}`);
                
                // Create remote directory if it doesn't exist
                sftp.mkdir(DEPLOY_BUDGET_ALLOCATION_SSH_PWD, { recursive: true }, (mkdirErr) => {
                    if (mkdirErr && mkdirErr.code !== 4) { // 4 = directory already exists
                        console.warn(`⚠️  Warning creating directory: ${mkdirErr.message}`);
                    }
                    
                    // Upload each file (dist, public, vendor)
                    uploads.forEach(({ file, relativePath, remotePath }) => {
                        const remoteDir = dirname(remotePath);
                        ensureRemoteDir(sftp, remoteDir, () => {
                            sftp.fastPut(file, remotePath, (uploadErr) => {
                                processedCount++;
                                if (uploadErr) {
                                    console.error(`❌ Failed to upload ${relativePath}:`, uploadErr.message);
                                } else {
                                    uploadedCount++;
                                    console.log(`✅ Uploaded ${relativePath} (${uploadedCount}/${totalFiles})`);
                                }

                                if (processedCount === totalFiles) {
                                    console.log(`\n🎉 Deployment completed! ${uploadedCount}/${totalFiles} files uploaded successfully`);
                                    console.log(`🌐 budget allocation available at: ${DEPLOY_BUDGET_ALLOCATION_PUBLIC_URL || 'https://inewlegend.com'}`);
                                    conn.end();
                                    resolve();
                                }
                            });
                        });
                    });
                });
            });
        });
        
        conn.on('error', (err) => {
            console.error('❌ SSH connection error:', err.message);
            reject(err);
        });
        
        // Connect to server
        const sshConfig = {
            host: DEPLOY_BUDGET_ALLOCATION_SSH_HOST,
            port: parseInt(DEPLOY_BUDGET_ALLOCATION_SSH_PORT),
            username: DEPLOY_BUDGET_ALLOCATION_SSH_USER,
            password: DEPLOY_BUDGET_ALLOCATION_SSH_PASS,
        };
        
        console.log('\n🔐 Connecting to server...');
        conn.connect(sshConfig);
    });
}

// Main deployment function
async function deploy() {
    try {
        await uploadFiles();

        console.log('\n✨ Deployment successful!');
    } catch (error) {
        console.error('\n💥 Deployment failed:', error.message);
        process.exit(1);
    }
}

// Run deployment
deploy();


