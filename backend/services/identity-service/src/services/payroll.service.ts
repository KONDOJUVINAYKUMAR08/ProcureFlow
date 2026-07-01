import { prisma } from '../lib/prisma';
import { saveFile } from '@procurement/common';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const numberToWords = (amount: number): string => {
  const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  const convert = (n: number): string => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n/10)] + (n%10 ? ' '+ones[n%10] : '');
    if (n < 1000) return ones[Math.floor(n/100)]+' Hundred'+(n%100?' '+convert(n%100):'');
    if (n < 100000) return convert(Math.floor(n/1000))+' Thousand'+(n%1000?' '+convert(n%1000):'');
    if (n < 10000000) return convert(Math.floor(n/100000))+' Lakh'+(n%100000?' '+convert(n%100000):'');
    return convert(Math.floor(n/10000000))+' Crore'+(n%10000000?' '+convert(n%10000000):'');
  };
  return 'Rupees ' + convert(Math.floor(amount)) + ' Only';
};

const generatePayslipNumber = () => `PAY-${Date.now().toString(36).toUpperCase()}`;

export class PayrollService {
  async generate(employeeId: string, month: number, year: number, userId: string, overrides: Record<string, any> = {}) {
    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) throw new Error('Employee not found');

    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    const monthRecords = await prisma.attendance.findMany({ where: { employeeId, date: { startsWith: prefix } } });

    const workingDays = 26;
    const presentDays = monthRecords.filter(r => r.status === 'present' || r.status === 'wfh').length;
    const halfDays = monthRecords.filter(r => r.status === 'half_day').length;
    const lopDays = Math.max(0, workingDays - presentDays - (halfDays * 0.5) - (overrides.leaveDays || 0));

    const basic = employee.basicSalary || 0;
    const hra = employee.hra || 0;
    const transport = employee.transportAllowance || 0;
    const other = employee.otherAllowances || 0;
    const arrears = overrides.arrears || 0;

    const perDayBasic = basic / workingDays;
    const lop = Math.round(perDayBasic * lopDays * 100) / 100;

    const grossEarnings = Math.round((basic + hra + transport + other + arrears) * 100) / 100;

    const pfEmployee = Math.min(Math.round(basic * 0.12 * 100) / 100, 1800);
    const pfEmployer = pfEmployee;
    const esicEligible = grossEarnings <= 21000;
    const esicEmployee = esicEligible ? Math.round(grossEarnings * 0.0075 * 100) / 100 : 0;
    const esicEmployer = esicEligible ? Math.round(grossEarnings * 0.0325 * 100) / 100 : 0;
    const tds = overrides.tds || 0;
    const otherDeductions = overrides.otherDeductions || 0;
    const totalDeductions = Math.round((pfEmployee + esicEmployee + tds + lop + otherDeductions) * 100) / 100;
    const netSalary = Math.round((grossEarnings - totalDeductions) * 100) / 100;

