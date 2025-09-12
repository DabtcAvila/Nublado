#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const TaskManager = require('../tasks/task_manager');

class Orchestrator {
  constructor() {
    this.configPath = path.join(__dirname, '../config/orchestrator.json');
    this.config = this.loadConfig();
    this.taskManager = new TaskManager();
    this.logFile = path.join(__dirname, '../logs/orchestrator.log');
  }

  loadConfig() {
    try {
      return JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
    } catch (error) {
      this.log('Error loading config: ' + error.message, 'error');
      return {};
    }
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
    
    console.log(logEntry.trim());
    
    try {
      fs.appendFileSync(this.logFile, logEntry);
    } catch (error) {
      console.error('Failed to write to log file:', error.message);
    }
  }

  initialize() {
    this.log('Orchestrator initializing...', 'info');
    this.log(`Version: ${this.config.version}`, 'info');
    this.log(`Status: ${this.config.status}`, 'info');
    
    if (!fs.existsSync(path.dirname(this.logFile))) {
      fs.mkdirSync(path.dirname(this.logFile), { recursive: true });
    }
    
    this.log('Orchestrator ready!', 'success');
  }

  createTask(name, description, priority) {
    const task = this.taskManager.createTask(name, description, priority);
    this.log(`Task created: ${task.name} (ID: ${task.id})`, 'info');
    return task;
  }

  listTasks() {
    const stats = this.taskManager.getTaskStats();
    this.log(`Task Statistics - Total: ${stats.total}, Pending: ${stats.pending}, In Progress: ${stats.inProgress}, Completed: ${stats.completed}`, 'info');
    return this.taskManager.getTasks();
  }

  executeTask(taskId) {
    this.taskManager.updateTaskStatus(taskId, 'in_progress');
    this.log(`Executing task ${taskId}...`, 'info');
    
    setTimeout(() => {
      this.taskManager.updateTaskStatus(taskId, 'completed');
      this.log(`Task ${taskId} completed`, 'success');
    }, 1000);
  }

  status() {
    return {
      orchestrator: this.config,
      tasks: this.taskManager.getTaskStats(),
      uptime: process.uptime(),
      memory: process.memoryUsage()
    };
  }
}

if (require.main === module) {
  const orchestrator = new Orchestrator();
  orchestrator.initialize();
  
  orchestrator.createTask('System Check', 'Verify all systems operational', 'high');
  orchestrator.createTask('Data Backup', 'Automated backup process', 'normal');
  orchestrator.createTask('Log Rotation', 'Clean old log files', 'low');
  
  orchestrator.listTasks();
  
  console.log('\nOrchestrator is running in home base...');
}

module.exports = Orchestrator;