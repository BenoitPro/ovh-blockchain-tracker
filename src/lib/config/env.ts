export function getEnvConfig() {
    return {
        tursoUrl: process.env.TURSO_DATABASE_URL,
        tursoAuthToken: process.env.TURSO_AUTH_TOKEN,
        cronSecret: process.env.CRON_SECRET,
        maxmindLicenseKey: process.env.MAXMIND_LICENSE_KEY,
        isDev: process.env.NODE_ENV === 'development',
    };
}
