import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  async create(
    file: Express.Multer.File,
    userId: number,
    title?: string,
    type?: string,
    taskId?: number,
    interventionId?: number,
  ) {
    const documentName = title || file.originalname;

    // Use manual type if provided, otherwise determine based on file
    let docType = type || 'AUTRE';
    if (!type) {
      if (file.mimetype.includes('pdf')) docType = 'RAPPORT_INTERVENTION';
      else if (file.mimetype.includes('image')) docType = 'PHOTO';
    }

    return this.prisma.document.create({
      data: {
        name: documentName,
        type: docType as any,
        url: `/uploads/${file.filename}`,
        mimeType: file.mimetype,
        size: file.size,
        uploadedById: userId,
        taskId: taskId ? Number(taskId) : null,
        interventionId: interventionId ? Number(interventionId) : null,
      },
      include: {
        uploadedBy: {
          select: { id: true, name: true },
        },
      },
    });
  }

  async findAll(user?: any) {
    const where: any = {};

    if (user && user.role === Role.CLIENT) {
      where.OR = [
        { uploadedById: user.userId || user.id },
        { intervention: { site: { contract: { clientId: user.companyId } } } },
      ];
    }

    return this.prisma.document.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        uploadedBy: {
          select: { id: true, name: true, email: true },
        },
        intervention: { select: { id: true, title: true } },
      },
    });
  }

  async remove(id: number) {
    const document = await this.prisma.document.findUnique({ where: { id } });
    if (!document) throw new NotFoundException('Document not found');

    // Remove file from disk
    const filePath = path.join(process.cwd(), document.url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return this.prisma.document.delete({
      where: { id },
    });
  }
}
