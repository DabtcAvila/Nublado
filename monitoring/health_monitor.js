#!/usr/bin/env node

/**
 * Advanced Health Monitoring System
 * Real-time monitoring and alerting for the Orchestrator
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class HealthMonitor {
  constructor() {
    this.config = {
      checkInterval: 30000, // 30 seconds
      alertThresholds: {
        cpu: 80,
        memory: 85,
        disk: 90,
        errorRate: 10,
        responseTime: 5000
      },
      webhooks: [],
      emailAlerts: false,
      slackIntegration: false
    };
    
    this.metrics = {
      cpu: [],
      memory: [],
      disk: [],
      agentStatus: {},
      errors: [],
      alerts: []
    };
    
    this.logFile = path.join(__dirname, '..', 'logs', 'health-monitor.log');
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [HEALTH] [${level}] ${message}`;
    console.log(logEntry);
    
    try {
      fs.appendFileSync(this.logFile, logEntry + '\n');
    } catch (error) {
      console.error('Failed to write log:', error);
    }
  }

  async start() {
    this.log('Health Monitor Starting...');
    
    // Initial check
    await this.performHealthCheck();
    
    // Set up periodic checks
    this.interval = setInterval(() => {
      this.performHealthCheck();
    }, this.config.checkInterval);
    
    // Set up PM2 integration
    await this.setupPM2Integration();
    
    this.log('Health Monitor Active');
  }

  async performHealthCheck() {
    const healthReport = {
      timestamp: new Date().toISOString(),
      system: await this.checkSystemHealth(),
      agents: await this.checkAgentHealth(),
      performance: await this.checkPerformance(),
      alerts: []
    };
    
    // Analyze and trigger alerts
    healthReport.alerts = this.analyzeHealth(healthReport);
    
    // Store metrics
    this.storeMetrics(healthReport);
    
    // Send alerts if necessary
    if (healthReport.alerts.length > 0) {
      await this.sendAlerts(healthReport.alerts);
    }
    
    return healthReport;
  }

  async checkSystemHealth() {
    const cpuUsage = os.loadavg()[0] / os.cpus().length * 100;
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const memoryUsage = ((totalMem - freeMem) / totalMem) * 100;
    
    // Check disk usage
    let diskUsage = 0;
    try {
      const { stdout } = await execPromise('df -h / | tail -1');
      const match = stdout.match(/(\d+)%/);
      if (match) diskUsage = parseInt(match[1]);
    } catch (error) {
      this.log('Failed to check disk usage', 'WARN');
    }
    
    return {
      cpu: {
        usage: Math.round(cpuUsage),
        cores: os.cpus().length,
        model: os.cpus()[0].model
      },
      memory: {
        usage: Math.round(memoryUsage),
        total: Math.round(totalMem / 1024 / 1024 / 1024 * 10) / 10, // GB
        free: Math.round(freeMem / 1024 / 1024 / 1024 * 10) / 10 // GB
      },
      disk: {
        usage: diskUsage
      },
      uptime: os.uptime(),
      platform: os.platform(),
      hostname: os.hostname()
    };
  }

  async checkAgentHealth() {
    const agentHealth = {};
    
    try {
      const { stdout } = await execPromise('pm2 jlist');
      const processes = JSON.parse(stdout);
      
      for (const process of processes) {
        agentHealth[process.name] = {
          status: process.pm2_env.status,
          restarts: process.pm2_env.restart_time,
          uptime: process.pm2_env.pm_uptime,
          cpu: process.monit.cpu,
          memory: Math.round(process.monit.memory / 1024 / 1024), // MB
          instances: process.pm2_env.instances || 1
        };
      }
    } catch (error) {
      this.log('Failed to check PM2 processes', 'ERROR');
    }
    
    return agentHealth;
  }

  async checkPerformance() {
    const performance = {
      taskQueue: 0,
      completedTasks: 0,
      failedTasks: 0,
      averageResponseTime: 0
    };
    
    // Check task queue
    try {
      const queueFile = path.join(__dirname, '..', 'agents', 'task_queue.json');
      if (fs.existsSync(queueFile)) {
        const queue = JSON.parse(fs.readFileSync(queueFile, 'utf8'));
        performance.taskQueue = queue.queue.length;
        performance.completedTasks = queue.stats.total_completed || 0;
      }
    } catch (error) {
      this.log('Failed to check task queue', 'WARN');
    }
    
    return performance;
  }

  analyzeHealth(healthReport) {
    const alerts = [];
    
    // Check system thresholds
    if (healthReport.system.cpu.usage > this.config.alertThresholds.cpu) {
      alerts.push({
        type: 'HIGH_CPU',
        severity: 'WARNING',
        message: `CPU usage is ${healthReport.system.cpu.usage}%`,
        value: healthReport.system.cpu.usage
      });
    }
    
    if (healthReport.system.memory.usage > this.config.alertThresholds.memory) {
      alerts.push({
        type: 'HIGH_MEMORY',
        severity: 'WARNING',
        message: `Memory usage is ${healthReport.system.memory.usage}%`,
        value: healthReport.system.memory.usage
      });
    }
    
    if (healthReport.system.disk.usage > this.config.alertThresholds.disk) {
      alerts.push({
        type: 'HIGH_DISK',
        severity: 'CRITICAL',
        message: `Disk usage is ${healthReport.system.disk.usage}%`,
        value: healthReport.system.disk.usage
      });
    }
    
    // Check agent status
    for (const [agent, status] of Object.entries(healthReport.agents)) {
      if (status.status !== 'online') {
        alerts.push({
          type: 'AGENT_DOWN',
          severity: 'CRITICAL',
          message: `Agent ${agent} is ${status.status}`,
          agent: agent
        });
      }
      
      if (status.restarts > 5) {
        alerts.push({
          type: 'EXCESSIVE_RESTARTS',
          severity: 'WARNING',
          message: `Agent ${agent} has restarted ${status.restarts} times`,
          agent: agent
        });
      }
    }
    
    return alerts;
  }

  storeMetrics(healthReport) {
    // Store in circular buffer (keep last 100 entries)
    this.metrics.cpu.push(healthReport.system.cpu.usage);
    this.metrics.memory.push(healthReport.system.memory.usage);
    this.metrics.disk.push(healthReport.system.disk.usage);
    
    if (this.metrics.cpu.length > 100) this.metrics.cpu.shift();
    if (this.metrics.memory.length > 100) this.metrics.memory.shift();
    if (this.metrics.disk.length > 100) this.metrics.disk.shift();
    
    this.metrics.agentStatus = healthReport.agents;
    
    // Save to file
    const metricsFile = path.join(__dirname, '..', 'logs', 'metrics.json');
    try {
      fs.writeFileSync(metricsFile, JSON.stringify(this.metrics, null, 2));
    } catch (error) {
      this.log('Failed to save metrics', 'WARN');
    }
  }

  async sendAlerts(alerts) {
    for (const alert of alerts) {
      this.log(`ALERT: ${alert.message}`, alert.severity);
      
      // Store alert
      this.metrics.alerts.push({
        ...alert,
        timestamp: new Date().toISOString()
      });
      
      // Keep only last 50 alerts
      if (this.metrics.alerts.length > 50) {
        this.metrics.alerts.shift();
      }
    }
    
    // Save alerts to file
    const alertsFile = path.join(__dirname, '..', 'logs', 'alerts.json');
    try {
      fs.writeFileSync(alertsFile, JSON.stringify(this.metrics.alerts, null, 2));
    } catch (error) {
      this.log('Failed to save alerts', 'WARN');
    }
  }

  async setupPM2Integration() {
    try {
      // Subscribe to PM2 events
      const { stdout } = await execPromise('pm2 list');
      this.log('PM2 integration established');
    } catch (error) {
      this.log('PM2 integration failed', 'WARN');
    }
  }

  async generateReport() {
    const report = {
      generated: new Date().toISOString(),
      summary: {
        avgCPU: this.metrics.cpu.reduce((a, b) => a + b, 0) / this.metrics.cpu.length || 0,
        avgMemory: this.metrics.memory.reduce((a, b) => a + b, 0) / this.metrics.memory.length || 0,
        avgDisk: this.metrics.disk.reduce((a, b) => a + b, 0) / this.metrics.disk.length || 0,
        totalAlerts: this.metrics.alerts.length,
        criticalAlerts: this.metrics.alerts.filter(a => a.severity === 'CRITICAL').length
      },
      currentStatus: await this.performHealthCheck(),
      recentAlerts: this.metrics.alerts.slice(-10)
    };
    
    return report;
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.log('Health Monitor stopped');
    }
  }
}

// Export for use as module
module.exports = HealthMonitor;

// Run standalone if executed directly
if (require.main === module) {
  const monitor = new HealthMonitor();
  
  monitor.start();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    monitor.stop();
    process.exit(0);
  });
  
  // API endpoints (simple HTTP server)
  const http = require('http');
  const server = http.createServer(async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    
    if (req.url === '/health') {
      const health = await monitor.performHealthCheck();
      res.writeHead(200);
      res.end(JSON.stringify(health, null, 2));
    } else if (req.url === '/metrics') {
      res.writeHead(200);
      res.end(JSON.stringify(monitor.metrics, null, 2));
    } else if (req.url === '/report') {
      const report = await monitor.generateReport();
      res.writeHead(200);
      res.end(JSON.stringify(report, null, 2));
    } else {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Not found' }));
    }
  });
  
  server.listen(3001, () => {
    monitor.log('Health API listening on port 3001');
    console.log('Endpoints:');
    console.log('  http://localhost:3001/health - Current health status');
    console.log('  http://localhost:3001/metrics - Historical metrics');
    console.log('  http://localhost:3001/report - Full report');
  });
}