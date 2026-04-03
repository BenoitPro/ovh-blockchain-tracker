module.exports = {
    apps: [
        {
            name: 'ovh-solana-worker',
            script: 'npm',
            args: 'run worker',
            cron_restart: '0 * * * *', // Every hour at minute 0
            autorestart: false,
            watch: false,
            error_file: './logs/worker-error.log',
            out_file: './logs/worker-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            env: { NODE_ENV: 'production' }
        },
        {
            name: 'ovh-avax-worker',
            script: 'npm',
            args: 'run worker:avax',
            cron_restart: '0 */2 * * *', // Every 2 hours
            autorestart: false,
            watch: false,
            error_file: './logs/avax-worker-error.log',
            out_file: './logs/avax-worker-out.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            env: { NODE_ENV: 'production' }
        }
    ]
};