    return prisma.payslip.create({
      data: {
        payslipNumber: generatePayslipNumber(),
        employeeId,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        designation: employee.designation,
        department: employee.department,
        month,
        year,
        payPeriod: `${MONTHS[month - 1]} ${year}`,
        workingDays,
        presentDays,
        leaveDays: overrides.leaveDays || 0,
        lopDays: Math.round(lopDays * 10) / 10,
        basicSalary: basic,
        hra,
        transportAllowance: transport,
        otherAllowances: other,
        arrears,
        grossEarnings,
        pfEmployee,
        pfEmployer,
        esicEmployee,
        esicEmployer,
        tds,
        lop,
        otherDeductions,
        totalDeductions,
        netSalary,
        amountInWords: numberToWords(netSalary),
        bankName: employee.bankName,
        accountNumber: employee.accountNumber,
        status: 'generated',
        generatedBy: userId,
      },
    });
  }

  async findAll(query: Record<string, any> = {}, skip = 0, limit = 20) {
    const where: Record<string, any> = {};
    if (query.employeeId) where.employeeId = query.employeeId;
    if (query.status) where.status = query.status;
    if (query.month) where.month = Number(query.month);
    if (query.year) where.year = Number(query.year);

    const [payslips, total] = await Promise.all([
      prisma.payslip.findMany({ where, orderBy: [{ year: 'desc' }, { month: 'desc' }], skip, take: limit }),
      prisma.payslip.count({ where }),
    ]);

    return { payslips, total };
  }

  async findById(id: string) {
    const ps = await prisma.payslip.findUnique({ where: { id: id } });
    if (!ps) throw new Error('Payslip not found');
    return ps;
  }

  async markPaid(id: string) {
    const ps = await prisma.payslip.findUnique({ where: { id: id } });
    if (!ps) throw new Error('Payslip not found');
    return prisma.payslip.update({ where: { id: id }, data: { status: 'paid', paidDate: new Date() } });
  }

  async generatePdf(id: string) {
    const payslip = await prisma.payslip.findUnique({ where: { id: id } });
    if (!payslip) throw new Error('Payslip not found');

    try {
      const puppeteer = await import('puppeteer').catch(() => null);
      if (!puppeteer) return { url: null, fileName: `${payslip.payslipNumber}.pdf` };

      const html = buildPayslipHtml(payslip);
      const browser = await puppeteer.default.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
      await browser.close();

      const key = `payslips/${payslip.employeeId}/${payslip.payslipNumber}.pdf`;
      await saveFile(Buffer.from(pdfBuffer), key);
      await prisma.payslip.update({ where: { id: id }, data: { pdfUrl: key, pdfKey: key } });

      return { url: `/hr/payroll/${id}/file`, fileName: `${payslip.payslipNumber}.pdf` };
    } catch (err: any) {
      throw new Error(`PDF generation failed: ${err.message}`);
    }
  }

  async getFilePath(id: string) {
    const ps = await prisma.payslip.findUnique({ where: { id: id } });
    if (!ps || !ps.pdfKey) throw new Error('Payslip PDF not found — generate it first');
    return ps;
  }
}

