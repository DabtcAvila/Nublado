#!/usr/bin/env node

const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class ParallelOrchestrator {
  constructor() {
    this.agents = {
      'data-processor': { branch: 'agent/data-processor', status: 'idle', tasks: [] },
      'file-manager': { branch: 'agent/file-manager', status: 'idle', tasks: [] },
      'monitor': { branch: 'agent/monitor', status: 'idle', tasks: [] },
      'security': { branch: 'agent/security', status: 'idle', tasks: [] },
      'builder': { branch: 'agent/builder', status: 'idle', tasks: [] },
      'tester': { branch: 'agent/tester', status: 'idle', tasks: [] }
    };
    
    this.taskQueue = [];
    this.activeTasks = new Map();
    this.completedTasks = [];
    this.performanceMetrics = {
      tasksProcessed: 0,
      averageTime: 0,
      parallelRatio: 0,
      efficiency: 100
    };
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [PARALLEL-ORCHESTRATOR] [${level}] ${message}`);
  }

  async initialize() {
    this.log('Initializing Parallel Orchestrator with Multi-Branch System');
    await this.verifyBranches();
    await this.setupParallelExecution();
    this.log('Ready for parallel task execution across branches');
  }

  async verifyBranches() {
    return new Promise((resolve) => {
      exec('git branch -a', (error, stdout) => {
        if (error) {
          this.log(`Branch verification error: ${error.message}`, 'ERROR');
          return resolve(false);
        }
        
        const branches = stdout.split('\n');
        let verified = 0;
        
        for (const agent in this.agents) {
          if (branches.some(b => b.includes(this.agents[agent].branch))) {
            verified++;
            this.log(`✓ Branch ${this.agents[agent].branch} verified`);
          } else {
            this.log(`✗ Branch ${this.agents[agent].branch} not found`, 'WARN');
          }
        }
        
        this.log(`${verified}/${Object.keys(this.agents).length} agent branches ready`);
        resolve(true);
      });
    });
  }

  async setupParallelExecution() {
    this.parallelExecutor = setInterval(() => {
      this.processTaskQueue();
      this.checkAgentStatus();
      this.updateMetrics();
    }, 2000);
  }

  async assignTask(task) {
    const startTime = Date.now();
    task.id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    task.assignedAt = new Date().toISOString();
    
    const agent = this.selectBestAgent(task);
    
    if (agent) {
      this.agents[agent].tasks.push(task);
      this.agents[agent].status = 'working';
      this.activeTasks.set(task.id, { agent, task, startTime });
      
      this.log(`Task ${task.id} assigned to ${agent} for parallel execution`);
      
      this.executeOnBranch(agent, task);
      
      return { success: true, taskId: task.id, agent };
    } else {
      this.taskQueue.push(task);
      this.log(`Task ${task.id} queued (all agents busy)`);
      return { success: false, taskId: task.id, queued: true };
    }
  }

  selectBestAgent(task) {
    const availableAgents = Object.keys(this.agents).filter(a => 
      this.agents[a].status === 'idle' || this.agents[a].tasks.length < 3
    );
    
    if (availableAgents.length === 0) return null;
    
    const taskType = this.analyzeTaskType(task);
    
    const agentMap = {
      'data': 'data-processor',
      'file': 'file-manager',
      'monitor': 'monitor',
      'security': 'security',
      'build': 'builder',
      'test': 'tester'
    };
    
    for (const [key, agent] of Object.entries(agentMap)) {
      if (taskType.includes(key) && availableAgents.includes(agent)) {
        return agent;
      }
    }
    
    return availableAgents[Math.floor(Math.random() * availableAgents.length)];
  }

  analyzeTaskType(task) {
    const keywords = (task.name + ' ' + task.description).toLowerCase();
    return keywords;
  }

  async executeOnBranch(agent, task) {
    const branchName = this.agents[agent].branch;
    
    const script = `
      cd "${process.cwd()}"
      git stash
      git checkout ${branchName}
      echo '${JSON.stringify(task)}' > tasks/current_${agent}.json
      node agents/${agent.replace('-', '_')}.js --task tasks/current_${agent}.json
      git add .
      git commit -m "Agent ${agent}: Complete task ${task.id}"
      git checkout main
      git merge ${branchName} --no-ff -m "Merge ${agent} results for task ${task.id}"
    `;
    
    exec(script, { shell: '/bin/bash' }, (error, stdout, stderr) => {
      const endTime = Date.now();
      const duration = endTime - this.activeTasks.get(task.id).startTime;
      
      if (error) {
        this.log(`Task ${task.id} failed on ${agent}: ${error.message}`, 'ERROR');
        task.status = 'failed';
        task.error = error.message;
      } else {
        this.log(`Task ${task.id} completed by ${agent} in ${duration}ms`, 'SUCCESS');
        task.status = 'completed';
        task.completedAt = new Date().toISOString();
        task.duration = duration;
      }
      
      this.completedTasks.push(task);
      this.activeTasks.delete(task.id);
      
      const agentTasks = this.agents[agent].tasks;
      const index = agentTasks.findIndex(t => t.id === task.id);
      if (index > -1) agentTasks.splice(index, 1);
      
      if (agentTasks.length === 0) {
        this.agents[agent].status = 'idle';
      }
      
      this.performanceMetrics.tasksProcessed++;
    });
  }

  processTaskQueue() {
    if (this.taskQueue.length === 0) return;
    
    const availableAgents = Object.keys(this.agents).filter(a => 
      this.agents[a].status === 'idle'
    );
    
    while (this.taskQueue.length > 0 && availableAgents.length > 0) {
      const task = this.taskQueue.shift();
      this.assignTask(task);
      availableAgents.shift();
    }
  }

  checkAgentStatus() {
    const status = [];
    for (const [name, agent] of Object.entries(this.agents)) {
      status.push({
        agent: name,
        status: agent.status,
        activeTasks: agent.tasks.length
      });
    }
    return status;
  }

  updateMetrics() {
    if (this.completedTasks.length > 0) {
      const totalTime = this.completedTasks.reduce((sum, t) => sum + (t.duration || 0), 0);
      this.performanceMetrics.averageTime = totalTime / this.completedTasks.length;
    }
    
    const activeAgents = Object.values(this.agents).filter(a => a.status === 'working').length;
    const totalAgents = Object.keys(this.agents).length;
    this.performanceMetrics.parallelRatio = (activeAgents / totalAgents) * 100;
    
    const idleAgents = totalAgents - activeAgents;
    this.performanceMetrics.efficiency = 100 - (idleAgents * 10);
  }

  async createBulkTasks(count = 10) {
    const taskTypes = ['data processing', 'file backup', 'system monitor', 'security scan', 'build project', 'run tests'];
    const tasks = [];
    
    for (let i = 0; i < count; i++) {
      const type = taskTypes[Math.floor(Math.random() * taskTypes.length)];
      tasks.push({
        name: `${type}_${i}`,
        description: `Automated ${type} task`,
        priority: ['low', 'normal', 'high'][Math.floor(Math.random() * 3)]
      });
    }
    
    this.log(`Creating ${count} parallel tasks`);
    
    for (const task of tasks) {
      await this.assignTask(task);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return tasks;
  }

  getPerformanceReport() {
    return {
      metrics: this.performanceMetrics,
      agents: this.checkAgentStatus(),
      queue: {
        pending: this.taskQueue.length,
        active: this.activeTasks.size,
        completed: this.completedTasks.length
      },
      throughput: {
        tasksPerMinute: (this.performanceMetrics.tasksProcessed / (Date.now() / 60000)).toFixed(2),
        parallelEfficiency: this.performanceMetrics.parallelRatio.toFixed(2) + '%',
        averageTaskTime: this.performanceMetrics.averageTime.toFixed(0) + 'ms'
      }
    };
  }

  shutdown() {
    clearInterval(this.parallelExecutor);
    this.log('Parallel Orchestrator shutting down');
    this.log(`Final stats: ${this.performanceMetrics.tasksProcessed} tasks processed`);
  }
}

if (require.main === module) {
  const orchestrator = new ParallelOrchestrator();
  
  (async () => {
    await orchestrator.initialize();
    
    console.log('\n=== PARALLEL ORCHESTRATOR READY ===');
    console.log('Commands:');
    console.log('  bulk <n>  - Create n parallel tasks');
    console.log('  status    - Show system status');
    console.log('  report    - Performance report');
    console.log('  exit      - Shutdown\n');
    
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: 'parallel> '
    });
    
    rl.prompt();
    
    rl.on('line', async (line) => {
      const [command, ...args] = line.trim().split(' ');
      
      switch (command) {
        case 'bulk':
          const count = parseInt(args[0]) || 10;
          await orchestrator.createBulkTasks(count);
          console.log(`${count} tasks distributed across agents`);
          break;
          
        case 'status':
          console.log(JSON.stringify(orchestrator.checkAgentStatus(), null, 2));
          break;
          
        case 'report':
          console.log(JSON.stringify(orchestrator.getPerformanceReport(), null, 2));
          break;
          
        case 'exit':
          orchestrator.shutdown();
          process.exit(0);
          
        default:
          console.log('Unknown command');
      }
      
      rl.prompt();
    });
  })();
}

module.exports = ParallelOrchestrator;