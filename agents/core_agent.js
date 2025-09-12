#!/usr/bin/env node

const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');

class CoreAgent extends EventEmitter {
  constructor(config = {}) {
    super();
    this.id = config.id || `agent_${Date.now()}`;
    this.name = config.name || 'CoreAgent';
    this.type = config.type || 'worker';
    this.capabilities = config.capabilities || ['general'];
    this.status = 'initializing';
    this.metrics = {
      tasksCompleted: 0,
      tasksFailedled: 0,
      avgExecutionTime: 0,
      successRate: 100,
      lastActivity: null,
      uptime: Date.now()
    };
    this.resources = {
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    };
    this.taskQueue = [];
    this.currentTask = null;
    this.maxRetries = config.maxRetries || 3;
    this.timeout = config.timeout || 60000;
  }

  async initialize() {
    this.log(`Initializing ${this.name} [${this.id}]`);
    this.status = 'idle';
    this.emit('initialized', { agent: this.id, capabilities: this.capabilities });
    this.startHealthMonitoring();
    return this;
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${this.name}] [${level.toUpperCase()}] ${message}`;
    console.log(logEntry);
    this.emit('log', { agent: this.id, message, level, timestamp });
  }

  async executeTask(task) {
    if (this.status !== 'idle') {
      throw new Error(`Agent ${this.id} is not available (status: ${this.status})`);
    }

    this.currentTask = task;
    this.status = 'busy';
    const startTime = Date.now();

    try {
      this.log(`Executing task: ${task.id} - ${task.name}`);
      
      const result = await this.processTask(task);
      
      const executionTime = Date.now() - startTime;
      this.updateMetrics(true, executionTime);
      
      this.log(`Task ${task.id} completed in ${executionTime}ms`);
      this.emit('task:completed', { agent: this.id, task, result, executionTime });
      
      return { success: true, result, executionTime };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.updateMetrics(false, executionTime);
      
      this.log(`Task ${task.id} failed: ${error.message}`, 'error');
      this.emit('task:failed', { agent: this.id, task, error: error.message, executionTime });
      
      throw error;
    } finally {
      this.currentTask = null;
      this.status = 'idle';
    }
  }

  async processTask(task) {
    const processor = this.getTaskProcessor(task.type);
    return await processor(task);
  }

  getTaskProcessor(taskType) {
    const processors = {
      compute: async (task) => {
        const { operation, data } = task.params || {};
        switch (operation) {
          case 'sum': return data.reduce((a, b) => a + b, 0);
          case 'multiply': return data.reduce((a, b) => a * b, 1);
          case 'analyze': return { count: data.length, unique: new Set(data).size };
          default: return { processed: true, data };
        }
      },
      transform: async (task) => {
        const { input, transformation } = task.params || {};
        return { transformed: true, output: `Transformed: ${input}` };
      },
      validate: async (task) => {
        const { data, rules } = task.params || {};
        return { valid: true, violations: [] };
      },
      optimize: async (task) => {
        const { target, constraints } = task.params || {};
        return { optimized: true, improvement: Math.random() * 30 };
      },
      default: async (task) => {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));
        return { processed: true, taskType: task.type };
      }
    };

    return processors[taskType] || processors.default;
  }

  updateMetrics(success, executionTime) {
    this.metrics.tasksCompleted++;
    if (!success) this.metrics.tasksFailed++;
    
    this.metrics.avgExecutionTime = 
      (this.metrics.avgExecutionTime * (this.metrics.tasksCompleted - 1) + executionTime) / 
      this.metrics.tasksCompleted;
    
    this.metrics.successRate = 
      ((this.metrics.tasksCompleted - this.metrics.tasksFailed) / this.metrics.tasksCompleted) * 100;
    
    this.metrics.lastActivity = new Date().toISOString();
    this.updateResourceUsage();
  }

  updateResourceUsage() {
    this.resources.memory = process.memoryUsage();
    this.resources.cpu = process.cpuUsage();
  }

  startHealthMonitoring() {
    setInterval(() => {
      this.updateResourceUsage();
      this.emit('health', {
        agent: this.id,
        status: this.status,
        metrics: this.metrics,
        resources: this.resources
      });
    }, 30000);
  }

  hasCapability(capability) {
    return this.capabilities.includes(capability) || this.capabilities.includes('general');
  }

  addCapability(capability) {
    if (!this.capabilities.includes(capability)) {
      this.capabilities.push(capability);
      this.log(`Added capability: ${capability}`);
      this.emit('capability:added', { agent: this.id, capability });
    }
  }

  getStatus() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      status: this.status,
      capabilities: this.capabilities,
      metrics: this.metrics,
      resources: this.resources,
      currentTask: this.currentTask ? this.currentTask.id : null
    };
  }

  async shutdown() {
    this.log(`Shutting down ${this.name}`);
    this.status = 'shutdown';
    this.emit('shutdown', { agent: this.id });
    this.removeAllListeners();
  }
}

module.exports = CoreAgent;