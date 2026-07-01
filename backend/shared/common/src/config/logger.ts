import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: process.env.SERVICE_NAME || 'procurement-platform' },
  transports: [],
});

if (process.env.NODE_ENV === 'production') {
  // Containers log to stdout only; CloudWatch Container Insights / Fluent Bit
  // picks this up cluster-wide. File transports would write to the container's
  // ephemeral filesystem and require non-root write permissions for no benefit.
  logger.add(new winston.transports.Console({ format: winston.format.json() }));
} else {
  logger.add(new winston.transports.File({ filename: 'logs/error.log', level: 'error' }));
  logger.add(new winston.transports.File({ filename: 'logs/combined.log' }));
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

export default logger;
