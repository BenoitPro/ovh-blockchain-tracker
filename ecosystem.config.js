module.exports = {
    apps: [
        {
            name: 'ovh-solana-worker',
            script: 'npm',
            args: 'run worker',
            cron_restart: '0 * * * *', // Run every hour at minute 0
            autorestart: false, // Don't restart on exit (cron will handle it)
            watch: false,
            error_file: './logs/worker-error.log',
            out_file: './logs/worker-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            env: {
                NODE_ENV: 'production'
            }
        }
    ]
};
