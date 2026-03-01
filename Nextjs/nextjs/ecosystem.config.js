// PM2 ecosystem config — used by deploy.yml to start/restart the Next.js frontend
// Ensures PM2 always uses the correct working directory and port.
module.exports = {
  apps: [
    {
      name: 'ceylonhs-frontend',
      script: 'node_modules/.bin/next',
      args: 'start -p 3000',
      cwd: '/root/ceylonhs/Nextjs/nextjs',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
    },
  ],
};
