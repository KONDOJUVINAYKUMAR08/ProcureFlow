import { prisma } from './lib/prisma';
import { sendEmail, logger, config } from '@procurement/common';

const fmt = (d: Date) =>
  d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

export async function runDailyContractAlerts(): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Alert at exactly 30 days, 7 days, and 1 day before expiry
  const THRESHOLDS = [30, 7, 1];

  try {
    const activeContracts = await prisma.contract.findMany({
      where: { status: 'active' },
    });

    for (const contract of activeContracts) {
      const daysLeft = Math.ceil(
        (contract.expiryDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)
      );

      if (THRESHOLDS.includes(daysLeft)) {
        await sendEmail(
          config.admin.email,
          `ProcureFlow — Contract ${contract.contractNumber} expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`,
          `<p>Hi Admin,</p>
           <p>Contract <strong>${contract.contractNumber}</strong> — <em>${contract.contractName}</em>
              (Vendor: ${contract.vendor}) expires on <strong>${fmt(contract.expiryDate)}</strong>
              (${daysLeft} day${daysLeft === 1 ? '' : 's'} remaining).</p>
           <p>Please log in to ProcureFlow to review and renew if necessary.</p>
           <p>Regards,<br/>ProcureFlow System</p>`
        ).catch((e: any) =>
          logger.error(`Contract expiry alert failed for ${contract.contractNumber}`, e)
        );
        logger.info(`Contract expiry alert sent: ${contract.contractNumber} (${daysLeft}d left)`);
      }
    }
  } catch (error) {
    logger.error('Contract alert scheduler error', error);
  }
}

export function startContractAlertScheduler(): void {
  runDailyContractAlerts();
  setInterval(runDailyContractAlerts, 24 * 60 * 60 * 1000);
  logger.info('Contract alert scheduler started (runs every 24 h)');
}
