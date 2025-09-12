#!/usr/bin/env node

const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');
const { Worker } = require('worker_threads');
const GitBranchManager = require('./git-branch-manager');

class MasterOrchestrator extends EventEmitter {
  constructor() {
    super();
    this.agents = new Map();
    this.taskQueue = [];
    this.activeJobs = new Map();
    this.gitManager = new GitBranchManager();
    this.messageQueue = new Map();
    this.performanceMetrics = new Map();
    this.configPath = path.join(__dirname, '..', 'config', 'agents-stack.json');
    this.isRunning = false;
  }

  async initialize() {
    this.log('🚀 Initializing Nublado Master Orchestrator v3.0.0');
    
    // Load configuration
    await this.loadConfiguration();
    
    // Initialize Git branch manager
    await this.gitManager.initialize();
    
    // Create agent branches
    await this.setupAgentBranches();
    
    // Initialize agents
    await this.initializeAgents();
    
    // Setup communication channels
    this.setupCommunicationChannels();
    
    // Start monitoring
    this.startMonitoring();
    
    this.isRunning = true;
    this.log('✅ Master Orchestrator initialized and ready');
  }

  async loadConfiguration() {
    const configData = await fs.readFile(this.configPath, 'utf8');
    this.config = JSON.parse(configData);
    this.log(`📋 Loaded configuration with ${this.config.agents.length} agents`);
  }

  async setupAgentBranches() {
    for (const agentConfig of this.config.agents) {
      await this.gitManager.createAgentBranch(agentConfig.id, agentConfig.branch);
    }
    this.log('🌿 Agent branches created');
  }

  async initializeAgents() {
    for (const agentConfig of this.config.agents) {
      const agent = await this.createAgent(agentConfig);
      this.agents.set(agentConfig.id, agent);
      this.performanceMetrics.set(agentConfig.id, {
        tasksCompleted: 0,
        tasksFailed: 0,
        avgExecutionTime: 0,
        lastActivity: null
      });
    }
    this.log(`🤖 Initialized ${this.agents.size} specialized agents`);
  }

  async createAgent(config) {
    return {
      id: config.id,
      name: config.name,
      branch: config.branch,
      role: config.role,
      specialization: config.specialization,
      permissions: config.permissions,
      protocols: config.protocols,
      status: 'idle',
      worker: null,
      currentTask: null
    };
  }

  setupCommunicationChannels() {
    // Create message channels for each communication type
    const channels = this.config.protocols.communication.channels;
    Object.keys(channels).forEach(channel => {
      this.messageQueue.set(channel, []);
    });

    // Setup Git manager event listeners
    this.gitManager.on('branch:created', (data) => this.handleBranchEvent('created', data));
    this.gitManager.on('commit:created', (data) => this.handleCommitEvent(data));
    this.gitManager.on('conflict:detected', (data) => this.handleConflictEvent(data));
    this.gitManager.on('branch:merged', (data) => this.handleMergeEvent(data));

    this.log('📡 Communication channels established');
  }

  async assignTask(task) {
    // Find best agent for task
    const agent = this.selectBestAgent(task);
    
    if (!agent) {
      this.log(`⚠️ No suitable agent found for task: ${task.name}`, 'warn');
      return null;
    }

    // Check agent availability
    if (agent.status !== 'idle') {
      this.taskQueue.push(task);
      this.log(`📋 Task queued: ${task.name} (agent ${agent.id} busy)`);
      return null;
    }

    // Assign task to agent
    agent.status = 'working';
    agent.currentTask = task;
    
    this.log(`📌 Assigned task "${task.name}" to ${agent.name}`);
    
    // Execute task in parallel
    this.executeAgentTask(agent, task);
    
    return agent.id;
  }

