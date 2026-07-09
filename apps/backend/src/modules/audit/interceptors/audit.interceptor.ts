import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../audit.service';
import { AuditAction } from '@prisma/client';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger('AuditInterceptor');

  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user, body, ip } = request;
    const userAgent = request.get('user-agent');

    // Only log state-changing methods
    if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
      return next.handle();
    }

    // Skip audit logs themselves to avoid recursion if they were fetched via POST (not the case here)
    if (url.includes('/api/audit')) return next.handle();

    return next.handle().pipe(
      tap(async (data) => {
        try {
          const action = this.mapMethodToAction(method);
          const entity = this.extractEntity(url);
          const entityId = data?.id || (body?.id ? Number(body.id) : null);

          // Sanitise body for sensitive info
          const loggedBody = { ...body };
          if (loggedBody.password) loggedBody.password = '********';

          await this.auditService.create({
            userId: user?.id,
            action,
            entity,
            entityId: typeof entityId === 'number' ? entityId : undefined,
            newValues: method !== 'DELETE' ? loggedBody : undefined,
            oldValues: undefined,
            ipAddress: ip,
            userAgent,
          });
        } catch (error) {
          this.logger.error(`Failed to create audit log: ${error.message}`);
        }
      }),
    );
  }

  private mapMethodToAction(method: string): AuditAction {
    switch (method) {
      case 'POST':
        return AuditAction.CREATE;
      case 'PATCH':
      case 'PUT':
        return AuditAction.UPDATE;
      case 'DELETE':
        return AuditAction.DELETE;
      default:
        return AuditAction.CREATE;
    }
  }

  private extractEntity(url: string): string {
    const parts = url.split('/');
    // Assuming /api/ENTITY/...
    return parts[2] || 'unknown';
  }
}
