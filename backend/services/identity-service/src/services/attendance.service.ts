import { prisma } from '../lib/prisma';
import { saveFile } from '@procurement/common';

export class AttendanceService {
  async checkIn(employeeId: string, data: {
    photoBase64?: string;
    latitude?: number;
    longitude?: number;
    address?: string;
    notes?: string;
  }) {
    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) throw new Error('Employee not found');

    const today = new Date().toISOString().split('T')[0];

    const existing = await prisma.attendance.findFirst({ where: { employeeId, date: today } });
    if (existing?.checkInTime) {
      throw new Error('Already checked in today');
    }

    let photoKey: string | undefined;

    if (data.photoBase64) {
      const buffer = Buffer.from(data.photoBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
      const key = `attendance/${employeeId}/${today}-checkin.jpg`;
      await saveFile(buffer, key);
      photoKey = key;
    }

    if (existing) {
      return prisma.attendance.update({
        where: { id: existing.id },
        data: {
          checkInTime: new Date(),
          checkInPhotoUrl: photoKey,
          checkInPhotoKey: photoKey,
          checkInLatitude: data.latitude,
          checkInLongitude: data.longitude,
          checkInAddress: data.address,
          status: 'present',
        },
      });
    }

    return prisma.attendance.create({
      data: {
        employeeId,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        date: today,
        checkInTime: new Date(),
        checkInPhotoUrl: photoKey,
        checkInPhotoKey: photoKey,
        checkInLatitude: data.latitude,
        checkInLongitude: data.longitude,
        checkInAddress: data.address,
        status: 'present',
        notes: data.notes,
        markedBy: 'self',
      },
    });
  }

  async checkOut(employeeId: string) {
    const today = new Date().toISOString().split('T')[0];
    const record = await prisma.attendance.findFirst({ where: { employeeId, date: today } });
    if (!record) throw new Error('No check-in record found for today');

    const checkIn = new Date(record.checkInTime!);
    const checkOut = new Date();
    const hours = (checkOut.getTime() - checkIn.getTime()) / 3600000;

    return prisma.attendance.update({
      where: { id: record.id },
      data: {
        checkOutTime: checkOut,
        workingHours: Math.round(hours * 100) / 100,
        status: hours < 4 ? 'half_day' : 'present',
      },
    });
  }

  async getMyAttendance(employeeId: string, month?: number, year?: number) {
    const where: Record<string, any> = { employeeId };
    if (month && year) {
      where.date = { startsWith: `${year}-${String(month).padStart(2, '0')}` };
    }
    return prisma.attendance.findMany({ where, orderBy: { date: 'desc' } });
  }

  async getAll(query: Record<string, any> = {}, skip = 0, limit = 50) {
    const where: Record<string, any> = {};
    if (query.employeeId) where.employeeId = query.employeeId;

    const [records, total] = await Promise.all([
      prisma.attendance.findMany({ where, orderBy: { date: 'desc' }, skip, take: limit }),
      prisma.attendance.count({ where }),
    ]);

    return { records, total };
  }

  async getSummary(employeeId: string, month: number, year: number) {
    const records = await this.getMyAttendance(employeeId, month, year);
    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const halfDay = records.filter(r => r.status === 'half_day').length;
    const wfh = records.filter(r => r.status === 'wfh').length;
    const leave = records.filter(r => r.status === 'leave').length;
    const totalHours = records.reduce((s, r) => s + (r.workingHours || 0), 0);

    return { present, absent, halfDay, wfh, leave, totalHours: Math.round(totalHours * 100) / 100, total: records.length };
  }
}

export default new AttendanceService();
