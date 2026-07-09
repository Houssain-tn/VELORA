import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InvoiceStatus, Role } from '@prisma/client';

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: any) {
    const { clientId, items, ...rest } = dto;

    // Auto-generate invoice number if not provided
    const count = await this.prisma.invoice.count();
    const number =
      rest.number ||
      `FAC-${new Date().getFullYear()}-${(count + 1).toString().padStart(3, '0')}`;

    return this.prisma.invoice.create({
      data: {
        number,
        date: rest.date ? new Date(rest.date) : new Date(),
        dueDate: new Date(rest.dueDate),
        status: rest.status || 'BROUILLON',
        totalHT: parseFloat(rest.totalHT),
        totalTTC: parseFloat(rest.totalTTC),
        tva: parseFloat(rest.tva),
        notes: rest.notes,
        client: { connect: { id: parseInt(clientId) } },
        items: {
          create: items.map((item: any) => ({
            description: item.description,
            quantity: parseFloat(item.quantity),
            unitPrice: parseFloat(item.unitPrice),
            totalPrice: parseFloat(item.quantity) * parseFloat(item.unitPrice),
          })),
        },
      },
      include: {
        client: true,
        items: true,
      },
    });
  }

  async findAll(query: any, user?: any) {
    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.clientId) where.clientId = parseInt(query.clientId);

    // Security: Filter by company for clients
    if (user && user.role === Role.CLIENT) {
      where.clientId = user.companyId;
    }

    return this.prisma.invoice.findMany({
      where,
      include: {
        client: { select: { id: true, name: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number, user?: any) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        client: true,
        items: true,
      },
    });

    if (!invoice) throw new NotFoundException('Facture non trouvée');

    // Security: Check ownership for clients
    if (
      user &&
      user.role === Role.CLIENT &&
      invoice.clientId !== user.companyId
    ) {
      throw new ForbiddenException("Vous n'avez pas accès à cette facture");
    }

    return invoice;
  }

  async update(id: number, dto: any) {
    const { items, clientId, ...rest } = dto;

    // For simplicity, we delete and recreate items if they are provided
    if (items) {
      await this.prisma.invoiceItem.deleteMany({ where: { invoiceId: id } });
    }

    return this.prisma.invoice.update({
      where: { id },
      data: {
        number: rest.number,
        date: rest.date ? new Date(rest.date) : undefined,
        dueDate: rest.dueDate ? new Date(rest.dueDate) : undefined,
        status: rest.status,
        totalHT: rest.totalHT ? parseFloat(rest.totalHT) : undefined,
        totalTTC: rest.totalTTC ? parseFloat(rest.totalTTC) : undefined,
        tva: rest.tva ? parseFloat(rest.tva) : undefined,
        notes: rest.notes,
        client: clientId ? { connect: { id: parseInt(clientId) } } : undefined,
        items: items
          ? {
              create: items.map((item: any) => ({
                description: item.description,
                quantity: parseFloat(item.quantity),
                unitPrice: parseFloat(item.unitPrice),
                totalPrice:
                  parseFloat(item.quantity) * parseFloat(item.unitPrice),
              })),
            }
          : undefined,
      },
      include: {
        client: true,
        items: true,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.invoice.delete({ where: { id } });
  }
}
