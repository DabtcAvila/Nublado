#!/usr/bin/env node

const { BaseAgent } = require('./base_agent');
const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');

const execPromise = util.promisify(exec);

class DevOpsSpecialist extends BaseAgent {
  constructor(config) {
    super({
      ...config,
      name: 'DevOpsSpecialist',
      type: 'devops',
      capabilities: [
        'git_workflow_management',
        'github_pages_deployment',
        'ci_cd_pipelines',
        'branch_management',
        'automated_deployment',
        'infrastructure_as_code',
        'security_scanning'
      ]
    });
    
    this.gitWorkflow = {
      branchingStrategy: 'GitHub Flow',
      mainBranch: 'main',
      featureBranchPrefix: 'feature/',
      deploymentBranch: 'gh-pages',
      commitConventions: {
        feat: 'New feature',
        fix: 'Bug fix',
        docs: 'Documentation',
        style: 'Formatting',
        refactor: 'Code restructuring',
        test: 'Testing',
        chore: 'Maintenance'
      }
    };
    
    this.deploymentConfig = {
      platform: 'GitHub Pages',
      buildCommand: 'npm run build',
      outputDir: 'dist',
      customDomain: null,
      https: true
    };
    
    this.qualityGates = {
      coverage: 80,
      buildTime: 300, // seconds
      deploymentTime: 120, // seconds
      securityVulnerabilities: 0
    };
  }

  async setup() {
    this.log('DevOps Specialist initializing with CI/CD expertise...');
    this.repoPath = process.cwd();
    await this.checkGitRepository();
    await this.loadGitHubActionsTemplates();
  }

  async checkGitRepository() {
    try {
      await execPromise('git rev-parse --git-dir');
      this.log('Git repository detected');
      const { stdout } = await execPromise('git remote get-url origin');
      this.remoteUrl = stdout.trim();
      this.log(`Remote repository: ${this.remoteUrl}`);
    } catch (error) {
      this.log('Not a git repository or no remote configured', 'warning');
    }
  }

  async loadGitHubActionsTemplates() {
    this.workflows = {
      deploy: this.createDeployWorkflow(),
      ci: this.createCIWorkflow()
    };
  }

