import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Res,
  UseGuards,
  StreamableFile,
} from '@nestjs/common';
import { BackupService } from './backup.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';

@Controller('backup')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN', 'DIRECTEUR')
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Post()
  async createManualBackup(@CurrentUser() user: any) {
    const filename = await this.backupService.createBackup(
      'MANUAL_ADMIN',
      user.id,
    );
    return {
      message: 'Sauvegarde système générée avec succès',
      filename,
    };
  }

  @Get()
  async listBackups() {
    return this.backupService.listBackups();
  }

  @Get(':filename')
  async downloadBackup(
    @Param('filename') filename: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const backupDir = path.join(process.cwd(), 'backups');

    // Security: strip any path traversal (e.g. ../../etc/passwd)
    const safeName = path.basename(filename);
    const filePath = path.join(backupDir, safeName);

    // Double-check resolved path stays within backupDir
    if (!filePath.startsWith(backupDir + path.sep) && filePath !== backupDir) {
      return res.status(403).send('Accès refusé');
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).send('Archive introuvable');
    }

    const fileStream = fs.createReadStream(filePath);
    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${safeName}"`,
    });
    return new StreamableFile(fileStream);
  }

  @Delete(':filename')
  async deleteBackup(@Param('filename') filename: string) {
    await this.backupService.deleteBackup(filename);
    return { message: 'Archive supprimée du serveur' };
  }
}
