module.exports = {
  apps: [
    {
      name: 'hikarinagi-backend-nestjs',
      script: 'pnpm',
      args: 'start:prod',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3005,
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 3006,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3005,
      },
    },
  ],
}
