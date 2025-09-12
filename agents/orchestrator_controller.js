#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class OrchestratorController {
  constructor() {
    this.agents = new Map();
    this.taskQueue = [];
    this.configFile = path.join(__dirname, '..', 'config', 'orchestrator.json');
    this.logFile = path.join(__dirname, '..', 'logs', 'orchestrator.log');
    this.taskIdCounter = 1;
    this.agentIdCounter = 1;
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [ORCHESTRATOR] [${level.toUpperCase()}] ${message}`;
    console.log(logEntry);
    
    try {
      const logDir = path.dirname(this.logFile);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      fs.appendFileSync(this.logFile, logEntry + '\n');
    } catch (error) {
      console.error('Log write error:', error.message);
    }
  }

  async initialize() {
    this.log('Development Orchestrator Framework initializing...');
    await this.loadConfig();
    this.setupCoreCapabilities();
    this.log('Orchestrator ready for development tasks');
  }

  async loadConfig() {
    try {
      if (fs.existsSync(this.configFile)) {
        this.config = JSON.parse(fs.readFileSync(this.configFile, 'utf8'));
        this.log(`Configuration loaded: ${this.config.name} v${this.config.version}`);
      } else {
        this.config = this.getDefaultConfig();
        this.log('Using default configuration');
      }
    } catch (error) {
      this.log(`Failed to load config: ${error.message}`, 'error');
      this.config = this.getDefaultConfig();
    }
  }

  getDefaultConfig() {
    return {
      name: 'Development Orchestrator',
      version: '1.0.0',
      capabilities: {
        task_management: true,
        parallel_execution: true,
        dynamic_agent_creation: true,
        self_learning: true
      },
      performance: {
        max_parallel_tasks: 10,
        max_agents: 20
      }
    };
  }

  setupCoreCapabilities() {
    this.capabilities = {
      createAgent: this.createDynamicAgent.bind(this),
      executeParallel: this.executeParallelTasks.bind(this),
      learn: this.learnFromExecution.bind(this),
      coordinate: this.coordinateAgents.bind(this)
    };
    
    this.log(`Core capabilities loaded: ${Object.keys(this.capabilities).join(', ')}`);
  }

  createDynamicAgent(config) {
    const agentId = `agent_${this.agentIdCounter++}`;
    const agent = {
      id: agentId,
      name: config.name || agentId,
      type: config.type || 'worker',
      capabilities: config.capabilities || [],
      status: 'idle',
      created: new Date().toISOString(),
      tasks: [],
      performance: {
        tasksCompleted: 0,
        avgExecutionTime: 0,
        successRate: 100
      }
    };

    this.agents.set(agentId, agent);
    this.log(`Dynamic agent created: ${agent.name} [${agentId}] with capabilities: ${agent.capabilities.join(', ')}`);
    
    return agent;
  }

  async executeParallelTasks(tasks) {
    const maxParallel = this.config.performance.max_parallel_tasks;
    const results = [];
    
    this.log(`Executing ${tasks.length} tasks with max parallelism of ${maxParallel}`);
    
    for (let i = 0; i < tasks.length; i += maxParallel) {
      const batch = tasks.slice(i, i + maxParallel);
      const batchPromises = batch.map(task => this.executeTask(task));
      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults);
    }
    
    return results;
  }

  async executeTask(task) {
    const startTime = Date.now();
    task.id = `task_${this.taskIdCounter++}`;
    task.status = 'executing';
    task.startTime = new Date().toISOString();
    
    this.log(`Executing task: ${task.id} - ${task.name}`);
    
    try {
      const bestAgent = this.selectBestAgent(task);
      
      if (bestAgent) {
        bestAgent.tasks.push(task.id);
        bestAgent.status = 'busy';
        
        const result = await this.simulateTaskExecution(task, bestAgent);
        
        task.status = 'completed';
        task.endTime = new Date().toISOString();
        task.executionTime = Date.now() - startTime;
        task.result = result;
        
        bestAgent.status = 'idle';
        bestAgent.performance.tasksCompleted++;
        bestAgent.performance.avgExecutionTime = 
          (bestAgent.performance.avgExecutionTime * (bestAgent.performance.tasksCompleted - 1) + task.executionTime) / 
          bestAgent.performance.tasksCompleted;
        
        this.log(`Task ${task.id} completed in ${task.executionTime}ms by ${bestAgent.name}`);
        
        return task;
      } else {
        throw new Error('No suitable agent available');
      }
    } catch (error) {
      task.status = 'failed';
      task.error = error.message;
      this.log(`Task ${task.id} failed: ${error.message}`, 'error');
      throw error;
    }
  }

  selectBestAgent(task) {
    const availableAgents = Array.from(this.agents.values()).filter(a => a.status === 'idle');
    
    if (availableAgents.length === 0) {
      const newAgent = this.createDynamicAgent({
        name: `Worker-${this.agentIdCounter}`,
        type: 'worker',
        capabilities: task.requiredCapabilities || ['general']
      });
      return newAgent;
    }
    
    const compatibleAgents = availableAgents.filter(agent => {
      if (!task.requiredCapabilities) return true;
      return task.requiredCapabilities.every(cap => agent.capabilities.includes(cap));
    });
    
    if (compatibleAgents.length === 0) {
      return this.createDynamicAgent({
        name: `Specialist-${this.agentIdCounter}`,
        type: 'specialist',
        capabilities: task.requiredCapabilities || ['general']
      });
    }
    
    return compatibleAgents.reduce((best, agent) => {
      if (!best) return agent;
      return agent.performance.avgExecutionTime < best.performance.avgExecutionTime ? agent : best;
    });
  }

  async simulateTaskExecution(task, agent) {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
    
    return {
      success: true,
      agent: agent.name,
      message: `Task ${task.name} completed successfully`,
      data: task.params || {}
    };
  }

  learnFromExecution(executionHistory) {
    const insights = {
      totalTasks: executionHistory.length,
      successRate: (executionHistory.filter(t => t.status === 'completed').length / executionHistory.length) * 100,
      avgExecutionTime: executionHistory.reduce((acc, t) => acc + (t.executionTime || 0), 0) / executionHistory.length,
      agentPerformance: {}
    };
    
    this.agents.forEach((agent, id) => {
      insights.agentPerformance[agent.name] = {
        tasksCompleted: agent.performance.tasksCompleted,
        avgTime: agent.performance.avgExecutionTime,
        efficiency: agent.performance.successRate
      };
    });
    
    this.log(`Learning insights: ${JSON.stringify(insights, null, 2)}`);
    
    return insights;
  }

  coordinateAgents(coordinationPlan) {
    const { tasks, dependencies, priority } = coordinationPlan;
    
    this.log(`Coordinating ${tasks.length} tasks with ${dependencies ? Object.keys(dependencies).length : 0} dependencies`);
    
    const executionPlan = this.buildExecutionPlan(tasks, dependencies, priority);
    
    return executionPlan;
  }

  buildExecutionPlan(tasks, dependencies = {}, priority = {}) {
    const plan = {
      phases: [],
      estimatedTime: 0,
      requiredAgents: 0
    };
    
    const taskMap = new Map(tasks.map(t => [t.id || t.name, t]));
    const completed = new Set();
    const inProgress = new Set();
    
    while (completed.size < tasks.length) {
      const phase = [];
      
      for (const task of tasks) {
        const taskId = task.id || task.name;
        
        if (completed.has(taskId) || inProgress.has(taskId)) continue;
        
        const deps = dependencies[taskId] || [];
        if (deps.every(d => completed.has(d))) {
          phase.push(task);
          inProgress.add(taskId);
        }
      }
      
      if (phase.length === 0 && completed.size < tasks.length) {
        this.log('Circular dependency detected or unresolvable dependencies', 'warning');
        break;
      }
      
      phase.sort((a, b) => (priority[b.id || b.name] || 0) - (priority[a.id || a.name] || 0));
      
      plan.phases.push(phase);
      phase.forEach(t => {
        inProgress.delete(t.id || t.name);
        completed.add(t.id || t.name);
      });
    }
    
    plan.requiredAgents = Math.max(...plan.phases.map(p => p.length));
    plan.estimatedTime = plan.phases.reduce((acc, phase) => acc + 1000, 0);
    
    return plan;
  }

  createTask(name, description, params = {}, requiredCapabilities = []) {
    const task = {
      name,
      description,
      params,
      requiredCapabilities,
      priority: params.priority || 'normal',
      status: 'pending',
      created: new Date().toISOString()
    };
    
    this.taskQueue.push(task);
    this.log(`Task created: ${name} with capabilities: ${requiredCapabilities.join(', ')}`);
    
    return task;
  }

  async processTasks() {
    if (this.taskQueue.length === 0) {
      this.log('No tasks in queue');
      return;
    }
    
    const tasks = [...this.taskQueue];
    this.taskQueue = [];
    
    const results = await this.executeParallelTasks(tasks);
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    this.log(`Batch processing complete: ${successful} successful, ${failed} failed`);
    
    const insights = this.learnFromExecution(
      results.filter(r => r.status === 'fulfilled').map(r => r.value)
    );
    
    return { results, insights };
  }

  getStatus() {
    return {
      agents: {
        total: this.agents.size,
        idle: Array.from(this.agents.values()).filter(a => a.status === 'idle').length,
        busy: Array.from(this.agents.values()).filter(a => a.status === 'busy').length
      },
      tasks: {
        queued: this.taskQueue.length,
        total: this.taskIdCounter - 1
      },
      config: this.config
    };
  }

  shutdown() {
    this.log('Orchestrator shutting down gracefully');
    this.agents.clear();
    this.taskQueue = [];
  }
}

if (require.main === module) {
  const orchestrator = new OrchestratorController();
  
  orchestrator.initialize().then(() => {
    console.log('\n=== DEVELOPMENT ORCHESTRATOR FRAMEWORK ===');
    console.log('Interactive CLI for orchestration control\n');
    console.log('Commands:');
    console.log('  status     - Show system status');
    console.log('  create     - Create example development tasks');
    console.log('  process    - Process all queued tasks');
    console.log('  agent      - Create a new agent');
    console.log('  parallel   - Demo parallel execution');
    console.log('  learn      - Show learning insights');
    console.log('  quit       - Exit orchestrator\n');

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
          console.log(JSON.stringify(orchestrator.getStatus(), null, 2));
          break;
          
        case 'create':
          orchestrator.createTask('Code Review', 'Review pull request #123', 
            { files: ['src/main.js', 'src/utils.js'] }, ['code_analysis', 'testing']);
          orchestrator.createTask('Build Project', 'Compile and bundle application', 
            { target: 'production' }, ['compilation', 'bundling']);
          orchestrator.createTask('Run Tests', 'Execute test suite', 
            { coverage: true }, ['testing']);
          orchestrator.createTask('Deploy', 'Deploy to staging environment', 
            { environment: 'staging' }, ['deployment', 'infrastructure']);
          console.log('4 development tasks created');
          break;
          
        case 'process':
          const results = await orchestrator.processTasks();
          console.log(`Processed ${results?.results?.length || 0} tasks`);
          break;
          
        case 'agent':
          const agent = orchestrator.createDynamicAgent({
            name: `DevAgent-${Date.now()}`,
            type: 'developer',
            capabilities: ['code_analysis', 'testing', 'refactoring']
          });
          console.log(`Created agent: ${agent.name}`);
          break;
          
        case 'parallel':
          const demoTasks = [
            { name: 'Lint Code', requiredCapabilities: ['code_analysis'] },
            { name: 'Format Code', requiredCapabilities: ['formatting'] },
            { name: 'Check Types', requiredCapabilities: ['type_checking'] },
            { name: 'Analyze Security', requiredCapabilities: ['security'] }
          ];
          console.log('Running parallel execution demo...');
          const parallelResults = await orchestrator.executeParallelTasks(demoTasks);
          console.log(`Completed ${parallelResults.filter(r => r.status === 'fulfilled').length} tasks in parallel`);
          break;
          
        case 'learn':
          const history = await orchestrator.executeParallelTasks([
            { name: 'Sample Task 1' },
            { name: 'Sample Task 2' }
          ]);
          const insights = orchestrator.learnFromExecution(
            history.filter(r => r.status === 'fulfilled').map(r => r.value)
          );
          console.log('Learning insights:', insights);
          break;
          
        case 'quit':
        case 'exit':
          orchestrator.shutdown();
          process.exit(0);
          
        default:
          console.log('Unknown command. Available: status, create, process, agent, parallel, learn, quit');
      }
      
      rl.prompt();
    });

    rl.on('close', () => {
      console.log('\nShutting down orchestrator');
      orchestrator.shutdown();
      process.exit(0);
    });
  });
}

module.exports = OrchestratorController;