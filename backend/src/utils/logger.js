const isProduction = process.env.NODE_ENV === 'production';

function formatMessage(level, ...args) {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level}] ${args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
  ).join(' ')}`;
}

export const logger = {
  info: (...args) => {
    if (!isProduction) {
      console.log(formatMessage('INFO', ...args));
    }
  },
  
  warn: (...args) => {
    if (!isProduction) {
      console.warn(formatMessage('WARN', ...args));
    }
  },
  
  error: (...args) => {
    console.error(formatMessage('ERROR', ...args));
  },
  
  debug: (...args) => {
    if (!isProduction && process.env.DEBUG === 'true') {
      console.log(formatMessage('DEBUG', ...args));
    }
  },
  
  log: (...args) => {
    if (!isProduction) {
      console.log(formatMessage('LOG', ...args));
    }
  }
};

export function logRequest(req, res, next) {
  if (!isProduction) {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`[${new Date().toISOString()}] [REQUEST] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    });
  }
  next();
}

export default logger;
