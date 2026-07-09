import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';
import * as archiver from 'archiver';
import { AuditService } from '../audit/audit.service';

const execPromise = promisify(exec);

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly backupDir = path.join(process.cwd(), 'backups');
  private readonly uploadDir = path.join(process.cwd(), 'uploads');
  private readonly mysqlDumpPath =
    process.env.MYSQL_DUMP_PATH || 'C:\\xampp\\mysql\\bin\\mysqldump.exe';

  constructor(private auditService: AuditService) {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleAutomatedBackup() {
    this.logger.log('Starting scheduled enterprise backup...');
    try {
      const filename = await this.createBackup('SYSTEM-AUTO');
      this.logger.log(`Scheduled backup completed: ${filename}`);

      // Auto-cleanup: keep only last 7 days
      await this.cleanupOldBackups(7);
    } catch (error) {
      this.logger.error('Scheduled backup failed', error.stack);
    }
  }

  async createBackup(
    triggerBy: string = 'ADMIN',
    userId: number = 1,
  ): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const folderName = `ST-BACKUP-${timestamp}`;
    const targetFolder = path.join(this.backupDir, folderName);
    const sqlFile = path.join(targetFolder, 'database_dump.sql');
    const zipFile = path.join(this.backupDir, `${folderName}.zip`);

    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }

    try {
      // 1. Database Configuration Extraction
      const dbUrl =
        process.env.DATABASE_URL || 'mysql://root:@localhost:3306/VELORApro';

      // Using robust URL parser instead of brittle regex
      let dbUri: URL;
      try {
        dbUri = new URL(dbUrl.replace('mysql://', 'http://')); // URL parser requires http-like protocol
      } catch (e) {
        throw new Error('Invalid DATABASE_URL format in configuration');
      }

      const user = dbUri.username || 'root';
      const password = dbUri.password || '';
      const host = dbUri.hostname || 'localhost';
      const port = dbUri.port || '3306';
      const database = dbUri.pathname.substring(1); // Remove leading slash

      if (!database)
        throw new Error('Database name not found in connection URL');

      // Path Verification
      if (!fs.existsSync(this.mysqlDumpPath)) {
        this.logger.warn(
          `Primary mysqldump not found at ${this.mysqlDumpPath}. Attempting resolution...`,
        );
        // Fallback or skip if we can't find it
      }

      const passArg = password ? `-p"${password}"` : ''; // Include password only if it exists
      const dumpCmd = `"${this.mysqlDumpPath}" -h ${host} -P ${port} -u ${user} ${passArg} --databases ${database} > "${sqlFile}"`;

      await execPromise(dumpCmd);

      // 2. Archive Construction (SQL + Uploads)
      await new Promise<void>((resolve, reject) => {
        const output = fs.createWriteStream(zipFile);
        const archive = (archiver as any)('zip', { zlib: { level: 9 } });

        output.on('close', () => resolve());
        archive.on('error', (err) => reject(err));

        archive.pipe(output);

        // Add SQL dump
        archive.file(sqlFile, { name: 'database_snapshot.sql' });

        // Add Uploads if exists
        if (fs.existsSync(this.uploadDir)) {
          archive.directory(this.uploadDir, 'uploads');
        }

        // Add Metadata
        const metadata = {
          version: '1.0.0',
          timestamp: new Date().toISOString(),
          triggeredBy: triggerBy,
          app: 'VELORA PRO',
        };
        archive.append(JSON.stringify(metadata, null, 2), {
          name: 'metadata.json',
        });

        archive.finalize();
      });

      // 3. Cleanup temp folder
      fs.rmSync(targetFolder, { recursive: true, force: true });

      // 4. Audit Log
      await this.auditService.create({
        userId,
        action: 'CREATE' as any,
        entity: 'SYSTEM_BACKUP',
        entityId: 0,
        newValues: { filename: `${folderName}.zip`, trigger: triggerBy },
      });

      return `${folderName}.zip`;
    } catch (error) {
      this.logger.error('Backup creation failed', error);
      if (fs.existsSync(targetFolder)) {
        fs.rmSync(targetFolder, { recursive: true, force: true });
      }
      throw error;
    }
  }

  async listBackups() {
    if (!fs.existsSync(this.backupDir)) return [];

    const files = fs.readdirSync(this.backupDir);
    return files
      .filter((f) => f.endsWith('.zip'))
      .map((f) => {
        const stats = fs.statSync(path.join(this.backupDir, f));
        return {
          filename: f,
          size: stats.size,
          createdAt: stats.birthtime,
        };
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async deleteBackup(filename: string) {
    // Security: strip any path traversal characters (mirrors download endpoint protection)
    const safeFile = path.basename(filename);
    const filePath = path.join(this.backupDir, safeFile);

    // Double-check the resolved path stays within the backup directory
    if (!filePath.startsWith(this.backupDir + path.sep) && filePath !== this.backupDir) {
      this.logger.warn(`Blocked suspicious backup delete attempt: ${filename}`);
      return;
    }

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  private async cleanupOldBackups(daysToKeep: number) {
    const files = await this.listBackups();
    const now = new Date().getTime();
    const msToKeep = daysToKeep * 24 * 60 * 60 * 1000;

    for (const file of files) {
      if (now - file.createdAt.getTime() > msToKeep) {
        this.logger.log(`Cleaning up old backup: ${file.filename}`);
        await this.deleteBackup(file.filename);
      }
    }
  }
}
