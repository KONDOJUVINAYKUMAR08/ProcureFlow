import { prisma } from '../lib/prisma';
import { saveFile } from '@procurement/common';
import { LetterType } from '../models/Letter';

const generateLetterNumber = (type: LetterType) => {
  const prefix = { offer: 'OL', experience: 'EXP', relieving: 'REL', internship_certificate: 'CERT' }[type] || 'LTR';
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`;
};

const fmtDate = (d: any) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';
const fmtCurrency = (n: number) => `₹${(n || 0).toLocaleString('en-IN')}`;

export class LetterService {
  async create(data: Record<string, any>, userId: string) {
    return prisma.letter.create({
      data: {
        ...data,
        letterNumber: generateLetterNumber(data.letterType),
        issuedBy: userId,
        issuedDate: new Date(),
      } as any,
    });
  }

  async findAll(query: Record<string, any> = {}, skip = 0, limit = 20) {
    const where: Record<string, any> = {};
    if (query.letterType) where.letterType = query.letterType;
    if (query.employeeId) where.employeeId = query.employeeId;

    const [letters, total] = await Promise.all([
      prisma.letter.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      prisma.letter.count({ where }),
    ]);

    return { letters, total };
  }

  async findById(id: string) {
    const letter = await prisma.letter.findUnique({ where: { id: id } });
    if (!letter) throw new Error('Letter not found');
    return letter;
  }

  async delete(id: string) {
    await prisma.letter.delete({ where: { id: id } });
  }

  async generatePdf(id: string) {
    const letter = await prisma.letter.findUnique({ where: { id: id } });
    if (!letter) throw new Error('Letter not found');

    try {
      const puppeteer = await import('puppeteer').catch(() => null);
      if (!puppeteer) return { url: null, fileName: `${letter.letterNumber}.pdf` };

      const html = buildLetterHtml(letter);
      const browser = await puppeteer.default.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
      await browser.close();

      const key = `letters/${letter.letterType}/${letter.letterNumber}.pdf`;
      await saveFile(Buffer.from(pdfBuffer), key);
      await prisma.letter.update({ where: { id: id }, data: { pdfUrl: key, pdfKey: key } });

      return { url: `/hr/letters/${id}/file`, fileName: `${letter.letterNumber}.pdf` };
    } catch (err: any) {
      throw new Error(`PDF generation failed: ${err.message}`);
    }
  }

  async getFilePath(id: string) {
    const letter = await prisma.letter.findUnique({ where: { id: id } });
    if (!letter || !letter.pdfKey) throw new Error('Letter PDF not found — generate it first');
    return letter;
  }
}

function buildLetterHtml(letter: any): string {
  const base = `
  <!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/>
  <style>
    *{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:'Segoe UI',Arial,sans-serif;font-size:13px;color:#1a1a2e;background:#fff;line-height:1.7;}
    .page{padding:40px 50px;max-width:800px;margin:0 auto;}
    .letterhead{border-bottom:3px solid #1a1a2e;padding-bottom:16px;margin-bottom:24px;display:flex;justify-content:space-between;align-items:flex-end;}
    .company-name{font-size:26px;font-weight:900;color:#1a1a2e;letter-spacing:-0.5px;}
    .ref{font-size:11px;color:#888;}
    h2{font-size:16px;font-weight:700;text-align:center;margin-bottom:24px;text-transform:uppercase;letter-spacing:2px;color:#1a1a2e;}
    p{margin-bottom:12px;}
    .highlight{font-weight:700;color:#1a1a2e;}
    .signature{margin-top:48px;}
    .sig-line{border-bottom:1px solid #333;width:160px;height:32px;margin-bottom:6px;}
    .footer{text-align:center;font-size:10px;color:#aaa;margin-top:32px;border-top:1px solid #eee;padding-top:12px;}
  </style></head><body><div class="page">
  <div class="letterhead">
    <div><div class="company-name">ProcureFlow</div><div style="font-size:11px;color:#888;margin-top:2px;">Procurement Platform</div></div>
    <div class="ref">Date: ${fmtDate(letter.issuedDate)}<br/>Ref: ${letter.letterNumber}</div>
  </div>`;

  const footer = `<div class="footer">This letter is issued by ProcureFlow | Document #${letter.letterNumber}</div></div></body></html>`;

  if (letter.letterType === 'offer') {
    return base + `
    <h2>Offer Letter</h2>
    <p>Dear <span class="highlight">${letter.employeeName}</span>,</p>
    <p>We are pleased to offer you the position of <span class="highlight">${letter.designation}</span>${letter.department ? ` in the <span class="highlight">${letter.department}</span> department` : ''} at ProcureFlow.</p>
    ${letter.joiningDate ? `<p>Your joining date will be <span class="highlight">${fmtDate(letter.joiningDate)}</span>.</p>` : ''}
    ${letter.ctcAnnual ? `<p>Your annual Cost to Company (CTC) will be <span class="highlight">${fmtCurrency(letter.ctcAnnual)} per annum</span>, subject to applicable tax deductions.</p>` : ''}
    <p>This offer is conditional upon successful completion of all pre-employment requirements, including background verification and document submission.</p>
    <p>We look forward to having you as part of our team. Please sign and return a copy of this letter as acceptance of the offer.</p>
    ${letter.notes ? `<p>${letter.notes}</p>` : ''}
    <div class="signature">
      <p>Yours sincerely,</p>
      <div class="sig-line"></div>
      <p><strong>Authorized Signatory</strong><br/>ProcureFlow</p>
    </div>
    <p style="margin-top:24px;">I, ${letter.employeeName}, accept the above offer:</p>
    <div style="margin-top:24px;display:flex;gap:80px;">
      <div><div style="border-bottom:1px solid #333;width:160px;height:32px;"></div><p style="font-size:11px;color:#888;">Signature</p></div>
      <div><div style="border-bottom:1px solid #333;width:120px;height:32px;"></div><p style="font-size:11px;color:#888;">Date</p></div>
    </div>` + footer;
  }

  if (letter.letterType === 'experience') {
    return base + `
    <h2>Experience Letter</h2>
    <p>To Whom It May Concern,</p>
    <p>This is to certify that <span class="highlight">${letter.employeeName}</span> was employed with <strong>ProcureFlow</strong> as <span class="highlight">${letter.designation}</span>${letter.department ? ` in the ${letter.department} department` : ''}.</p>
    ${letter.joiningDateActual ? `<p>The period of employment was from <span class="highlight">${fmtDate(letter.joiningDateActual)}</span>${letter.lastWorkingDate ? ` to <span class="highlight">${fmtDate(letter.lastWorkingDate)}</span>` : ''}.</p>` : ''}
    <p>During the tenure, <span class="highlight">${letter.employeeName}</span> demonstrated a high level of professionalism, dedication, and commitment to work. Their conduct was exemplary and they were an asset to the organization.</p>
    <p>We wish them all the best in their future endeavors.</p>
    ${letter.notes ? `<p>${letter.notes}</p>` : ''}
    <div class="signature">
      <p>Yours sincerely,</p>
      <div class="sig-line"></div>
      <p><strong>Authorized Signatory</strong><br/>ProcureFlow</p>
    </div>` + footer;
  }

  if (letter.letterType === 'relieving') {
    return base + `
    <h2>Relieving Letter</h2>
    <p>Dear <span class="highlight">${letter.employeeName}</span>,</p>
    <p>This is to acknowledge that you have been relieved from your position as <span class="highlight">${letter.designation}</span>${letter.department ? ` in the ${letter.department} department` : ''} at ProcureFlow, effective <span class="highlight">${fmtDate(letter.lastWorkingDate)}</span>.</p>
    <p>You joined us on <span class="highlight">${fmtDate(letter.joiningDateActual)}</span> and have contributed significantly to the organization during your tenure.</p>
    <p>We confirm that all dues and formalities have been completed as per company policy. We wish you success in your future career.</p>
    ${letter.notes ? `<p>${letter.notes}</p>` : ''}
    <div class="signature">
      <p>Yours sincerely,</p>
      <div class="sig-line"></div>
      <p><strong>HR Manager</strong><br/>ProcureFlow</p>
    </div>` + footer;
  }

  return base + `
  <h2>Internship Certificate</h2>
  <p>This is to certify that <span class="highlight">${letter.employeeName}</span> has successfully completed an internship with <strong>ProcureFlow</strong> as <span class="highlight">${letter.designation}</span>.</p>
  ${(letter.internFromDate && letter.internToDate) ? `<p>The internship duration was from <span class="highlight">${fmtDate(letter.internFromDate)}</span> to <span class="highlight">${fmtDate(letter.internToDate)}</span>${letter.internDurationMonths ? ` (${letter.internDurationMonths} month${letter.internDurationMonths > 1 ? 's' : ''})` : ''}.</p>` : ''}
  ${letter.internProject ? `<p>During the internship, ${letter.employeeName} worked on <span class="highlight">${letter.internProject}</span>.</p>` : ''}
  ${letter.internPerformance ? `<p>Their performance was rated as <span class="highlight">${letter.internPerformance}</span>.</p>` : ''}
  ${letter.mentorName ? `<p>This internship was supervised by <span class="highlight">${letter.mentorName}</span>.</p>` : ''}
  <p>We wish them continued success in their academic and professional pursuits.</p>
  ${letter.notes ? `<p>${letter.notes}</p>` : ''}
  <div class="signature">
    <p>Yours sincerely,</p>
    <div class="sig-line"></div>
    <p><strong>Authorized Signatory</strong><br/>ProcureFlow</p>
  </div>` + footer;
}

export default new LetterService();
