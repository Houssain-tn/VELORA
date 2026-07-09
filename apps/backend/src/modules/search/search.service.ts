import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async globalSearch(query: string) {
    const q = `%${query}%`;
    const [users, companies, invoices, tasks, interventions] = await Promise.all([
      this.prisma.user.findMany({
        where: { name: { contains: query } },
        take: 5,
        select: { id: true, name: true, email: true, role: true }
      }),
      this.prisma.company.findMany({
        where: { name: { contains: query } },
        take: 5,
        select: { id: true, name: true, city: true }
      }),
      this.prisma.invoice.findMany({
        where: { OR: [{ number: { contains: query } }] },
        take: 5,
        select: { id: true, number: true, status: true, totalTTC: true }
      }),
      this.prisma.task.findMany({
        where: { title: { contains: query } },
        take: 5,
        select: { id: true, title: true, status: true }
      }),
      this.prisma.intervention.findMany({
        where: { OR: [{ reference: { contains: query } }, { title: { contains: query } }] },
        take: 5,
        select: { id: true, reference: true, title: true, status: true }
      })
    ]);

    const results: any[] = [];

    users.forEach(u => results.push({ type: 'USER', id: u.id, title: u.name, subtitle: u.email, tag: u.role, link: `/users` }));
    companies.forEach(c => results.push({ type: 'CLIENT', id: c.id, title: c.name, subtitle: c.city || 'Client', tag: 'CRM', link: `/clients` }));
    invoices.forEach(i => results.push({ type: 'INVOICE', id: i.id, title: i.number, subtitle: `${i.totalTTC} DT`, tag: i.status, link: `/invoices` }));
    tasks.forEach(t => results.push({ type: 'TASK', id: t.id, title: t.title, subtitle: 'Tâche', tag: t.status, link: `/task-tracking` }));
    interventions.forEach(i => results.push({ type: 'INTERVENTION', id: i.id, title: i.title || i.reference, subtitle: i.reference, tag: i.status, link: `/interventions` }));

    return results;
  }
}