function buildPayslipHtml(p: any): string {
  const fmt = (n: number) => `₹${(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/>
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:'Segoe UI',Arial,sans-serif;font-size:12px;color:#1a1a2e;background:#fff;}
.page{padding:24px;max-width:800px;margin:0 auto;}
.header{background:#1a1a2e;color:#fff;padding:20px;border-radius:8px;display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;}
.company{font-size:20px;font-weight:800;}
.slip-title{font-size:16px;font-weight:600;opacity:0.9;}
.emp-section{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;}
.emp-box{background:#f8f9fa;border-radius:8px;padding:12px;}
.emp-label{font-size:10px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;}
.emp-row{display:flex;justify-content:space-between;font-size:11px;padding:3px 0;border-bottom:1px solid #eee;}
.salary-section{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;}
.salary-box{border:1px solid #e0e0e8;border-radius:8px;overflow:hidden;}
.salary-head{background:#f0f4ff;padding:8px 12px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#1a1a2e;}
.salary-row{display:flex;justify-content:space-between;padding:6px 12px;font-size:11px;border-bottom:1px solid #f0f0f0;}
.salary-row:last-child{border:none;}
.salary-total{background:#1a1a2e;color:#fff;padding:8px 12px;display:flex;justify-content:space-between;font-weight:700;font-size:12px;}
.net-section{background:#e8f5e9;border:2px solid #4caf50;border-radius:8px;padding:16px;text-align:center;margin-bottom:12px;}
.net-amount{font-size:28px;font-weight:900;color:#1a1a2e;}
.net-label{font-size:11px;color:#555;margin-bottom:4px;}
.words{font-size:11px;color:#333;font-style:italic;margin-top:4px;}
.footer{display:flex;justify-content:space-between;margin-top:24px;padding-top:12px;border-top:2px solid #1a1a2e;}
.sig-block{text-align:center;}
.sig-line{width:120px;border-bottom:1px solid #333;height:30px;margin:0 auto 6px;}
.sig-label{font-size:10px;color:#888;}
.note{text-align:center;font-size:10px;color:#aaa;margin-top:12px;}
</style></head><body>
<div class="page">
<div class="header">
  <div><div class="company">ProcureFlow</div><div style="opacity:0.7;font-size:11px;margin-top:2px;">Human Resources</div></div>
  <div style="text-align:right;"><div class="slip-title">SALARY SLIP</div><div style="opacity:0.8;font-size:11px;">${p.payPeriod}</div><div style="opacity:0.7;font-size:10px;">${p.payslipNumber}</div></div>
</div>

<div class="emp-section">
<div class="emp-box">
<div class="emp-label">Employee Details</div>
<div class="emp-row"><span>Name</span><b>${p.employeeName}</b></div>
<div class="emp-row"><span>Designation</span><span>${p.designation}</span></div>
<div class="emp-row"><span>Department</span><span>${p.department}</span></div>
${p.bankName ? `<div class="emp-row"><span>Bank</span><span>${p.bankName}</span></div>` : ''}
${p.accountNumber ? `<div class="emp-row"><span>Account</span><span>XXXX${p.accountNumber.slice(-4)}</span></div>` : ''}
</div>
<div class="emp-box">
<div class="emp-label">Pay Period</div>
<div class="emp-row"><span>Pay Period</span><b>${p.payPeriod}</b></div>
<div class="emp-row"><span>Working Days</span><span>${p.workingDays}</span></div>
<div class="emp-row"><span>Present Days</span><span>${p.presentDays}</span></div>
<div class="emp-row"><span>Leave Days</span><span>${p.leaveDays}</span></div>
<div class="emp-row"><span>LOP Days</span><span>${p.lopDays}</span></div>
</div>
</div>

<div class="salary-section">
<div class="salary-box">
<div class="salary-head">Earnings</div>
<div class="salary-row"><span>Basic Salary</span><span>${fmt(p.basicSalary)}</span></div>
<div class="salary-row"><span>HRA</span><span>${fmt(p.hra)}</span></div>
<div class="salary-row"><span>Transport Allowance</span><span>${fmt(p.transportAllowance)}</span></div>
<div class="salary-row"><span>Other Allowances</span><span>${fmt(p.otherAllowances)}</span></div>
${p.arrears > 0 ? `<div class="salary-row"><span>Arrears</span><span>${fmt(p.arrears)}</span></div>` : ''}
<div class="salary-total"><span>Gross Earnings</span><span>${fmt(p.grossEarnings)}</span></div>
</div>
<div class="salary-box">
<div class="salary-head">Deductions</div>
<div class="salary-row"><span>PF (Employee 12%)</span><span>${fmt(p.pfEmployee)}</span></div>
${p.esicEmployee > 0 ? `<div class="salary-row"><span>ESIC (Employee 0.75%)</span><span>${fmt(p.esicEmployee)}</span></div>` : ''}
${p.tds > 0 ? `<div class="salary-row"><span>TDS</span><span>${fmt(p.tds)}</span></div>` : ''}
${p.lop > 0 ? `<div class="salary-row"><span>Loss of Pay</span><span>${fmt(p.lop)}</span></div>` : ''}
${p.otherDeductions > 0 ? `<div class="salary-row"><span>Other Deductions</span><span>${fmt(p.otherDeductions)}</span></div>` : ''}
<div class="salary-total"><span>Total Deductions</span><span>${fmt(p.totalDeductions)}</span></div>
</div>
</div>

<div class="net-section">
<div class="net-label">Net Salary (Take Home)</div>
<div class="net-amount">${fmt(p.netSalary)}</div>
<div class="words">${p.amountInWords}</div>
</div>

<div class="footer">
<div class="sig-block"><div class="sig-line"></div><div class="sig-label">Employee Signature</div></div>
<div class="sig-block"><div class="sig-line"></div><div class="sig-label">HR / Manager</div></div>
<div class="sig-block"><div class="sig-line"></div><div class="sig-label">Authorized Signatory</div></div>
</div>
<div class="note">This is a computer-generated payslip. PF Employer contribution: ${fmt(p.pfEmployer)} | ESIC Employer: ${fmt(p.esicEmployer)}</div>
</div></body></html>`;
}

export default new PayrollService();
