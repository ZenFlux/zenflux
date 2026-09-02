#!/usr/bin/env node

import { Client } from 'ssh2';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import { zFindRootPackageJsonPath } from "@zenflux/utils/workspace";
import { execSync } from 'child_process';

// Setup paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const workspaceRootPath = path.dirname(zFindRootPackageJsonPath());
const envPath = join(workspaceRootPath, '.env');

// Load environment variables
if (existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log('📄 Loaded environment variables from .env file');
} else {
    console.log('⚠️  No .env file found. Using system environment variables.');
}

const {
    DEPLOY_BUDGET_ALLOCATION_BACKEND_SSH_HOST,
    DEPLOY_BUDGET_ALLOCATION_BACKEND_SSH_PORT = '22',
    DEPLOY_BUDGET_ALLOCATION_BACKEND_SSH_USER = 'ubuntu',
    DEPLOY_BUDGET_ALLOCATION_BACKEND_SSH_PASS,
    DEPLOY_BUDGET_ALLOCATION_BACKEND_SSH_KEY,
    DEPLOY_BUDGET_ALLOCATION_BACKEND_SSH_PWD,
    DEPLOY_BUDGET_ALLOCATION_BACKEND_APP_PORT = '3001',
    DEPLOY_BUDGET_ALLOCATION_BACKEND_APP_NAME = 'budget-allocation-server'
} = process.env;

// Validate required environment variables
const requiredEnvVars = [
    'DEPLOY_BUDGET_ALLOCATION_BACKEND_SSH_HOST',
    'DEPLOY_BUDGET_ALLOCATION_BACKEND_SSH_PWD'
];

// Either password or key must be provided
if (!DEPLOY_BUDGET_ALLOCATION_BACKEND_SSH_PASS && !DEPLOY_BUDGET_ALLOCATION_BACKEND_SSH_KEY) {
    console.error(`❌ Either DEPLOY_BUDGET_ALLOCATION_BACKEND_SSH_PASS or DEPLOY_BUDGET_ALLOCATION_BACKEND_SSH_KEY must be provided`);
    process.exit(1);
}

for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        console.error(`❌ Missing required environment variable: ${envVar}`);
        process.exit(1);
    }
}

const APP_SOURCE = join(workspaceRootPath, 'apps-example/budget-allocation-server');
const SERVER = DEPLOY_BUDGET_ALLOCATION_BACKEND_SSH_HOST;
const APP_NAME = DEPLOY_BUDGET_ALLOCATION_BACKEND_APP_NAME;
const APP_PORT = DEPLOY_BUDGET_ALLOCATION_BACKEND_APP_PORT;
const DEPLOY_PATH = DEPLOY_BUDGET_ALLOCATION_BACKEND_SSH_PWD;

console.log('🚀 Starting budget-allocation-server deployment...');
console.log(`📡 Target: ${DEPLOY_BUDGET_ALLOCATION_BACKEND_SSH_USER}@${SERVER}:${DEPLOY_BUDGET_ALLOCATION_BACKEND_SSH_PORT}`);
console.log(`📁 Source: ${APP_SOURCE}`);
console.log(`📁 Destination: ${DEPLOY_PATH}`);
console.log(`🐳 App: ${APP_NAME} on port ${APP_PORT}`);

// Verify source directory exists
if (!existsSync(APP_SOURCE)) {
    console.error(`❌ Source directory not found: ${APP_SOURCE}`);
    process.exit(1);
}

// Read SSH private key if provided
let privateKey;
if (DEPLOY_BUDGET_ALLOCATION_BACKEND_SSH_KEY) {
    try {
        const SSH_KEY_PATH = DEPLOY_BUDGET_ALLOCATION_BACKEND_SSH_KEY.replace('~', process.env.HOME);
        privateKey = readFileSync(SSH_KEY_PATH);
    } catch (error) {
        console.error(`❌ Failed to read SSH key: ${DEPLOY_BUDGET_ALLOCATION_BACKEND_SSH_KEY}`, error.message);
        process.exit(1);
    }
}

