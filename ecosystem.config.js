module.exports = {
  apps: [
    {
      name: 'hikarinagi-backend-nestjs',
      script: 'pnpm',
      args: 'start',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3005,
      },
    },
  ],
}
