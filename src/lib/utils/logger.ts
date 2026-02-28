/**
 * Logger utility for OVH Solana Tracker
 * 
 * Conditionally logs messages based on environment:
 * - Development: all logs are printed
 * - Production: only errors and warnings are printed
 * 
 * Usage:
 *   import { logger } from '@/lib/utils/logger';
 *   logger.info('[API] Fetching data...');
 *   logger.error('[API] Failed to fetch', error);
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
    enabled: boolean;
    minLevel: LogLevel;
}

const LOG_LEVELS: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};

const getConfig = (): LoggerConfig => {
    const isDev = process.env.NODE_ENV === 'development';
    return {
        enabled: true,
        minLevel: isDev ? 'debug' : 'warn', // In production, only warn/error
    };
};

const shouldLog = (level: LogLevel): boolean => {
    const config = getConfig();
    if (!config.enabled) return false;
    return LOG_LEVELS[level] >= LOG_LEVELS[config.minLevel];
};

const formatMessage = (level: LogLevel, message: string): string => {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
};

export const logger = {
    /**
     * Debug level - only shown in development
     */
    debug: (message: string, ...args: unknown[]): void => {
        if (shouldLog('debug')) {
            console.debug(formatMessage('debug', message), ...args);
        }
    },

    /**
     * Info level - shown in development only
     */
    info: (message: string, ...args: unknown[]): void => {
        if (shouldLog('info')) {
            console.log(formatMessage('info', message), ...args);
        }
    },

    /**
     * Warning level - always shown
     */
    warn: (message: string, ...args: unknown[]): void => {
        if (shouldLog('warn')) {
            console.warn(formatMessage('warn', message), ...args);
        }
    },

    /**
     * Error level - always shown
     */
    error: (message: string, ...args: unknown[]): void => {
        if (shouldLog('error')) {
            console.error(formatMessage('error', message), ...args);
        }
    },

    /**
     * Success message - shown in development only
     */
    success: (message: string, ...args: unknown[]): void => {
        if (shouldLog('info')) {
            console.log(formatMessage('info', `✅ ${message}`), ...args);
        }
    },
};

export default logger;
