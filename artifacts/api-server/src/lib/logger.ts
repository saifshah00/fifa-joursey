// src/lib/logger.ts
const LEVELS = ['debug', 'info', 'warn', 'error'] as const;
type Level = (typeof LEVELS)[number];

const envLevel = (process.env.LOG_LEVEL ?? 'info').toLowerCase();
const minLevelIndex = Math.max(0, LEVELS.indexOf((LEVELS.includes(envLevel as Level) ? envLevel : 'info') as Level));

function formatArgs(level: string, args: unknown[]) {
  const ts = new Date().toISOString();
  return [`[${ts}] [${level}]`, ...args];
}

export const logger = {
  debug: (...args: unknown[]) => {
    if (minLevelIndex <= 0) console.debug(...formatArgs('debug', args));
  },
  info: (...args: unknown[]) => {
    if (minLevelIndex <= 1) console.log(...formatArgs('info', args));
  },
  warn: (...args: unknown[]) => {
    if (minLevelIndex <= 2) console.warn(...formatArgs('warn', args));
  },
  error: (...args: unknown[]) => {
    if (minLevelIndex <= 3) console.error(...formatArgs('error', args));
  },
};

export default logger;
