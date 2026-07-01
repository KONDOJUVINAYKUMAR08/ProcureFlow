import express from 'express';
import cors from 'cors';
import { logger, config } from '@procurement/common';
import { metricsMiddleware, metricsHandler } from '@procurement/middleware';
import authService from './services/auth.service';

export const app: import('express').Express = express();

export const bootstrapApp = async (): Promise<import('express').Express> => {
  try {
    await authService.bootstrapAdmin();

    app.use(express.json());
    app.use(cors());
    app.use(metricsMiddleware);

    app.get('/api/health', (req, res) => {
      res.status(200).json({ status: 'ok', service: 'identity-service', timestamp: new Date() });
    });
    app.get('/metrics', metricsHandler);

    app.use('/api', (await import('./index')).default);

    return app;
  } catch (error) {
    logger.error('Failed to bootstrap identity service', error);
    throw error;
  }
};

if (require.main === module) {
  bootstrapApp().then(initializedApp => {
    const port = process.env.PORT || 5001;
    initializedApp.listen(port, () => {
      logger.info(`🚀 Identity Service running on port ${port} in ${config.nodeEnv} mode`);
    });
  }).catch(() => process.exit(1));
}
