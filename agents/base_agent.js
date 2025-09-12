#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

class BaseAgent extends EventEmitter {
  constructor(config = {}) {
    super();
    this.id = config.id || `agent_${Date.now()}`;
    this.name = config.name || 'BaseAgent';
    this.type = config.type || 'generic';
    this.capabilities = config.capabilities || [];
    this.status = 'initializing';
    this.logFile = config.logFile || path.join(__dirname, '..', 'logs', `${this.name.toLowerCase()}.log`);
    this.performance = {
      tasksCompleted: 0,
      tasksSuccessful: 0,
      tasksFailed: 0,
      avgExecutionTime: 0,
      startTime: new Date().toISOString()
    };
    this.activeTasks = new Map();
    this.taskHistory = [];
    this.maxConcurrentTasks = config.maxConcurrentTasks || 5;
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${this.name}] [${level.toUpperCase()}] ${message}`;
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
    
    this.emit('log', { message, level, timestamp });
  }

  async initialize() {
    this.log(`Initializing ${this.name} agent...`);
    
    try {
      await this.setup();
      this.status = 'ready';
      this.log(`${this.name} agent initialized successfully`);
      this.emit('ready', { agent: this.name, id: this.id });
      return true;
    } catch (error) {
      this.status = 'error';
      this.log(`Failed to initialize: ${error.message}`, 'error');
      this.emit('error', { error, agent: this.name });
      return false;
    }
  }

  async setup() {
    // Override in child classes for specific setup
  }

  async executeTask(task) {
    if (this.activeTasks.size >= this.maxConcurrentTasks) {
      this.log(`Max concurrent tasks reached, queueing task: ${task.id}`, 'warning');
      this.emit('task-queued', { task, agent: this.name });
      return { success: false, reason: 'Max concurrent tasks reached' };
    }

    const taskId = task.id || `task_${Date.now()}`;
    const startTime = Date.now();
    
    this.activeTasks.set(taskId, {
      ...task,
      startTime: new Date().toISOString(),
      status: 'executing'
    });
    
    this.log(`Executing task: ${taskId} - ${task.name || 'Unnamed task'}`);
    this.emit('task-started', { taskId, task, agent: this.name });
    
    try {
      const result = await this.performTask(task);
      
      const executionTime = Date.now() - startTime;
      this.updatePerformance(executionTime, true);
      
      const completedTask = {
        ...task,
        id: taskId,
        result,
        status: 'completed',
        executionTime,
        completedAt: new Date().toISOString()
      };
      
      this.taskHistory.push(completedTask);
      this.activeTasks.delete(taskId);
      
      this.log(`Task ${taskId} completed in ${executionTime}ms`);
      this.emit('task-completed', { taskId, result, executionTime, agent: this.name });
      
      return { success: true, result, executionTime };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.updatePerformance(executionTime, false);
      
      const failedTask = {
        ...task,
        id: taskId,
        error: error.message,
        status: 'failed',
        executionTime,
        failedAt: new Date().toISOString()
      };
      
      this.taskHistory.push(failedTask);
      this.activeTasks.delete(taskId);
      
      this.log(`Task ${taskId} failed: ${error.message}`, 'error');
      this.emit('task-failed', { taskId, error: error.message, executionTime, agent: this.name });
      
      return { success: false, error: error.message, executionTime };
    }
  }

  async performTask(task) {
    // Override in child classes for specific task execution
    return { message: 'Task executed by base agent', data: task };
  }

  updatePerformance(executionTime, success) {
    this.performance.tasksCompleted++;
    
    if (success) {
      this.performance.tasksSuccessful++;
    } else {
      this.performance.tasksFailed++;
    }
    
    this.performance.avgExecutionTime = 
      (this.performance.avgExecutionTime * (this.performance.tasksCompleted - 1) + executionTime) / 
      this.performance.tasksCompleted;
  }

  hasCapability(capability) {
    return this.capabilities.includes(capability);
  }

  addCapability(capability) {
    if (!this.hasCapability(capability)) {
      this.capabilities.push(capability);
      this.log(`Added capability: ${capability}`);
      this.emit('capability-added', { capability, agent: this.name });
    }
  }

  removeCapability(capability) {
    const index = this.capabilities.indexOf(capability);
    if (index > -1) {
      this.capabilities.splice(index, 1);
      this.log(`Removed capability: ${capability}`);
      this.emit('capability-removed', { capability, agent: this.name });
    }
  }

  getStatus() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      status: this.status,
      capabilities: this.capabilities,
      activeTasks: this.activeTasks.size,
      performance: this.performance,
      uptime: this.getUptime()
    };
  }

  getUptime() {
    const start = new Date(this.performance.startTime);
    const now = new Date();
    const uptimeMs = now - start;
    
    const hours = Math.floor(uptimeMs / 3600000);
    const minutes = Math.floor((uptimeMs % 3600000) / 60000);
    const seconds = Math.floor((uptimeMs % 60000) / 1000);
    
    return `${hours}h ${minutes}m ${seconds}s`;
  }

  async shutdown() {
    this.log(`Shutting down ${this.name} agent...`);
    this.status = 'shutting_down';
    
    // Wait for active tasks to complete
    if (this.activeTasks.size > 0) {
      this.log(`Waiting for ${this.activeTasks.size} active tasks to complete...`);
      await new Promise(resolve => {
        const checkInterval = setInterval(() => {
          if (this.activeTasks.size === 0) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
      });
    }
    
    this.status = 'stopped';
    this.log(`${this.name} agent shut down successfully`);
    this.emit('shutdown', { agent: this.name, performance: this.performance });
  }

  // Communication methods for inter-agent coordination
  async sendMessage(targetAgent, message) {
    this.emit('message-sent', { 
      from: this.name, 
      to: targetAgent, 
      message,
      timestamp: new Date().toISOString()
    });
  }

  async receiveMessage(fromAgent, message) {
    this.log(`Received message from ${fromAgent}: ${JSON.stringify(message)}`);
    this.emit('message-received', { 
      from: fromAgent, 
      message,
      timestamp: new Date().toISOString()
    });
    
    // Process message based on type
    if (message.type === 'task-request') {
      return await this.executeTask(message.task);
    } else if (message.type === 'status-request') {
      return this.getStatus();
    } else if (message.type === 'capability-query') {
      return this.hasCapability(message.capability);
    }
    
    return { acknowledged: true };
  }
}

// Example specialized agent extending BaseAgent
class DevelopmentAgent extends BaseAgent {
  constructor(config) {
    super({
      ...config,
      name: config.name || 'DevelopmentAgent',
      type: 'developer',
      capabilities: ['code_generation', 'testing', 'debugging', 'refactoring', ...(config.capabilities || [])]
    });
  }

  async setup() {
    // Development-specific setup
    this.codeTemplates = new Map();
    this.testFrameworks = ['jest', 'mocha', 'jasmine'];
    this.languages = ['javascript', 'typescript', 'python', 'java'];
  }

  async performTask(task) {
    const { type, params } = task;
    
    switch (type) {
      case 'generate_code':
        return await this.generateCode(params);
      case 'run_tests':
        return await this.runTests(params);
      case 'debug':
        return await this.debugCode(params);
      case 'refactor':
        return await this.refactorCode(params);
      default:
        return await super.performTask(task);
    }
  }

  async generateCode(params) {
    // Simulate code generation
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      code: `// Generated code for ${params.feature}\nfunction ${params.feature}() {\n  // Implementation here\n}`,
      language: params.language || 'javascript'
    };
  }

  async runTests(params) {
    // Simulate test execution
    await new Promise(resolve => setTimeout(resolve, 1500));
    return {
      passed: Math.random() > 0.2,
      coverage: Math.floor(Math.random() * 30) + 70,
      framework: params.framework || 'jest'
    };
  }

  async debugCode(params) {
    // Simulate debugging
    await new Promise(resolve => setTimeout(resolve, 2000));
    return {
      issues: ['Memory leak in function X', 'Undefined variable in line 42'],
      suggestions: ['Use const instead of let', 'Add error handling']
    };
  }

  async refactorCode(params) {
    // Simulate refactoring
    await new Promise(resolve => setTimeout(resolve, 1200));
    return {
      refactored: true,
      improvements: ['Reduced complexity', 'Better naming', 'Extracted methods']
    };
  }
}

module.exports = { BaseAgent, DevelopmentAgent };