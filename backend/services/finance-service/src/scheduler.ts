import { prisma } from './lib/prisma';
import { sendEmail, logger, config } from '@procurement/common';

const fmt = (d: Date) =>
  d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const formatCurrency = (n: number) =>
  `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export async function runDailyInvoiceAlerts(): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  try {
    // Mark approved customer invoices whose due date has passed as overdue
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        dueDate: { lt: today },
        status: 'approved',
        invoiceType: 'CUSTOMER_INVOICE',
      },
    });

    for (const inv of overdueInvoices) {
      await prisma.invoice.update({ where: { id: inv.id }, data: { status: 'overdue' } });

      if (inv.customerId) {
        const customer = await prisma.customer.findUnique({ where: { id: inv.customerId } });
        if (customer?.email) {
          await sendEmail(
            customer.email,
            `ProcureFlow — Invoice ${inv.invoiceNumber} is Overdue`,
            `<p>Dear ${customer.companyName},</p>
             <p>Your invoice <strong>${inv.invoiceNumber}</strong> for <strong>${formatCurrency(inv.grossAmount)}</strong>
                was due on <strong>${fmt(inv.dueDate)}</strong> and is now overdue.</p>
             <p>Please arrange payment at your earliest convenience.</p>
             <p>Regards,<br/>ProcureFlow Team</p>`
          ).catch((e: any) => logger.error(`Overdue email failed for ${inv.invoiceNumber}`, e));
        }
      }

      // Notify admin as well
      await sendEmail(
        config.admin.email,
        `ProcureFlow — Invoice ${inv.invoiceNumber} marked overdue`,
        `<p>Invoice <strong>${inv.invoiceNumber}</strong> (${inv.partyName}) for
           <strong>${formatCurrency(inv.grossAmount)}</strong> due on ${fmt(inv.dueDate)}
           has been automatically marked <strong>overdue</strong>.</p>`
      ).catch((e: any) => logger.error(`Admin overdue alert failed for ${inv.invoiceNumber}`, e));
    }

    if (overdueInvoices.length) {
      logger.info(`Marked ${overdueInvoices.length} invoice(s) overdue and sent alerts`);
    }

    // Due-today reminders
    const dueTodayInvoices = await prisma.invoice.findMany({
      where: {
        dueDate: { gte: today, lt: tomorrow },
        status: 'approved',
        invoiceType: 'CUSTOMER_INVOICE',
      },
    });

    for (const inv of dueTodayInvoices) {
      if (inv.customerId) {
        const customer = await prisma.customer.findUnique({ where: { id: inv.customerId } });
        if (customer?.email) {
          await sendEmail(
            customer.email,
            `ProcureFlow — Invoice ${inv.invoiceNumber} is Due Today`,
            `<p>Dear ${customer.companyName},</p>
             <p>Your invoice <strong>${inv.invoiceNumber}</strong> for <strong>${formatCurrency(inv.grossAmount)}</strong>
                is due today, <strong>${fmt(inv.dueDate)}</strong>.</p>
             <p>Please arrange payment to avoid late charges.</p>
             <p>Regards,<br/>ProcureFlow Team</p>`
          ).catch((e: any) => logger.error(`Due-today email failed for ${inv.invoiceNumber}`, e));
        }
      }
    }

    if (dueTodayInvoices.length) {
      logger.info(`Sent due-today alerts for ${dueTodayInvoices.length} invoice(s)`);
    }
  } catch (error) {
    logger.error('Invoice alert scheduler error', error);
  }
}

export function startInvoiceAlertScheduler(): void {
  // Run once immediately after startup, then every 24 hours
  runDailyInvoiceAlerts();
  setInterval(runDailyInvoiceAlerts, 24 * 60 * 60 * 1000);
  logger.info('Invoice alert scheduler started (runs every 24 h)');
}