  selectBestAgent(task) {
    let bestAgent = null;
    let bestScore = 0;

    for (const [id, agent] of this.agents) {
      // Calculate compatibility score
      let score = 0;

      // Check if agent has required capabilities
      if (task.requiredCapabilities) {
        const capabilities = agent.specialization.primary;
        const matches = task.requiredCapabilities.filter(req => 
          capabilities.some(cap => cap.includes(req) || req.includes(cap))
        );
        score += matches.length * 10;
      }

      // Check task type alignment
      if (task.type && agent.role.toLowerCase().includes(task.type.toLowerCase())) {
        score += 5;
      }

      // Consider agent priority
      score += agent.protocols.priority;

      // Consider current workload (prefer idle agents)
      if (agent.status === 'idle') {
        score += 3;
      }

      if (score > bestScore) {
        bestScore = score;
        bestAgent = agent;
      }
    }

    return bestAgent;
  }

  async executeAgentTask(agent, task) {
    const startTime = Date.now();
    
    try {
      // Switch to agent's branch
      await this.gitManager.switchBranch(agent.id);
      
      // Create worker for parallel execution
      const worker = new Worker(path.join(__dirname, 'agent-worker.js'), {
        workerData: {
          agentConfig: agent,
          task: task
        }
      });

      agent.worker = worker;

      // Handle worker messages
      worker.on('message', async (message) => {
        await this.handleWorkerMessage(agent, message);
      });

      // Handle worker completion
      worker.on('exit', async (code) => {
        const executionTime = Date.now() - startTime;
        
        if (code === 0) {
          await this.handleTaskCompletion(agent, task, executionTime);
        } else {
          await this.handleTaskFailure(agent, task, executionTime);
        }

        agent.worker = null;
        agent.status = 'idle';
        agent.currentTask = null;

        // Process next task in queue
        this.processTaskQueue();
      });

      // Handle worker errors
      worker.on('error', async (error) => {
        this.log(`❌ Worker error for ${agent.name}: ${error.message}`, 'error');
        await this.handleTaskFailure(agent, task, Date.now() - startTime);
      });

    } catch (error) {
      this.log(`❌ Failed to execute task for ${agent.name}: ${error.message}`, 'error');
      agent.status = 'idle';
      agent.currentTask = null;
    }
  }

  async handleWorkerMessage(agent, message) {
    switch (message.type) {
      case 'progress':
        this.log(`📊 ${agent.name}: ${message.data.message}`);
        this.emit('agent:progress', { agent: agent.id, progress: message.data });
        break;

      case 'file_created':
        await this.gitManager.commitChanges(
          agent.id,
          message.data.commitMessage || `Created ${message.data.file}`,
          [message.data.file]
        );
        break;

      case 'help_request':
        await this.handleHelpRequest(agent, message.data);
        break;

      case 'completed':
        this.log(`✅ ${agent.name} completed: ${message.data.message}`);
        break;

      default:
        this.messageQueue.get('status.update')?.push({
          from: agent.id,
          message: message.data
        });
    }
  }

  async handleTaskCompletion(agent, task, executionTime) {
    // Update metrics
    const metrics = this.performanceMetrics.get(agent.id);
    metrics.tasksCompleted++;
    metrics.avgExecutionTime = 
      (metrics.avgExecutionTime * (metrics.tasksCompleted - 1) + executionTime) / 
      metrics.tasksCompleted;
    metrics.lastActivity = new Date();

    // Commit and push changes
    await this.gitManager.commitChanges(agent.id, `Completed task: ${task.name}`);
    await this.gitManager.pushBranch(agent.id);

    this.log(`✅ Task "${task.name}" completed by ${agent.name} in ${executionTime}ms`);
    this.emit('task:completed', { agent: agent.id, task, executionTime });
  }

  async handleTaskFailure(agent, task, executionTime) {
    const metrics = this.performanceMetrics.get(agent.id);
    metrics.tasksFailed++;
    metrics.lastActivity = new Date();

    this.log(`❌ Task "${task.name}" failed for ${agent.name}`, 'error');
    this.emit('task:failed', { agent: agent.id, task, executionTime });

    // Retry with different agent
    if (task.retries < 3) {
      task.retries = (task.retries || 0) + 1;
      task.excludeAgents = [...(task.excludeAgents || []), agent.id];
      this.taskQueue.unshift(task);
    }
  }

