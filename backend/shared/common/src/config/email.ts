import sgMail from '@sendgrid/mail';
import config from './secrets';
import logger from './logger';

let initialized = false;
const ensureInitialized = () => {
  if (!initialized && config.sendgrid.apiKey) {
    sgMail.setApiKey(config.sendgrid.apiKey);
    initialized = true;
  }
};

export const sendEmail = async (to: string, subject: string, htmlBody: string): Promise<void> => {
  ensureInitialized();

  if (!config.sendgrid.apiKey) {
    logger.info(`[Mock email — no SENDGRID_API_KEY set] To: ${to} | Subject: ${subject}`);
    return;
  }

  try {
    await sgMail.send({
      to,
      from: config.sendgrid.from,
      subject,
      html: htmlBody,
    });
    logger.info(`Email sent to ${to} via SendGrid: ${subject}`);
  } catch (error: any) {
    logger.error(`Failed to send email to ${to} via SendGrid:`, error?.response?.body || error);
    throw error;
  }
};