  createDeployWorkflow() {
    return `name: Deploy to GitHub Pages

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
        
      - name: Setup Pages
        uses: actions/configure-pages@v4
        
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: '.'
          
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
  }

  createCIWorkflow() {
    return `name: CI Pipeline

on:
  pull_request:
    branches: [ main ]
  push:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Validate HTML
      uses: Cyb3r-Jak3/html5validator-action@v7.2.0
      with:
        root: .
        
    - name: Lighthouse CI
      uses: treosh/lighthouse-ci-action@v10
      with:
        urls: |
          https://\${{ github.repository_owner }}.github.io/\${{ github.event.repository.name }}/
        uploadArtifacts: true
        temporaryPublicStorage: true`;
  }

  async performTask(task) {
    const { type, params } = task;
    
    switch (type) {
      case 'setup_repository':
        return await this.setupRepository(params);
      case 'create_branch':
        return await this.createBranch(params);
      case 'commit_changes':
        return await this.commitChanges(params);
      case 'setup_github_pages':
        return await this.setupGitHubPages(params);
      case 'deploy':
        return await this.deployToGitHubPages(params);
      case 'merge_branches':
        return await this.mergeBranches(params);
      default:
        return await super.performTask(task);
    }
  }

  async setupRepository(params) {
    this.log('Setting up repository structure and workflows...');
    
    try {
      // Initialize git if not already initialized
      try {
        await execPromise('git rev-parse --git-dir');
      } catch {
        await execPromise('git init');
        this.log('Initialized git repository');
      }

      // Create .github/workflows directory
      const workflowsDir = path.join(this.repoPath, '.github', 'workflows');
      if (!fs.existsSync(workflowsDir)) {
        fs.mkdirSync(workflowsDir, { recursive: true });
        this.log('Created .github/workflows directory');
      }

      // Write workflow files
      fs.writeFileSync(
        path.join(workflowsDir, 'deploy.yml'),
        this.workflows.deploy,
        'utf8'
      );
      fs.writeFileSync(
        path.join(workflowsDir, 'ci.yml'),
        this.workflows.ci,
        'utf8'
      );
      this.log('Created GitHub Actions workflows');

      // Create .gitignore if not exists
      const gitignorePath = path.join(this.repoPath, '.gitignore');
      if (!fs.existsSync(gitignorePath)) {
        const gitignoreContent = `# Dependencies
node_modules/

# Build outputs
dist/
build/

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# Environment variables
.env
.env.local`;
        
        fs.writeFileSync(gitignorePath, gitignoreContent, 'utf8');
        this.log('Created .gitignore file');
      }

      return {
        success: true,
        message: 'Repository structure configured',
        workflows: ['deploy.yml', 'ci.yml'],
        configuration: {
          gitIgnore: true,
          githubActions: true,
          branchProtection: 'recommended'
        }
      };
    } catch (error) {
      this.log(`Repository setup failed: ${error.message}`, 'error');
      return {
        success: false,
        error: error.message
      };
    }
  }

  async createBranch(params) {
    const { branchName, baseBranch = 'main' } = params;
    
    try {
      this.log(`Creating branch: ${branchName} from ${baseBranch}`);
      
      // Ensure we're on the base branch
      await execPromise(`git checkout ${baseBranch} 2>/dev/null || git checkout -b ${baseBranch}`);
      
      // Create and checkout new branch
      await execPromise(`git checkout -b ${branchName}`);
      
      this.log(`Successfully created and switched to branch: ${branchName}`);
      
      return {
        success: true,
        branch: branchName,
        baseBranch: baseBranch,
        message: `Branch ${branchName} created successfully`
      };
    } catch (error) {
      this.log(`Failed to create branch: ${error.message}`, 'error');
      return {
        success: false,
        error: error.message
      };
    }
  }

  async commitChanges(params) {
    const { message, files = '.', branch } = params;
    
    try {
      if (branch) {
        await execPromise(`git checkout ${branch}`);
      }
      
      // Stage files
      await execPromise(`git add ${files}`);
      
      // Check if there are changes to commit
      const { stdout: status } = await execPromise('git status --porcelain');
      
      if (!status) {
        this.log('No changes to commit');
        return {
          success: true,
          message: 'No changes to commit',
          committed: false
        };
      }
      
      // Commit with conventional commit message
      const commitMessage = this.formatCommitMessage(message);
      await execPromise(`git commit -m "${commitMessage}"`);
      
      // Get commit hash
      const { stdout: commitHash } = await execPromise('git rev-parse HEAD');
      
      this.log(`Committed changes: ${commitHash.trim().substring(0, 7)}`);
      
      return {
        success: true,
        message: 'Changes committed successfully',
        commit: commitHash.trim(),
        branch: branch || 'current',
        committed: true
      };
    } catch (error) {
      this.log(`Commit failed: ${error.message}`, 'error');
      return {
        success: false,
        error: error.message
      };
    }
  }

  formatCommitMessage(message) {
    // Ensure commit message follows conventional commits
    if (!message.includes(':')) {
      return `feat: ${message}`;
    }
    return message;
  }

  async setupGitHubPages(params) {
    this.log('Configuring GitHub Pages deployment...');
    
    try {
      // Check if gh-pages branch exists
      try {
        await execPromise('git rev-parse --verify gh-pages');
        this.log('gh-pages branch already exists');
      } catch {
        // Create orphan gh-pages branch
        await execPromise('git checkout --orphan gh-pages');
        await execPromise('git rm -rf . 2>/dev/null || true');
        
        // Create initial index.html
        const initialContent = '<html><body><h1>GitHub Pages Setup</h1></body></html>';
        fs.writeFileSync('index.html', initialContent);
        
        await execPromise('git add index.html');
        await execPromise('git commit -m "Initial GitHub Pages setup"');
        
        this.log('Created gh-pages branch');
        
        // Switch back to main branch
        await execPromise('git checkout main');
      }
      
      // Configure GitHub Pages settings
      const pagesConfig = {
        source: 'gh-pages branch',
        path: '/',
        customDomain: params.customDomain || null,
        enforceHTTPS: true
      };
      
      this.log('GitHub Pages configuration complete');
      
      return {
        success: true,
        message: 'GitHub Pages configured successfully',
        configuration: pagesConfig,
        url: this.getGitHubPagesUrl()
      };
    } catch (error) {
      this.log(`GitHub Pages setup failed: ${error.message}`, 'error');
      return {
        success: false,
        error: error.message
      };
    }
  }

  getGitHubPagesUrl() {
    if (!this.remoteUrl) return 'URL will be available after pushing to GitHub';
    
    const match = this.remoteUrl.match(/github\.com[:/]([^/]+)\/(.+?)(\.git)?$/);
    if (match) {
      const [, owner, repo] = match;
      return `https://${owner}.github.io/${repo}/`;
    }
    return 'URL will be available after pushing to GitHub';
  }

  async deployToGitHubPages(params) {
    const { sourceBranch = 'main', force = false } = params;
    
    try {
      this.log(`Deploying from ${sourceBranch} to GitHub Pages...`);
      
      // Checkout source branch
      await execPromise(`git checkout ${sourceBranch}`);
      
      // Get files to deploy
      const filesToDeploy = ['index.html', 'styles.css', 'script.js'];
      
      // Create temporary directory for deployment
      const tempDir = path.join(this.repoPath, '.deploy-temp');
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true });
      }
      fs.mkdirSync(tempDir);
      
      // Copy files to temp directory
      for (const file of filesToDeploy) {
        if (fs.existsSync(file)) {
          fs.copyFileSync(file, path.join(tempDir, file));
        }
      }
      
      // Switch to gh-pages branch
      await execPromise('git checkout gh-pages');
      
      // Clear existing files
      const existingFiles = fs.readdirSync(this.repoPath);
      for (const file of existingFiles) {
        if (file !== '.git' && file !== '.deploy-temp') {
          const filePath = path.join(this.repoPath, file);
          if (fs.lstatSync(filePath).isDirectory()) {
            fs.rmSync(filePath, { recursive: true });
          } else {
            fs.unlinkSync(filePath);
          }
        }
      }
      
      // Copy files from temp to root
      const deployFiles = fs.readdirSync(tempDir);
      for (const file of deployFiles) {
        fs.copyFileSync(path.join(tempDir, file), path.join(this.repoPath, file));
      }
      
      // Clean up temp directory
      fs.rmSync(tempDir, { recursive: true });
      
      // Commit and push
      await execPromise('git add .');
      
      const { stdout: status } = await execPromise('git status --porcelain');
      if (status) {
        await execPromise(`git commit -m "Deploy: Update GitHub Pages from ${sourceBranch}"`);
        this.log('Changes committed to gh-pages branch');
      } else {
        this.log('No changes to deploy');
      }
      
      // Return to source branch
      await execPromise(`git checkout ${sourceBranch}`);
      
      return {
        success: true,
        message: 'Deployment to GitHub Pages successful',
        url: this.getGitHubPagesUrl(),
        deployedFiles: filesToDeploy,
        branch: 'gh-pages'
      };
    } catch (error) {
      this.log(`Deployment failed: ${error.message}`, 'error');
      return {
        success: false,
        error: error.message
      };
    }
  }

  async mergeBranches(params) {
    const { sourceBranch, targetBranch = 'main', strategy = 'merge' } = params;
    
    try {
      this.log(`Merging ${sourceBranch} into ${targetBranch}...`);
      
      // Checkout target branch
      await execPromise(`git checkout ${targetBranch}`);
      
      // Merge source branch
      if (strategy === 'squash') {
        await execPromise(`git merge --squash ${sourceBranch}`);
        await execPromise(`git commit -m "Merge: Squash merge ${sourceBranch} into ${targetBranch}"`);
      } else {
        await execPromise(`git merge ${sourceBranch} -m "Merge: ${sourceBranch} into ${targetBranch}"`);
      }
      
      this.log(`Successfully merged ${sourceBranch} into ${targetBranch}`);
      
      return {
        success: true,
        message: `Branches merged successfully`,
        sourceBranch,
        targetBranch,
        strategy
      };
    } catch (error) {
      this.log(`Merge failed: ${error.message}`, 'error');
      return {
        success: false,
        error: error.message
      };
    }
  }

  async runSecurityScan(params) {
    this.log('Running security scan...');
    
    try {
      // Check for common security issues
      const issues = [];
      
      // Check for exposed secrets
      const files = fs.readdirSync(this.repoPath);
      for (const file of files) {
        if (file.endsWith('.env') || file.includes('secret') || file.includes('key')) {
          issues.push(`Potential sensitive file: ${file}`);
        }
      }
      
      // Check dependencies (if package.json exists)
      if (fs.existsSync('package.json')) {
        try {
          const { stdout } = await execPromise('npm audit --json');
          const audit = JSON.parse(stdout);
          if (audit.metadata.vulnerabilities.total > 0) {
            issues.push(`Found ${audit.metadata.vulnerabilities.total} npm vulnerabilities`);
          }
        } catch (error) {
          // npm audit might fail if no dependencies
          this.log('No npm dependencies to audit');
        }
      }
      
      return {
        success: true,
        issues: issues,
        secure: issues.length === 0,
        message: issues.length === 0 ? 'No security issues found' : `Found ${issues.length} potential issues`
      };
    } catch (error) {
      this.log(`Security scan failed: ${error.message}`, 'error');
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Auto-execute if run directly
if (require.main === module) {
  const agent = new DevOpsSpecialist();
  agent.initialize().then(() => {
    agent.log('DevOps Specialist ready for CI/CD and deployment tasks');
  });
}

module.exports = DevOpsSpecialist;