// Deploy function
async function deploy() {
    return new Promise((resolve, reject) => {
        const conn = new Client();
        
        conn.on('ready', () => {
            console.log('\n📤 Connected to server...');

            // Step 0: Build locally
            console.log('🔨 Building locally...');
            try {
                execSync('bun run demos:budget-allocation-server-build', { cwd: APP_SOURCE, stdio: 'inherit' });
                console.log('✅ Local build completed');
            } catch (error) {
                reject(new Error(`Local build failed: ${error.message}`));
                return;
            }

            // Step 1: Create remote directory
            console.log('📁 Creating remote directory...');
            conn.exec(`mkdir -p ${DEPLOY_PATH}`, (err, stream) => {
                if (err) {
                    reject(err);
                    return;
                }

                stream.on('data', (data) => {
                    console.log('mkdir stdout:', data.toString());
                });

                stream.stderr.on('data', (data) => {
                    console.error('mkdir stderr:', data.toString());
                });

                stream.on('close', (code, signal) => {
                    console.log(`✅ Remote directory created (exit code: ${code})`);
                    if (code !== 0) {
                        reject(new Error(`mkdir failed with code ${code}`));
                        return;
                    }
                    // Step 2: Upload files using rsync
                    console.log('📦 Uploading files via rsync...');

                    // Build rsync command with password or key auth
                    let rsyncCmd;
                    if (DEPLOY_BUDGET_ALLOCATION_BACKEND_SSH_PASS) {
                        // Use expect script for password authentication (works on macOS)
                        const expectScript = `
expect << 'EOF'
set timeout -1
spawn rsync -av --progress --exclude='node_modules' --exclude='.git' --exclude='*.log' --exclude='.DS_Store' --exclude='src' --exclude='tsconfig*.json' --exclude='*.md' --exclude='README.md' --exclude='.dockerignore' -e "ssh -o StrictHostKeyChecking=no -p ${DEPLOY_BUDGET_ALLOCATION_BACKEND_SSH_PORT}" "${APP_SOURCE}/" ${DEPLOY_BUDGET_ALLOCATION_BACKEND_SSH_USER}@${SERVER}:${DEPLOY_PATH}/
expect {
    "password:" {
        send "${DEPLOY_BUDGET_ALLOCATION_BACKEND_SSH_PASS}\\r"
        exp_continue
    }
    eof
}
EOF
`;
                        rsyncCmd = expectScript;
                    } else {
                        const SSH_KEY_PATH = DEPLOY_BUDGET_ALLOCATION_BACKEND_SSH_KEY.replace('~', process.env.HOME);
                        rsyncCmd = `rsync -av --progress \
                            --exclude='node_modules' \
                            --exclude='.git' \
                            --exclude='*.log' \
                            --exclude='.DS_Store' \
                            --exclude='src' \
                            --exclude='tsconfig*.json' \
                            --exclude='*.md' \
                            --exclude='README.md' \
                            --exclude='.dockerignore' \
                            -e "ssh -i ${SSH_KEY_PATH} -o StrictHostKeyChecking=no -p ${DEPLOY_BUDGET_ALLOCATION_BACKEND_SSH_PORT}" \
                            "${APP_SOURCE}/" \
                            ${DEPLOY_BUDGET_ALLOCATION_BACKEND_SSH_USER}@${SERVER}:${DEPLOY_PATH}/`;
                    }

                    try {
                        execSync(rsyncCmd, { stdio: 'inherit', shell: '/bin/bash' });
                        console.log('✅ Files uploaded successfully');

                        // Step 3: Build and run Docker container
                        console.log('\n🐳 Building and deploying Docker container...');

                        const dockerCmd = `
                            cd ${DEPLOY_PATH} &&
                            sudo docker build -t ${APP_NAME} . &&
                            sudo docker stop ${APP_NAME} 2>/dev/null || true &&
                            sudo docker rm -f ${APP_NAME} 2>/dev/null || true &&
                            sudo docker run -d --name ${APP_NAME} -e PORT=3000 -p 127.0.0.1:${APP_PORT}:3000 --restart unless-stopped ${APP_NAME}
                        `;
                        
                        conn.exec(dockerCmd, (err, stream) => {
                            if (err) {
                                reject(err);
                                return;
                            }
                            
                            stream.on('data', (data) => {
                                process.stdout.write(data.toString());
                            });
                            
                            stream.stderr.on('data', (data) => {
                                process.stderr.write(data.toString());
                            });
                            
                            stream.on('close', (code) => {
                                if (code !== 0) {
                                    reject(new Error(`Docker deployment failed with code ${code}`));
                                    return;
                                }
                                
                                console.log('\n✅ Docker container deployed successfully!');
                                
                                // Step 4: Check container status
                                console.log('\n📊 Checking container status...');
                                conn.exec(`sudo docker ps | grep ${APP_NAME}`, (err, stream) => {
                                    if (err) {
                                        console.warn('⚠️  Could not check container status');
                                    }
                                    
                                    stream.on('data', (data) => {
                                        console.log(data.toString());
                                    });
                                    
                                    stream.on('close', () => {
                                        console.log(`\n🎉 Deployment completed!`);
                                        console.log(`🌐 Service available at: https://inewlegend.com/projects/budget-allocation/api/ (nginx -> 127.0.0.1:${APP_PORT})`);
                                        conn.end();
                                        resolve();
                                    });
                                });
                            });
                        });
                        
                    } catch (error) {
                        reject(new Error(`Rsync failed: ${error.message}`));
                    }
                });
            });
        });
        
        conn.on('error', (err) => {
            console.error('❌ SSH connection error:', err.message);
            reject(err);
        });
        
        // Connect to server
        const sshConfig = {
            host: SERVER,
            port: parseInt(DEPLOY_BUDGET_ALLOCATION_BACKEND_SSH_PORT),
            username: DEPLOY_BUDGET_ALLOCATION_BACKEND_SSH_USER
        };

        if (privateKey) {
            sshConfig.privateKey = privateKey;
        } else if (DEPLOY_BUDGET_ALLOCATION_BACKEND_SSH_PASS) {
            sshConfig.password = DEPLOY_BUDGET_ALLOCATION_BACKEND_SSH_PASS;
        }

        conn.connect(sshConfig);
    });
}

// Run deployment
deploy().catch(error => {
    console.error('\n💥 Deployment failed:', error.message);
    process.exit(1);
});