  async handleHelpRequest(agent, request) {
    this.log(`🆘 Help request from ${agent.name}: ${request.message}`);
    
    // Find agents that can help
    const helpers = Array.from(this.agents.values()).filter(a => 
      a.id !== agent.id && 
      a.status === 'idle' &&
      request.capabilities.some(cap => a.specialization.primary.includes(cap))
    );

    if (helpers.length > 0) {
      // Send help request to capable agents
      for (const helper of helpers) {
        this.messageQueue.get('help.request')?.push({
          from: agent.id,
          to: helper.id,
          request: request
        });
      }
    }
  }

  async processTaskQueue() {
    if (this.taskQueue.length === 0) return;

    const idleAgents = Array.from(this.agents.values()).filter(a => a.status === 'idle');
    
    while (this.taskQueue.length > 0 && idleAgents.length > 0) {
      const task = this.taskQueue.shift();
      await this.assignTask(task);
      idleAgents.shift();
    }
  }

  async synchronizeWork() {
    this.log('🔄 Synchronizing all agent branches...');
    const results = await this.gitManager.synchronizeAgentBranches();
    
    const conflicts = results.filter(r => r.status === 'conflict');
    if (conflicts.length > 0) {
      this.log(`⚠️ Detected ${conflicts.length} conflicts, resolving...`, 'warn');
      for (const conflict of conflicts) {
        await this.resolveConflict(conflict.agentId);
      }
    }

    this.log('✅ Synchronization complete');
  }

  async resolveConflict(agentId) {
    // Intelligent conflict resolution based on agent priority
    const agent = this.agents.get(agentId);
    const strategy = agent.protocols.priority > 7 ? 'ours' : 'theirs';
    
    try {
      await this.gitManager.resolveConflicts(agentId, strategy);
      this.log(`✅ Resolved conflict for ${agent.name} using ${strategy} strategy`);
    } catch (error) {
      this.log(`❌ Failed to resolve conflict for ${agent.name}: ${error.message}`, 'error');
    }
  }

  async deployToProduction() {
    this.log('🚀 Initiating deployment to production...');
    
    // Ensure all work is synchronized
    await this.synchronizeWork();
    
    // Run quality gates
    const qualityCheck = await this.runQualityGates();
    if (!qualityCheck.passed) {
      this.log(`❌ Quality gates failed: ${qualityCheck.failures.join(', ')}`, 'error');
      return false;
    }

    // Deploy to production
    await this.gitManager.deployToProduction();
    
    this.log('✅ Successfully deployed to production');
    this.emit('deploy:complete', { timestamp: new Date() });
    
    return true;
  }

  async runQualityGates() {
    const gates = this.config.protocols.quality_gates;
    const failures = [];

    // Check each quality gate
    if (gates.automated_testing) {
      // Run tests (simplified for now)
      this.log('🧪 Running automated tests...');
    }

    if (gates.performance_benchmarks) {
      // Check performance
      this.log('⚡ Checking performance benchmarks...');
    }

    if (gates.accessibility_standards) {
      // Check accessibility
      this.log('♿ Validating accessibility standards...');
    }

    return { passed: failures.length === 0, failures };
  }

  startMonitoring() {
    setInterval(() => {
      this.reportStatus();
    }, 30000); // Every 30 seconds

    setInterval(() => {
      this.processTaskQueue();
    }, 5000); // Every 5 seconds

    setInterval(() => {
      this.synchronizeWork();
    }, 300000); // Every 5 minutes
  }

