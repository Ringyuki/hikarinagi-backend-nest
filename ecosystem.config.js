module.exports = {
  apps: [
    {
      name: 'hikarinagi-backend-nestjs',
      script: 'dist/main.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env_file: '.env',
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
}
