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
      env_file: '.env',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
}
