#!/usr/bin/env node

const CoreAgent = require('./core_agent');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class DevOpsDeploymentAgent extends CoreAgent {
  constructor(config = {}) {
    super({
      ...config,
      id: 'agent_010',
      name: 'DevOps & Deployment Agent',
      type: 'devops',
      capabilities: [
        'github_actions',
        'deployment',
        'monitoring',
        'docker',
        'github_pages',
        'vercel',
        'netlify',
        'ci_cd',
        'infrastructure',
        'security_scanning'
      ],
      branch: 'feature/devops',
      permissions: {
        read: ['*'],
        write: ['.github/**', 'Dockerfile', 'docker-compose.yml', 'netlify.toml', 'vercel.json'],
        execute: ['deploy:staging', 'deploy:production', 'rollback']
      }
    });
  }

  async processTask(task) {
    switch (task.type) {
      case 'setup_ci_cd':
        return await this.setupCICD(task.params);
      case 'create_dockerfile':
        return await this.createDockerfile(task.params);
      case 'deploy_github_pages':
        return await this.deployGitHubPages(task.params);
      case 'setup_monitoring':
        return await this.setupMonitoring(task.params);
      default:
        return await super.processTask(task);
    }
  }

  async setupCICD(params) {
    const { provider = 'github-actions' } = params;
    
    const workflow = `name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
  workflow_dispatch:

env:
  NODE_VERSION: '18'
  
jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: \${{ env.NODE_VERSION }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linting
      run: npm run lint
    
    - name: Run tests
      run: npm test -- --coverage --watchAll=false
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
    
    - name: Run security audit
      run: npm audit --audit-level=moderate

  build:
    needs: test
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: \${{ env.NODE_VERSION }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build application
      run: npm run build
      env:
        CI: true
    
    - name: Upload build artifacts
      uses: actions/upload-artifact@v3
      with:
        name: build-files
        path: ./build

  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Download build artifacts
      uses: actions/download-artifact@v3
      with:
        name: build-files
        path: ./build
    
    - name: Deploy to Staging
      run: |
        echo "Deploying to staging environment"
        # Add deployment script here
    
    - name: Run smoke tests
      run: |
        echo "Running smoke tests"
        # Add smoke test script here

  deploy-production:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment:
      name: production
      url: https://your-app.com
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Download build artifacts
      uses: actions/download-artifact@v3
      with:
        name: build-files
        path: ./build
    
    - name: Deploy to Production
      run: |
        echo "Deploying to production"
        # Add production deployment script
    
    - name: Notify deployment
      uses: 8398a7/action-slack@v3
      with:
        status: \${{ job.status }}
        text: 'Production deployment completed'
      if: always()`;

    const workflowPath = path.join(process.cwd(), '.github', 'workflows', 'ci-cd.yml');
    await fs.mkdir(path.dirname(workflowPath), { recursive: true });
    await fs.writeFile(workflowPath, workflow);

    return { success: true, cicd: 'GitHub Actions' };
  }

  async createDockerfile(params) {
    const { framework = 'react' } = params;
    
    const dockerfile = `# Multi-stage build for optimized production image

# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Stage 2: Production
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application from builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]`;

    await fs.writeFile(path.join(process.cwd(), 'Dockerfile'), dockerfile);

    // Create nginx config
    const nginxConfig = `server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Cache static assets
    location ~* \\.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}`;

    await fs.writeFile(path.join(process.cwd(), 'nginx.conf'), nginxConfig);

    // Create docker-compose
    const dockerCompose = `version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:80"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    networks:
      - app-network

  # Optional: Add database service
  # postgres:
  #   image: postgres:15-alpine
  #   environment:
  #     POSTGRES_DB: appdb
  #     POSTGRES_USER: appuser
  #     POSTGRES_PASSWORD: \${DB_PASSWORD}
  #   volumes:
  #     - postgres-data:/var/lib/postgresql/data
  #   networks:
  #     - app-network

networks:
  app-network:
    driver: bridge

volumes:
  postgres-data:`;

    await fs.writeFile(path.join(process.cwd(), 'docker-compose.yml'), dockerCompose);

    return { success: true, docker: true };
  }

  async deployGitHubPages(params) {
    const deployScript = `name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout
      uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build
      run: npm run build
      env:
        PUBLIC_URL: /\${{ github.event.repository.name }}
    
    - name: Setup Pages
      uses: actions/configure-pages@v4
    
    - name: Upload artifact
      uses: actions/upload-pages-artifact@v3
      with:
        path: './build'
  
  deploy:
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    
    steps:
    - name: Deploy to GitHub Pages
      id: deployment
      uses: actions/deploy-pages@v4`;

    const ghPagesPath = path.join(process.cwd(), '.github', 'workflows', 'gh-pages.yml');
    await fs.mkdir(path.dirname(ghPagesPath), { recursive: true });
    await fs.writeFile(ghPagesPath, deployScript);

    return { success: true, deployment: 'GitHub Pages' };
  }

  async setupMonitoring(params) {
    const monitoring = `// Performance monitoring setup
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

// Send metrics to analytics endpoint
function sendToAnalytics(metric) {
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType,
    url: window.location.href,
    timestamp: Date.now()
  });

  // Use sendBeacon for reliability
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/metrics', body);
  } else {
    fetch('/api/metrics', {
      body,
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Measure Core Web Vitals
export function measureWebVitals() {
  getCLS(sendToAnalytics);
  getFID(sendToAnalytics);
  getFCP(sendToAnalytics);
  getLCP(sendToAnalytics);
  getTTFB(sendToAnalytics);
}

// Error tracking
window.addEventListener('error', (event) => {
  sendToAnalytics({
    name: 'js-error',
    value: 1,
    delta: 1,
    id: Math.random().toString(36),
    navigationType: 'error',
    error: {
      message: event.message,
      source: event.filename,
      line: event.lineno,
      column: event.colno,
      stack: event.error?.stack
    }
  });
});

// Track unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  sendToAnalytics({
    name: 'unhandled-rejection',
    value: 1,
    delta: 1,
    id: Math.random().toString(36),
    navigationType: 'error',
    error: {
      reason: event.reason,
      promise: event.promise
    }
  });
});`;

    const monitoringPath = path.join(process.cwd(), 'src', 'utils', 'monitoring.js');
    await fs.mkdir(path.dirname(monitoringPath), { recursive: true });
    await fs.writeFile(monitoringPath, monitoring);

    return { success: true, monitoring: true };
  }

  async deploy(params) {
    const { environment = 'staging', provider = 'vercel' } = params;
    
    try {
      const command = {
        vercel: `vercel --prod ${environment === 'production' ? '' : '--no-prod'}`,
        netlify: `netlify deploy ${environment === 'production' ? '--prod' : ''}`,
        'gh-pages': 'gh-pages -d build'
      }[provider];

      const { stdout } = await execAsync(command);
      
      return {
        success: true,
        environment,
        provider,
        output: stdout
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = DevOpsDeploymentAgent;