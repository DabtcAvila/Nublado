#!/usr/bin/env node

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');

const execAsync = promisify(exec);

class GitBranchManager extends EventEmitter {
  constructor(config = {}) {
    super();
    this.repoPath = config.repoPath || process.cwd();
    this.mainBranch = config.mainBranch || 'main';
    this.developBranch = config.developBranch || 'develop';
    this.agentBranches = new Map();
    this.activeMergeRequests = new Map();
    this.conflictResolutionQueue = [];
  }

  async initialize() {
    await this.ensureCleanState();
    await this.setupDevelopBranch();
    this.log('Git Branch Manager initialized');
  }

  async ensureCleanState() {
    try {
      const { stdout: status } = await execAsync('git status --porcelain', { cwd: this.repoPath });
      if (status.trim()) {
        await execAsync('git stash', { cwd: this.repoPath });
        this.log('Working directory stashed for clean state');
      }
    } catch (error) {
      this.log(`Warning: ${error.message}`, 'warn');
    }
  }

  async setupDevelopBranch() {
    try {
      await execAsync(`git checkout -b ${this.developBranch}`, { cwd: this.repoPath });
      this.log(`Created ${this.developBranch} branch`);
    } catch (error) {
      if (error.message.includes('already exists')) {
        await execAsync(`git checkout ${this.developBranch}`, { cwd: this.repoPath });
        this.log(`Switched to existing ${this.developBranch} branch`);
      }
    }
  }

  async createAgentBranch(agentId, branchName) {
    try {
      // Always branch from develop
      await execAsync(`git checkout ${this.developBranch}`, { cwd: this.repoPath });
      await execAsync(`git pull origin ${this.developBranch}`, { cwd: this.repoPath }).catch(() => {});
      
      // Create and checkout new branch
      await execAsync(`git checkout -b ${branchName}`, { cwd: this.repoPath });
      
      this.agentBranches.set(agentId, {
        branch: branchName,
        created: new Date(),
        commits: 0,
        status: 'active'
      });
      
      this.log(`Created branch ${branchName} for agent ${agentId}`);
      this.emit('branch:created', { agentId, branch: branchName });
      
      return branchName;
    } catch (error) {
      if (error.message.includes('already exists')) {
        await execAsync(`git checkout ${branchName}`, { cwd: this.repoPath });
        this.log(`Agent ${agentId} switched to existing branch ${branchName}`);
        return branchName;
      }
      throw error;
    }
  }

  async switchBranch(agentId, targetBranch = null) {
    const branch = targetBranch || this.agentBranches.get(agentId)?.branch;
    if (!branch) {
      throw new Error(`No branch found for agent ${agentId}`);
    }

    await execAsync(`git checkout ${branch}`, { cwd: this.repoPath });
    this.log(`Switched to branch ${branch} for agent ${agentId}`);
    return branch;
  }

  async commitChanges(agentId, message, files = []) {
    const branchInfo = this.agentBranches.get(agentId);
    if (!branchInfo) {
      throw new Error(`No branch found for agent ${agentId}`);
    }

    await this.switchBranch(agentId);

    // Add files
    if (files.length > 0) {
      for (const file of files) {
        await execAsync(`git add ${file}`, { cwd: this.repoPath });
      }
    } else {
      await execAsync('git add .', { cwd: this.repoPath });
    }

    // Commit
    const commitMessage = `[${agentId}] ${message}`;
    await execAsync(`git commit -m "${commitMessage}"`, { cwd: this.repoPath });
    
    branchInfo.commits++;
    this.log(`Agent ${agentId} committed: ${message}`);
    this.emit('commit:created', { agentId, message, branch: branchInfo.branch });

    return { success: true, branch: branchInfo.branch, commits: branchInfo.commits };
  }

  async pushBranch(agentId) {
    const branchInfo = this.agentBranches.get(agentId);
    if (!branchInfo) {
      throw new Error(`No branch found for agent ${agentId}`);
    }

    await this.switchBranch(agentId);
    await execAsync(`git push -u origin ${branchInfo.branch}`, { cwd: this.repoPath });
    
    this.log(`Pushed branch ${branchInfo.branch} for agent ${agentId}`);
    this.emit('branch:pushed', { agentId, branch: branchInfo.branch });

    return { success: true, branch: branchInfo.branch };
  }

  async createPullRequest(agentId, title, description) {
    const branchInfo = this.agentBranches.get(agentId);
    if (!branchInfo) {
      throw new Error(`No branch found for agent ${agentId}`);
    }

    // Push branch first
    await this.pushBranch(agentId);

    // Create PR using GitHub CLI
    try {
      const { stdout } = await execAsync(
        `gh pr create --base ${this.developBranch} --head ${branchInfo.branch} --title "${title}" --body "${description}"`,
        { cwd: this.repoPath }
      );
      
      const prUrl = stdout.trim();
      this.activeMergeRequests.set(agentId, {
        pr: prUrl,
        branch: branchInfo.branch,
        created: new Date(),
        status: 'open'
      });

      this.log(`Created PR for agent ${agentId}: ${prUrl}`);
      this.emit('pr:created', { agentId, pr: prUrl, branch: branchInfo.branch });

      return { success: true, pr: prUrl };
    } catch (error) {
      this.log(`Failed to create PR: ${error.message}`, 'error');
      throw error;
    }
  }

