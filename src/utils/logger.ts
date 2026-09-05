/**
 * Logger utility for SentinelPay agent telemetry and console output.
 */
export const logger = {
  info: (module: string, message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    console.log(`\x1b[36m[${timestamp}] [INFO] [${module}]\x1b[0m ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  success: (module: string, message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    console.log(`\x1b[32m[${timestamp}] [SUCCESS] [${module}]\x1b[0m ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  warn: (module: string, message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    console.warn(`\x1b[33m[${timestamp}] [WARN] [${module}]\x1b[0m ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  error: (module: string, message: string, error?: any) => {
    const timestamp = new Date().toISOString();
    console.error(`\x1b[31m[${timestamp}] [ERROR] [${module}]\x1b[0m ${message}`, error || '');
  }
};