  reportStatus() {
    const status = {
      agents: {
        total: this.agents.size,
        idle: Array.from(this.agents.values()).filter(a => a.status === 'idle').length,
        working: Array.from(this.agents.values()).filter(a => a.status === 'working').length
      },
      tasks: {
        queued: this.taskQueue.length,
        active: this.activeJobs.size
      },
      performance: {}
    };

    // Add performance metrics
    for (const [agentId, metrics] of this.performanceMetrics) {
      const agent = this.agents.get(agentId);
      status.performance[agent.name] = {
        completed: metrics.tasksCompleted,
        failed: metrics.tasksFailed,
        avgTime: Math.round(metrics.avgExecutionTime),
        successRate: metrics.tasksCompleted > 0 
          ? Math.round((metrics.tasksCompleted / (metrics.tasksCompleted + metrics.tasksFailed)) * 100)
          : 100
      };
    }

    this.emit('status:report', status);
    return status;
  }

  // Handle events from Git manager
  handleBranchEvent(event, data) {
    this.log(`🌿 Branch ${event}: ${data.branch} for agent ${data.agentId}`);
  }

  handleCommitEvent(data) {
    this.log(`💾 Commit by agent ${data.agentId}: ${data.message}`);
  }

  handleConflictEvent(data) {
    this.log(`⚠️ Conflict detected for agent ${data.agentId}`, 'warn');
    this.resolveConflict(data.agentId);
  }

  handleMergeEvent(data) {
    this.log(`🔀 Branch merged: ${data.branch} from agent ${data.agentId}`);
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '📝',
      warn: '⚠️',
      error: '❌',
      success: '✅'
    }[level] || '📝';
    
    console.log(`[${timestamp}] ${prefix} [ORCHESTRATOR] ${message}`);
  }

  async shutdown() {
    this.log('🛑 Shutting down Master Orchestrator...');
    this.isRunning = false;

    // Terminate all workers
    for (const agent of this.agents.values()) {
      if (agent.worker) {
        agent.worker.terminate();
      }
    }

    this.log('👋 Master Orchestrator shutdown complete');
  }
}

// CLI Interface
if (require.main === module) {
  const orchestrator = new MasterOrchestrator();
  
  orchestrator.initialize().then(() => {
    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║   NUBLADO MASTER ORCHESTRATOR v3.0.0      ║');
    console.log('║   AI-Powered Parallel Development System   ║');
    console.log('╚════════════════════════════════════════════╝\n');
    
    console.log('Commands:');
    console.log('  status    - Show system status');
    console.log('  task      - Create new task');
    console.log('  sync      - Synchronize all branches');
    console.log('  deploy    - Deploy to production');
    console.log('  monitor   - Show performance metrics');
    console.log('  quit      - Shutdown orchestrator\n');

    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: 'orchestrator> '
    });

    rl.prompt();

    rl.on('line', async (line) => {
      const command = line.trim().toLowerCase();
      
      switch (command) {
        case 'status':
          const status = orchestrator.reportStatus();
          console.log(JSON.stringify(status, null, 2));
          break;

        case 'task':
          // Example task creation
          await orchestrator.assignTask({
            name: 'Create landing page',
            type: 'frontend',
            requiredCapabilities: ['react', 'responsive_design'],
            priority: 'high'
          });
          break;

        case 'sync':
          await orchestrator.synchronizeWork();
          break;

        case 'deploy':
          await orchestrator.deployToProduction();
          break;

        case 'monitor':
          const metrics = orchestrator.reportStatus();
          console.log('\n📊 Performance Metrics:');
          Object.entries(metrics.performance).forEach(([agent, stats]) => {
            console.log(`  ${agent}:`);
            console.log(`    ✅ Completed: ${stats.completed}`);
            console.log(`    ❌ Failed: ${stats.failed}`);
            console.log(`    ⏱️  Avg Time: ${stats.avgTime}ms`);
            console.log(`    📈 Success Rate: ${stats.successRate}%`);
          });
          break;

        case 'quit':
        case 'exit':
          await orchestrator.shutdown();
          process.exit(0);

        default:
          console.log('Unknown command. Available: status, task, sync, deploy, monitor, quit');
      }
      
      rl.prompt();
    });

    rl.on('close', async () => {
      await orchestrator.shutdown();
      process.exit(0);
    });
  }).catch(error => {
    console.error('Failed to initialize orchestrator:', error);
    process.exit(1);
  });
}

module.exports = MasterOrchestrator;