  async checkForConflicts(agentId) {
    const branchInfo = this.agentBranches.get(agentId);
    if (!branchInfo) {
      throw new Error(`No branch found for agent ${agentId}`);
    }

    await this.switchBranch(agentId);

    try {
      // Try to merge develop into agent branch (dry-run)
      await execAsync(`git merge ${this.developBranch} --no-commit --no-ff`, { cwd: this.repoPath });
      await execAsync('git merge --abort', { cwd: this.repoPath });
      
      return { hasConflicts: false };
    } catch (error) {
      await execAsync('git merge --abort', { cwd: this.repoPath }).catch(() => {});
      
      if (error.message.includes('conflict')) {
        this.log(`Conflicts detected for agent ${agentId}`, 'warn');
        this.emit('conflict:detected', { agentId, branch: branchInfo.branch });
        return { hasConflicts: true, branch: branchInfo.branch };
      }
      throw error;
    }
  }

  async resolveConflicts(agentId, strategy = 'theirs') {
    const branchInfo = this.agentBranches.get(agentId);
    if (!branchInfo) {
      throw new Error(`No branch found for agent ${agentId}`);
    }

    await this.switchBranch(agentId);

    try {
      // Attempt automatic resolution
      const mergeStrategy = strategy === 'theirs' ? 'theirs' : 'ours';
      await execAsync(`git merge ${this.developBranch} --strategy-option=${mergeStrategy}`, { cwd: this.repoPath });
      
      this.log(`Conflicts resolved for agent ${agentId} using ${strategy} strategy`);
      this.emit('conflict:resolved', { agentId, branch: branchInfo.branch, strategy });

      return { success: true, strategy };
    } catch (error) {
      this.log(`Failed to auto-resolve conflicts for agent ${agentId}`, 'error');
      this.conflictResolutionQueue.push({ agentId, branch: branchInfo.branch });
      throw error;
    }
  }

  async mergeToDevelop(agentId) {
    const branchInfo = this.agentBranches.get(agentId);
    if (!branchInfo) {
      throw new Error(`No branch found for agent ${agentId}`);
    }

    // Check for conflicts first
    const { hasConflicts } = await this.checkForConflicts(agentId);
    if (hasConflicts) {
      await this.resolveConflicts(agentId);
    }

    // Switch to develop and merge
    await execAsync(`git checkout ${this.developBranch}`, { cwd: this.repoPath });
    await execAsync(`git merge ${branchInfo.branch} --no-ff -m "Merge ${branchInfo.branch} from agent ${agentId}"`, { cwd: this.repoPath });
    
    branchInfo.status = 'merged';
    this.log(`Merged branch ${branchInfo.branch} to ${this.developBranch}`);
    this.emit('branch:merged', { agentId, branch: branchInfo.branch });

    return { success: true, branch: branchInfo.branch };
  }

  async synchronizeAgentBranches() {
    const results = [];
    
    for (const [agentId, branchInfo] of this.agentBranches) {
      if (branchInfo.status !== 'active') continue;

      try {
        await this.switchBranch(agentId);
        await execAsync(`git pull origin ${branchInfo.branch}`, { cwd: this.repoPath }).catch(() => {});
        await execAsync(`git merge ${this.developBranch}`, { cwd: this.repoPath });
        
        results.push({ agentId, status: 'synchronized' });
        this.log(`Synchronized branch for agent ${agentId}`);
      } catch (error) {
        if (error.message.includes('conflict')) {
          results.push({ agentId, status: 'conflict', error: error.message });
          this.conflictResolutionQueue.push({ agentId, branch: branchInfo.branch });
        } else {
          results.push({ agentId, status: 'error', error: error.message });
        }
      }
    }

    this.emit('sync:complete', { results, conflicts: this.conflictResolutionQueue.length });
    return results;
  }

  async deployToProduction() {
    // Ensure all agent work is merged to develop
    await this.synchronizeAgentBranches();

    // Switch to main branch
    await execAsync(`git checkout ${this.mainBranch}`, { cwd: this.repoPath });
    await execAsync(`git pull origin ${this.mainBranch}`, { cwd: this.repoPath }).catch(() => {});

    // Merge develop to main
    await execAsync(`git merge ${this.developBranch} --no-ff -m "Deploy to production"`, { cwd: this.repoPath });
    await execAsync(`git push origin ${this.mainBranch}`, { cwd: this.repoPath });

    this.log('Deployed to production (main branch)');
    this.emit('deploy:production', { branch: this.mainBranch });

    return { success: true, deployed: true };
  }

  async getAgentStatus(agentId) {
    const branchInfo = this.agentBranches.get(agentId);
    if (!branchInfo) {
      return { exists: false };
    }

    await this.switchBranch(agentId);
    const { stdout: status } = await execAsync('git status --porcelain', { cwd: this.repoPath });
    const { stdout: logCount } = await execAsync(`git rev-list --count HEAD ^${this.developBranch}`, { cwd: this.repoPath });

    return {
      exists: true,
      branch: branchInfo.branch,
      status: branchInfo.status,
      commits: branchInfo.commits,
      uncommittedChanges: status.trim().split('\n').filter(Boolean).length,
      ahead: parseInt(logCount.trim()) || 0
    };
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [GitBranchManager] [${level.toUpperCase()}] ${message}`);
  }
}

module.exports = GitBranchManager;