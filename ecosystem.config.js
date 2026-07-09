/**
 * VELORA PRO — PM2 Ecosystem Configuration
 *
 * ⚠️  IMPORTANT — WebSocket & Cluster Mode Warning:
 * Running Socket.io in PM2 cluster mode with multiple instances REQUIRES
 * either sticky sessions (nginx ip_hash) or a Redis adapter for Socket.io.
 * Without it, WebSocket connections may disconnect randomly because a user's
 * socket connects to instance A, but their next HTTP auth request hits instance B.
 *
 * Options:
 *   A) Safe (single instance): Set `instances: 1` — no Redis needed.
 *   B) High-availability (cluster): Set `instances: 'max'` AND configure:
 *      1. Nginx sticky sessions (ip_hash) for socket.io connections
 *      2. OR install @socket.io/redis-adapter and configure Redis
 *
 * For most deployments, option A is recommended unless you expect >500 concurrent users.
 */

module.exports = {
  apps: [
    {
      name: 'velora-backend-prod',
      script: 'apps/backend/dist/src/main.js',
      cwd: './',
      // SAFE DEFAULT: Single instance — no Redis adapter needed for WebSockets.
      // Change to 'max' (cluster mode) only if you have configured Redis adapter.
      instances: 1,
      exec_mode: 'fork',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3333,
      },
      watch: false,
      max_memory_restart: '1G', // Automatically restart if memory exceeds 1GB
      error_file: 'apps/backend/logs/pm2-error.log',
      out_file: 'apps/backend/logs/pm2-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    }
  ]
};
