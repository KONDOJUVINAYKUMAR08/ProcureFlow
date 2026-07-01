import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import { sendEmail } from '@procurement/common';
import { v4 as uuidv4 } from 'uuid';

const generateEmployeeId = async (): Promise<string> => {
  const count = await prisma.employee.count();
  return `EMP-${String(count + 1).padStart(4, '0')}`;
};

export class EmployeeService {
  async findAll(query: Record<string, any> = {}, skip = 0, limit = 20) {
    const where: Record<string, any> = {};
    if (query.status) where.status = query.status;
    if (query.department) where.department = query.department;
    if (query.search) {
      const search = query.search as string;
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { employeeId: { contains: search, mode: 'insensitive' } },
        { designation: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      prisma.employee.count({ where }),
    ]);

    return { employees, total };
  }

  async findById(id: string) {
    const emp = await prisma.employee.findUnique({ where: { id: id } });
    if (!emp) throw new Error('Employee not found');
    return emp;
  }

  async create(data: Record<string, any>, userId: string) {
    if (!data.email) throw new Error('Email is required');
    const existing = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
    if (existing) throw new Error('A user with this email address already exists');

    const employeeId = await generateEmployeeId();
    const gross = (data.basicSalary || 0) + (data.hra || 0) + (data.transportAllowance || 0) + (data.otherAllowances || 0);
    const employeeUuid = uuidv4();

    const tempPassword = `Temp@${Math.floor(100000 + Math.random() * 900000)}`;
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);

    await prisma.user.create({
      data: {
        id: employeeUuid,
        email: data.email.toLowerCase(),
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName || '',
        role: 'employee',
        department: data.department || 'General',
        isActive: true,
        mustChangePassword: true,
      },
    });

    const employee = await prisma.employee.create({
      data: { ...data, id: employeeUuid, employeeId, grossSalary: gross, createdBy: userId } as any,
    });

    const emailSubject = 'Welcome to ProcureFlow - Your Temporary Credentials';
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eeeeee; border-radius: 8px;">
        <h2 style="color: #6366f1; text-align: center;">Welcome to ProcureFlow!</h2>
        <p>Hello ${data.firstName},</p>
        <p>Your employee profile has been successfully created. Here are your temporary login credentials to access the portal:</p>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0;"><strong>Portal URL:</strong> <a href="${process.env.FRONTEND_URL || 'http://localhost'}" style="color: #6366f1;">ProcureFlow Portal</a></p>
          <p style="margin: 0 0 10px 0;"><strong>Username:</strong> ${data.email.toLowerCase()}</p>
          <p style="margin: 0;"><strong>Temporary Password:</strong> <code style="background: #eeeeee; padding: 2px 6px; border-radius: 4px; font-weight: bold;">${tempPassword}</code></p>
        </div>
        <p style="color: #ef4444; font-weight: bold;">Important: You will be required to change your password immediately upon your first login.</p>
        <p>Best regards,<br/>HR Operations Team</p>
      </div>
    `;
    try {
      await sendEmail(data.email.toLowerCase(), emailSubject, emailHtml);
    } catch (err) {
      console.error('Error sending credentials email:', err);
    }

    return employee;
  }

  async update(id: string, data: Record<string, any>) {
    const emp = await prisma.employee.findUnique({ where: { id: id } });
    if (!emp) throw new Error('Employee not found');
    if (data.basicSalary !== undefined || data.hra !== undefined) {
      data.grossSalary = (data.basicSalary ?? emp.basicSalary) + (data.hra ?? emp.hra) + (data.transportAllowance ?? emp.transportAllowance) + (data.otherAllowances ?? emp.otherAllowances);
    }
    const updated = await prisma.employee.update({ where: { id: id }, data });

    if (data.firstName || data.lastName || data.department) {
      try {
        const userUpdate: Record<string, any> = {};
        if (data.firstName) userUpdate.firstName = data.firstName;
        if (data.lastName) userUpdate.lastName = data.lastName;
        if (data.department) userUpdate.department = data.department;
        await prisma.user.update({ where: { id: id }, data: userUpdate });
      } catch (e) {
        console.error('Failed to sync user details:', e);
      }
    }
    return updated;
  }

  async delete(id: string) {
    const emp = await prisma.employee.findUnique({ where: { id: id } });
    if (!emp) throw new Error('Employee not found');
    await prisma.employee.delete({ where: { id: id } });
    try {
      await prisma.user.delete({ where: { id: id } });
    } catch (e) {
      console.error('Associated user delete failed or user does not exist:', e);
    }
  }

  async getStats() {
    const all = await prisma.employee.findMany();
    const byDept: Record<string, number> = {};
    const byType: Record<string, number> = {};
    let totalPayroll = 0;

    all.forEach(e => {
      if (e.status === 'active') {
        byDept[e.department || 'Unknown'] = (byDept[e.department || 'Unknown'] || 0) + 1;
        byType[e.employmentType || 'full_time'] = (byType[e.employmentType || 'full_time'] || 0) + 1;
        totalPayroll += e.grossSalary || 0;
      }
    });

    return {
      total: all.length,
      active: all.filter(e => e.status === 'active').length,
      inactive: all.filter(e => e.status !== 'active').length,
      byDepartment: Object.entries(byDept).map(([dept, count]) => ({ dept, count })),
      byType: Object.entries(byType).map(([type, count]) => ({ type, count })),
      totalPayroll: Math.round(totalPayroll * 100) / 100,
    };
  }
}

export default new EmployeeService();
