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
      res.status(200).json({ status: 'ok', service: 'finance-service', timestamp: new Date() });
    });
    app.get('/metrics', metricsHandler);

    app.use('/api', (await import('./index')).default);

    const { seedDemoData } = await import('./seed');
    await seedDemoData();

    return app;
  } catch (error) {
    logger.error('Failed to bootstrap finance service', error);
    throw error;
  }
};

if (require.main === module) {
  bootstrapApp().then(async initializedApp => {
    const port = process.env.PORT || 5002;
    initializedApp.listen(port, () => {
      logger.info(`🚀 Finance Service running on port ${port} in ${config.nodeEnv} mode`);
    });
    const { startInvoiceAlertScheduler } = await import('./scheduler');
    startInvoiceAlertScheduler();
  }).catch(() => process.exit(1));
}
