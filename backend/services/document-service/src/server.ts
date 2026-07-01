import express from 'express';
import cors from 'cors';
import { logger, config } from '@procurement/common';
import { metricsMiddleware, metricsHandler } from '@procurement/middleware';

export const app: import('express').Express = express();

export const bootstrapApp = async (): Promise<import('express').Express> => {
  try {
    app.use(express.json());
    app.use(cors());
    app.use(metricsMiddleware);

    app.get('/api/health', (req, res) => {
      res.status(200).json({ status: 'ok', service: 'document-service', timestamp: new Date() });
    });
    app.get('/metrics', metricsHandler);

    app.use('/api', (await import('./index')).default);

    return app;
  } catch (error) {
    logger.error('Failed to bootstrap document service', error);
    throw error;
  }
};

if (require.main === module) {
  bootstrapApp().then(initializedApp => {
    const port = process.env.PORT || 5004;
    initializedApp.listen(port, () => {
      logger.info(`🚀 Document Service running on port ${port} in ${config.nodeEnv} mode`);
    });
  }).catch(() => process.exit(1));
}
