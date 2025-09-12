module.exports = {
  apps: [
    {
      name: 'orchestrator-main',
      script: './agents/orchestrator_controller.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        ORCHESTRATOR_MODE: 'main'
      },
      error_file: './logs/orchestrator-error.log',
      out_file: './logs/orchestrator-out.log',
      log_file: './logs/orchestrator-combined.log',
      time: true,
      min_uptime: '10s',
      max_restarts: 10
    }
  ]
};