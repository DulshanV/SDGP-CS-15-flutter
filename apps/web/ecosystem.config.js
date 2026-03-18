// PM2 ecosystem config — used by deploy.yml to start/restart the Next.js frontend
// Ensures PM2 always uses the correct working directory and port.
module.exports = {
  apps: [
    {
      name: 'ceylonhs-frontend',
      script: 'npm',
      args: 'run start',
      cwd: '/root/ceylonhs/Nextjs/nextjs',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '0.0.0.0',
      },
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
    },
  ],
};
