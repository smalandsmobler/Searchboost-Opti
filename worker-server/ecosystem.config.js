// PM2 Ecosystem — Searchboost Worker Server
module.exports = {
  apps: [
    {
      name: 'worker-api',
      script: './worker-api/index.js',
      cwd: '/home/ubuntu/searchboost-worker',
      instances: 1,
      autorestart: true,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        WORKER_PORT: 4000,
        N8N_URL: 'http://127.0.0.1:5678',
        // Sätts via .env-fil:
        // WORKER_API_KEY, N8N_API_KEY
      },
      env_file: './worker-api/.env',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: './logs/worker-api-error.log',
      out_file: './logs/worker-api-out.log',
      merge_logs: true
    },
    {
      name: 'n8n',
      script: 'n8n',
      args: 'start',
      instances: 1,
      autorestart: true,
      max_memory_restart: '2G',
      env: {
        NODE_ENV: 'production',
        N8N_CONFIG_FILES: '/home/ubuntu/.n8n/.env'
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: '/home/ubuntu/searchboost-worker/logs/n8n-error.log',
      out_file: '/home/ubuntu/searchboost-worker/logs/n8n-out.log',
      merge_logs: true
    }
  ]
};
